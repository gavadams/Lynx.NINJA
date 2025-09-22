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
      let value = setting.value
      
      // Handle boolean values
      if (setting.value === 'TRUE') value = true
      else if (setting.value === 'FALSE') value = false
      // Handle number values
      else if (setting.dataType === 'number') value = parseInt(setting.value) || 0
      
      acc[setting.key] = value
      return acc
    }, {} as Record<string, any>) || {}

    // Group logo size settings into a logoSize object
    const logoSizeSettings = {
      landingPage: settingsObject.logoSize_landingPage || 20,
      dashboard: settingsObject.logoSize_dashboard || 16,
      authPages: settingsObject.logoSize_authPages || 20,
      publicProfile: settingsObject.logoSize_publicProfile || 12
    }
    
    // Remove individual logo size keys and add the grouped object
    delete settingsObject.logoSize_landingPage
    delete settingsObject.logoSize_dashboard
    delete settingsObject.logoSize_authPages
    delete settingsObject.logoSize_publicProfile
    settingsObject.logoSize = logoSizeSettings

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

    // Flatten logoSize object into individual settings
    const flattenedSettings = { ...settings }
    if (settings.logoSize) {
      flattenedSettings.logoSize_landingPage = settings.logoSize.landingPage
      flattenedSettings.logoSize_dashboard = settings.logoSize.dashboard
      flattenedSettings.logoSize_authPages = settings.logoSize.authPages
      flattenedSettings.logoSize_publicProfile = settings.logoSize.publicProfile
      delete flattenedSettings.logoSize
    }

    // Update each setting (use upsert to handle missing settings)
    const updates = Object.entries(flattenedSettings).map(async ([key, value]) => {
      const stringValue = typeof value === 'boolean' ? (value ? 'TRUE' : 'FALSE') : String(value)
      
      console.log(`Upserting setting: ${key} = ${stringValue}`)
      
      const { error } = await supabase
        .from('SystemSetting')
        .upsert({ 
          key,
          value: stringValue,
          updatedAt: new Date().toISOString()
        }, {
          onConflict: 'key'
        })

      if (error) {
        console.error(`Error upserting setting ${key}:`, error)
        return { key, error: error.message }
      }

      console.log(`Successfully upserted setting: ${key}`)
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
