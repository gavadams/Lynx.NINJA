import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/teams/[id]/links - Get team links
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
      .eq('userId', session.user.email)
      .single()

    if (membershipError || !membership || membership.status !== 'accepted') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get team links
    const { data: links, error: linksError } = await supabase.rpc('get_team_links', {
      team_id: id
    })

    if (linksError) {
      console.error("Error fetching team links:", linksError)
      return NextResponse.json({ error: "Failed to fetch team links" }, { status: 500 })
    }

    return NextResponse.json({ links: links || [] })
  } catch (error) {
    console.error("Error in team links GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/teams/[id]/links - Add a link to the team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check if user is a member of this team
    const { data: membership, error: membershipError } = await supabase
      .from('TeamMember')
      .select('role, status')
      .eq('teamId', id)
      .eq('userId', session.user.email)
      .single()

    if (membershipError || !membership || membership.status !== 'accepted') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { linkId } = await request.json()

    if (!linkId) {
      return NextResponse.json({ error: "Link ID is required" }, { status: 400 })
    }

    // Verify the link exists and belongs to the user
    const { data: link, error: linkError } = await supabase
      .from('Link')
      .select('id, userId, title, url')
      .eq('id', linkId)
      .eq('userId', session.user.email)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: "Link not found or access denied" }, { status: 404 })
    }

    // Check if link is already in the team
    const { data: existingTeamLink, error: existingError } = await supabase
      .from('TeamLink')
      .select('id')
      .eq('teamId', id)
      .eq('linkId', linkId)
      .single()

    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error checking existing team link:", existingError)
      return NextResponse.json({ error: "Failed to check existing team link" }, { status: 500 })
    }

    if (existingTeamLink) {
      return NextResponse.json({ error: "Link is already in this team" }, { status: 409 })
    }

    // Add link to team
    const { data: teamLink, error: teamLinkError } = await supabase
      .from('TeamLink')
      .insert({
        teamId: id,
        linkId: linkId,
        createdBy: session.user.email
      })
      .select()
      .single()

    if (teamLinkError) {
      console.error("Error adding link to team:", teamLinkError)
      return NextResponse.json({ error: "Failed to add link to team" }, { status: 500 })
    }

    return NextResponse.json({
      ...teamLink,
      link: {
        id: link.id,
        title: link.title,
        url: link.url
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Error in team links POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
