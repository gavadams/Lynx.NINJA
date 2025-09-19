import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/user/profile - Get user profile
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

    // Get user profile from database with email capture form
    const { data: profile, error } = await supabase
      .from('User')
      .select(`
        *,
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
      .eq('id', session.user.id)
      .single()

    if (error) {
      // If user doesn't exist in our database, create them
      if (error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('User')
          .insert({
            id: session.user.id,
            email: session.user.email,
            username: session.user.email?.split('@')[0] || 'user',
            displayName: session.user.name || session.user.email?.split('@')[0] || 'User',
            profileImage: session.user.image || null,
            theme: 'default'
          })
          .select()
          .single()

        if (createError) {
          console.error("Error creating user profile:", createError)
          return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
        }

        return NextResponse.json(newProfile)
      }

      console.error("Error fetching user profile:", error)
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/user/profile - Update user profile
// POST /api/user/profile - Create a new user profile
export async function POST(request: NextRequest) {
  try {
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
    const { id, email, name, image } = body

    if (!id || !email) {
      return NextResponse.json({ error: "ID and email are required" }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('id', id)
      .single()

    if (existingUser) {
      return NextResponse.json({ message: "User already exists" })
    }

    // Create new user profile
    const { data: newProfile, error } = await supabase
      .from('User')
      .insert({
        id,
        email,
        username: email.split('@')[0],
        displayName: name || email.split('@')[0],
        profileImage: image,
        isPremium: false,
        theme: 'default'
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating user profile:", error)
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
    }

    return NextResponse.json(newProfile, { status: 201 })
  } catch (error) {
    console.error("Error creating user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
    const { username, displayName, profileImage, theme, bio, emailCaptureId } = body

    // Basic validation
    if (!username || !displayName) {
      return NextResponse.json({ error: "Username and Display Name are required" }, { status: 400 })
    }

    // Check if username is already taken by another user
    const { data: existingUser, error: existingUserError } = await supabase
      .from('User')
      .select('id')
      .eq('username', username)
      .neq('id', session.user.id)
      .single()

    if (existingUserError && existingUserError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error checking existing username:", existingUserError)
      return NextResponse.json({ error: "Failed to check username availability" }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 })
    }

    // Build update data, only including fields that exist in the schema
    const updateData: any = {
      username,
      displayName,
      profileImage: profileImage || null,
      theme: theme || 'default'
    }

    // Only add bio if it's provided (handle gracefully if column doesn't exist)
    if (bio !== undefined) {
      updateData.bio = bio
    }

    // Only add emailCaptureId if it's provided (handle gracefully if column doesn't exist)
    if (emailCaptureId !== undefined) {
      updateData.emailCaptureId = emailCaptureId || null
    }

    const { data: profile, error } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating user profile:", error)
      return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
