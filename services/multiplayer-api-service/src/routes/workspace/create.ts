import type { Request, Response, NextFunction } from 'express'
import {
  WorkspaceUserStatus,
  AccountType,
  IWorkspace,
  FeatureFlag,
} from '@multiplayer/types'
import { isFreeEmail, Username } from '@multiplayer/util-shared'
// import AMQP from '@multiplayer/amqp'
import {
  WorkspaceModel,
  WorkspaceUserModel,
  RoleModel,
  IUserDocument,
  AccountModel,
  UserModel,
} from '@multiplayer/models'
import { ObjectId } from '@multiplayer/mongo'
import { AccessControlContext } from '@multiplayer/auth'
import { NotFoundError, InvalidArgumentError } from 'restify-errors'
import { forkTemplateProject } from '../../util'
import { BillingService } from '../../services'
import { stripe } from '../../lib'
import { STRIPE_DEFAULT_PRICE_ID } from '../../config'
// import {
//   AMQP_NOTIFICATION_QUEUE,
// } from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    let user = req.user as IUserDocument

    if (req.isInternal) {
      const { userId } = req.body
      user = await UserModel.findUserById(userId) as IUserDocument
      if (!user) {
        throw new NotFoundError('User not found')
      }
    } else if (req.body.userId) {
      throw new InvalidArgumentError('Not allowed to specify userId')
    }

    const { billing, ..._payload } = req.body
    const priceId = billing?.stripe?.priceId || STRIPE_DEFAULT_PRICE_ID

    const newWorkspaceId = new ObjectId()
    const workspaceUser = await WorkspaceUserModel.createWorkspaceUser({
      workspace: newWorkspaceId,
      user: user._id,
      username: Username.getUsernameFromEmail(user.primaryEmail),
      firstName: user.firstName,
      lastName: user.lastName,
      status: WorkspaceUserStatus.ACTIVE,
    })

    const workspaceOwnerRole = await RoleModel.findWorkspaceOwnerRole()

    let companyName = ''

    if (!isFreeEmail(user.primaryEmail)) {
      companyName = user.primaryEmail.match(/@(.*)(\..*)$/)?.[1] as string
    }

    const customerName = `${user.firstName || ''} ${user.lastName || ''} ${companyName.length ? `at ${companyName}` : ''}`.trim()
    const stripeCustomer = await stripe.createCustomer(customerName, user.primaryEmail)
    const account = await AccountModel.createAccount({
      type: AccountType.PRIVATE,
      owner: user._id,
      name: customerName,
      billing: {
        usedTrial: false,
        stripe: {
          customerId: stripeCustomer.id,
        },
      },
    })

    const featureFlags: Record<FeatureFlag, boolean> = {
      [FeatureFlag.RADAR]: false,
      [FeatureFlag.RADAR_DETECT_ENDPOINTS]: false,
      [FeatureFlag.RADAR_DETECT_ENDPOINT_PAYLOAD]: false,
      [FeatureFlag.RADAR_DEPENDENCIES]: false,
      [FeatureFlag.ASSISTANT]: false,
      [FeatureFlag.END_USERS]: false,
      [FeatureFlag.FLOWS]: false,
      [FeatureFlag.SKETCH]: false,
      [FeatureFlag.NOTEBOOK]: false,
      [FeatureFlag.REPOSITORY]: false,
      [FeatureFlag.PLATFORM]: false,
      [FeatureFlag.VARIABLE_GROUP]: false,
      [FeatureFlag.PROJECT_BRANCH]: false,
      [FeatureFlag.ALERT_RULES]: false,
      [FeatureFlag.CONDITIONAL_RECORDING]: false,
      [FeatureFlag.AGENTS]: true,
      [FeatureFlag.ISSUES]: true,
      [FeatureFlag.DEBUG_SESSION]: true,
    }

    const payload: Partial<IWorkspace> = {
      ..._payload,
      _id: newWorkspaceId,
      account: account._id,
      users: [{
        workspaceUser: workspaceUser._id,
        role: workspaceOwnerRole._id,
      }],
      featureFlags,
    }

    if (user.primaryEmail && !isFreeEmail(user.primaryEmail)) {
      payload.domains = [{
        domain: user.primaryEmail.split('@')[1],
      }]
    }

    const workspace = await WorkspaceModel.createWorkspace(payload)

    await AccessControlContext.invalidateContext({
      userId: user._id.toString(),
    })

    await BillingService.createSubscriptionForWorkspace(
      account,
      workspace,
      priceId,
    )

    await forkTemplateProject(
      user,
      workspace._id,
    )

    // await AMQP.publish(
    //   AMQP_NOTIFICATION_QUEUE,
    //   {
    //     variables: {
    //       template: 'WELCOME',
    //       email: user.primaryEmail,
    //       data: {
    //         user: user,
    //       },
    //     },
    //   },
    // )

    return res.status(200).json(workspace)
  } catch (err) {
    return next(err)
  }
}
