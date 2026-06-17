import { UserModel, IUserDocument } from '@multiplayer/models'
import { IUser } from '@multiplayer/types'
import { UserCache } from '../cache'

export const findById = async (userId: string): Promise<IUserDocument | undefined> => {
  const cachedUser = await UserCache.get(userId)

  if (cachedUser) {
    return cachedUser as unknown as IUserDocument
  }

  const user = await UserModel.findUserById(userId)

  if (!user) {
    return undefined
  }

  const _user = user.toObject()

  await UserCache.set(
    userId,
    _user as unknown as IUser,
  )

  return _user
}
