import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// POST /api/links/[id]/check-password - Check if password is correct for a link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
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

    // Get the link and check password
    const { data: link, error } = await supabase
      .from('Link')
      .select('id, password, isActive, scheduledAt, expiresAt')
      .eq('id', id)
      .single()

    if (error || !link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    // Check if link is active and not expired
    const now = new Date()
    const isScheduled = link.scheduledAt && new Date(link.scheduledAt) > now
    const isExpired = link.expiresAt && new Date(link.expiresAt) <= now

    if (!link.isActive || isScheduled || isExpired) {
      return NextResponse.json({ error: "Link is not accessible" }, { status: 403 })
    }

    // Check password
    if (link.password && link.password !== password) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error checking password:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
