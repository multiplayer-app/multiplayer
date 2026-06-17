import {
  fetchBranch,
  fetchProject,
  fetchWorkspaceUser,
  socketCheckPermissions,
} from '../middlewares/auth'
import { YjsRequestSocketData } from '../interfaces/yjs-socket-data'
import {
  RoleAccessAction,
  RequestEntityType,
  RoleWorkspacePermissionEntity,
} from '@multiplayer/types'
import { YSocketIO } from './y-socket-io'
import { ExtendedError } from 'socket.io'
import { logError } from '@multiplayer/logger'
import { socketAuthorize, socketCookieParser, socketExpressSession } from '@multiplayer/auth'

export class YjsRequestSocketIO extends YSocketIO<YjsRequestSocketData> {
  @logError
  public initialize (): void {
    // request|projectId/branchId?type=
    const dynamicNamespace = this.io.of(/^\/request\|([A-Fa-f0-9]{24})\/([A-Fa-f0-9]{24})$/)

    dynamicNamespace.use(socketCookieParser)
    dynamicNamespace.use(socketExpressSession)
    dynamicNamespace.use(socketAuthorize())
    dynamicNamespace.use(fetchProject)
    dynamicNamespace.use(fetchBranch)
    dynamicNamespace.use(fetchWorkspaceUser)
    dynamicNamespace.use(socketCheckPermissions({
      entity: RoleWorkspacePermissionEntity.PROJECT,
      action: RoleAccessAction.UPDATE,
    }))
    dynamicNamespace.use((socket , next: (err?: ExtendedError) => void) => {
      const type = socket.handshake.query.type?.toString()
      if (!type || !Object.values(RequestEntityType).includes(type as RequestEntityType)) {
        return next(new Error('Provide valid request type in query'))
      }

      socket.data.type = RequestEntityType[type]
      return next()
    })

    dynamicNamespace.on('connection', this.onNamespaceConnect.bind(this))
  }

  public static generateKey(projectId: string, branchId: string, type: RequestEntityType) {
    return `${projectId}.${branchId}.${type}`
  }
}
