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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // all, links, users, reports
    const status = searchParams.get('status') || 'all' // all, pending, reviewed, flagged
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const offset = (page - 1) * limit

    const data: any = {}

    if (type === 'all' || type === 'links') {
      // Get potentially problematic links
      const { data: flaggedLinks } = await supabase
        .from('Link')
        .select(`
          id,
          title,
          url,
          isActive,
          clickCount,
          createdAt,
          User (
            id,
            username,
            displayName,
            email
          )
        `)
        .or('title.ilike.%spam%,title.ilike.%scam%,title.ilike.%fake%,url.ilike.%spam%,url.ilike.%scam%')
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

      data.flaggedLinks = flaggedLinks || []
    }

    if (type === 'all' || type === 'users') {
      // Get users with potentially problematic content
      const { data: flaggedUsers } = await supabase
        .from('User')
        .select(`
          id,
          username,
          displayName,
          email,
          bio,
          createdAt,
          isPremium
        `)
        .or('username.ilike.%spam%,displayName.ilike.%spam%,bio.ilike.%spam%')
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

      data.flaggedUsers = flaggedUsers || []
    }

    // Get recent high-click links for review
    const { data: highClickLinks } = await supabase
      .from('Link')
      .select(`
        id,
        title,
        url,
        clickCount,
        createdAt,
        User (
          id,
          username,
          displayName
        )
      `)
      .gt('clickCount', 1000)
      .order('clickCount', { ascending: false })
      .limit(10)

    data.highClickLinks = highClickLinks || []

    // Get users with many links (potential spam)
    const { data: prolificUsers } = await supabase
      .from('User')
      .select(`
        id,
        username,
        displayName,
        email,
        createdAt
      `)
      .limit(20)

    // Get link counts for each user
    const usersWithLinkCounts = await Promise.all(
      (prolificUsers || []).map(async (user) => {
        const { count } = await supabase
          .from('Link')
          .select('*', { count: 'exact', head: true })
          .eq('userId', user.id)
        
        return { ...user, linkCount: count || 0 }
      })
    )

    data.prolificUsers = usersWithLinkCounts
      .filter(user => user.linkCount > 50)
      .sort((a, b) => b.linkCount - a.linkCount)
      .slice(0, 10)

    // Get moderation statistics
    const [
      { count: totalLinks },
      { count: totalUsers },
      { count: activeLinks },
      { count: premiumUsers }
    ] = await Promise.all([
      supabase.from('Link').select('*', { count: 'exact', head: true }),
      supabase.from('User').select('*', { count: 'exact', head: true }),
      supabase.from('Link').select('*', { count: 'exact', head: true }).eq('isActive', true),
      supabase.from('User').select('*', { count: 'exact', head: true }).eq('isPremium', true)
    ])

    data.stats = {
      totalLinks: totalLinks || 0,
      totalUsers: totalUsers || 0,
      activeLinks: activeLinks || 0,
      premiumUsers: premiumUsers || 0,
      flaggedLinks: data.flaggedLinks?.length || 0,
      flaggedUsers: data.flaggedUsers?.length || 0
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin moderation API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const { action, resourceType, resourceId, reason } = await request.json()

    if (!action || !resourceType || !resourceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
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

    let result: any = {}

    switch (action) {
      case 'deactivate_link':
        const { data: deactivatedLink, error: deactivateError } = await supabase
          .from('Link')
          .update({ isActive: false })
          .eq('id', resourceId)
          .select()
          .single()

        if (deactivateError) {
          return NextResponse.json({ error: "Failed to deactivate link" }, { status: 500 })
        }

        result = { link: deactivatedLink }
        break

      case 'activate_link':
        const { data: activatedLink, error: activateError } = await supabase
          .from('Link')
          .update({ isActive: true })
          .eq('id', resourceId)
          .select()
          .single()

        if (activateError) {
          return NextResponse.json({ error: "Failed to activate link" }, { status: 500 })
        }

        result = { link: activatedLink }
        break

      case 'delete_link':
        const { error: deleteLinkError } = await supabase
          .from('Link')
          .delete()
          .eq('id', resourceId)

        if (deleteLinkError) {
          return NextResponse.json({ error: "Failed to delete link" }, { status: 500 })
        }

        result = { success: true }
        break

      case 'suspend_user':
        // For now, we'll add a note to the user's bio or create a separate suspension system
        // This is a placeholder - you might want to add a proper suspension field to the User table
        const { data: suspendedUser, error: suspendError } = await supabase
          .from('User')
          .update({ 
            bio: `[SUSPENDED] ${reason || 'Account suspended for policy violation'}`
          })
          .eq('id', resourceId)
          .select()
          .single()

        if (suspendError) {
          return NextResponse.json({ error: "Failed to suspend user" }, { status: 500 })
        }

        result = { user: suspendedUser }
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Log the moderation action
    await supabase.rpc('log_system_event', {
      log_level: 'info',
      log_message: `Moderation action: ${action} on ${resourceType} ${resourceId}`,
      admin_user_id: authResult.admin!.id,
      action_name: action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata: { reason }
    })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Admin moderation action API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

