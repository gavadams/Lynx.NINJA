import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/teams/invitations - Get pending invitations for current user
export async function GET() {
  try {
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

    // Get pending invitations for current user
    const { data: invitations, error } = await supabase
      .from('TeamMember')
      .select(`
        id,
        role,
        status,
        invitedAt,
        Team!inner(
          id,
          name,
          description
        ),
        User!TeamMember_invitedBy_fkey(
          displayName,
          email
        )
      `)
      .eq('userId', session.user.id)
      .eq('status', 'pending')
      .order('invitedAt', { ascending: false })

    if (error) {
      console.error("Error fetching invitations:", error)
      return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
    }

    return NextResponse.json({
      invitations: invitations || [],
      count: invitations?.length || 0
    })
  } catch (error) {
    console.error("Error in GET /api/teams/invitations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
