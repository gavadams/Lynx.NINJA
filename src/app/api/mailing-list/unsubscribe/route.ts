import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/mailing-list/unsubscribe?token=xxx - Unsubscribe using token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: "Missing unsubscribe token" }, { status: 400 })
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

    // Find subscription by token
    const { data: subscription, error: fetchError } = await supabase
      .from('MailingListSubscription')
      .select(`
        id,
        userId,
        mailingListId,
        isSubscribed,
        MailingList(name, description)
      `)
      .eq('unsubscribeToken', token)
      .single()

    if (fetchError || !subscription) {
      return NextResponse.json({ error: "Invalid unsubscribe token" }, { status: 404 })
    }

    if (!subscription.isSubscribed) {
      return NextResponse.json({ 
        message: "You are already unsubscribed from this mailing list",
        alreadyUnsubscribed: true
      })
    }

    // Unsubscribe the user
    const { error: unsubscribeError } = await supabase
      .from('MailingListSubscription')
      .update({
        isSubscribed: false,
        unsubscribedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', subscription.id)

    if (unsubscribeError) {
      console.error('Error unsubscribing user:', unsubscribeError)
      return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `You have been unsubscribed from "${subscription.MailingList.name}"`,
      mailingListName: subscription.MailingList.name
    })
  } catch (error) {
    console.error('Unsubscribe API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/mailing-list/unsubscribe - Unsubscribe using user session
export async function POST(request: NextRequest) {
  try {
    const { mailingListId } = await request.json()

    if (!mailingListId) {
      return NextResponse.json({ error: "Missing mailing list ID" }, { status: 400 })
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

    // Get user from session (this would need to be implemented based on your auth system)
    // For now, we'll use a simple approach
    const { data: subscription, error: fetchError } = await supabase
      .from('MailingListSubscription')
      .select(`
        id,
        isSubscribed,
        MailingList(name)
      `)
      .eq('mailingListId', mailingListId)
      .eq('isSubscribed', true)
      .single()

    if (fetchError || !subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    // Unsubscribe
    const { error: unsubscribeError } = await supabase
      .from('MailingListSubscription')
      .update({
        isSubscribed: false,
        unsubscribedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', subscription.id)

    if (unsubscribeError) {
      console.error('Error unsubscribing:', unsubscribeError)
      return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `You have been unsubscribed from "${subscription.MailingList.name}"`
    })
  } catch (error) {
    console.error('Unsubscribe API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
