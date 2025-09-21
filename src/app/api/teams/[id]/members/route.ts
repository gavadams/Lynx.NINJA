import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

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

    const { data: members, error } = await supabase
      .from('TeamMember')
      .select(`
        id,
        userId,
        role,
        status,
        invitedAt,
        joinedAt,
        user:User(id, displayName, email, profileImage)
      `)
      .eq('teamId', id)
      .order('invitedAt', { ascending: true })

    if (error) {
      console.error("Error fetching team members:", error)
      return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
    }

    return NextResponse.json({ members: members || [] })
  } catch (error) {
    console.error("Error in GET /api/teams/[id]/members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
        invitedBy: session.user.email
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
    console.error("Error in POST /api/teams/[id]/members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}