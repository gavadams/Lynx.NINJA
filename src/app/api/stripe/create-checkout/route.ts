import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { stripe, createCheckoutSession, createStripeCustomer, STRIPE_CONFIG } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Check if user already has an active subscription
    if (profile.isPremium) {
      return NextResponse.json({ error: "User already has premium subscription" }, { status: 400 })
    }

    let customerId = profile.stripeCustomerId

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await createStripeCustomer(
        user.id,
        user.email!,
        profile.displayName || profile.username
      )
      customerId = customer.id

      // Update user with Stripe customer ID
      await supabase
        .from('User')
        .update({ stripeCustomerId: customerId })
        .eq('id', user.id)
    }

    // Create checkout session
    const session = await createCheckoutSession(
      customerId,
      STRIPE_CONFIG.plans.premium.priceId,
      STRIPE_CONFIG.urls.success,
      STRIPE_CONFIG.urls.cancel
    )

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ 
      error: "Failed to create checkout session" 
    }, { status: 500 })
  }
}
