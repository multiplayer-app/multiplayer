import 'dotenv/config'
import mongo from '@multiplayer/mongo'
import {
  UserModel,
  AccountModel,
  WorkspaceModel,
  WorkspaceUserModel,
  IWorkspaceUserModel,
  RoleModel,
} from '@multiplayer/models'
import {
  AccountType,
} from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { isFreeEmail } from '@multiplayer/util'
import {
  stripe,
} from '../dist/lib'

const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID as string

const main = async () => {
  let exitWithError = false
  try {
    await mongo.connect()

    const workspaceOwnerRole = await RoleModel.findWorkspaceOwnerRole()

    if (!workspaceOwnerRole) {
      throw new Error('WS Owner role not found')
    }

    for await (const workspace of WorkspaceModel.find({ account: { $exists: false } }).cursor()) {
      logger.info(`Updating workspace ${workspace._id}`)
      if (!workspace.users.length) {
        continue
      }

      const workspaceUserIds = workspace.users.map(({ workspaceUser }) => workspaceUser) as string[]
      const workspaceUserOwner = await WorkspaceUserModel.findOne({
        _id: { $in: workspaceUserIds },
      }).sort({ _id: 1 })

      if (!workspaceUserOwner) {
        throw new Error('Workspace user not found')
      }

      const workspaceOwnerId = workspaceUserOwner._id
      const workspaceMemberId = (workspace as any).users.find(({ workspaceUser }) => workspaceUser.equals(workspaceOwnerId))?._id
      const workspaceUser = await WorkspaceUserModel.findWorkspaceUserById(workspaceOwnerId)
      const user = await UserModel.findUserById(workspaceUser?.user as string)

      if (!user) {
        logger.error('User not found for WS_USER:', workspaceUser)

        continue
      }

      let companyName = ''

      if (!isFreeEmail(user.primaryEmail)) {
        companyName = user.primaryEmail.match(/@(.*)(\..*)$/)?.[1] as string
      }

      const customerName = `${user.firstName || ''} ${user.lastName || ''} ${companyName.length ? `at ${companyName}` : ''}`.trim()
      const stripeCustomer = await stripe.createCustomer(
        customerName,
        user.primaryEmail,
      )

      const account = await AccountModel.createAccount({
        type: AccountType.PRIVATE,
        owner: user._id,
        name: customerName,
        billing: {
          stripe: {
            customerId: stripeCustomer.id,
          },
        },
      })

      await WorkspaceModel.updateOne({
        _id: workspace._id,
      }, {
        $set: {
          account: account._id,
        },
      })

      await WorkspaceModel.updateUser(
        workspace._id,
        workspaceMemberId,
        { role: workspaceOwnerRole._id },
      )

      await stripe.createSubscription(
        account,
        workspace,
        STRIPE_PRICE_ID,
        {
          quantity: workspace.users.length,
        },
      )
    }

  } catch (err) {
    exitWithError = true
    logger.error(err)
  } finally {
    await mongo.disconnect()
    process.exit(Number(exitWithError))
  }
}

main()
