import 'dotenv/config'
import mongo from '@multiplayer/mongo'
import { WorkspaceModel } from '@multiplayer/models'
import { WorkspaceBillingFeatures, IWorkspaceBillingFeature } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
const STRIPE_NEW_PRICE_ID = process.env.STRIPE_NEW_PRICE_ID as string
const STRIPE_TRIAL_PERIOD_DAYS = process.env.STRIPE_TRIAL_PERIOD_DAYS as string

if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY missing')
if (!STRIPE_NEW_PRICE_ID) throw new Error('STRIPE_NEW_PRICE_ID missing')
if (!STRIPE_TRIAL_PERIOD_DAYS) throw new Error('STRIPE_TRIAL_PERIOD_DAYS missing')

const stripe = new Stripe(STRIPE_SECRET_KEY)

const trialDays = Number(STRIPE_TRIAL_PERIOD_DAYS)

if (isNaN(trialDays) || trialDays <= 0) throw new Error(`STRIPE_TRIAL_PERIOD_DAYS must be a positive number, got: ${STRIPE_TRIAL_PERIOD_DAYS}`)

const trialEnd = Math.floor((Date.now() + trialDays * 24 * 60 * 60 * 1000) / 1000)

const workspaceBillingFeatures = Object.values(WorkspaceBillingFeatures)

const getProductFeatures = (stripeFeatures: Stripe.ProductFeature[]): IWorkspaceBillingFeature[] => {
  return stripeFeatures.reduce((acc: IWorkspaceBillingFeature[], stripeFeature) => {
    const match = workspaceBillingFeatures.find(
      name => stripeFeature.entitlement_feature.lookup_key.startsWith(name),
    )
    if (match) {
      acc.push({
        name: match,
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
      })
    }
    return acc
  }, [])
}

const main = async () => {
  let exitWithError = false
  try {
    await mongo.connect()

    const totalWorkspaces = await WorkspaceModel.countDocuments({ 'billing.stripe.subscriptionId': { $exists: true } })
    logger.info(`Found ${totalWorkspaces} workspaces with subscriptions`)
    logger.info(`Migrating to price: ${STRIPE_NEW_PRICE_ID}`)
    logger.info(`Trial end: ${new Date(trialEnd * 1000).toISOString()}`)

    const newPrice = await stripe.prices.retrieve(STRIPE_NEW_PRICE_ID)
    const newProduct = await stripe.products.retrieve(newPrice.product as string)
    const newProductFeatures = await stripe.products.listFeatures(newPrice.product as string)
    const newFeatures = getProductFeatures(newProductFeatures.data)

    let counter = 0
    let skipped = 0
    let failed = 0

    for await (const workspace of WorkspaceModel.find({
      'billing.stripe.subscriptionId': { $exists: true },
    }).cursor()) {
      counter++
      const subscriptionId = workspace.billing.stripe.subscriptionId as string
      const workspaceId = workspace._id.toString()

      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        if (subscription.status === 'canceled') {
          logger.info(`[${counter}/${totalWorkspaces}] SKIP canceled — workspace ${workspaceId}`)
          skipped++
          continue
        }

        const currentItem = subscription.items.data[0]

        if (currentItem.price.id === STRIPE_NEW_PRICE_ID && subscription.trial_end === trialEnd) {
          logger.info(`[${counter}/${totalWorkspaces}] SKIP already migrated — workspace ${workspaceId}`)
          skipped++
          continue
        }

        const quantity = Math.max(workspace.users.length, 1)

        await stripe.subscriptions.update(subscriptionId, {
          items: [{
            id: currentItem.id,
            price: STRIPE_NEW_PRICE_ID,
            quantity,
          }],
          trial_end: trialEnd,
          proration_behavior: 'none',
        })

        await WorkspaceModel.updateWorkspaceById(workspace._id, {
          billing: {
            stripe: {
              productName: newProduct.name,
              features: newFeatures,
              trialEndsAt: new Date(trialEnd * 1000),
            },
          },
        })

        logger.info(`[${counter}/${totalWorkspaces}] OK — workspace ${workspaceId}, quantity ${quantity}`)
      } catch (err) {
        failed++
        logger.error({ workspaceId, subscriptionId, err }, `[${counter}/${totalWorkspaces}] FAILED — workspace ${workspaceId}`)
      }
    }

    logger.info(`Done. Total: ${totalWorkspaces}, skipped: ${skipped}, failed: ${failed}`)
  } catch (err) {
    exitWithError = true
    logger.error(err)
  } finally {
    await mongo.disconnect()
    process.exit(Number(exitWithError))
  }
}

main()
