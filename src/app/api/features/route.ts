import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get all feature flags (public endpoint - no admin auth required)
    const { data: featureFlags, error } = await supabase
      .from('FeatureFlag')
      .select('name, isEnabled')
      .order('name')

    if (error) {
      console.error('Error fetching feature flags:', error)
      return NextResponse.json({ error: "Failed to fetch feature flags" }, { status: 500 })
    }

    const response = NextResponse.json({ flags: featureFlags || [] })
    
    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300') // 5 minutes cache
    
    return response
  } catch (error) {
    console.error('Public features API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
