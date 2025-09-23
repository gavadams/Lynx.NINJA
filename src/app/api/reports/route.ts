import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// POST /api/reports - Submit a new report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { 
      reportType, 
      reason, 
      description, 
      reportedUserId, 
      reportedLinkId 
    } = body

    // Validate required fields
    if (!reportType || !reason) {
      return NextResponse.json({ error: "Report type and reason are required" }, { status: 400 })
    }

    // Validate report type
    const validReportTypes = ['spam', 'inappropriate', 'malicious', 'harassment', 'fake', 'other']
    if (!validReportTypes.includes(reportType)) {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    // Must report either a user or a link, not both
    if (!reportedUserId && !reportedLinkId) {
      return NextResponse.json({ error: "Must report either a user or a link" }, { status: 400 })
    }

    if (reportedUserId && reportedLinkId) {
      return NextResponse.json({ error: "Cannot report both user and link in the same report" }, { status: 400 })
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

    // Check if the reported user/link exists
    if (reportedUserId) {
      const { data: user, error: userError } = await supabase
        .from('User')
        .select('id')
        .eq('id', reportedUserId)
        .single()

      if (userError || !user) {
        return NextResponse.json({ error: "Reported user not found" }, { status: 404 })
      }
    }

    if (reportedLinkId) {
      const { data: link, error: linkError } = await supabase
        .from('Link')
        .select('id')
        .eq('id', reportedLinkId)
        .single()

      if (linkError || !link) {
        return NextResponse.json({ error: "Reported link not found" }, { status: 404 })
      }
    }

    // Create the report
    const { data: report, error: reportError } = await supabase
      .from('Report')
      .insert({
        reporterId: session?.user?.id || null, // Allow anonymous reports
        reportedUserId: reportedUserId || null,
        reportedLinkId: reportedLinkId || null,
        reportType,
        reason,
        description: description || null,
        status: 'pending'
      })
      .select()
      .single()

    if (reportError) {
      console.error('Error creating report:', reportError)
      return NextResponse.json({ error: "Failed to submit report" }, { status: 500 })
    }

    // Log the report submission
    await supabase.rpc('log_system_event', {
      log_level: 'info',
      log_message: `New report submitted: ${reportType} - ${reason}`,
      admin_user_id: null,
      action_name: 'submit_report',
      resource_type: reportedUserId ? 'user' : 'link',
      resource_id: reportedUserId || reportedLinkId,
      metadata: { 
        reportId: report.id,
        reportType,
        reporterId: session?.user?.id || 'anonymous'
      }
    })

    return NextResponse.json({ 
      success: true, 
      report,
      message: "Report submitted successfully. Thank you for helping keep our community safe." 
    })

  } catch (error) {
    console.error('Report submission error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/reports - Get reports (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin status
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

    const { data: adminUser } = await supabase
      .from('AdminUser')
      .select('id')
      .eq('userId', session.user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('Report')
      .select(`
        id,
        reportType,
        reason,
        description,
        status,
        adminNotes,
        createdAt,
        updatedAt,
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
          email
        ),
        ReportedLink:reportedLinkId (
          id,
          title,
          url,
          User (
            id,
            username,
            displayName
          )
        ),
        ResolvedBy:resolvedBy (
          id,
          username,
          displayName
        )
      `)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (type !== 'all') {
      query = query.eq('reportType', type)
    }

    const { data: reports, error } = await query

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('Report')
      .select('*', { count: 'exact', head: true })

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    if (type !== 'all') {
      countQuery = countQuery.eq('reportType', type)
    }

    const { count } = await countQuery

    return NextResponse.json({
      reports: reports || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
