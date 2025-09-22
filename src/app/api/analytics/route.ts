import { NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    // Get the current user from NextAuth
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

    // First, get the user from the database by email
    console.log('🔍 Looking for user with email:', session.user.email)
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      console.error("Error fetching user:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    console.log('✅ Found user with ID:', user.id)

    // Get user's links with click counts
    console.log('🔍 Fetching links for user ID:', user.id)
    const { data: links, error: linksError } = await supabase
      .from('Link')
      .select('id, title, url, clicks, createdAt')
      .eq('userId', user.id)
      .order('clicks', { ascending: false })

    if (linksError) {
      console.error("Error fetching links:", linksError)
      return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 })
    }
    
    console.log('📊 Found links:', links?.length || 0, links)

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

    // Get profile view count (with error handling)
    console.log('🔍 Fetching profile views for user ID:', user.id)
    let profileViews = []
    try {
      const { data, error: profileViewsError } = await supabase
        .from('ProfileViewAnalytics')
        .select('id')
        .eq('userId', user.id)

      if (profileViewsError) {
        console.error("Error fetching profile views:", profileViewsError)
        console.log("Continuing without profile views data...")
        profileViews = []
      } else {
        profileViews = data || []
      }
    } catch (error) {
      console.error("Exception fetching profile views:", error)
      console.log("Continuing without profile views data...")
      profileViews = []
    }
    
    console.log('👁️ Found profile views:', profileViews?.length || 0)

    // Calculate stats
    const totalClicks = links?.reduce((sum, link) => sum + (link.clicks || 0), 0) || 0
    const totalLinks = links?.length || 0
    const totalProfileViews = profileViews?.length || 0

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
    })).sort((a, b) => (b.count as number) - (a.count as number))

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

    const responseData = {
      totalClicks,
      totalLinks,
      totalProfileViews,
      clicksToday,
      clicksThisWeek,
      clicksThisMonth,
      topLinks,
      deviceStats,
      browserStats: browserStatsArray,
      recentClicks
    }
    
    console.log('📈 Returning analytics data:', responseData)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
