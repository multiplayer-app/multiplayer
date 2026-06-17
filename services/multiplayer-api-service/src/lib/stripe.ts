import Stripe from 'stripe'
import {
  IAccountDocument,
  IWorkspaceDocument,
} from '@multiplayer/models'
import {
  WorkspaceBillingFeatures,
  IWorkspaceBillingFeature,
} from '@multiplayer/types'
import {
  STRIPE_DISABLED,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_TRIAL_PERIOD_DAYS,
  STRIPE_DEFAULT_PRICE_ID,
  // STRIPE_FREE_PRODUCT_ID,
} from '../config'
import logger from '@multiplayer/logger'

logger.info(`[STRIPE] Stripe integration is ${STRIPE_DISABLED ? 'disabled' : 'enabled'}`)

const stripe = STRIPE_DISABLED ? null as unknown as Stripe : new Stripe(STRIPE_SECRET_KEY)

const DISABLED_SUBSCRIPTION_STUB = {
  id: 'local',
  status: 'active',
  trial_end: null,
  cancel_at_period_end: false,
  current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  items: {
    data: [{
      id: 'local',
      price: { id: 'local', product: 'local', currency: 'usd' },
      plan: { id: 'local', interval: 'month' },
      quantity: 1,
    }],
  },
} as unknown as Stripe.Subscription

const constructEvent = (
  webhookRawBody,
  webhookStripeSignatureHeader,
) => {
  const event = stripe.webhooks.constructEvent(
    webhookRawBody,
    webhookStripeSignatureHeader,
    STRIPE_WEBHOOK_SECRET,
  )

  return event
}

const listPlans = async () => {
  if (STRIPE_DISABLED) return []

  const plans = await stripe.plans.list({
    expand: ['data.product'],
    active: true,
  })

  const _plans = plans.data.map(plan => ({
    id: plan.id,
    product: {
      id: (plan.product as any).id,
      default_price: (plan.product as any).default_price,
      name: (plan.product as any).name,
      isEnterprise: (plan.product as any).metadata?.isEnterprise === 'true',
    },
    amount: plan.amount,
    amount_decimal: plan.amount_decimal,
    currency: plan.currency,
    interval: plan.interval,
    interval_count: plan.interval_count,
    trial_period_days: plan.trial_period_days,
    default: plan.id === STRIPE_DEFAULT_PRICE_ID,
    free: false, // (plan.product as any).id === STRIPE_FREE_PRODUCT_ID,
  }))

  return _plans
}

const createCustomer = async (
  name: string,
  email: string,
) => {
  if (STRIPE_DISABLED) return { id: 'local' } as Stripe.Customer

  const customer = await stripe.customers.create({
    name,
    email,
  })

  return customer
}

const updateCustomer = async (
  customerId: string,
  params: { name?: string, email?: string },
) => {
  if (STRIPE_DISABLED) return

  const customer = await stripe.customers.update(
    customerId,
    params,
  )

  return customer
}

const createSubscription = async (
  account: IAccountDocument,
  workspace: IWorkspaceDocument,
  priceId: string,
  options?: { quantity: number },
) => {
  if (STRIPE_DISABLED) return DISABLED_SUBSCRIPTION_STUB

  const subscription = await stripe.subscriptions.create({
    customer: account.billing.stripe.customerId,
    items: [
      {
        price: priceId,
        ...options?.quantity ? { quantity: options.quantity } : {},
      },
    ],
    trial_period_days: STRIPE_TRIAL_PERIOD_DAYS,
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'create_invoice',
      },
    },
    cancel_at_period_end: false,
    metadata: {
      accountId: account._id.toString(),
      workspaceId: workspace._id.toString(),
    },
  })
  return subscription
}

const cancelSubscription = async (
  subscriptionId: string,
) => {
  if (STRIPE_DISABLED) return

  await stripe.subscriptions.cancel(subscriptionId)
}

const deleteCustomer = async (
  customerId: string,
) => {
  if (STRIPE_DISABLED) return

  await stripe.customers.del(customerId)
}

const updateSubscriptionQuantity = async (
  subscriptionId: string,
  quantity: number,
) => {
  if (STRIPE_DISABLED) return

  const existingSubscription = await stripe.subscriptions.retrieve(subscriptionId)

  const subscription = await stripe.subscriptions.update(
    subscriptionId,
    {
      items: [{
        id: existingSubscription.items.data[0].id,
        quantity,
      }],
    },
  )

  return subscription
}

const updateSubscriptionPlanToFree = async (
  subscriptionId: string,
  freePriceId: string,
) => {
  if (STRIPE_DISABLED) return

  let subscription = await stripe.subscriptions.retrieve(subscriptionId)

  if (subscription.status === 'paused') {
    subscription = await stripe.subscriptions.resume(
      subscriptionId,
      {},
    )

    subscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        proration_behavior: 'none',
        items: [{
          id: subscription.items.data[0].id,
          quantity: subscription.items.data[0].quantity,
          price: freePriceId,
        }],
      },
    )
  } else if (subscription.cancel_at_period_end) {
    subscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: false,
        ...subscription.trial_end
          ? { trial_settings: { end_behavior: { missing_payment_method: 'create_invoice' } } }
          : {},
      },
    )

    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: subscriptionId,
    })

    await stripe.subscriptionSchedules.update(
      schedule.id,
      {
        end_behavior: 'release',
        proration_behavior: 'none',
        phases: [
          {
            items: [
              {
                plan: subscription.items.data[0].plan.id,
                quantity: subscription.items.data[0].quantity,
              },
            ],
            start_date: 'now',
            end_date: subscription.current_period_end,
          },
          {
            start_date: subscription.current_period_end,
            items: [
              {
                plan: freePriceId,
                quantity: subscription.items.data[0].quantity,
              },
            ],
          },
        ],
      },
    )
  } else {
    subscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        proration_behavior: 'none',
        items: [{
          id: subscription.items.data[0].id,
          quantity: subscription.items.data[0].quantity,
          price: freePriceId,
        }],
      },
    )
  }

  return subscription
}

const retrieveSubscription = async (
  subscriptionId: string,
) => {
  if (STRIPE_DISABLED) return DISABLED_SUBSCRIPTION_STUB

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  return subscription
}

const getProductNameForSubscription = async (
  subscriptionId: string,
) => {
  if (STRIPE_DISABLED) return 'Local'

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const subscriptionItem = subscription.items.data[0]
  const productId = subscriptionItem.price.product
  const product = await stripe.products.retrieve(productId as string)

  return product.name
}

const getProductNameById = async (
  productId: string,
) => {
  if (STRIPE_DISABLED) return 'Local'

  const product = await stripe.products.retrieve(productId as string)

  return product.name
}

const getSubscriptionInfo = async (
  subscriptionId: string | undefined,
): Promise<{
  productName: string,
  subscriptionInterval: string,
  subscriptionStatus: string,
  subscriptionId: string,
  freeTrial: boolean,
  isEnterprise: boolean,
  trialRemainingDays: number,
  unitAmount: number,
  unitCurrency: string,
  unitQuantity: number,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: boolean,
}> => {
  if (STRIPE_DISABLED) {
    return {
      productName: 'Local',
      subscriptionInterval: 'month',
      subscriptionStatus: 'active',
      subscriptionId: 'local',
      freeTrial: false,
      isEnterprise: false,
      trialRemainingDays: 0,
      unitAmount: 0,
      unitCurrency: 'usd',
      unitQuantity: 1,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    }
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)

  let trialRemainingDays = 0
  const isFreeTrial = subscription.status === 'trialing'

  if (isFreeTrial && subscription.trial_end) {
    const now = new Date()
    const trialEnd = new Date(subscription.trial_end * 1000)
    const timeDifference = Math.abs(trialEnd.getTime() - now.getTime())
    const daysLeft = Math.ceil(timeDifference / (1000 * 3600 * 24))
    trialRemainingDays = daysLeft
  }

  const productId = subscription.items.data[0].price.product as string
  const product = await stripe.products.retrieve(productId)
  const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
    subscription: subscriptionId,
  })

  const subscriptionInfo = {
    productName: product.name,
    subscriptionInterval: subscription.items.data[0].plan.interval,
    subscriptionStatus: subscription.status,
    subscriptionId: subscription.id,
    priceId: subscription.items.data[0].price.id,
    productId,
    freeTrial: isFreeTrial,
    trialRemainingDays,
    isEnterprise: product.metadata?.isEnterprise === 'true',
    unitAmount: upcomingInvoice.lines.data[0].amount,
    unitCurrency: subscription.items.data[0].price.currency,
    unitQuantity: subscription.items.data[0].quantity || 0,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  }

  return subscriptionInfo
}

const getCustomerPortalUrl = async (
  customerId: string,
  subscriptionId?: string,
) => {
  if (STRIPE_DISABLED) return ''

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,

    // return_url: 'https://example.com/account',
    ...subscriptionId
      ? {
        flow_data: {
          type: 'subscription_update',
          subscription_update: {
            subscription: subscriptionId,
          },
        },
      }
      : {},
  })

  return session.url
}

const listPaymentMethods = async (customerId) => {
  if (STRIPE_DISABLED) return []

  const paymentMethods = await stripe.customers.listPaymentMethods(
    customerId,
    {
      limit: 20,
    },
  )

  const _paymentMethods = paymentMethods.data.map(paymentMethod => ({
    id: paymentMethod.id,
    card: {
      brand: paymentMethod.card?.display_brand,
      country: paymentMethod.card?.country,
      last4: paymentMethod.card?.last4,
    },
    billingDetails: {
      country: paymentMethod.billing_details.address?.country,
    },
  }))

  return _paymentMethods
}

const getProduct = async (productId) => {
  if (STRIPE_DISABLED) {
    return { id: 'local', name: 'Local' } as Stripe.Product
  }

  const product = await stripe.products.retrieve(productId)

  return product
}

const getProductFeatures = async (productId) => {
  if (STRIPE_DISABLED) {
    return { data: [] } as unknown as Stripe.ApiList<Stripe.ProductFeature>
  }

  const productFeatures = await stripe.products.listFeatures(productId)

  return productFeatures
}

const workspaceBillingFeatures = Object.values(WorkspaceBillingFeatures)
const transformProductFeaturesToWorkspaceFeatures = (stripeFeatures: Stripe.ProductFeature[]) => {
  const workspaceFeatures = stripeFeatures.reduce((acc: IWorkspaceBillingFeature[], stripeFeature) => {
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

  return workspaceFeatures
}


const retrieveTestClockTime = async (testClockId: string): Promise<Date | null> => {
  if (STRIPE_DISABLED) return null

  const testClock = await stripe.testHelpers.testClocks.retrieve(testClockId)

  if (testClock) {
    return new Date(testClock.frozen_time * 1000)
  }

  return null
}

export const closeInvoice = async (invoiceId: string) => {
  if (STRIPE_DISABLED) {
    return
  }

  await stripe.invoices.voidInvoice(invoiceId)
}

export default {
  stripe,
  listPlans,
  constructEvent,
  createCustomer,
  updateCustomer,
  createSubscription,
  getCustomerPortalUrl,
  getSubscriptionInfo,
  listPaymentMethods,
  updateSubscriptionQuantity,
  updateSubscriptionPlanToFree,
  getProduct,
  getProductFeatures,
  transformProductFeaturesToWorkspaceFeatures,
  cancelSubscription,
  deleteCustomer,
  retrieveSubscription,
  retrieveTestClockTime,
  getProductNameForSubscription,
  getProductNameById,
  deleteInvoice: closeInvoice,
}
