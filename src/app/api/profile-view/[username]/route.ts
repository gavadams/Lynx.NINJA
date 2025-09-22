import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// POST /api/profile-view/[username] - Track profile view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
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

    // First, get the user by username
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('username', username)
      .single()

    if (userError || !user) {
      console.error("Error fetching user:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create profile view analytics record
    const { data: analytics, error: analyticsError } = await supabase
      .from('ProfileViewAnalytics')
      .insert({
        userId: user.id,
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
      console.error("Error creating profile view analytics:", analyticsError)
      return NextResponse.json({ error: "Failed to create analytics" }, { status: 500 })
    }

    return NextResponse.json({ success: true, analytics })
  } catch (error) {
    console.error("Error tracking profile view:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
