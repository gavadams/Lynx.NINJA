import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/admin-auth"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminId = request.cookies.get('admin-session')?.value
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const authResult = await verifyAdminSession(adminId)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get query parameters for date range
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, 1y
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate date range
    let dateFilter = ''
    if (startDate && endDate) {
      dateFilter = `gte.${startDate},lte.${endDate}`
    } else {
      const now = new Date()
      let daysBack = 7
      
      switch (period) {
        case '30d':
          daysBack = 30
          break
        case '90d':
          daysBack = 90
          break
        case '1y':
          daysBack = 365
          break
      }
      
      const start = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
      dateFilter = `gte.${start.toISOString()},lte.${now.toISOString()}`
    }

    // Get overall platform statistics
    const [
      { count: totalUsers },
      { count: totalLinks },
      { count: totalClicks },
      { count: premiumUsers }
    ] = await Promise.all([
      supabase.from('User').select('*', { count: 'exact', head: true }),
      supabase.from('Link').select('*', { count: 'exact', head: true }),
      supabase.from('Analytics').select('*', { count: 'exact', head: true }),
      supabase.from('User').select('*', { count: 'exact', head: true }).eq('isPremium', true)
    ])

    // Get user registration trends
    const { data: userRegistrations } = await supabase
      .from('User')
      .select('clickTime')
      .gte('clickTime', dateFilter.split(',')[0].replace('gte.', ''))

    // Get click trends
    const { data: clickTrends } = await supabase
      .from('Analytics')
      .select('clickTime')
      .gte('clickTime', dateFilter.split(',')[0].replace('gte.', ''))

    // Get top performing links
    const { data: topLinks } = await supabase
      .from('Link')
      .select(`
        id,
        title,
        url,
        clickCount,
        User (
          username,
          displayName
        )
      `)
      .order('clickCount', { ascending: false })
      .limit(10)

    // Get geographic distribution
    const { data: geoData } = await supabase
      .from('Analytics')
      .select('country, city')
      .not('country', 'is', null)
      .gte('clickTime', dateFilter.split(',')[0].replace('gte.', ''))

    // Get device/browser stats
    const { data: deviceData } = await supabase
      .from('Analytics')
      .select('device, browser')
      .not('device', 'is', null)
      .gte('clickTime', dateFilter.split(',')[0].replace('gte.', ''))

    // Process data for charts
    const processTimeSeriesData = (data: any[], dateField: string) => {
      const grouped = data.reduce((acc, item) => {
        const date = new Date(item[dateField]).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {})

      return Object.entries(grouped)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    const userRegistrationTrends = processTimeSeriesData(userRegistrations || [], 'createdAt')
    const clickTrendsData = processTimeSeriesData(clickTrends || [], 'createdAt')

    // Process geographic data
    const countryStats = geoData?.reduce((acc, click) => {
      const country = click.country || 'Unknown'
      acc[country] = (acc[country] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const topCountries = Object.entries(countryStats)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Process device data
    const deviceStats = deviceData?.reduce((acc, click) => {
      const device = click.device || 'Unknown'
      acc[device] = (acc[device] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const browserStats = deviceData?.reduce((acc, click) => {
      const browser = click.browser || 'Unknown'
      acc[browser] = (acc[browser] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      overview: {
        totalUsers: totalUsers || 0,
        totalLinks: totalLinks || 0,
        totalClicks: totalClicks || 0,
        premiumUsers: premiumUsers || 0,
        conversionRate: totalUsers ? ((premiumUsers || 0) / totalUsers * 100).toFixed(2) : '0'
      },
      trends: {
        userRegistrations: userRegistrationTrends,
        clicks: clickTrendsData
      },
      topLinks: topLinks || [],
      geographic: {
        topCountries
      },
      devices: {
        deviceTypes: Object.entries(deviceStats).map(([device, count]) => ({ device, count })),
        browsers: Object.entries(browserStats).map(([browser, count]) => ({ browser, count }))
      }
    })
  } catch (error) {
    console.error('Admin analytics API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

