import 'dotenv/config'
import mongo from '@multiplayer/mongo'
import {
  WorkspaceModel,
} from '@multiplayer/models'
import {
  WorkspaceBillingFeatures,
  IWorkspaceBillingFeature,
} from '@multiplayer/types'
import logger from '@multiplayer/logger'
import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID as string
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

    for await (const workspace of WorkspaceModel.find({
      'billing.stripe.subscriptionId': { $exists: false },
      account: { $exists: true },
    }).populate('account').cursor()) {
      const account = workspace.account as any

      const subscription = await stripe.subscriptions.create({
        customer: account.billing.stripe.customerId,
        items: [
          {
            price: STRIPE_PRICE_ID,
            quantity: workspace.users.length,
          },
        ],
        trial_period_days: 1000,
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'pause',
          },
        },
        cancel_at_period_end: false,
        metadata: {
          accountId: account._id.toString(),
          workspaceId: workspace._id.toString(),
        },
      })

      await updateWorkspaceFeauturesOnPlanUpdate(
        workspace,
        subscription,
      )

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
