import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getLinkScheduleStatus } from "@/lib/link-scheduling"

/**
 * Background job to process scheduled and expired links
 * This should be called by a cron job service (like Vercel Cron, GitHub Actions, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

    const now = new Date().toISOString()
    
    // Find all links that need to be activated (scheduled for now or earlier)
    const { data: scheduledLinks, error: scheduledError } = await supabase
      .from('Link')
      .select('id, scheduledAt, isActive')
      .not('scheduledAt', 'is', null)
      .lte('scheduledAt', now)
      .eq('isActive', false)

    if (scheduledError) {
      console.error('Error fetching scheduled links:', scheduledError)
      return NextResponse.json({ error: "Failed to fetch scheduled links" }, { status: 500 })
    }

    // Find all links that need to be deactivated (expired)
    const { data: expiredLinks, error: expiredError } = await supabase
      .from('Link')
      .select('id, expiresAt, isActive')
      .not('expiresAt', 'is', null)
      .lte('expiresAt', now)
      .eq('isActive', true)

    if (expiredError) {
      console.error('Error fetching expired links:', expiredError)
      return NextResponse.json({ error: "Failed to fetch expired links" }, { status: 500 })
    }

    let activatedCount = 0
    let deactivatedCount = 0

    // Activate scheduled links
    if (scheduledLinks && scheduledLinks.length > 0) {
      const linkIds = scheduledLinks.map(link => link.id)
      
      const { error: activateError } = await supabase
        .from('Link')
        .update({ isActive: true })
        .in('id', linkIds)

      if (activateError) {
        console.error('Error activating scheduled links:', activateError)
      } else {
        activatedCount = scheduledLinks.length
        console.log(`Activated ${activatedCount} scheduled links`)
      }
    }

    // Deactivate expired links
    if (expiredLinks && expiredLinks.length > 0) {
      const linkIds = expiredLinks.map(link => link.id)
      
      const { error: deactivateError } = await supabase
        .from('Link')
        .update({ isActive: false })
        .in('id', linkIds)

      if (deactivateError) {
        console.error('Error deactivating expired links:', deactivateError)
      } else {
        deactivatedCount = expiredLinks.length
        console.log(`Deactivated ${deactivatedCount} expired links`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${activatedCount} scheduled links and ${deactivatedCount} expired links`,
      activated: activatedCount,
      deactivated: deactivatedCount,
      timestamp: now
    })

  } catch (error) {
    console.error('Error processing scheduled links:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Allow GET for testing
export async function GET() {
  return NextResponse.json({
    message: "Scheduled links processor endpoint",
    note: "Use POST with proper authorization to process links"
  })
}
