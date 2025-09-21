import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/links/[id] - Get a specific link
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Get the current user from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First, get the user from the database by email
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      console.error("Error fetching user:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { data: link, error } = await supabase
      .from('Link')
      .select('*')
      .eq('id', id)
      .eq('userId', user.id)
      .single()

    if (error || !link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    return NextResponse.json(link)
  } catch (error) {
    console.error("Error fetching link:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/links/[id] - Update a specific link
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Get the current user from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First, get the user from the database by email
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      console.error("Error fetching user:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { title, url, isActive, scheduledAt, expiresAt, password } = body

    // Check if link exists and belongs to user
    const { data: existingLink, error: checkError } = await supabase
      .from('Link')
      .select('id')
      .eq('id', id)
      .eq('userId', user.id)
      .single()

    if (checkError || !existingLink) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (title) updateData.title = title
    if (url) updateData.url = url
    if (isActive !== undefined) updateData.isActive = isActive
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt).toISOString() : null
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt).toISOString() : null
    if (password !== undefined) updateData.password = password

    const { data: link, error } = await supabase
      .from('Link')
      .update(updateData)
      .eq('id', id)
      .eq('userId', user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating link:", error)
      return NextResponse.json({ error: "Failed to update link" }, { status: 500 })
    }

    return NextResponse.json(link)
  } catch (error) {
    console.error("Error updating link:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/links/[id] - Delete a specific link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Get the current user from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First, get the user from the database by email
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      console.error("Error fetching user:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if link exists and belongs to user
    const { data: existingLink, error: checkError } = await supabase
      .from('Link')
      .select('id')
      .eq('id', id)
      .eq('userId', user.id)
      .single()

    if (checkError || !existingLink) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    const { error } = await supabase
      .from('Link')
      .delete()
      .eq('id', id)
      .eq('userId', user.id)

    if (error) {
      console.error("Error deleting link:", error)
      return NextResponse.json({ error: "Failed to delete link" }, { status: 500 })
    }

    return NextResponse.json({ message: "Link deleted successfully" })
  } catch (error) {
    console.error("Error deleting link:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}