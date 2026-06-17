import 'dotenv/config'
import mongo from '@multiplayer/mongo'
import {
  WorkspaceModel,
} from '@multiplayer/models'
import { IAccount } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string

const stripe = new Stripe(STRIPE_SECRET_KEY)

const main = async () => {
  let exitWithError = false
  try {
    await mongo.connect()

    const totalWorkspaces = await WorkspaceModel.countDocuments()

    let workspaceCounter = 1

    for await (const workspace of WorkspaceModel.find({}).populate('account').cursor()) {
      try {
        const subscriptionId = workspace.billing.stripe.subscriptionId as string

        if (!subscriptionId) {
          continue
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        if (subscription.trial_end) {
          await WorkspaceModel.updateWorkspaceById(
            workspace._id,
            {
              billing: {
                stripe: {
                  trialEndsAt: new Date(subscription.trial_end * 1000),
                },
              },
            },
          )
        }

        await stripe.subscriptions.update(
          subscriptionId,
          {
            trial_settings: {
              end_behavior: {
                missing_payment_method: 'create_invoice',
              },
            },
            cancel_at_period_end: false,
            metadata: {
              accountId: (workspace.account as any as IAccount)._id.toString(),
              workspaceId: workspace._id.toString(),
            },
          },
        )

      } catch (err) {
        logger.error(err)
      } finally {
        logger.info(`Processed workspaces: ${workspaceCounter}/${totalWorkspaces}`)

        workspaceCounter++
      }
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
