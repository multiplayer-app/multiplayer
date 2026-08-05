import {
  WorkspaceUserStatus,
  AccountType,
  IWorkspace,
  FeatureFlag,
} from '@multiplayer/types'
import { isFreeEmail, Username } from '@multiplayer/util-shared'
import {
  WorkspaceModel,
  WorkspaceUserModel,
  RoleModel,
  IUserDocument,
  IWorkspaceDocument,
  AccountModel,
} from '@multiplayer/models'
import { ObjectId } from '@multiplayer/mongo'
import { AccessControlContext } from '@multiplayer/auth'
import { forkTemplateProject } from '../util'
import { stripe } from '../lib'
import { STRIPE_DEFAULT_PRICE_ID } from '../config'
import * as BillingService from './billing.service'

// Shared by routes/workspace/create.ts (session-authenticated + internal-service HTTP
// callers) and util/auto-add-workspace.ts (in-process signup flow, same service since
// the services merge - no more reason for that call site to go back out over HTTP to
// reach a route living in this very process).
export const createWorkspaceForUser = async (
  user: IUserDocument,
  // Loosely typed to match the original req.body-sourced payload this replaces -
  // _id/account/users/featureFlags/domains below are always computed by this
  // function itself, never taken from the caller.
  payload: any,
  billing?: { stripe?: { priceId?: string } },
): Promise<IWorkspaceDocument> => {
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

  const workspacePayload: Partial<IWorkspace> = {
    ...payload,
    _id: newWorkspaceId,
    account: account._id,
    users: [{
      workspaceUser: workspaceUser._id,
      role: workspaceOwnerRole._id,
    }],
    featureFlags,
  }

  if (user.primaryEmail && !isFreeEmail(user.primaryEmail)) {
    workspacePayload.domains = [{
      domain: user.primaryEmail.split('@')[1],
    }]
  }

  const workspace = await WorkspaceModel.createWorkspace(workspacePayload)

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

  return workspace
}
