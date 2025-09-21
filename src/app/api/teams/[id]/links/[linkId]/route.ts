import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// DELETE /api/teams/[id]/links/[linkId] - Remove a link from the team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  try {
    const { id, linkId } = await params
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
      .eq('userId', session.user.email)
      .single()

    if (membershipError || !membership || membership.status !== 'accepted') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get the team link record
    const { data: teamLink, error: teamLinkError } = await supabase
      .from('TeamLink')
      .select('*')
      .eq('teamId', id)
      .eq('linkId', linkId)
      .single()

    if (teamLinkError || !teamLink) {
      return NextResponse.json({ error: "Team link not found" }, { status: 404 })
    }

    // Check if user is the creator of the team link or has admin/owner permissions
    const canRemove = teamLink.createdBy === session.user.email || 
                     ['owner', 'admin'].includes(membership.role)

    if (!canRemove) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Remove the link from team
    const { error: deleteError } = await supabase
      .from('TeamLink')
      .delete()
      .eq('id', teamLink.id)

    if (deleteError) {
      console.error("Error removing link from team:", deleteError)
      return NextResponse.json({ error: "Failed to remove link from team" }, { status: 500 })
    }

    return NextResponse.json({ message: "Link removed from team successfully" })
  } catch (error) {
    console.error("Error in team link DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
