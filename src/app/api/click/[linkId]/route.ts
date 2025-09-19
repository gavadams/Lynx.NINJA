import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// POST /api/click/[linkId] - Track link click
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params
    const body = await request.json()
    const { ipAddress, userAgent, referer, country, city, device, browser } = body

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

    // First, get the link to find the userId
    const { data: link, error: linkError } = await supabase
      .from('Link')
      .select('userId')
      .eq('id', linkId)
      .single()

    if (linkError || !link) {
      console.error("Error fetching link:", linkError)
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    // Increment click count using the database function
    const { error: incrementError } = await supabase.rpc('increment_link_clicks', {
      link_id: linkId
    })

    if (incrementError) {
      console.error("Error incrementing clicks:", incrementError)
      return NextResponse.json({ error: "Failed to track click" }, { status: 500 })
    }

    // Create analytics record
    const { data: analytics, error: analyticsError } = await supabase
      .from('Analytics')
      .insert({
        linkId,
        userId: link.userId,
        ipAddress,
        userAgent,
        referer,
        country,
        city,
        device,
        browser
      })
      .select()
      .single()

    if (analyticsError) {
      console.error("Error creating analytics:", analyticsError)
      return NextResponse.json({ error: "Failed to create analytics" }, { status: 500 })
    }

    return NextResponse.json({ success: true, analytics })
  } catch (error) {
    console.error("Error tracking click:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
