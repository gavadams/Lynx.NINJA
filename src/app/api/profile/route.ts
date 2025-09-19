import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/profile?username=xxx - Get public user profile and links
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

    // Get user profile with email capture form
    const { data: user, error: userError } = await supabase
      .from('User')
      .select(`
        id, 
        username, 
        displayName, 
        profileImage, 
        theme, 
        bio,
        emailCaptureId,
        emailCapture:EmailCapture!User_emailCaptureId_fkey(
          id,
          title,
          description,
          buttonText,
          placeholder,
          successMessage,
          isActive
        )
      `)
      .eq('username', username)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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
      return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profileImage: user.profileImage,
        theme: user.theme,
        bio: user.bio,
        emailCaptureId: user.emailCaptureId,
        emailCapture: user.emailCapture
      },
      links: links || []
    })
  } catch (error) {
    console.error("Error fetching public profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
