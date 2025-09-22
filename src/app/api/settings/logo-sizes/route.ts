import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
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

    // Get logo size settings from database
    const { data: logoSettings, error } = await supabase
      .from('SystemSetting')
      .select('key, value')
      .in('key', [
        'logoSize_landingPage',
        'logoSize_dashboard', 
        'logoSize_authPages',
        'logoSize_publicProfile'
      ])

    if (error) {
      console.error('Error fetching logo size settings:', error)
      return NextResponse.json({ error: "Failed to fetch logo settings" }, { status: 500 })
    }

    // Convert to object format
    const logoSizeSettings = {
      landingPage: 20,
      dashboard: 16,
      authPages: 20,
      publicProfile: 12
    }

    // Update with database values
    logoSettings?.forEach(setting => {
      const key = setting.key.replace('logoSize_', '') as keyof typeof logoSizeSettings
      if (key in logoSizeSettings) {
        logoSizeSettings[key] = parseInt(setting.value) || logoSizeSettings[key]
      }
    })

    return NextResponse.json(logoSizeSettings)
  } catch (error) {
    console.error('Logo sizes API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
