import { Server, Socket } from 'socket.io'
import * as AwarenessProtocol from 'y-protocols/awareness'
import { Observable } from 'lib0/observable'
import { YjsSocketData } from '../interfaces/yjs-socket-data'
import { DefaultEventsMap } from 'socket.io'
import { YjsEvents, YjsEventsMap, YjsServerEventsMap, YjsUpdateStatus } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import * as Y from 'yjs'
import { IEntityUpdateDocument, ISessionNotesUpdateDocument } from '@multiplayer/models'
import { s3 } from '@multiplayer/s3'

export enum EmittedEvents {
  userConnected='user-connected',
  userDisconnected='user-disconnected',
  allDocumentConnectionsClosed = 'all-document-connections-closed',
  notifyOnUpdate = 'notify-update',
}

export abstract class YSocketIO<K extends YjsSocketData = YjsSocketData> extends Observable<EmittedEvents> {
  protected readonly io: Server<YjsEventsMap, YjsServerEventsMap, DefaultEventsMap, K>

  constructor (io: Server<YjsEventsMap, YjsServerEventsMap, DefaultEventsMap, K>) {
    super()
    this.io = io
  }

  public abstract initialize(): void

  protected async onNamespaceConnect(socket: Socket<YjsEventsMap, YjsServerEventsMap, DefaultEventsMap, K>) {
    try {
      const updates = await this.getNonCommittedUpdates(socket.data)
      const update = updates ?
        Y.mergeUpdates(updates
          .filter(({ update }) => update)
          .map(({ update }) => new Uint8Array((update as Buffer).buffer))) :
        undefined
      socket.emit(YjsEvents.SYNC_INIT_2, update)

      if (updates) {
        const updatesToLoad = updates
          .filter(({
            key,
            bucket,
            status,
          }) => key && bucket && status === YjsUpdateStatus.DONE)
          .map(({ _id }) => _id.toString())

        if (updatesToLoad.length)
          socket.emit(YjsEvents.SYNC_UPDATE_URL_DONE, updatesToLoad)
      }

      this.initSyncListeners(socket)
      this.initAwarenessListeners(socket)
      this.initSocketListeners(socket)

      await this.startSync(socket)
    } catch (err) {
      logger.error(err)
      socket.disconnect()
    }
  }

  private async startSync(socket: Socket<YjsEventsMap, YjsServerEventsMap, DefaultEventsMap, K>) {
    if (!socket.data.allowEdit) return
    try {
      const sockets = await socket.nsp.fetchSockets()
      sockets.forEach((s) => {
        if (s.id === socket.id) return
        //actions that change state on user's side should not be emitted if user has only READ access

        s.emit(YjsEvents.SYNC_INIT, (vectorState) => {
          if (!vectorState || !vectorState.byteLength) {
            return
          }
          socket.emit(YjsEvents.SYNC_STEP_1, new Uint8Array(vectorState), (update) => {
            if (!update || !update.byteLength) return
            s.emit(YjsEvents.SYNC_STEP_2, new Uint8Array(update))
          })
        })
      })
    } catch (err) {
      logger.error(err, 'Error on startSync', socket.nsp.name)
    }
  }

  protected async getNonCommittedUpdates(socketData: K): Promise<IEntityUpdateDocument[] | ISessionNotesUpdateDocument[] | undefined> {
    // override in children if needed
    return undefined
  }
  protected async storeUpdate(data: K, update: number[]) {
    // override in children if needed
  }

  protected readonly initSyncListeners = (socket: Socket<YjsEventsMap, YjsServerEventsMap, DefaultEventsMap, K>): void => {
    socket.on(YjsEvents.SYNC_STEP_1, async (stateVector: Uint8Array) => {
      logger.debug(YjsEvents.SYNC_STEP_1, socket.id)
      try {
        const sockets = await socket.nsp.fetchSockets()
        sockets.forEach((s) => {
          if (s.id === socket.id) return

          s.emit(YjsEvents.SYNC_STEP_1, stateVector, (update) => {
            if (!update.byteLength) return
            socket.emit(YjsEvents.SYNC_STEP_2, update)
            logger.debug(YjsEvents.SYNC_STEP_2, socket.id)
          })
        })
      } catch (err) {
        logger.error(err, 'Error on SYNC_STEP_1', socket.nsp.name)
      }
    })

    if (socket.data.allowEdit) {
      socket.on(YjsEvents.SYNC_UPDATE, async (update: Uint8Array, callback?: () => void) => {
        try {
          logger.debug(YjsEvents.SYNC_UPDATE, socket.id)
          socket.broadcast.emit(YjsEvents.SYNC_UPDATE, new Uint8Array(update))
          await this.storeUpdate(socket.data, Array.from(update.values()))
          callback?.()
        } catch (err) {
          logger.error(err, socket.nsp.name)
        }
      })
    }
  }

  protected modifyUserAwareness(state: Record<string, unknown>, socket: Socket<YjsEventsMap, YjsEventsMap, DefaultEventsMap, K>): Record<string, unknown> {
    if (!state || !socket.data.user) return state

    return {
      ...state,
      user: socket.data.user,
    }
  }

  private initAwarenessListeners (socket: Socket<YjsEventsMap, YjsEventsMap, DefaultEventsMap, K>) {
    if (!socket.data.allowEdit) return
    socket.on(YjsEvents.AWARENESS_UPDATE, (update: Uint8Array) => {
      //actions that change state on user's side should not be emitted if user has only READ access

      socket.broadcast.emit(YjsEvents.AWARENESS_UPDATE, AwarenessProtocol.modifyAwarenessUpdate(new Uint8Array(update), (state) => {
        return this.modifyUserAwareness(state, socket)
      }))
    })
  }

  private initSocketListeners(socket: Socket<YjsEventsMap, YjsEventsMap, DefaultEventsMap, K>) {
    socket.once('disconnect', async () => {
      const sockets = await socket.nsp.fetchSockets()
      if (sockets.length !== 0) {
        return
      }

      this.emit(EmittedEvents.allDocumentConnectionsClosed, [socket.nsp.name]) //todo remove if not used or update param if needed
    })
  }
}
