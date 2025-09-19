import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/admin-auth"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminId = request.cookies.get('admin-session')?.value
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const authResult = await verifyAdminSession(adminId)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Get all system settings
    const { data: settings, error } = await supabase
      .from('SystemSetting')
      .select('*')
      .order('key')

    if (error) {
      console.error('Error fetching system settings:', error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    // Convert array to object for easier handling
    const settingsObject = settings?.reduce((acc, setting) => {
      acc[setting.key] = setting.value === 'TRUE' ? true : 
                         setting.value === 'FALSE' ? false : 
                         setting.value
      return acc
    }, {} as Record<string, any>) || {}

    return NextResponse.json({ settings: settingsObject })
  } catch (error) {
    console.error('Admin settings GET error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminId = request.cookies.get('admin-session')?.value
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const authResult = await verifyAdminSession(adminId)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await request.json()

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

    // Update each setting
    const updates = Object.entries(settings).map(async ([key, value]) => {
      const stringValue = typeof value === 'boolean' ? (value ? 'TRUE' : 'FALSE') : String(value)
      
      const { error } = await supabase
        .from('SystemSetting')
        .update({ 
          value: stringValue,
          updatedAt: new Date().toISOString()
        })
        .eq('key', key)

      if (error) {
        console.error(`Error updating setting ${key}:`, error)
        return { key, error: error.message }
      }

      return { key, success: true }
    })

    const results = await Promise.all(updates)
    const errors = results.filter(result => 'error' in result)

    if (errors.length > 0) {
      return NextResponse.json({ 
        error: "Some settings failed to update", 
        details: errors 
      }, { status: 500 })
    }

    // Log the action
    await supabase.rpc('log_system_event', {
      log_level: 'info',
      log_message: `System settings updated by admin`,
      admin_user_id: authResult.admin!.id,
      action_name: 'update_system_settings',
      resource_type: 'system_settings',
      metadata: { updatedSettings: Object.keys(settings) }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Settings updated successfully" 
    })
  } catch (error) {
    console.error('Admin settings PUT error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
