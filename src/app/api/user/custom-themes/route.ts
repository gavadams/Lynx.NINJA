import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET() {
  try {
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

    // Get current user
    const { data: currentUser, error: currentUserError } = await supabase
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's custom themes
    const { data: customThemes, error } = await supabase
      .from('CustomTheme')
      .select('*')
      .eq('userId', currentUser.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error("Error fetching custom themes:", error)
      return NextResponse.json({ error: "Failed to fetch custom themes" }, { status: 500 })
    }

    // Get the theme limit from system settings
    const { data: systemSettings, error: settingsError } = await supabase
      .from('SystemSetting')
      .select('value')
      .eq('key', 'maxCustomThemesPerUser')
      .single()

    const themeLimit = settingsError ? 10 : parseInt(systemSettings?.value || '10') // Default to 10 if not set

    return NextResponse.json({
      themes: customThemes || [],
      usage: {
        current: customThemes?.length || 0,
        limit: themeLimit,
        remaining: Math.max(0, themeLimit - (customThemes?.length || 0))
      }
    })
  } catch (error) {
    console.error("Error fetching custom themes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Get current user
    const { data: currentUser, error: currentUserError } = await supabase
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, primaryColor, secondaryColor, accentColor, textColor } = body

    if (!name || !primaryColor || !secondaryColor || !accentColor || !textColor) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check current theme count for user
    const { count: currentThemeCount, error: countError } = await supabase
      .from('CustomTheme')
      .select('*', { count: 'exact', head: true })
      .eq('userId', currentUser.id)

    if (countError) {
      console.error("Error checking theme count:", countError)
      return NextResponse.json({ error: "Failed to check theme limit" }, { status: 500 })
    }

    // Get the theme limit from system settings
    const { data: systemSettings, error: settingsError } = await supabase
      .from('SystemSetting')
      .select('value')
      .eq('key', 'maxCustomThemesPerUser')
      .single()

    const themeLimit = settingsError ? 10 : parseInt(systemSettings?.value || '10') // Default to 10 if not set

    if (currentThemeCount && currentThemeCount >= themeLimit) {
      return NextResponse.json({ 
        error: `Theme limit reached. You can create up to ${themeLimit} custom themes.`,
        limit: themeLimit,
        current: currentThemeCount
      }, { status: 400 })
    }

    // Create custom theme
    const { data: customTheme, error } = await supabase
      .from('CustomTheme')
      .insert({
        userId: currentUser.id,
        name,
        description: description || null,
        primaryColor,
        secondaryColor,
        accentColor,
        textColor,
        isActive: false
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating custom theme:", error)
      return NextResponse.json({ error: "Failed to create custom theme" }, { status: 500 })
    }

    return NextResponse.json(customTheme)
  } catch (error) {
    console.error("Error creating custom theme:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
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

    // Get current user
    const { data: currentUser, error: currentUserError } = await supabase
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { id, name, description, primaryColor, secondaryColor, accentColor, textColor, isActive } = body

    if (!id) {
      return NextResponse.json({ error: "Theme ID is required" }, { status: 400 })
    }

    // Update custom theme
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor
    if (accentColor !== undefined) updateData.accentColor = accentColor
    if (textColor !== undefined) updateData.textColor = textColor
    if (isActive !== undefined) updateData.isActive = isActive

    const { data: customTheme, error } = await supabase
      .from('CustomTheme')
      .update(updateData)
      .eq('id', id)
      .eq('userId', currentUser.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating custom theme:", error)
      return NextResponse.json({ error: "Failed to update custom theme" }, { status: 500 })
    }

    return NextResponse.json(customTheme)
  } catch (error) {
    console.error("Error updating custom theme:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
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

    // Get current user
    const { data: currentUser, error: currentUserError } = await supabase
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Theme ID is required" }, { status: 400 })
    }

    // Delete custom theme
    const { error } = await supabase
      .from('CustomTheme')
      .delete()
      .eq('id', id)
      .eq('userId', currentUser.id)

    if (error) {
      console.error("Error deleting custom theme:", error)
      return NextResponse.json({ error: "Failed to delete custom theme" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting custom theme:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
