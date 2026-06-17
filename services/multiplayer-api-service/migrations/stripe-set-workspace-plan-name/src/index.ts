import 'dotenv/config'
import mongo from '@multiplayer/mongo'
import {
  WorkspaceModel,
} from '@multiplayer/models'
import logger from '@multiplayer/logger'
import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string

const stripe = new Stripe(STRIPE_SECRET_KEY)

const productNameMapping: any = {} // id: product name

const main = async () => {
  let exitWithError = false
  try {
    await mongo.connect()

    const totalWorkspaces = await WorkspaceModel.countDocuments()

    let workspaceCounter = 1

    for await (const workspace of WorkspaceModel.find({ }).cursor()) {
      try {
        const subscriptionId = workspace.billing.stripe.subscriptionId as string

        if (!subscriptionId) {
          continue
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const subscriptionItem = subscription.items.data[0]
        const productId = subscriptionItem.price.product as string

        let productName
        if (productNameMapping[productId]) {
          productName = productNameMapping[productId]
        } else {
          const product = await stripe.products.retrieve(productId)

          productName = product.name

          productNameMapping[productId] = productName
        }


        await WorkspaceModel.updateWorkspaceById(
          workspace._id,
          {
            billing: {
              stripe: {
                productName: productName,
              },
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
