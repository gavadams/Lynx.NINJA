import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/admin-auth"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'

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

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true })

    // Get total links count
    const { count: totalLinks } = await supabase
      .from('Link')
      .select('*', { count: 'exact', head: true })

    // Get total clicks count
    const { count: totalClicks } = await supabase
      .from('Analytics')
      .select('*', { count: 'exact', head: true })

    // Get premium users count
    const { count: premiumUsers } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true })
      .eq('isPremium', true)

    // Get users created today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: newUsersToday } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', today.toISOString())

    // Get users created this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { count: newUsersThisWeek } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', weekAgo.toISOString())

    // Get users created this month
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    const { count: newUsersThisMonth } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', monthAgo.toISOString())

    // Get pending team invitations
    const { count: pendingInvitations } = await supabase
      .from('TeamMember')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get moderation stats
    const [
      { count: pendingReports },
      { count: flaggedLinks },
      { count: flaggedUsers },
      { count: highClickLinks }
    ] = await Promise.all([
      supabase.from('Report').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('Link').select('*', { count: 'exact', head: true }).or('title.ilike.%spam%,title.ilike.%scam%,title.ilike.%fake%,url.ilike.%spam%,url.ilike.%scam%'),
      supabase.from('User').select('*', { count: 'exact', head: true }).or('username.ilike.%spam%,displayName.ilike.%spam%,bio.ilike.%spam%'),
      supabase.from('Link').select('*', { count: 'exact', head: true }).gt('clicks', 1000)
    ])

    // Get recent system logs for health check
    const { data: recentLogs } = await supabase
      .from('SystemLog')
      .select('level, message, createdAt')
      .order('createdAt', { ascending: false })
      .limit(10)

    // Determine system health based on recent error logs
    const errorLogs = recentLogs?.filter(log => log.level === 'error') || []
    const systemHealth = errorLogs.length > 5 ? 'critical' : 
                        errorLogs.length > 2 ? 'warning' : 'healthy'

    // Calculate total revenue from Stripe
    let totalRevenue = 0
    try {
      // Get all successful payments from Stripe
      const payments = await stripe.paymentIntents.list({
        limit: 100, // Get recent payments
      })
      
      // Calculate total revenue from successful payments
      totalRevenue = payments.data
        .filter(payment => payment.status === 'succeeded')
        .reduce((sum, payment) => sum + (payment.amount / 100), 0) // Convert from cents
    } catch (stripeError) {
      console.error('Error fetching Stripe revenue:', stripeError)
      // Fallback to estimated revenue based on premium users
      totalRevenue = (premiumUsers || 0) * 10 // £10/month per premium user
    }

    const stats = {
      totalUsers: totalUsers || 0,
      totalLinks: totalLinks || 0,
      totalClicks: totalClicks || 0,
      totalRevenue: totalRevenue,
      activeUsers: totalUsers || 0, // For now, same as total users
      newUsersToday: newUsersToday || 0,
      newUsersThisWeek: newUsersThisWeek || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
      systemHealth,
      uptime: '99.9%', // This would need to be calculated from actual uptime data
      lastBackup: new Date().toISOString(), // This would need to be fetched from backup system
      pendingInvitations: pendingInvitations || 0,
      // Moderation stats
      pendingReports: pendingReports || 0,
      flaggedLinks: flaggedLinks || 0,
      flaggedUsers: flaggedUsers || 0,
      highClickLinks: highClickLinks || 0
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Admin dashboard stats error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
