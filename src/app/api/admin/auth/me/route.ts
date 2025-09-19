import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  try {
    const adminId = request.cookies.get('admin-session')?.value

    console.log('🔍 Admin auth check - session exists:', !!adminId)
    console.log('🔍 Admin auth check - admin ID:', adminId)

    if (!adminId) {
      console.log('❌ No admin session found in cookies')
      return NextResponse.json({ error: "No admin session found" }, { status: 401 })
    }

    const result = await verifyAdminSession(adminId)
    console.log('🔍 Admin session verification result:', result)

    if (!result.success) {
      console.log('❌ Admin session verification failed:', result.error)
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    console.log('✅ Admin authentication successful')
    return NextResponse.json({ 
      success: true, 
      admin: result.admin 
    })
  } catch (error) {
    console.error('❌ Admin auth check error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
