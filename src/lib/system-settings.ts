import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export interface SystemSettings {
  maintenanceMode: boolean
  registrationEnabled: boolean
  siteName: string
  siteDescription: string
}

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    console.log('🔍 getSystemSettings: Starting to fetch settings...')
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

    const { data: settings, error } = await supabase
      .from('SystemSetting')
      .select('key, value, dataType')
      .in('key', ['maintenanceMode', 'registrationEnabled', 'siteName', 'siteDescription'])

    console.log('🔍 getSystemSettings: Database query result:', { 
      hasError: !!error, 
      error: error?.message, 
      settingsCount: settings?.length || 0,
      settings: settings 
    })

    if (error) {
      console.error('❌ Error fetching system settings:', error)
      // Return default values if there's an error
      return {
        maintenanceMode: false,
        registrationEnabled: true,
        siteName: 'Lynx.NINJA',
        siteDescription: 'Modern link-in-bio platform'
      }
    }

    // Convert array to object
    const settingsObject = settings?.reduce((acc, setting) => {
      let value = setting.value
      
      console.log(`🔍 getSystemSettings: Processing ${setting.key} = ${setting.value} (dataType: ${setting.dataType})`)
      
      // Handle boolean values
      if (setting.dataType === 'boolean') {
        value = setting.value === 'TRUE' || setting.value === 'true'
        console.log(`🔍 getSystemSettings: Converted ${setting.key} to boolean: ${value}`)
      }
      
      acc[setting.key] = value
      return acc
    }, {} as Record<string, any>) || {}

    const result = {
      maintenanceMode: settingsObject.maintenanceMode || false,
      registrationEnabled: settingsObject.registrationEnabled !== false, // Default to true
      siteName: settingsObject.siteName || 'Lynx.NINJA',
      siteDescription: settingsObject.siteDescription || 'Modern link-in-bio platform'
    }

    console.log('🔍 getSystemSettings: Final result:', result)
    return result
  } catch (error) {
    console.error('Error in getSystemSettings:', error)
    // Return default values if there's an error
    return {
      maintenanceMode: false,
      registrationEnabled: true,
      siteName: 'Lynx.NINJA',
      siteDescription: 'Modern link-in-bio platform'
    }
  }
}
