import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/teams/[id] - Get team details
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

    // Check if user is a member of this team
    const { data: membership, error: membershipError } = await supabase
      .from('TeamMember')
      .select('role, status')
      .eq('teamId', id)
      .eq('userId', session.user.id)
      .single()

    if (membershipError || !membership || membership.status !== 'accepted') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get team details
    const { data: team, error: teamError } = await supabase
      .from('Team')
      .select('*')
      .eq('id', id)
      .single()

    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Get team members
    const { data: members, error: membersError } = await supabase.rpc('get_team_members', {
      team_id: id
    })

    if (membersError) {
      console.error("Error fetching team members:", membersError)
    }

    // Get team links
    const { data: links, error: linksError } = await supabase.rpc('get_team_links', {
      team_id: id
    })

    if (linksError) {
      console.error("Error fetching team links:", linksError)
    }

    return NextResponse.json({
      team,
      membership: {
        role: membership.role,
        status: membership.status
      },
      members: members || [],
      links: links || []
    })
  } catch (error) {
    console.error("Error in team GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/teams/[id] - Update team
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

    // Check if user is owner or admin of this team
    const { data: membership, error: membershipError } = await supabase
      .from('TeamMember')
      .select('role, status')
      .eq('teamId', id)
      .eq('userId', session.user.id)
      .single()

    if (membershipError || !membership || membership.status !== 'accepted') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { name, description } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    // Update the team
    const { data: team, error: teamError } = await supabase
      .from('Team')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (teamError) {
      console.error("Error updating team:", teamError)
      return NextResponse.json({ error: "Failed to update team" }, { status: 500 })
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error("Error in team PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/teams/[id] - Delete team
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

    // Check if user is owner of this team
    const { data: membership, error: membershipError } = await supabase
      .from('TeamMember')
      .select('role, status')
      .eq('teamId', id)
      .eq('userId', session.user.id)
      .single()

    if (membershipError || !membership || membership.status !== 'accepted') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (membership.role !== 'owner') {
      return NextResponse.json({ error: "Only team owners can delete teams" }, { status: 403 })
    }

    // Delete the team (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('Team')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error("Error deleting team:", deleteError)
      return NextResponse.json({ error: "Failed to delete team" }, { status: 500 })
    }

    return NextResponse.json({ message: "Team deleted successfully" })
  } catch (error) {
    console.error("Error in team DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/teams/[id] - Invite member to team
export async function POST(
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

    const { email, role = 'member' } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const { data: invitedUser, error: userError } = await supabase
      .from('User')
      .select('id, displayName')
      .eq('email', email)
      .single()

    if (userError || !invitedUser) {
      return NextResponse.json({ error: "User with this email not found" }, { status: 404 })
    }

    const { data: newMember, error } = await supabase
      .from('TeamMember')
      .insert({
        teamId: id,
        userId: invitedUser.id,
        role,
        status: 'pending',
        invitedBy: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error("Error inviting member:", error)
      return NextResponse.json({ error: "Failed to invite member" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Member invited successfully",
      member: newMember
    }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/teams/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
