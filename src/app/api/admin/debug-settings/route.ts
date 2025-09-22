import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/admin-auth"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug settings endpoint called')
    
    // Check admin authentication
    const adminId = request.cookies.get('admin-session')?.value
    console.log('🔍 Admin session cookie:', adminId ? 'exists' : 'missing')
    
    if (!adminId) {
      return NextResponse.json({ 
        error: "No admin session found",
        debug: { hasAdminSession: false }
      }, { status: 401 })
    }

    const authResult = await verifyAdminSession(adminId)
    console.log('🔍 Admin auth result:', authResult)
    
    if (!authResult.success) {
      return NextResponse.json({ 
        error: "Admin authentication failed",
        debug: { 
          hasAdminSession: true,
          authSuccess: false,
          authError: authResult.error
        }
      }, { status: 401 })
    }

    // Try to connect to Supabase
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check if SystemSetting table exists and has data
    const { data: settings, error } = await supabase
      .from('SystemSetting')
      .select('*')
      .order('key')

    console.log('🔍 SystemSetting query result:', { data: settings, error })

    return NextResponse.json({ 
      success: true,
      debug: {
        hasAdminSession: true,
        authSuccess: true,
        adminId: authResult.admin?.id,
        adminEmail: authResult.admin?.email,
        supabaseConnected: true,
        settingsCount: settings?.length || 0,
        settings: settings,
        error: error?.message
      }
    })
  } catch (error) {
    console.error('❌ Debug settings error:', error)
    return NextResponse.json({ 
      error: "Debug failed",
      debug: { 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
}
