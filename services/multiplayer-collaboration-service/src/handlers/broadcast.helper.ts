import { BroadcastOperator, Socket } from 'socket.io'
import { ProjectSocketData } from '../interfaces/project-socket-data'
import { ProjectServerEventsMap } from '@multiplayer/types'

export class BroadcastHelper {
  static getBranchRoomName(branchId: string) {
    return `branch${branchId}`
  }
  static getThreadRoomName(threadId: string) {
    return `thread${threadId}`
  }
  static getBranchBroadcast(socket: Socket, branchId?: string): BroadcastOperator<ProjectServerEventsMap, ProjectSocketData> {
    if (!branchId) {
      return socket.broadcast
    }
    return socket.broadcast.to(BroadcastHelper.getBranchRoomName(branchId))
  }
}
