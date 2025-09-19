import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const username = url.searchParams.get('username')
    
    if (!username) {
      return NextResponse.json({ error: "Username parameter required" }, { status: 400 })
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

    // Get user profile directly
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, username, displayName, profileImage, theme, bio')
      .eq('username', username)
      .single()

    if (userError || !user) {
      return NextResponse.json({ 
        error: "User not found", 
        username: username,
        userError: userError 
      }, { status: 404 })
    }

    // Get user's active links directly
    const { data: links, error: linksError } = await supabase
      .from('Link')
      .select('*')
      .eq('userId', user.id)
      .eq('isActive', true)
      .order('order', { ascending: true })

    if (linksError) {
      console.error("Error fetching links:", linksError)
      return NextResponse.json({ error: "Failed to fetch links", linksError }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profileImage: user.profileImage,
        theme: user.theme,
        bio: user.bio
      },
      links: links || []
    })
  } catch (error) {
    console.error("Error in public debug:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
