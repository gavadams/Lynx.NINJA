import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// PUT /api/reports/[id] - Update report status (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user?.id) {
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

    // Verify admin status
    const { data: adminUser } = await supabase
      .from('AdminUser')
      .select('id')
      .eq('userId', session.user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { status, adminNotes, action } = body

    // Validate status
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Get the current report
    const { data: report, error: reportError } = await supabase
      .from('Report')
      .select('*')
      .eq('id', id)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    
    if (status) {
      updateData.status = status
    }
    
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes
    }

    // If resolving the report, set resolvedBy and resolvedAt
    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolvedBy = adminUser.id
      updateData.resolvedAt = new Date().toISOString()
    }

    // Update the report
    const { data: updatedReport, error: updateError } = await supabase
      .from('Report')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating report:', updateError)
      return NextResponse.json({ error: "Failed to update report" }, { status: 500 })
    }

    // If there's an action to take on the reported content
    if (action && report.reportedUserId) {
      // Handle user-related actions
      switch (action) {
        case 'suspend_user':
          await supabase
            .from('User')
            .update({ isActive: false })
            .eq('id', report.reportedUserId)
          break
        case 'activate_user':
          await supabase
            .from('User')
            .update({ isActive: true })
            .eq('id', report.reportedUserId)
          break
      }
    }

    if (action && report.reportedLinkId) {
      // Handle link-related actions
      switch (action) {
        case 'deactivate_link':
          await supabase
            .from('Link')
            .update({ isActive: false })
            .eq('id', report.reportedLinkId)
          break
        case 'activate_link':
          await supabase
            .from('Link')
            .update({ isActive: true })
            .eq('id', report.reportedLinkId)
          break
        case 'delete_link':
          await supabase
            .from('Link')
            .delete()
            .eq('id', report.reportedLinkId)
          break
      }
    }

    // Log the admin action
    await supabase.rpc('log_system_event', {
      log_level: 'info',
      log_message: `Admin updated report ${id}: ${status}${action ? ` with action ${action}` : ''}`,
      admin_user_id: adminUser.id,
      action_name: 'update_report',
      resource_type: 'report',
      resource_id: id,
      metadata: { 
        status,
        action,
        previousStatus: report.status
      }
    })

    return NextResponse.json({ 
      success: true, 
      report: updatedReport,
      message: "Report updated successfully" 
    })

  } catch (error) {
    console.error('Update report error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/reports/[id] - Get specific report (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user?.id) {
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

    // Verify admin status
    const { data: adminUser } = await supabase
      .from('AdminUser')
      .select('id')
      .eq('userId', session.user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get the report with all related data
    const { data: report, error } = await supabase
      .from('Report')
      .select(`
        *,
        Reporter:reporterId (
          id,
          username,
          displayName,
          email
        ),
        ReportedUser:reportedUserId (
          id,
          username,
          displayName,
          email,
          bio,
          createdAt
        ),
        ReportedLink:reportedLinkId (
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
        ),
        ResolvedBy:resolvedBy (
          id,
          username,
          displayName
        )
      `)
      .eq('id', id)
      .single()

    if (error || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json({ report })

  } catch (error) {
    console.error('Get report error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
