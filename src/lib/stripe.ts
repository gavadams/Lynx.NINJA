import Stripe from 'stripe'
import { getBaseUrl } from './url'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const STRIPE_CONFIG = {
  // Premium subscription plans
  plans: {
    premium: {
      priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_monthly',
      name: 'Premium',
      price: 10, // £10/month
      currency: 'gbp',
      features: [
        'Custom Domain',
        'Advanced Analytics',
        'Link Scheduling',
        'Password Protection',
        'Email Capture',
        'QR Code Generation',
        'Custom CSS',
        'Priority Support'
      ]
    }
  },
  
  // Webhook endpoints
  webhooks: {
    checkout: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_webhook_secret',
  },
  
  // Success/cancel URLs
  urls: {
    success: `${getBaseUrl()}/dashboard/settings?success=true`,
    cancel: `${getBaseUrl()}/dashboard/settings?canceled=true`,
  }
}

// Helper function to create Stripe customer
export async function createStripeCustomer(userId: string, email: string, name?: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    })
    return customer
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    throw error
  }
}

// Helper function to create checkout session
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        customerId,
      },
    })
    return session
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

// Helper function to create billing portal session
export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
    return session
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    throw error
  }
}
