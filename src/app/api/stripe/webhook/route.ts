import { NextRequest, NextResponse } from "next/server"
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          
          // Update user to premium
          await supabase
            .from('User')
            .update({ 
              isPremium: true,
              stripeCustomerId: session.customer as string
            })
            .eq('id', session.metadata?.userId)

          // Create subscription record
          await supabase
            .from('Subscription')
            .insert({
              userId: session.metadata?.userId,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: session.customer as string,
              status: subscription.status as any,
              currentPeriodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
            })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Update subscription status
        await supabase
          .from('Subscription')
          .update({
            status: subscription.status as any,
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
          })
          .eq('stripeSubscriptionId', subscription.id)

        // Update user premium status
        const isPremium = subscription.status === 'active'
        await supabase
          .from('User')
          .update({ isPremium })
          .eq('stripeCustomerId', subscription.customer as string)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Update subscription status
        await supabase
          .from('Subscription')
          .update({
            status: 'canceled',
          })
          .eq('stripeSubscriptionId', subscription.id)

        // Update user premium status
        await supabase
          .from('User')
          .update({ isPremium: false })
          .eq('stripeCustomerId', subscription.customer as string)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        if ((invoice as any).subscription) {
          // Update subscription status
          await supabase
            .from('Subscription')
            .update({
              status: 'active',
            })
            .eq('stripeSubscriptionId', (invoice as any).subscription as string)

          // Update user premium status
          await supabase
            .from('User')
            .update({ isPremium: true })
            .eq('stripeCustomerId', invoice.customer as string)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        if ((invoice as any).subscription) {
          // Update subscription status
          await supabase
            .from('Subscription')
            .update({
              status: 'past_due',
            })
            .eq('stripeSubscriptionId', (invoice as any).subscription as string)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}