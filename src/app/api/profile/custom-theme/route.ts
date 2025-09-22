import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
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

    // Get user by username
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, theme')
      .eq('username', username)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if the theme is a custom theme (starts with 'custom-')
    if (user.theme && user.theme.startsWith('custom-')) {
      // Get the custom theme from the database
      const { data: customTheme, error: customThemeError } = await supabase
        .from('CustomTheme')
        .select('*')
        .eq('userId', user.id)
        .eq('isActive', true)
        .single()

      if (customThemeError || !customTheme) {
        // If custom theme not found, return null (will fallback to default)
        return NextResponse.json(null)
      }

      return NextResponse.json(customTheme)
    }

    // If not a custom theme, return null
    return NextResponse.json(null)
  } catch (error) {
    console.error("Error fetching custom theme:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
