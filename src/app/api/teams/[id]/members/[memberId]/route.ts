import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// PUT /api/teams/[id]/members/[memberId] - Update team member role or accept invitation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.emailail) {
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

    const body = await request.json()
    const { role, status } = body

    // Get the team member record
    const { data: teamMember, error: memberError } = await supabase
      .from('TeamMember')
      .select('*')
      .eq('id', memberId)
      .eq('teamId', id)
      .single()

    if (memberError || !teamMember) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    // Check if user is the member themselves (for accepting invitations)
    if (teamMember.userId === session.user.email) {
      if (status === 'accepted' && teamMember.status === 'pending') {
        // User is accepting the invitation
        const { data: updatedMember, error: updateError } = await supabase
          .from('TeamMember')
          .update({
            status: 'accepted',
            joinedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .eq('id', memberId)
          .select()
          .single()

        if (updateError) {
          console.error("Error accepting invitation:", updateError)
          return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
        }

        return NextResponse.json(updatedMember)
      } else if (status === 'declined' && teamMember.status === 'pending') {
        // User is declining the invitation
        const { error: updateError } = await supabase
          .from('TeamMember')
          .update({
            status: 'declined',
            updatedAt: new Date().toISOString()
          })
          .eq('id', memberId)

        if (updateError) {
          console.error("Error declining invitation:", updateError)
          return NextResponse.json({ error: "Failed to decline invitation" }, { status: 500 })
        }

        return NextResponse.json({ message: "Invitation declined" })
      }
    }

    // Check if user has permission to modify this member (owner/admin)
    const { data: membership, error: membershipError } = await supabase
      .from('TeamMember')
      .select('role, status')
      .eq('teamId', id)
      .eq('userId', session.user.email)
      .single()

    if (membershipError || !membership || membership.status !== 'accepted') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Prevent non-owners from modifying owner roles
    if (teamMember.role === 'owner' && membership.role !== 'owner') {
      return NextResponse.json({ error: "Cannot modify team owner" }, { status: 403 })
    }

    // Update member role
    if (role && ['member', 'admin'].includes(role)) {
      const { data: updatedMember, error: updateError } = await supabase
        .from('TeamMember')
        .update({
          role,
          updatedAt: new Date().toISOString()
        })
        .eq('id', memberId)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating member role:", updateError)
        return NextResponse.json({ error: "Failed to update member role" }, { status: 500 })
      }

      return NextResponse.json(updatedMember)
    }

    return NextResponse.json({ error: "Invalid update" }, { status: 400 })
  } catch (error) {
    console.error("Error in team member PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/teams/[id]/members/[memberId] - Remove team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.emailailail) {
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

    // Get the team member record
    const { data: teamMember, error: memberError } = await supabase
      .from('TeamMember')
      .select('*')
      .eq('id', memberId)
      .eq('teamId', id)
      .single()

    if (memberError || !teamMember) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    // Check if user is the member themselves (for leaving team)
    if (teamMember.userId === session.user.email) {
      // User is leaving the team
      if (teamMember.role === 'owner') {
        return NextResponse.json({ error: "Team owners cannot leave the team. Transfer ownership first." }, { status: 400 })
      }

      const { error: deleteError } = await supabase
        .from('TeamMember')
        .delete()
        .eq('id', memberId)

      if (deleteError) {
        console.error("Error leaving team:", deleteError)
        return NextResponse.json({ error: "Failed to leave team" }, { status: 500 })
      }

      return NextResponse.json({ message: "Left team successfully" })
    }

    // Check if user has permission to remove this member (owner/admin)
    const { data: membership, error: membershipError } = await supabase
      .from('TeamMember')
      .select('role, status')
      .eq('teamId', id)
      .eq('userId', session.user.email)
      .single()

    if (membershipError || !membership || membership.status !== 'accepted') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Prevent non-owners from removing owners
    if (teamMember.role === 'owner' && membership.role !== 'owner') {
      return NextResponse.json({ error: "Cannot remove team owner" }, { status: 403 })
    }

    // Remove the member
    const { error: deleteError } = await supabase
      .from('TeamMember')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      console.error("Error removing team member:", deleteError)
      return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 })
    }

    return NextResponse.json({ message: "Team member removed successfully" })
  } catch (error) {
    console.error("Error in team member DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
