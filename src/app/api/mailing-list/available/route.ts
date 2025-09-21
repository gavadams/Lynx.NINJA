import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/mailing-list/available - Get all available mailing lists for subscription
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Get all active mailing lists (without subscriber counts for privacy)
    const { data: mailingLists, error } = await supabase
      .from('MailingList')
      .select(`
        id,
        name,
        description,
        isDefault
      `)
      .eq('isActive', true)
      .order('isDefault', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching available mailing lists:', error)
      return NextResponse.json({ error: "Failed to fetch mailing lists" }, { status: 500 })
    }

    return NextResponse.json({ 
      mailingLists: mailingLists || [] 
    })
  } catch (error) {
    console.error('Available mailing lists API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
