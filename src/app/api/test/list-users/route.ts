import { NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
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

    // Get all users with email capture forms (for testing purposes)
    const { data: users, error } = await supabase
      .from('User')
      .select(`
        id, 
        username, 
        email, 
        displayName,
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
      .limit(10)

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error("Error listing users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
