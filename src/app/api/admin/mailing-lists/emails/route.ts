import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/admin-auth"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/admin/mailing-lists/emails - Get recent emails
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

    // Get recent emails with performance metrics
    const { data: emails, error } = await supabase
      .from('MailingListEmail')
      .select(`
        id,
        subject,
        sentAt,
        recipientCount,
        openedCount,
        clickedCount,
        MailingList(name)
      `)
      .order('sentAt', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching emails:', error)
      return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 })
    }

    return NextResponse.json({ emails: emails || [] })
  } catch (error) {
    console.error('Admin emails API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
