import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/teams/invitations/[invitationId] - Get invitation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { invitationId } = await params
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

    // Get invitation details with team and inviter info
    const { data: invitation, error } = await supabase
      .from('TeamMember')
      .select(`
        id,
        role,
        status,
        teamId,
        userId,
        invitedBy,
        Team!inner(name),
        User!TeamMember_invitedBy_fkey(displayName)
      `)
      .eq('id', invitationId)
      .eq('userId', session.user.id)
      .single()

    if (error || !invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: invitation.id,
      teamName: invitation.Team.name,
      inviterName: invitation.User.displayName || 'A team member',
      role: invitation.role,
      status: invitation.status
    })
  } catch (error) {
    console.error("Error in GET /api/teams/invitations/[invitationId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
