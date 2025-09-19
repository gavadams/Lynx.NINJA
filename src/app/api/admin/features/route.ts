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

    // Get all feature flags
    const { data: featureFlags, error } = await supabase
      .from('FeatureFlag')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching feature flags:', error)
      return NextResponse.json({ error: "Failed to fetch feature flags" }, { status: 500 })
    }

    return NextResponse.json({ flags: featureFlags || [] })
  } catch (error) {
    console.error('Admin features API error:', error)
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

    const { name, isEnabled } = await request.json()

    if (!name || typeof isEnabled !== 'boolean') {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
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

    // Update feature flag
    const { data: updatedFlag, error } = await supabase
      .from('FeatureFlag')
      .update({ 
        isEnabled,
        updatedAt: new Date().toISOString()
      })
      .eq('name', name)
      .select()
      .single()

    if (error) {
      console.error('Error updating feature flag:', error)
      return NextResponse.json({ error: "Failed to update feature flag" }, { status: 500 })
    }

    // Log the action
    await supabase.rpc('log_system_event', {
      log_level: 'info',
      log_message: `Feature flag updated: ${name} = ${isEnabled}`,
      admin_user_id: authResult.admin!.id,
      action_name: 'update_feature_flag',
      resource_type: 'feature_flag',
      resource_id: name,
      metadata: { isEnabled }
    })

    return NextResponse.json({ flag: updatedFlag })
  } catch (error) {
    console.error('Admin features update API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
