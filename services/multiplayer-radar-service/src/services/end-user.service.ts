import {
  EndUserModel,
  IEndUserDocument,
} from '@multiplayer/models'
import {
  EndUserType,
  EndUserState,
  IEndUser,
  SessionRecordingMode,
} from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { ClientIdEndUserCache } from '../cache'

export const createEndUser = async (
  payload: Partial<IEndUser>,
  connection?: {
    socketId: string,
    clientId?: string,
    state: EndUserState,
  },
) => {
  if (!payload.workspace || !payload.project) {
    throw new Error('Missing workspace or project')
  }

  if (payload.attributes?.type === EndUserType.VISITOR) {
    if (!connection?.socketId) {
      throw new Error('Missing socket id')
    }

    await removeConnection(connection.socketId)
  }

  let endUser: IEndUserDocument | undefined = await EndUserModel.createEndUser(payload)

  logger.debug(`[END_USER] Created end user ${endUser?._id}`)

  if (connection) {
    endUser = await EndUserModel.upsertSocketIdToEndUserById(
      endUser._id,
      connection.socketId,
      connection.clientId,
      connection.state,
    )

    if (connection.clientId) {
      await ClientIdEndUserCache.set(
        connection.clientId,
        endUser.toObject(),
      )
    }
  }

  logger.debug(`[END_USER] Added socket id ${connection?.socketId} to end user ${endUser?._id}`)

  return endUser
}

export const removeConnection = async (socketId: string): Promise<IEndUserDocument | void> => {
  const endUsers = await EndUserModel.findEndUsersBySocketId(socketId)

  if (!endUsers.length) {
    return
  }

  for (const endUser of endUsers) {
    if (endUser.attributes.type === EndUserType.VISITOR) {
      await EndUserModel.removeEndUserById(endUser._id)
    } else {
      await EndUserModel.disconnectEndUserBySocketId(socketId)
    }
  }

  return endUsers[0]
}

export const updateEndUserStateBySocketId = async (
  socketId: string,
  payload: {
    state: EndUserState,
    recordingMode?: SessionRecordingMode,
    sessionRecording?: string,
  },
): Promise<IEndUserDocument | undefined> => {
  return EndUserModel.updateEndUserStateBySocketId(
    socketId,
    payload,
  )
}

export const findEndUserByClientId = async (clientId: string): Promise<IEndUser | undefined> => {
  let endUser = await ClientIdEndUserCache.get(clientId)

  if (!endUser) {
    const _endUser = await EndUserModel.findEndUserByClientId(clientId)

    if (_endUser) {
      endUser = _endUser.toObject()
      await ClientIdEndUserCache.set(clientId, endUser)
    }
  }

  return endUser
}

export const incrementSessionRecordingsCount = async (filter: {
  clientId?: string
  hash?: string,
}): Promise<void> => {
  if (!filter.hash && !filter.clientId) {
    throw new Error('No condition provided')
  }

  await EndUserModel.incrementSessionRecordingsCount(filter)
}
