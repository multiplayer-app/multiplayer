import { ObjectId } from '@multiplayer/mongo'
import {
  AgentChatMessageModel,
  SessionNoteModel,
  SessionNotesUpdateModel,
} from '@multiplayer/models'
import { s3 } from '@multiplayer/s3'
import { SessionNotesHelper, Y } from '@multiplayer/entity'
import {
  AgentChatMessageRole,
  AgentEvents,
  AgentEventsMap,
  IAgentChat,
  IAgentAttachment,
  ISessionNoteItem,
  SessionNoteKey,
  SessionNoteType,
  AgentChatAttachmentType,
} from '@multiplayer/types'
import * as websocket from '../websocket'

export interface SessionSketch {
  id: string
  title?: string
  note?: string
  timestamp?: number
  s3Key: string
  s3Bucket: string
}

export interface SessionNotesContext {
  notes: ISessionNoteItem[]
  sketches: SessionSketch[]
}

const buildYDoc = async (
  stateKey: string,
  bucket: string,
  updates: Array<{ update?: Buffer | Uint8Array; key?: string; bucket?: string }>,
): Promise<Y.Doc> => {
  const stateBuffer = await s3.downloadFileAsByteArray(stateKey, bucket)

  const doc = new Y.Doc()
  if (stateBuffer) {
    Y.applyUpdate(doc, stateBuffer)
  }

  const loadedUpdates = await Promise.all(
    updates
      .filter(u => !u.update && u.key && u.bucket)
      .map(u => s3.downloadFileAsByteArray(u.key!, u.bucket!)),
  )

  const inMemoryUpdates = updates
    .filter(u => u.update)
    .map(u => new Uint8Array((u.update as Buffer).buffer))

  const allUpdates = [
    ...inMemoryUpdates,
    ...loadedUpdates.filter((u): u is Uint8Array => u != null),
  ]

  if (allUpdates.length > 0) {
    Y.applyUpdate(doc, Y.mergeUpdates(allUpdates))
  }

  return doc
}

export const getSessionNotesContext = async (
  debugSessionId: string,
): Promise<SessionNotesContext | null> => {
  try {
    const note = await SessionNoteModel.findSessionNote(debugSessionId)
    if (!note) return null

    const { data: updates } = await SessionNotesUpdateModel.listSessionNotesUpdates(
      {
        workspace: note.workspace.toString(),
        project: note.project.toString(),
        session: debugSessionId,
      },
      {},
    )

    const doc = await buildYDoc(
      `${note.prefix}/${SessionNoteKey.STATE}`,
      note.bucket,
      updates,
    )

    const fragment = doc.getXmlFragment('xml')
    const allBlocks = SessionNotesHelper.getAllSessionNoteBlocks(fragment)

    const notes = allBlocks.filter(b => b.type !== SessionNoteType.Sketch)
    const sketchBlocks = allBlocks.filter(b => b.type === SessionNoteType.Sketch)

    const sketches: SessionSketch[] = sketchBlocks.map(block => ({
      id: block.id,
      title: block.title,
      note: block.note,
      timestamp: block.timestamp,
      s3Key: `${note.prefix}/${SessionNoteKey.UPLOADS}/${block.id}`,
      s3Bucket: note.bucket,
    }))

    return { notes, sketches }
  } catch {
    return null
  }
}

export const getSessionNotesContextForChat = async (
  chat: IAgentChat,
): Promise<SessionNotesContext | null> => {
  const sessionIds: string[] = []

  if (chat.metadata?.debugSession?._id) {
    sessionIds.push(chat.metadata.debugSession._id.toString())
  }

  for (const s of (chat.metadata?.attachedDebugSessions ?? [])) {
    sessionIds.push(s._id.toString())
  }

  if (sessionIds.length === 0) return null

  const results = await Promise.all(sessionIds.map(id => getSessionNotesContext(id)))
  const valid = results.filter((r): r is SessionNotesContext => r !== null)

  if (valid.length === 0) return null

  return {
    notes: valid.flatMap(r => r.notes),
    sketches: valid.flatMap(r => r.sketches),
  }
}

export const formatSessionNotesForChat = (context: SessionNotesContext): string => {
  if (context.notes.length === 0 && context.sketches.length === 0) return ''

  const lines: string[] = ['## Session Notes']

  for (const note of context.notes) {
    const ts = note.timestamp ? ` @${note.timestamp}ms` : ''
    const title = note.title ? ` **${note.title}**` : ''
    const text = note.note ? `: ${note.note}` : ''
    lines.push(`- [${note.type}${ts}]${title}${text}`)
  }

  if (context.sketches.length > 0) {
    lines.push('', `*(${context.sketches.length} sketch image${context.sketches.length > 1 ? 's' : ''} attached)*`)
  }

  return lines.join('\n')
}

export const injectSessionNotesContextMessage = async (params: {
  context: SessionNotesContext
  chatId: string
  workspaceId: string
  projectId: string
}): Promise<void> => {
  const { context, chatId, workspaceId, projectId } = params

  const content = formatSessionNotesForChat(context)
  if (!content) return

  const attachments: IAgentAttachment[] = context.sketches.map(sketch => ({
    _id: new ObjectId().toString(),
    type: AgentChatAttachmentType.File as const,
    name: sketch.title ?? 'Sketch',
    mimeType: 'image/png',
    metadata: {
      s3Key: sketch.s3Key,
      s3Bucket: sketch.s3Bucket,
    },
  }))

  const message = await AgentChatMessageModel.createMessage({
    workspace: workspaceId,
    project: projectId,
    chat: chatId,
    role: AgentChatMessageRole.Assistant,
    agentName: 'context',
    content,
    attachments,
  })

  websocket.agentNamespaceHandler.emitToChatRoom(
    workspaceId,
    projectId,
    chatId,
    AgentEvents.AGENT_MESSAGE_NEW,
    message.toObject() as AgentEventsMap[AgentEvents.AGENT_MESSAGE_NEW]['responseParams'],
  )
}
