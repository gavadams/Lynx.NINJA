import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
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

    const { data: adminUser, error: adminError } = await supabase
      .from('AdminUser')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get all links with scheduling information
    const { data: links, error: linksError } = await supabase
      .from('Link')
      .select(`
        id,
        title,
        url,
        isActive,
        scheduledAt,
        expiresAt,
        password,
        createdAt,
        user:userId (
          id,
          username,
          displayName
        )
      `)
      .not('scheduledAt', 'is', null)
      .or('expiresAt.not.is.null')
      .order('createdAt', { ascending: false })

    if (linksError) {
      console.error('Error fetching scheduled links:', linksError)
      return NextResponse.json({ error: "Failed to fetch scheduled links" }, { status: 500 })
    }

    return NextResponse.json({
      links: links || [],
      count: links?.length || 0
    })

  } catch (error) {
    console.error('Error in scheduled links API:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
