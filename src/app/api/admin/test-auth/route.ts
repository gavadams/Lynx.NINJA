import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing admin authentication...')
    
    // Check if admin session cookie exists
    const adminId = request.cookies.get('admin-session')?.value
    console.log('Admin session cookie:', adminId ? 'Present' : 'Missing')
    
    if (!adminId) {
      return NextResponse.json({ 
        error: "No admin session found",
        cookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value]))
      }, { status: 401 })
    }

    // Verify admin session
    const authResult = await verifyAdminSession(adminId)
    console.log('Auth result:', authResult)

    if (!authResult.success) {
      return NextResponse.json({ 
        error: "Admin session verification failed",
        details: authResult.error
      }, { status: 401 })
    }

    return NextResponse.json({ 
      success: true, 
      admin: authResult.admin,
      message: "Admin authentication successful"
    })
  } catch (error) {
    console.error('Admin auth test error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
