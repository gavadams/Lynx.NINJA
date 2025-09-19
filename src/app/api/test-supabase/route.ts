import { NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // First, check if environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing environment variables",
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey,
          url: supabaseUrl ? 'present' : 'missing',
          key: supabaseAnonKey ? 'present' : 'missing'
        }
      }, { status: 500 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Test basic connection
    const { data, error } = await supabase
      .from('Link')
      .select('*')
      .limit(1)

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Supabase connection successful!",
      data 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Failed to connect to Supabase",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
