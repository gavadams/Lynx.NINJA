import { NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
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

    // Test if tables exist
    const tables = ['User', 'Link', 'Analytics', 'ProfileViewAnalytics']
    const results: any = {}

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        results[table] = {
          exists: !error,
          error: error?.message || null,
          count: data?.length || 0
        }
      } catch (err) {
        results[table] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          count: 0
        }
      }
    }

    return NextResponse.json({
      message: "Database table check",
      tables: results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error checking database:", error)
    return NextResponse.json({ 
      error: "Failed to check database",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
