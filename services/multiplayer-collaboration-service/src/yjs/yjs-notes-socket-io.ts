import {
  fetchSession,
  fetchWorkspaceUser,
  socketCheckPermissions,
} from '../middlewares/auth'
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
  YjsEvents, YjsEventsMap, YjsServerEventsMap, YjsUpdateStatus,
} from '@multiplayer/types'
import logger, { asyncLogError, logError } from '@multiplayer/logger'
import { YSocketIO } from './y-socket-io'
import { socketAuthorize, socketCookieParser, socketExpressSession } from '@multiplayer/auth'
import { YjsSessionNotesSocketData } from '../interfaces/yjs-socket-data'
import { SessionNotesContext, SessionNotesUpdateModel } from '@multiplayer/models'
import { kafkaProducer } from '../kafka'
import { KAFKA_SESSION_NOTES_UPDATE_TOPIC } from '../config'
import { Socket } from 'socket.io'
import { DefaultEventsMap } from 'socket.io'

type YjsNotesSocket = Socket<YjsEventsMap, YjsServerEventsMap, DefaultEventsMap, YjsSessionNotesSocketData>

export class YjsSessionNotesSocketIO extends YSocketIO<YjsSessionNotesSocketData> {
  @asyncLogError
  protected async storeUpdate(data: Omit<YjsSessionNotesSocketData, 'user' | 'isDefaultBranch' | 'allowEdit'>, update: number[]) {
    if (!update.length) return

    await SessionNotesUpdateModel.createSessionNotesUpdate({
      workspace: data.workspaceId,
      project: data.projectId,
      session: data.sessionId,
      owner: data.userId,
      update: Buffer.from(new Uint8Array(update)),
    })
    await this.notifyAboutAvailableUpdates({
      workspace: data.workspaceId,
      project: data.projectId,
      session: data.sessionId,
    })
  }

  private async notifyAboutAvailableUpdates(data: SessionNotesContext) {
    try {
      await kafkaProducer.send(KAFKA_SESSION_NOTES_UPDATE_TOPIC, data)
    } catch (err) {
      logger.error('Cannot send message to kafka', err)
    }
  }


  @asyncLogError
  protected async getNonCommittedUpdates(data: Omit<YjsSessionNotesSocketData, 'user' | 'isDefaultBranch' | 'userId' | 'allowEdit'>) {
    const updates = await SessionNotesUpdateModel.listSessionNotesUpdates({
      workspace: data.workspaceId,
      project: data.projectId,
      session: data.sessionId,
    }, {})
    return updates.data
  }
  @asyncLogError
  private async generateUpdateForUpload(data: YjsSessionNotesSocketData) {
    const update = await SessionNotesUpdateModel.createSessionNotesUpdate({
      workspace: data.workspaceId,
      project: data.projectId,
      session: data.sessionId,
      owner: data.userId,
      status: YjsUpdateStatus.IN_PROGRESS,
    })

    return update._id.toString()
  }
  @logError
  public initialize (): void {
    const dynamicNamespace = this.io.of(/^\/session-notes\|([A-Fa-f0-9]{24})$/)

    dynamicNamespace.use(socketCookieParser)
    dynamicNamespace.use(socketExpressSession)
    dynamicNamespace.use(fetchSession)
    dynamicNamespace.use((socket, next) => {
      return socketAuthorize({
        entity: RoleProjectPermissionEntity.SESSION_NOTES,
        action: RoleAccessAction.READ,
      }, {
        workspaceId: socket.data.workspaceId,
        projectId: socket.data.projectId,
        debugSessionId: socket.data.sessionId,
      })(socket, next)
    })
    dynamicNamespace.use(fetchWorkspaceUser)
    dynamicNamespace.use((socket, next) => {
      socketCheckPermissions({
        entity: RoleProjectPermissionEntity.SESSION_NOTES,
        action: RoleAccessAction.UPDATE,
      })(socket, (err: any) => {
        if (!err) {
          socket.data.allowEdit = true
        }

        return next()
      })
    })

    dynamicNamespace.on('connection', this.onNamespaceConnect.bind(this))
  }
  @asyncLogError
  protected async onNamespaceConnect(socket: YjsNotesSocket) {
    await super.onNamespaceConnect(socket)
    socket.on(YjsEvents.SYNC_UPDATE_URL, async (callback: (id: string) => void) => {
      if (!callback) return
      const id = await this.generateUpdateForUpload(socket.data)
      callback(id)
    })

    socket.on(YjsEvents.SYNC_UPDATE_URL_DONE, async (id: string) => {
      if (!id) return
      socket.broadcast.emit(YjsEvents.SYNC_UPDATE_URL_DONE, [id])
    })
  }

  @logError
  public destroyNotes(sessionId: string) {
    this.io.of(`session-notes|${sessionId}`).emit(YjsEvents.DESTROY_DOC)
  }
}
