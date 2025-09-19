import { NextRequest, NextResponse } from "next/server"
import { logoutAdmin } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  try {
    await logoutAdmin()

    const response = NextResponse.json({ success: true })
    
    // Clear the admin session cookie
    response.cookies.set('admin-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
