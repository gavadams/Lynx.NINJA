import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createBillingPortalSession } from '@/lib/stripe'
import { getBaseUrl } from '@/lib/url'

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
      .select('stripeCustomerId')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    if (!profile.stripeCustomerId) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 })
    }

    // Create billing portal session
    const session = await createBillingPortalSession(
      profile.stripeCustomerId,
      `${getBaseUrl()}/dashboard/settings`
    )

    return NextResponse.json({ 
      url: session.url 
    })
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    return NextResponse.json({ 
      error: "Failed to create billing portal session" 
    }, { status: 500 })
  }
}
