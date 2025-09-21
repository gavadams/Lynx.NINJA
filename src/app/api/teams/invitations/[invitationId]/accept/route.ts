import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// POST /api/teams/invitations/[invitationId]/accept - Accept team invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { invitationId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
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

    // Check if invitation exists and belongs to current user
    const { data: invitation, error: checkError } = await supabase
      .from('TeamMember')
      .select('id, status, userId')
      .eq('id', invitationId)
      .eq('userId', session.user.email)
      .single()

    if (checkError || !invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ 
        error: `Invitation has already been ${invitation.status}` 
      }, { status: 400 })
    }

    // Update invitation status to accepted
    const { data: updatedInvitation, error: updateError } = await supabase
      .from('TeamMember')
      .update({
        status: 'accepted',
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', invitationId)
      .select()
      .single()

    if (updateError) {
      console.error("Error accepting invitation:", updateError)
      return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Invitation accepted successfully",
      invitation: updatedInvitation
    })
  } catch (error) {
    console.error("Error in POST /api/teams/invitations/[invitationId]/accept:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
