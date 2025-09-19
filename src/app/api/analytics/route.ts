import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
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

    // Get user's links with click counts
    const { data: links, error: linksError } = await supabase
      .from('Link')
      .select('id, title, url, clickCount, createdAt')
      .eq('userId', user.id)
      .order('clickCount', { ascending: false })

    if (linksError) {
      console.error("Error fetching links:", linksError)
      return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 })
    }

    // Get analytics data
    const { data: analytics, error: analyticsError } = await supabase
      .from('Analytics')
      .select('*')
      .in('linkId', links?.map(link => link.id) || [])
      .order('createdAt', { ascending: false })

    if (analyticsError) {
      console.error("Error fetching analytics:", analyticsError)
      return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
    }

    // Calculate stats
    const totalClicks = links?.reduce((sum, link) => sum + link.clickCount, 0) || 0
    const totalLinks = links?.length || 0

    // Calculate time-based stats
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const clicksToday = analytics?.filter(a => 
      new Date(a.createdAt) >= today
    ).length || 0

    const clicksThisWeek = analytics?.filter(a => 
      new Date(a.createdAt) >= weekAgo
    ).length || 0

    const clicksThisMonth = analytics?.filter(a => 
      new Date(a.createdAt) >= monthAgo
    ).length || 0

    // Get top links (limit to 5)
    const topLinks = links?.slice(0, 5) || []

    // Calculate device stats
    const deviceStats = analytics?.reduce((acc, a) => {
      if (a.device === 'mobile') {
        acc.mobile += 1
      } else if (a.device === 'desktop') {
        acc.desktop += 1
      }
      return acc
    }, { mobile: 0, desktop: 0 }) || { mobile: 0, desktop: 0 }

    // Calculate browser stats
    const browserStats = analytics?.reduce((acc, a) => {
      const browser = a.browser || 'Unknown'
      acc[browser] = (acc[browser] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const browserStatsArray = Object.entries(browserStats).map(([browser, count]) => ({
      browser,
      count
    })).sort((a, b) => b.count - a.count)

    // Get recent clicks (limit to 10)
    const recentClicks = analytics?.slice(0, 10).map(click => {
      const link = links?.find(l => l.id === click.linkId)
      return {
        id: click.id,
        linkTitle: link?.title || 'Unknown Link',
        clickedAt: click.createdAt,
        device: click.device || 'Unknown',
        browser: click.browser || 'Unknown'
      }
    }) || []

    return NextResponse.json({
      totalClicks,
      totalLinks,
      clicksToday,
      clicksThisWeek,
      clicksThisMonth,
      topLinks,
      deviceStats,
      browserStats: browserStatsArray,
      recentClicks
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
