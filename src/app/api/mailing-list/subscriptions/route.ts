import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/mailing-list/subscriptions - Get user's mailing list subscriptions
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Get user's mailing list subscriptions
    const { data: subscriptions, error } = await supabase
      .rpc('get_user_mailing_lists', { user_id: session.user.email })

    if (error) {
      console.error('Error fetching mailing list subscriptions:', error)
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    return NextResponse.json({ subscriptions: subscriptions || [] })
  } catch (error) {
    console.error('Mailing list subscriptions API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/mailing-list/subscriptions - Update user's mailing list subscriptions
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { mailingListId, isSubscribed } = await request.json()

    if (!mailingListId || typeof isSubscribed !== 'boolean') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

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

    let result
    if (isSubscribed) {
      // Subscribe to mailing list
      const { data, error } = await supabase
        .rpc('subscribe_to_mailing_list', { 
          user_id: session.user.email, 
          mailing_list_id: mailingListId 
        })
      
      if (error) {
        console.error('Error subscribing to mailing list:', error)
        return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
      }
      
      result = data
    } else {
      // Unsubscribe from mailing list
      const { data, error } = await supabase
        .rpc('unsubscribe_from_mailing_list', { 
          user_id: session.user.email, 
          mailing_list_id: mailingListId 
        })
      
      if (error) {
        console.error('Error unsubscribing from mailing list:', error)
        return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
      }
      
      result = data
    }

    return NextResponse.json({ 
      success: true, 
      subscribed: isSubscribed,
      result 
    })
  } catch (error) {
    console.error('Mailing list subscription update error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
