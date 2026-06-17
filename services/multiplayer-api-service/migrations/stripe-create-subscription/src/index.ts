import 'dotenv/config'
import mongo from '@multiplayer/mongo'
import {
  WorkspaceModel,
} from '@multiplayer/models'
import {
  IAccount,
  WorkspaceBillingFeatures,
  IWorkspaceBillingFeature,
} from '@multiplayer/types'
import logger from '@multiplayer/logger'
import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
export const STRIPE_DEFAULT_FREE_PRICE_ID = process.env.STRIPE_DEFAULT_FREE_PRICE_ID as string
const stripe = new Stripe(STRIPE_SECRET_KEY)

const workspaceBillingFeatures = Object.values(WorkspaceBillingFeatures)

const updateWorkspaceFeauturesOnPlanUpdate = async (workspace, subscription) => {
  const productId = subscription.items.data[0].price.product

  const productFeatures = await stripe.products.listFeatures(productId)

  const workspaceFeatures = productFeatures.data.reduce((acc: IWorkspaceBillingFeature[], stripeFeature) => {
    const workspaceBillingFeature = workspaceBillingFeatures.find(featureName => stripeFeature.entitlement_feature.lookup_key.startsWith(featureName))

    if (workspaceBillingFeature) {
      const workspaceFeature: IWorkspaceBillingFeature = {
        name: workspaceBillingFeature,
        metadata: {
          ...stripeFeature.entitlement_feature.metadata.unlimited
            ? { unlimited: stripeFeature.entitlement_feature.metadata.unlimited === 'true' }
            : {},
          ...stripeFeature.entitlement_feature.metadata.count
            ? { count: Number(stripeFeature.entitlement_feature.metadata.count) }
            : {},
          ...stripeFeature.entitlement_feature.metadata.enabled
            ? { enabled: stripeFeature.entitlement_feature.metadata.enabled === 'true' }
            : {},
        },
      }

      acc.push(workspaceFeature)
    }

    return acc
  }, [])

  await WorkspaceModel.updateWorkspaceById(
    workspace._id,
    {
      billing: {
        stripe: {
          features: workspaceFeatures,
        },
      },
    },
  )
}

const main = async () => {
  let exitWithError = false
  try {
    await mongo.connect()

    const totalWorkspaces = await WorkspaceModel.countDocuments()

    let workspaceCounter = 1

    for await (const workspace of WorkspaceModel.find({}).populate('account').cursor()) {
      if (workspace.account && (workspace.account as any as IAccount)?.billing?.stripe?.customerId) {
        if (workspace.billing.stripe.subscriptionId) {
          let subscription = await stripe.subscriptions.retrieve(workspace.billing.stripe.subscriptionId)

          if (!subscription) {
            logger.error(
              { subscriptionId: workspace.billing.stripe.subscriptionId },
              'Subscription not found in STRIPE',
            )
          }

          if (subscription.status === 'canceled') {
            subscription = await stripe.subscriptions.create({
              customer: (workspace.account as any as IAccount).billing.stripe.customerId,
              items: [
                {
                  price: STRIPE_DEFAULT_FREE_PRICE_ID,
                  quantity: subscription.items.data[0].quantity || 1,
                },
              ],
              payment_settings: {
                save_default_payment_method: 'on_subscription',
              },
              cancel_at_period_end: false,
              metadata: {
                accountId: (workspace.account as any as IAccount)._id.toString(),
                workspaceId: workspace._id.toString(),
              },
            })

            await WorkspaceModel.updateWorkspaceById(
              workspace._id,
              {
                billing: {
                  stripe: {
                    subscriptionId: subscription.id,
                  },
                },
              },
            )

            logger.info(`Created new subscription for workspace ${workspace._id}`)
          }

          await updateWorkspaceFeauturesOnPlanUpdate(workspace, subscription)
          logger.info(`Updated workspace features for workspace ${workspace._id}`)
        } else {
          logger.error(
            { workspaceId: workspace._id.toString() },
            'Workspace without subscription',
          )
        }
      } else {
        logger.error(
          {
            workspaceId: workspace._id.toString(),
            customerId: (workspace.account as any as IAccount)?.billing?.stripe?.customerId,
          },
          'Workspace without account',
        )
      }

      logger.info(`Processed workspaces: ${workspaceCounter}/${totalWorkspaces}`)
      workspaceCounter++
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
