import { NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const result = await authenticateAdmin(email, password)

    console.log('🔍 Admin login result:', { success: result.success })

    if (!result.success) {
      console.log('❌ Admin login failed:', result.error)
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    console.log('✅ Admin login successful, setting session cookie...')

    // Set HTTP-only cookie for admin session
    const response = NextResponse.json({ 
      success: true, 
      admin: result.admin 
    })

    response.cookies.set('admin-session', result.admin!.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    console.log('✅ Admin session cookie set successfully')
    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
