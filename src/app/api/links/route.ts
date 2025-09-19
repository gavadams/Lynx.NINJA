import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/links - Get all links for the authenticated user
export async function GET() {
  try {
    // Get the current user from NextAuth
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

    // Get user's links
    const { data: links, error } = await supabase
      .from('Link')
      .select('*')
      .eq('userId', session.user.id)
      .order('order', { ascending: true })

    if (error) {
      console.error("Error fetching links:", error)
      return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 })
    }

    return NextResponse.json(links || [])
  } catch (error) {
    console.error("Error fetching links:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/links - Create a new link
export async function POST(request: NextRequest) {
  try {
    // Get the current user from NextAuth
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

    const body = await request.json()
    const { title, url } = body

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required" }, { status: 400 })
    }

    // Get the highest order number for this user
    const { data: lastLink } = await supabase
      .from('Link')
      .select('order')
      .eq('userId', session.user.id)
      .order('order', { ascending: false })
      .limit(1)
      .single()

    const newOrder = lastLink ? lastLink.order + 1 : 0

    // Create the new link
    const { data: link, error } = await supabase
      .from('Link')
      .insert({
        title,
        url,
        order: newOrder,
        userId: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating link:", error)
      return NextResponse.json({ error: "Failed to create link" }, { status: 500 })
    }

    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    console.error("Error creating link:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}