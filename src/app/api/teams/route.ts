import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/teams - Get user's teams
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

    // Get user's teams using the database function
    const { data: teams, error } = await supabase.rpc('get_user_teams', {
      user_id: session.user.email
    })

    if (error) {
      console.error("Error fetching teams:", error)
      return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
    }

    return NextResponse.json({ teams: teams || [] })
  } catch (error) {
    console.error("Error in teams GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
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

    const { name, description } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    // Create the team
    const { data: team, error: teamError } = await supabase
      .from('Team')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: session.user.email
      })
      .select()
      .single()

    if (teamError) {
      console.error("Error creating team:", teamError)
      return NextResponse.json({ error: "Failed to create team" }, { status: 500 })
    }

    // Add the creator as the owner
    const { error: memberError } = await supabase
      .from('TeamMember')
      .insert({
        teamId: team.id,
        userId: session.user.email,
        role: 'owner',
        status: 'accepted',
        joinedAt: new Date().toISOString()
      })

    if (memberError) {
      console.error("Error adding team owner:", memberError)
      // Clean up the team if member creation fails
      await supabase.from('Team').delete().eq('id', team.id)
      return NextResponse.json({ error: "Failed to create team" }, { status: 500 })
    }

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error("Error in teams POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
