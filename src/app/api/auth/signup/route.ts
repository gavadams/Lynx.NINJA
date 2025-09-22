import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { getSystemSettings } from '@/lib/system-settings'

export async function POST(request: NextRequest) {
  try {
    // Check if registration is enabled
    const settings = await getSystemSettings()
    if (!settings.registrationEnabled) {
      return NextResponse.json({ 
        error: "New user registration is currently disabled. Please try again later." 
      }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
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

    // Check if user already exists by email
    const { data: existingUserByEmail } = await supabase
      .from('User')
      .select('id, email')
      .eq('email', email)
      .single()

    if (existingUserByEmail) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Generate username and check if it's unique
    const username = email.split('@')[0]
    let usernameCounter = 1
    let finalUsername = username

    while (true) {
      const { data: existingUserByUsername } = await supabase
        .from('User')
        .select('id')
        .eq('username', finalUsername)
        .single()

      if (!existingUserByUsername) {
        break
      }

      finalUsername = `${username}${usernameCounter}`
      usernameCounter++
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate a unique user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create user profile using RPC function to bypass RLS
    const { data: newUser, error } = await supabase.rpc('create_user', {
      user_id: userId,
      user_email: email,
      user_username: finalUsername,
      user_display_name: name,
      user_password: hashedPassword
    })

    if (error) {
      console.error("Error creating user:", error)
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 })
    }

    if (!newUser || newUser.length === 0) {
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 })
    }

    // Return user data (without password)
    const createdUser = newUser[0]
    return NextResponse.json({ 
      message: "Account created successfully",
      user: createdUser 
    }, { status: 201 })

  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
