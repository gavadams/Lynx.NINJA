import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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

    // Test if we can select bio column
    const { data: userTest, error: userError } = await supabase
      .from('User')
      .select('id, username, bio, emailCaptureId')
      .limit(1)

    if (userError) {
      return NextResponse.json({ 
        error: "Database schema issue", 
        details: userError,
        message: "The bio or emailCaptureId columns may not exist in the User table"
      }, { status: 500 })
    }

    // Test if we can select from EmailCapture table
    const { data: emailTest, error: emailError } = await supabase
      .from('EmailCapture')
      .select('id, title')
      .limit(1)

    return NextResponse.json({
      success: true,
      message: "Database schema is working correctly",
      userColumns: userTest ? Object.keys(userTest[0] || {}) : [],
      emailCaptureColumns: emailTest ? Object.keys(emailTest[0] || {}) : [],
      userError: userError,
      emailError: emailError
    })
  } catch (error) {
    console.error("Error testing schema:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
