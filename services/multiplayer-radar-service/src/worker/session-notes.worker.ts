import crypto from 'crypto'
import { KafkaProducer } from '@multiplayer/kafka'
import { S3_DEBUG_SESSIONS_BUCKET } from '../config'
import logger from '@multiplayer/logger'
import { Joi, JoiValidator } from '@multiplayer/util'
import { DataWithCursor, NotesType, SessionNoteKey, YjsUpdateStatus } from '@multiplayer/types'
import {
  DebugSessionModel,
  ISessionNoteDocument,
  ISessionNotesUpdateDocument,
  SessionNoteModel,
  SessionNotesContext,
  SessionNotesUpdateModel,
} from '@multiplayer/models'
import redis from '@multiplayer/redis'
import { s3 } from '@multiplayer/s3'
import { EntityConverter, Y } from '@multiplayer/entity'
import { getS3DebugSessionFolder } from '../helpers/debug-session.helper'

const AUTOSAVE_TIMEOUT_INTERVAL_MS = 10000
class NoteUpdatesWorker {
  private static messageSchema = Joi.object({
    workspace: Joi.string().hex().length(24).required(),
    project: Joi.string().hex().length(24).required(),
    session: Joi.string().hex().length(24).required(),
  })

  private timers: Record<string, NodeJS.Timeout> = {}

  public validateMessage(message: SessionNotesContext): boolean {
    try {
      JoiValidator.validate(message, NoteUpdatesWorker.messageSchema)
      return true
    } catch (err) {
      logger.info(err)
      return false
    }
  }

  private scheduleCommitCheck(params: SessionNotesContext, timeout?: number) {
    const key = this.getLockKey(params)
    if (this.timers[key])
      return
    this.timers[key] = setTimeout(
      async () => {
        delete this.timers[key]
        await this.triggerCommitCheck(params)
      }, timeout || AUTOSAVE_TIMEOUT_INTERVAL_MS)
  }

  private clearTimeout(params: SessionNotesContext) {
    const key = this.getLockKey(params)
    if (!this.timers[key]) return
    clearTimeout(this.timers[key])
    delete this.timers[key]
  }

  public static getS3Key (params: SessionNotesContext): string {
    return `${getS3DebugSessionFolder({
      workspaceId: params.workspace,
      projectId: params.project,
      debugSessionId: params.session,
    })}/yjs`
  }

  private async cleanupUnusedUpdates(params: SessionNotesContext) {
    return Promise.all([
      SessionNotesUpdateModel.deleteSessionNotesUpdates(params),
      s3.deleteObjectsByPrefix(
        S3_DEBUG_SESSIONS_BUCKET,
        NoteUpdatesWorker.getS3Key(params),
      ),
    ])
  }

  public async triggerCommitCheck(params: SessionNotesContext) {
    const availableUpdates = await SessionNotesUpdateModel.listSessionNotesUpdates({
      workspace: params.workspace,
      project: params.project,
      session: params.session,
    }, { limit: 0 })

    if (!availableUpdates.cursor.total) {
      return
    }
    const session = await DebugSessionModel.findDebugSessionByIdAndProjectAndWorkspace(
      params.session,
      params.project,
      params.workspace,
    )
    if (!session) {
      await this.cleanupUnusedUpdates(params)
      return
    }
    const note = await SessionNoteModel.findSessionNote(params.session)
    if (!note) {
      await this.cleanupUnusedUpdates(params)
      return
    }

    await this.commitIfNeeded(params, note)
  }

  private getLockKey(message: SessionNotesContext) {
    return `notes:${message.workspace}.${message.project}.${message.session}`
  }

  private async acquireLock(message: SessionNotesContext, expiration = 20) {
    const lockKey = this.getLockKey(message)
    const res = await redis.set(lockKey, 'locked', expiration, { NX: true })
    logger.debug(res)
    return res === 'OK'
  }

  private async releaseLock(message: SessionNotesContext) {
    const lockKey = this.getLockKey(message)
    await redis.del(lockKey)
  }

  private async commit(
    params: SessionNotesContext,
    availableUpdates: ISessionNotesUpdateDocument[],
    note: ISessionNoteDocument,
  ) {
    try {
      this.clearTimeout(params)
      await this.commitUpdates(params,
        availableUpdates,
        note,
      )
    } catch (err) {
      logger.error(err)
      throw err
    } finally {
      this.scheduleCommitCheck(params)
    }
  }
  private getBase64Hash(base64: string | Buffer) {
    return crypto.createHash('sha256').update(base64 as any).digest('hex')
  }
  private validateBase64Image(dataUri: string) {
    if (!dataUri) return null

    // 1. Check prefix format
    const regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/
    const match = dataUri.match(regex)
    if (!match) {
      return null // not valid data URI image
    }

    // 2. Extract mime type and base64 payload
    const mimeType = match[1]
    const base64Data = dataUri.replace(regex, '')

    // 3. Validate base64 payload
    let buffer: Buffer
    try {
      buffer = Buffer.from(base64Data, 'base64')
      if (buffer.length === 0) return null
    } catch {
      return null
    }

    // 4. Return result
    return {
      mimeType,
      buffer,
    }
  }

  private async commitUpdates(params: SessionNotesContext,
    availableUpdates: ISessionNotesUpdateDocument[],
    note: ISessionNoteDocument,
  ) {
    const updatesToLoad = availableUpdates
      .filter(({ update, key, bucket, status }) =>
        !update && key && bucket && status === YjsUpdateStatus.DONE)

    const doc = await this.buildLatestDoc({
      key: `${note.prefix}/${SessionNoteKey.STATE}`,
      bucket: note.bucket,
    },
    availableUpdates,
    )

    const newState = Y.encodeStateAsUpdate(doc)
    const content = JSON.stringify(EntityConverter.convertStateToData(NotesType.SESSION, newState))
    await Promise.all([
      s3.uploadFile(`${note.prefix}/${SessionNoteKey.STATE}`, note.bucket, newState),
      SessionNoteModel.updateSessionNote(params.session, { content }),
    ])
    await Promise.all(availableUpdates.map(({ _id }) => SessionNotesUpdateModel.deleteSessionNotesUpdate(_id)))
    await Promise.all(updatesToLoad.map(({ key, bucket }) =>
      s3.deleteObject(bucket as string, key as string)),
    )
  }
  private async buildLatestDoc(
    s3params: { key: string, bucket: string },
    availableUpdates: ISessionNotesUpdateDocument[]) {
    const updatesToMerge = availableUpdates
      .filter(({ update }) => update)
      .map(({ update }) => new Uint8Array((update as Uint8Array).buffer))

    const updatesToLoad = availableUpdates
      .filter(({ update, key, bucket, status }) =>
        !update && key && bucket && status === YjsUpdateStatus.DONE)

    const loadedUpdates = await Promise.all(updatesToLoad.map(({ key, bucket }) => {
      return s3.downloadFileAsByteArray(key as string, bucket as string)
    }))

    const state = await s3.downloadFileAsByteArray(
      s3params.key as string,
      s3params.bucket as string) || EntityConverter.getInitialContent(NotesType.SESSION)

    const doc = new Y.Doc()
    Y.applyUpdate(doc, state)
    Y.applyUpdate(doc, Y.mergeUpdates(updatesToMerge))
    loadedUpdates.forEach((data) => {
      if (!data) return
      try {
        Y.applyUpdate(doc, data)
      } catch (err) {
        logger.error(err)
      }
    })

    return doc
  }

  private async commitIfNeeded(params: SessionNotesContext, note: ISessionNoteDocument) {
    const acquired = await this.acquireLock(params)
    if (!acquired) {
      logger.debug('Commit lock exists', params)
      return
    }

    try {
      const availableUpdates = await SessionNotesUpdateModel.listSessionNotesUpdates({
        workspace: params.workspace,
        project: params.project,
        session: params.session,
      }, {})

      const numOfUpdates = availableUpdates.cursor.total
      if (!numOfUpdates || !availableUpdates.data.length) {
        return
      }
      const passedTimeMs = new Date().getTime() - new Date(availableUpdates.data[0].createdAt).getTime()
      const shouldCreateCommit = numOfUpdates > 10 || passedTimeMs > AUTOSAVE_TIMEOUT_INTERVAL_MS
      if (!shouldCreateCommit) {
        this.scheduleCommitCheck(params)
        return
      }
      await this.commit(params,
        availableUpdates.data,
        note,
      )
    } catch (err) {
      logger.error(err)
      throw err
    }
    finally {
      await this.releaseLock(params)
    }
  }
}

const worker = new NoteUpdatesWorker()

export async function processMessage(key: string, value: SessionNotesContext) {
  try {
    const isValidMessage = worker.validateMessage(value)
    if (!isValidMessage) {
      logger.info('Kafka message is invalid', value)
      return
    }
    await worker.triggerCommitCheck(value)
  } catch (err) {
    logger.error(err)
    throw err
  }
}

export async function processLeftUpdates(kafkaProducer: KafkaProducer, topic: string) {
  const limit = 30
  let skip = 0
  let groups: DataWithCursor<SessionNotesContext>
  do {
    groups = await SessionNotesUpdateModel.listSessionNoteUpdatesGroups({}, { skip, limit })

    await Promise.all(groups.data.map((group) =>
      kafkaProducer.send(topic, group)),
    )
    skip += limit
  } while (skip < groups.cursor.total)
}