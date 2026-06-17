import 'dotenv/config'
import Stripe from 'stripe'
import logger from '@multiplayer/logger'
import * as fs from 'fs'
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string

const stripe = new Stripe(STRIPE_SECRET_KEY)

// const EXTEND_TRIAL_DAYS = 14 * 24 * 60 * 60 * 1000 // 14 days
// const now = new Date()

const newTrialEndDate = new Date('2024-12-17T23:59:59.000Z')

const updatedTrials: {
  subscriptionId: string,
  oldTrialEnd: number,
  newTrialEnd: number,
  oldTrialEndHuman: Date,
  newTrialEndHuman: Date,
}[] = []

const main = async () => {
  let exitWithError = false
  try {
    logger.info('Starting to update trials')

    for await (const subscription of stripe.subscriptions.list({ limit: 30 })) {
      if (!subscription.trial_end) {
        logger.info('SUBSCRIPTION_WITHOUT_TRIAL:', subscription.id)
      } else {
        const trialEndDate = new Date(subscription.trial_end * 1000)

        if (
          trialEndDate > new Date('2024-12-17T00:00:00.000Z')
          // || trialEndDate > new Date('2024-11-08T23:59:59.000Z')
        ) {

          // logger.info('SKIPPING_SUBSCRIPTION:', {
          //   id: subscription.id,
          //   trialEndDate,
          // })
          continue
        }

        const newTrialEnd = newTrialEndDate.getTime() / 1000

        logger.info('SUBSCRIPTION_TRIAL_ENDS_AT:', {
          id: subscription.id,
          oldTrialEnd: subscription.trial_end,
          newTrialEnd,
          oldTrialEndHuman: new Date(subscription.trial_end * 1000),
          newTrialEndHuman: new Date(newTrialEnd * 1000),
        })

        updatedTrials.push({
          subscriptionId: subscription.id,
          oldTrialEnd: subscription.trial_end,
          newTrialEnd,
          oldTrialEndHuman: new Date(subscription.trial_end * 1000),
          newTrialEndHuman: new Date(newTrialEnd * 1000),
        })

        await stripe.subscriptions.update(
          subscription.id,
          {
            trial_end: newTrialEnd,
          },
        )
      }
    }

    fs.writeFileSync('./stripe-subscriptions.json', JSON.stringify(updatedTrials, null, 2))
  } catch (err) {
    exitWithError = true
    logger.error(err)
  } finally {
    process.exit(Number(exitWithError))
  }
}

main()
