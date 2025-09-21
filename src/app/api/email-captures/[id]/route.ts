import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/email-captures/[id] - Get specific email capture details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
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

    // Get email capture details
    const { data: capture, error } = await supabase
      .from('EmailCapture')
      .select('*')
      .eq('id', id)
      .eq('userId', session.user.email)
      .single()

    if (error || !capture) {
      return NextResponse.json({ error: "Email capture not found" }, { status: 404 })
    }

    // Get stats
    const { data: stats, error: statsError } = await supabase
      .rpc('get_email_capture_stats', { capture_id: id })

    if (statsError) {
      console.error("Error fetching stats:", statsError)
    }

    return NextResponse.json({ 
      capture,
      stats: stats?.[0] || {
        total_submissions: 0,
        unique_emails: 0,
        today_submissions: 0,
        this_week_submissions: 0,
        this_month_submissions: 0
      }
    })
  } catch (error) {
    console.error("Error in email-capture GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/email-captures/[id] - Update email capture settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, buttonText, placeholder, successMessage, isActive } = body

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

    // Update email capture
    const { data: updatedCapture, error } = await supabase
      .from('EmailCapture')
      .update({
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        buttonText: buttonText || undefined,
        placeholder: placeholder || undefined,
        successMessage: successMessage || undefined,
        isActive: isActive !== undefined ? isActive : undefined
      })
      .eq('id', id)
      .eq('userId', session.user.email)
      .select()
      .single()

    if (error || !updatedCapture) {
      return NextResponse.json({ error: "Failed to update email capture" }, { status: 500 })
    }

    return NextResponse.json({ capture: updatedCapture })
  } catch (error) {
    console.error("Error in email-capture PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/email-captures/[id] - Delete email capture
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
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

    // Delete email capture (cascade will delete submissions)
    const { error } = await supabase
      .from('EmailCapture')
      .delete()
      .eq('id', id)
      .eq('userId', session.user.email)

    if (error) {
      console.error("Error deleting email capture:", error)
      return NextResponse.json({ error: "Failed to delete email capture" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in email-capture DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
