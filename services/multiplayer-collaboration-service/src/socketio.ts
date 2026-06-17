import http from 'http'
import { EmittedEvents, YSocketIO } from './yjs/y-socket-io'
import { Server } from 'socket.io'
import { API_PREFIX, COOKIE_NAME, CORS_DOMAIN, WS_ADAPTER_KEY } from './config'
import { ProjectNamespaceHandler } from './handlers/project.handlers'
import { DefaultEventsMap } from 'socket.io'
import {
  YjsEntitySocketData,
  YjsRequestSocketData,
  YjsSessionNotesSocketData,
} from './interfaces/yjs-socket-data'
import { EntityEvents, EntityEventsMap, EntityServerEventsMap, YjsEventsMap } from '@multiplayer/types'
import { ProjectSocketData } from './interfaces/project-socket-data'
import { YjsEntitiesSocketIO } from './yjs/yjs-entities-socket-io'
import { YjsRequestSocketIO } from './yjs/yjs-request-socket-io'
import { createAdapter } from '@socket.io/redis-adapter'
import redis from '@multiplayer/redis'
import logger from '@multiplayer/logger'
import { YjsSessionNotesSocketIO } from './yjs/yjs-notes-socket-io'

type ProjectNamespaceServer = Server<EntityEventsMap, EntityServerEventsMap, DefaultEventsMap, ProjectSocketData>
type YjsEntitiesNamespaceServer = Server<YjsEventsMap, YjsEventsMap, DefaultEventsMap, YjsEntitySocketData>
type YjsSessionNotesNamespaceServer = Server<YjsEventsMap, YjsEventsMap, DefaultEventsMap, YjsSessionNotesSocketData>
type YjsRequestsNamespaceServer = Server<YjsEventsMap, YjsEventsMap, DefaultEventsMap, YjsRequestSocketData>

export const redisPubClient: any = redis.createClient()
export const redisSubClient: any = redisPubClient.duplicate()
redisSubClient.on('error', logger.error)

export default async (server: http.Server): Promise<{ yjsIOs: YSocketIO<any>[], projectIO: ProjectNamespaceHandler }> => {
  await Promise.all([redisPubClient.connect(), redisSubClient.connect()])

  const io = new Server(server, {
    path: `${API_PREFIX}/ws`,
    cleanupEmptyChildNamespaces: true,
    maxHttpBufferSize: 2e6,
    adapter: createAdapter(redisPubClient, redisSubClient, { key: WS_ADAPTER_KEY }),
    cookie: {
      name: COOKIE_NAME,
      path: '/',
    },
    cors: {
      origin: CORS_DOMAIN === '*' ? '*' : CORS_DOMAIN.split(','),
      credentials: true,
      allowedHeaders: ['auth'],
    },
  })
  const yEntitiesSocketIO = new YjsEntitiesSocketIO(io as YjsEntitiesNamespaceServer)
  yEntitiesSocketIO.initialize()

  const ySessionNotesSocketIO = new YjsSessionNotesSocketIO(io as YjsSessionNotesNamespaceServer)
  ySessionNotesSocketIO.initialize()

  const projectIO = new ProjectNamespaceHandler(io as ProjectNamespaceServer)
  projectIO.initialize()

  yEntitiesSocketIO.on(EmittedEvents.userConnected, projectIO.onEntityConnect.bind(projectIO))
  yEntitiesSocketIO.on(EmittedEvents.userDisconnected, projectIO.onEntityDisconnect.bind(projectIO))
  yEntitiesSocketIO.on(EmittedEvents.notifyOnUpdate, projectIO.onEntityUpdate.bind(projectIO))
  projectIO.on(EntityEvents.ENTITY_GIT_COMMIT, yEntitiesSocketIO.destroyEntity.bind(yEntitiesSocketIO))
  projectIO.on(EntityEvents.ENTITY_RESET, yEntitiesSocketIO.destroyEntity.bind(yEntitiesSocketIO))

  const yjsRequestsSocketIO = new YjsRequestSocketIO(io as YjsRequestsNamespaceServer)
  yjsRequestsSocketIO.initialize()

  return { yjsIOs: [yEntitiesSocketIO, yjsRequestsSocketIO, ySessionNotesSocketIO], projectIO }
}
