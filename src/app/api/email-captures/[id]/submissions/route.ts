import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/email-captures/[id]/submissions - Get email submissions for a capture form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const exportFormat = url.searchParams.get('export') === 'csv'

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

    // Verify user owns this email capture
    const { data: capture, error: captureError } = await supabase
      .from('EmailCapture')
      .select('id')
      .eq('id', id)
      .eq('userId', session.user.email)
      .single()

    if (captureError || !capture) {
      return NextResponse.json({ error: "Email capture not found" }, { status: 404 })
    }

    if (exportFormat) {
      // Export as CSV
      const { data: submissions, error } = await supabase
        .from('EmailSubmission')
        .select('*')
        .eq('emailCaptureId', id)
        .order('submittedAt', { ascending: false })

      if (error) {
        console.error("Error fetching submissions for export:", error)
        return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
      }

      // Convert to CSV
      const csvHeaders = 'Email,Submitted At,IP Address,Device,Browser,Country,City\n'
      const csvRows = submissions?.map(sub => 
        `"${sub.email}","${sub.submittedAt}","${sub.ipAddress || ''}","${sub.device || ''}","${sub.browser || ''}","${sub.country || ''}","${sub.city || ''}"`
      ).join('\n') || ''

      const csv = csvHeaders + csvRows

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="email-submissions-${id}.csv"`
        }
      })
    } else {
      // Regular paginated response
      const offset = (page - 1) * limit

      const { data: submissions, error } = await supabase
        .from('EmailSubmission')
        .select('*')
        .eq('emailCaptureId', id)
        .order('submittedAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error("Error fetching submissions:", error)
        return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
      }

      // Get total count
      const { count, error: countError } = await supabase
        .from('EmailSubmission')
        .select('*', { count: 'exact', head: true })
        .eq('emailCaptureId', id)

      if (countError) {
        console.error("Error counting submissions:", countError)
      }

      return NextResponse.json({
        submissions: submissions || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      })
    }
  } catch (error) {
    console.error("Error in submissions GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
