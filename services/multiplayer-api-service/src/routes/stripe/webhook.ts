import type { Request, Response, NextFunction } from 'express'
import logger from '@multiplayer/logger'
// import { ErrorMessage } from '@multiplayer/types'
import {
  WorkspaceModel,
  WorkspaceUserModel,
  RoleModel,
  UserModel,
} from '@multiplayer/models'
// import AMQP from '@multiplayer/amqp'
// import { NotFoundError } from 'restify-errors'
import { stripe } from '../../lib'
import { BillingService } from '../../services'
// import {
//   STRIPE_GRACE_PERIOD_DAYS,
//   AMQP_NOTIFICATION_QUEUE,
//   // STRIPE_PRO_PRODUCT_ID,
//   // STRIPE_FREE_PRODUCT_ID,
// } from '../../config'

const handleNotFoundWorkspace = async (
  customerId: string,
  subscriptionId: string,
) => {
  await stripe.cancelSubscription(subscriptionId)

  await stripe.deleteCustomer(customerId)
}

export default async (req: Request, res: Response, next: NextFunction) => {
  const stripeSignatureHeader = req.headers['stripe-signature']

  const event = await stripe.constructEvent(
    req.rawBody,
    stripeSignatureHeader,
  )

  try {
    // console.dir({
    //   t: '==STRIPE_EVENT==',
    //   event,
    // }, { depth: 20, colors: true })

    const testClockId = (event.data.object as any).test_clock as string | undefined
    let now = new Date()

    if (testClockId) {
      const testClock = await stripe.retrieveTestClockTime(testClockId)

      if (testClock) {
        now = testClock
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      if (event.data.object.amount_paid > 0) {
        const subscriptionId = event.data.object.subscription as string
        const productName = await stripe.getProductNameForSubscription(subscriptionId)

        const workspace = await WorkspaceModel.updateWorkspaceBySubscriptionId(
          subscriptionId,
          {
            billing: {
              stripe: {
                productName,
                paidAtLeastOneTime: true,
              },
            },
          },
        )

        logger.info({
          subscriptionId,
          workspaceId: workspace?._id.toString(),
          event: event.type,
          eventId: event.id,
        }, '[STRIPE] Payment succeeded')
      }
    }
    // if (event.type === 'invoice.payment_failed') {
    //   const subscriptionId = event.data.object.subscription as string
    //   const invoiceId = event.data.object.id as string
    //   const customerId = event.data.object.customer as string

    //   const workspace = await WorkspaceModel.getWorkspaceBySubscriptionId(subscriptionId)

    //   if (!workspace) {
    //     logger.error({
    //       subscriptionId,
    //       invoiceId,
    //       event: event.type,
    //       eventId: event.id,
    //     }, '[STRIPE] Workspace not found')

    //     await handleNotFoundWorkspace(
    //       customerId,
    //       subscriptionId,
    //     )
    //     return res.sendStatus(204)
    //   }

    //   const subscription = await stripe.retrieveSubscription(subscriptionId)

    //   const periodEndedAt = new Date(event.data.object.period_end * 1000)
    //   const daysAfterPeriodEnd = Math.floor(
    //     now.getTime() - periodEndedAt.getTime(),
    //   ) / (1000 * 60 * 60 * 24)

    //   const notPaidAfterTrialEnded = !workspace.billing.stripe.paidAtLeastOneTime
    //     && subscription.status === 'past_due'

    //   if (
    //     notPaidAfterTrialEnded
    //     || (
    //       workspace.billing.stripe.paidAtLeastOneTime
    //       && (
    //         daysAfterPeriodEnd >= STRIPE_GRACE_PERIOD_DAYS
    //         || event.data.object.next_payment_attempt === null
    //       )
    //     )
    //   ) {
    //     if (notPaidAfterTrialEnded && !workspace.billing.stripe.paidAtLeastOneTime) {
    //       await BillingService.closeInvoice(invoiceId)
    //       logger.info({
    //         subscriptionId,
    //         invoiceId,
    //         workspaceId: workspace._id.toString(),
    //         event: event.type,
    //         eventId: event.id,
    //       }, '[STRIPE] Closed invoice')
    //     }

    //     await BillingService.changeSubscriptionPlanToFree(subscriptionId)
    //     logger.info({
    //       subscriptionId,
    //       workspaceId: workspace._id.toString(),
    //       event: event.type,
    //       eventId: event.id,
    //     }, '[STRIPE] Changed subscrion plan to free')
    //   }

    //   const productName = await stripe.getProductNameForSubscription(subscriptionId)

    //   await WorkspaceModel.updateWorkspaceBySubscriptionId(
    //     subscriptionId,
    //     {
    //       billing: {
    //         stripe: {
    //           productName,
    //         },
    //       },
    //     },
    //   )
    // } else
    else if (event.type === 'customer.subscription.updated') {
      const subscriptionId = event.data.object.id
      const customerId = event.data.object.customer as string

      const workspace = await WorkspaceModel.getWorkspaceBySubscriptionId(subscriptionId)

      if (!workspace) {
        logger.error({
          subscriptionId,
          event: event.type,
          eventId: event.id,
        }, '[STRIPE] Workspace not found')

        await handleNotFoundWorkspace(customerId, subscriptionId)
        return res.sendStatus(204)
      }

      await BillingService.updateWorkspaceFeauturesOnPlanUpdate(subscriptionId)

      const previousProductId = event.data.previous_attributes?.items?.data[0].plan.product as string
      const currentProductId = event.data.object.items?.data[0].plan.product as string
      if (
        previousProductId
        && currentProductId
        && previousProductId !== currentProductId
      ) {
        const workspace = await WorkspaceModel.getWorkspaceBySubscriptionId(subscriptionId)
        const workspaceOwnerRole = await RoleModel.findWorkspaceOwnerRole()
        const ownerWorkspaceUserId = workspace?.users.find(({ role }) => workspaceOwnerRole._id.equals(role))?.workspaceUser as string

        if (!workspaceOwnerRole) {
          return
        }

        const workspaceUser = await WorkspaceUserModel.findWorkspaceUserById(ownerWorkspaceUserId)
        const user = await UserModel.findUserById(workspaceUser?.user as string)

        if (!user?.primaryEmail) {
          return
        }

        const currentPeriodEnd = new Date(event.data.object.current_period_end * 1000).toISOString().split('T')[0]

        // if (currentProductId === STRIPE_PRO_PRODUCT_ID) {
        // await AMQP.publish(
        //   AMQP_NOTIFICATION_QUEUE,
        //   {
        //     variables: {
        //       template: 'BILLING_WELCOME_PRO',
        //       email: user.primaryEmail,
        //       data: {
        //         workspace,
        //         currentPeriodEnd,
        //       },
        //     },
        //   },
        // )
        // } else if (currentProductId === STRIPE_FREE_PRODUCT_ID) {
        //   await AMQP.publish(
        //     AMQP_NOTIFICATION_QUEUE,
        //     {
        //       variables: {
        //         template: 'BILLING_WELCOME_FREE',
        //         email: user.primaryEmail,
        //         data: {
        //           workspace,
        //           currentPeriodEnd,
        //         },
        //       },
        //     },
        //   )
        // }
      }
    }
    // else if (event.type === 'customer.subscription.deleted') {
    //   const subscriptionId = event.data.object.id

    //   const workspace = await WorkspaceModel.getWorkspaceBySubscriptionId(subscriptionId)

    //   logger.info({
    //     subscriptionId,
    //     workspaceId: workspace?._id.toString(),
    //     event: event.type,
    //     eventId: event.id,
    //   }, '[STRIPE] Subscrion was cancelled')
    // } else if (event.type === 'product.updated') {
    //   const product = event.data.object
    //   const productId = product.id

    //   for await (const subscription of stripe.stripe.subscriptions.list({
    //     status: 'all',
    //   })) {
    //     if (subscription.items.data.some(item => item.price.product === productId)) {
    //       await BillingService
    //         .updateWorkspaceFeauturesOnPlanUpdate(subscription.id)
    //         .catch((e) => e)
    //     }
    //   }
    // }

    return res.sendStatus(204)
  } catch (err) {
    logger.error({
      err,
      event: event.type,
      eventId: event.id,
    }, '[STRIPE] Error processing webhook')
    return next(err)
  }
}
