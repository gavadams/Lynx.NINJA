import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/email-captures - Get user's email capture forms
export async function GET() {
  try {
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

    // Get user's email captures with stats using the function
    const { data: captures, error } = await supabase
      .rpc('get_user_email_captures', { user_id: session.user.email })

    if (error) {
      console.error("Error fetching email captures:", error)
      return NextResponse.json({ error: "Failed to fetch email captures" }, { status: 500 })
    }

    return NextResponse.json({ captures: captures || [] })
  } catch (error) {
    console.error("Error in email-captures GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/email-captures - Create a new email capture form
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, buttonText, placeholder, successMessage } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
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

    // Create new email capture
    const { data: newCapture, error: createError } = await supabase
      .from('EmailCapture')
      .insert({
        userId: session.user.email,
        title,
        description: description || null,
        buttonText: buttonText || 'Subscribe',
        placeholder: placeholder || 'Enter your email',
        successMessage: successMessage || 'Thank you for subscribing!'
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating email capture:", createError)
      return NextResponse.json({ error: "Failed to create email capture" }, { status: 500 })
    }

    return NextResponse.json({ capture: newCapture })
  } catch (error) {
    console.error("Error in email-captures POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
