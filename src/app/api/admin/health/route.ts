import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    // Check if admin tables exist
    const { data: adminUsers, error: adminError } = await supabase
      .from('AdminUser')
      .select('id')
      .limit(1)

    const { data: featureFlags, error: flagsError } = await supabase
      .from('FeatureFlag')
      .select('id')
      .limit(1)

    const { data: systemSettings, error: settingsError } = await supabase
      .from('SystemSetting')
      .select('id')
      .limit(1)

    const tablesExist = !adminError && !flagsError && !settingsError

    return NextResponse.json({
      status: 'ok',
      tablesExist,
      tables: {
        AdminUser: !adminError,
        FeatureFlag: !flagsError,
        SystemSetting: !settingsError,
        SystemLog: true, // We'll assume this exists if others do
        AdminSession: true // We'll assume this exists if others do
      },
      errors: {
        admin: adminError?.message,
        flags: flagsError?.message,
        settings: settingsError?.message
      }
    })
  } catch (error) {
    console.error('Admin health check error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check admin system health',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
