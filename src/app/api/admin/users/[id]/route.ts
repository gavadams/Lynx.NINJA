import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/admin-auth"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 Admin user detail request:', { userId: id })

    // Verify admin authentication
    const adminId = request.cookies.get('admin-session')?.value
    console.log('🔍 Admin session cookie:', adminId ? 'Present' : 'Missing')
    
    if (!adminId) {
      console.log('❌ No admin session cookie')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const authResult = await verifyAdminSession(adminId)
    console.log('🔍 Admin auth result:', { success: authResult.success, error: authResult.error })
    
    if (!authResult.success) {
      console.log('❌ Admin auth failed:', authResult.error)
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

    // Get user details
    const { data: user, error } = await supabase
      .from('User')
      .select(`
        id,
        email,
        username,
        displayName,
        profileImage,
        bio,
        theme,
        isPremium,
        createdAt,
        updatedAt,
        lastLoginAt
      `)
      .eq('id', id)
      .single()

    console.log('🔍 Admin user detail query:', { 
      userId: id, 
      userFound: !!user, 
      error: error?.message,
      userData: user ? { id: user.id, email: user.email } : null
    })

    if (error) {
      console.log('❌ Database query error:', { userId: id, error: error.message, code: error.code })
      return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 })
    }

    if (!user) {
      console.log('❌ User not found in database:', { userId: id })
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's links count
    const { count: linksCount } = await supabase
      .from('Link')
      .select('*', { count: 'exact', head: true })
      .eq('userId', id)

    // Get user's total clicks
    const { data: clicksData } = await supabase
      .from('Click')
      .select('id')
      .eq('userId', id)

    const totalClicks = clicksData?.length || 0

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentClicks } = await supabase
      .from('Click')
      .select('id, createdAt')
      .eq('userId', id)
      .gte('createdAt', sevenDaysAgo.toISOString())

    return NextResponse.json({
      user: {
        ...user,
        stats: {
          linksCount: linksCount || 0,
          totalClicks,
          recentClicks: recentClicks?.length || 0
        }
      }
    })
  } catch (error) {
    console.error('Admin user detail API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updates = await request.json()

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

    // Validate allowed fields
    const allowedFields = ['username', 'displayName', 'bio', 'theme', 'isPremium']
    const filteredUpdates: any = {}
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Check if username is unique (if being updated)
    if (filteredUpdates.username) {
      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('username', filteredUpdates.username)
        .neq('id', id)
        .single()

      if (existingUser) {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 })
      }
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('User')
      .update({
        ...filteredUpdates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    // Log the action
    await supabase.rpc('log_system_event', {
      log_level: 'info',
      log_message: `Admin updated user: ${updatedUser.email}`,
      admin_user_id: authResult.admin!.id,
      action_name: 'update_user',
      resource_type: 'user',
      resource_id: id,
      metadata: { updates: filteredUpdates }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Admin user update API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Get user details before deletion for logging
    const { data: userToDelete } = await supabase
      .from('User')
      .select('email, username')
      .eq('id', id)
      .single()

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete user (this will cascade to related records due to foreign key constraints)
    const { error } = await supabase
      .from('User')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    // Log the action
    await supabase.rpc('log_system_event', {
      log_level: 'warning',
      log_message: `Admin deleted user: ${userToDelete.email}`,
      admin_user_id: authResult.admin!.id,
      action_name: 'delete_user',
      resource_type: 'user',
      resource_id: id,
      metadata: { deletedUser: userToDelete }
    })

    return NextResponse.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    console.error('Admin user delete API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}