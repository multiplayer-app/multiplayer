import 'dotenv/config'
import Stripe from 'stripe'
import logger from '@multiplayer/logger'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
const STRIPE_FREE_PRODUCT_ID = process.env.STRIPE_FREE_PRODUCT_ID

if (!STRIPE_FREE_PRODUCT_ID) {
  throw new Error('STRIPE_FREE_PRODUCT_ID missing')
}

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY missing')
}

const stripe = new Stripe(STRIPE_SECRET_KEY)

let i = 0

const main = async () => {
  let exitWithError = false
  try {
    for await (const subscription of stripe.subscriptions.list({
      status: 'unpaid',
      // test_clocked: true,
      // test_clock: 'true',
      // limit: 30,
      // customer: 'cus_RScexxnWKlRu5J',
    })) {
      i++

      if (['canceled'].includes(subscription.status)) {
        // eslint-disable-next-line
        console.log('Skipped', subscription.id, i)
        continue
      }

      const subscriptionItem = subscription.items.data[0]
      const productId = subscriptionItem.price.product
      const customerId = subscription.customer

      const { data: [charge] } = await stripe.charges.list({
        limit: 1,
        customer: customerId as string,
      })

      if (
        !charge?.amount
        && productId === STRIPE_FREE_PRODUCT_ID
      ) {
        const { data: invoices } = await stripe.invoices.list({
          subscription: subscription.id,
          limit: 10,
        })



        // let trialEndDate

        // eslint-disable-next-line
        console.log('Processing', subscription.id, i)

        // if (subscription.trial_end) {
        //   trialEndDate = new Date(subscription.trial_end * 1000)
        //   if (new Date().getTime() < trialEndDate.getTime()) {
        //     continue
        //   }
        // }







        if (invoices.length === 3) {
          if (
            !invoices.find(_i => _i.status === 'void')
            && invoices[0].amount_due === 0
            && invoices[0].amount_paid === 0
            && invoices[0].status === 'draft'
            && invoices[1].amount_due > 0
            && invoices[1].amount_paid === 0
            && invoices[2].amount_due === 0
            && invoices[2].amount_paid === 0
          ) {
            const invoiceId = invoices[1].id

            // eslint-disable-next-line
            console.log('INVOICE_VOIDED___3', {
              subscriptionId: subscription.id,
              invoiceId,
              invoices: invoices.map(i => ({
                id: i.id,
                amount_due: i.amount_due,
                amount_paid: i.amount_paid,
                status: i.status,
              })),
            })



            await stripe.invoices.voidInvoice(invoiceId)

          } else {
            const invoiceId = invoices[1].id

            // eslint-disable-next-line
            console.log(
              'Invoice cancell skipped___3',
              {
                subscriptionId: subscription.id,
                invoiceId,
                // invoices: invoices.map(i => ({
                //   id: i.id,
                //   amount_due: i.amount_due,
                //   amount_paid: i.amount_paid,
                //   status: i.status,
                // })),
              },
            )
          }

        }











        if (invoices.length === 2) {
          if (
            invoices[0].amount_due > 0
            && invoices[0].amount_paid === 0
            && invoices[1].amount_due === 0
            && invoices[1].amount_paid === 0
            && invoices[0].status !== 'void'
          ) {
            const invoiceId = invoices[0].id
            // eslint-disable-next-line
            console.log('INVOICE_VOIDED___2', {
              subscriptionId: subscription.id,
              invoiceId,
              invoices: invoices.map(i => ({
                id: i.id,
                amount_due: i.amount_due,
                amount_paid: i.amount_paid,
              })),
            })



            // await stripe.invoices.voidInvoice(invoiceId)

          } else {
            const invoiceId = invoices[0].id
            // eslint-disable-next-line
            console.log(
              'Invoice cancell skipped___2',
              {
                subscriptionId: subscription.id,
                invoiceId,
              },
            )
          }
        }

      }
    }

    // eslint-disable-next-line
    console.log('===DONE===', i)

  } catch (err) {
    exitWithError = true
    logger.error(err)
  } finally {
    process.exit(Number(exitWithError))
  }
}

main()
