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

    // Get system health metrics
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Database connection test
    const dbStart = Date.now()
    const { data: dbTest, error: dbError } = await supabase
      .from('User')
      .select('id')
      .limit(1)
    const dbResponseTime = Date.now() - dbStart

    // Get recent activity metrics
    const [
      { count: recentUsers },
      { count: recentLinks },
      { count: recentClicks },
      { count: recentErrors }
    ] = await Promise.all([
      supabase.from('User').select('*', { count: 'exact', head: true }).gte('createdAt', oneHourAgo.toISOString()),
      supabase.from('Link').select('*', { count: 'exact', head: true }).gte('createdAt', oneHourAgo.toISOString()),
      supabase.from('Analytics').select('*', { count: 'exact', head: true }).gte('clickTime', oneHourAgo.toISOString()),
      supabase.from('SystemLog').select('*', { count: 'exact', head: true }).eq('logLevel', 'error').gte('timestamp', oneHourAgo.toISOString())
    ])

    // Get system logs
    const { data: systemLogs } = await supabase
      .from('SystemLog')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50)

    // Get error logs specifically
    const { data: errorLogs } = await supabase
      .from('SystemLog')
      .select('*')
      .eq('logLevel', 'error')
      .order('timestamp', { ascending: false })
      .limit(20)

    // Get performance metrics
    const { data: performanceData } = await supabase
      .from('SystemLog')
      .select('*')
      .eq('actionName', 'performance_check')
      .gte('timestamp', oneDayAgo.toISOString())
      .order('timestamp', { ascending: false })
      .limit(100)

    // Calculate system health score
    let healthScore = 100
    
    // Deduct points for errors
    if (recentErrors && recentErrors > 0) {
      healthScore -= Math.min(recentErrors * 5, 30)
    }
    
    // Deduct points for slow database response
    if (dbResponseTime > 1000) {
      healthScore -= 20
    } else if (dbResponseTime > 500) {
      healthScore -= 10
    }
    
    // Deduct points for database errors
    if (dbError) {
      healthScore -= 30
    }

    healthScore = Math.max(healthScore, 0)

    // Get feature flag status
    const { data: featureFlags } = await supabase
      .from('FeatureFlag')
      .select('*')
      .order('name')

    // Get system settings
    const { data: systemSettings } = await supabase
      .from('SystemSetting')
      .select('*')
      .order('name')

    return NextResponse.json({
      health: {
        score: healthScore,
        status: healthScore >= 90 ? 'healthy' : healthScore >= 70 ? 'warning' : 'critical',
        database: {
          connected: !dbError,
          responseTime: dbResponseTime,
          error: dbError?.message
        }
      },
      metrics: {
        recent: {
          users: recentUsers || 0,
          links: recentLinks || 0,
          clicks: recentClicks || 0,
          errors: recentErrors || 0
        },
        uptime: {
          // This would typically come from your hosting provider
          percentage: 99.9,
          lastDowntime: null
        }
      },
      logs: {
        system: systemLogs || [],
        errors: errorLogs || []
      },
      performance: {
        averageResponseTime: performanceData?.length 
          ? performanceData.reduce((sum, log) => sum + (log.metadata?.responseTime || 0), 0) / performanceData.length
          : 0,
        dataPoints: performanceData || []
      },
      configuration: {
        featureFlags: featureFlags || [],
        systemSettings: systemSettings || []
      }
    })
  } catch (error) {
    console.error('Admin monitoring API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

