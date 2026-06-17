import {
  IAccountDocument,
  IWorkspaceDocument,
  WorkspaceModel,
  AccountModel,
} from '@multiplayer/models'
import logger from '@multiplayer/logger'
import { NotFoundError } from 'restify-errors'
import { stripe } from '../lib'
// import { STRIPE_DEFAULT_FREE_PRICE_ID } from '../config'

export const updateCustomer = async (
  customerId: string,
  params: {
    email?: string,
    name?: string
  },
) => {
  await stripe.updateCustomer(customerId, params)
}

export const updateSubscriptionOnUserAdded = async (workspaceId: string) => {
  const workspace = await WorkspaceModel.findWorkspaceById(
    workspaceId,
    { billing: 1, users: 1 },
  ) as IWorkspaceDocument
  const usersCount = workspace.users.length
  const subscriptionId = workspace.billing.stripe.subscriptionId as string

  const subscription = await stripe.retrieveSubscription(subscriptionId)
  const currentQuantity = subscription.items.data[0].quantity ?? 0

  if (currentQuantity < usersCount) {
    await stripe.updateSubscriptionQuantity(subscriptionId, usersCount)
  }
}

export const updateSubscriptionOnUserRemoved = async (workspaceId: string) => {
  const workspace = await WorkspaceModel.findWorkspaceById(
    workspaceId,
    { billing: 1, users: 1 },
  ) as IWorkspaceDocument
  const usersCount = workspace.users.length
  await stripe.updateSubscriptionQuantity(
    workspace.billing.stripe.subscriptionId as string,
    usersCount,
  )
}

export const createSubscriptionForWorkspace = async (
  account: IAccountDocument,
  workspace: IWorkspaceDocument,
  priceId: string,
  options?: { quantity: number },
) => {
  const subscription = await stripe.createSubscription(
    account,
    workspace,
    priceId,
    options ?? { quantity: workspace.users.length },
  )
  const productFeatures = await stripe.getProductFeatures(subscription.items.data[0].price.product)

  const productName = await stripe.getProductNameById(subscription.items.data[0].price.product as string)

  await WorkspaceModel.updateWorkspaceById(
    workspace._id,
    {
      billing: {
        stripe: {
          productName,
          subscriptionId: subscription.id,
          features: stripe.transformProductFeaturesToWorkspaceFeatures(productFeatures.data),
          ...subscription.trial_end
            ? { trialEndsAt: new Date(subscription.trial_end * 1000) }
            : {},
        },
      },
    },
  )

  await AccountModel.updateAccountById(
    account._id,
    {
      billing: {
        usedTrial: true,
      },
    },
  )
}

// export const changeSubscriptionPlanToFree = async (subscriptionId: string) => {
//   await stripe.updateSubscriptionPlanToFree(
//     subscriptionId,
//     STRIPE_DEFAULT_FREE_PRICE_ID,
//   )
// }

export const closeInvoice = async (invoiceId: string) => {
  await stripe.deleteInvoice(invoiceId)
}

export const updateWorkspaceFeauturesOnPlanUpdate = async (subscriptionId: string) => {
  const workspace = await WorkspaceModel.getWorkspaceBySubscriptionId(subscriptionId)

  if (!workspace) {
    logger.error(`[BILLING] Workspace with subscriptionId ${subscriptionId} not found`)
    throw new NotFoundError(`Workspace with subscriptionId ${subscriptionId} not found`)
  }
  const subscription = await stripe.retrieveSubscription(subscriptionId)
  const productId = subscription.items.data[0].price.product

  const productFeatures = await stripe.getProductFeatures(productId)
  const productName = await stripe.getProductNameById(subscription.items.data[0].price.product as string)

  const features = stripe.transformProductFeaturesToWorkspaceFeatures(productFeatures.data)

  logger.info(
    { features },
    `[BILLING] Updating workspace ${workspace._id} features on plan update`,
  )

  await WorkspaceModel.updateWorkspaceById(
    workspace._id,
    {
      billing: {
        stripe: {
          productName,
          ...subscription.trial_end
            ? { trialEndsAt: new Date(subscription.trial_end * 1000) }
            : {},
          features,
        },
      },
    },
  )
}

export const getCurrentPriceId = async (subscriptionId: string) => {
  const subscription = await stripe.retrieveSubscription(subscriptionId)
  return subscription.items.data[0].price.id
}
