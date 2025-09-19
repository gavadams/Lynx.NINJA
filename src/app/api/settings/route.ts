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

    // Get public system settings only
    const { data: settings, error } = await supabase
      .from('SystemSetting')
      .select('key, value')
      .eq('isPublic', true)
      .order('key')

    if (error) {
      console.error('Error fetching public settings:', error)
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
    console.error('Public settings API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
