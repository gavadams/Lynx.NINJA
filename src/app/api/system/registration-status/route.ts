import { NextRequest, NextResponse } from "next/server"
import { getSystemSettings } from '@/lib/system-settings'

export async function GET(request: NextRequest) {
  try {
    const settings = await getSystemSettings()
    
    return NextResponse.json({
      registrationEnabled: settings.registrationEnabled,
      maintenanceMode: settings.maintenanceMode
    })
  } catch (error) {
    console.error('Error checking registration status:', error)
    return NextResponse.json({ 
      registrationEnabled: true, // Default to enabled if there's an error
      maintenanceMode: false
    })
  }
}
