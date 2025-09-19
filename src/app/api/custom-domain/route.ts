import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/custom-domain?domain=example.com - Get user profile by custom domain
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')

    if (!domain) {
      return NextResponse.json({ error: "Domain parameter is required" }, { status: 400 })
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

    // Find the custom domain record
    const { data: customDomain, error: domainError } = await supabase
      .from('CustomDomain')
      .select(`
        id,
        domain,
        status,
        userId,
        user:User!CustomDomain_userId_fkey(
          id,
          username,
          displayName,
          profileImage,
          theme,
          bio
        )
      `)
      .eq('domain', domain)
      .eq('status', 'active')
      .single()

    if (domainError || !customDomain) {
      return NextResponse.json({ error: "Custom domain not found or not active" }, { status: 404 })
    }

    if (!customDomain.user) {
      return NextResponse.json({ error: "User not found for this domain" }, { status: 404 })
    }

    // Get user's active links
    const { data: links, error: linksError } = await supabase
      .from('Link')
      .select('*')
      .eq('userId', customDomain.userId)
      .eq('isActive', true)
      .order('order', { ascending: true })

    if (linksError) {
      console.error("Error fetching links:", linksError)
      return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        id: customDomain.user.id,
        username: customDomain.user.username,
        displayName: customDomain.user.displayName,
        profileImage: customDomain.user.profileImage,
        theme: customDomain.user.theme,
        bio: customDomain.user.bio
      },
      links: links || [],
      customDomain: {
        domain: customDomain.domain,
        status: customDomain.status
      }
    })
  } catch (error) {
    console.error("Error fetching custom domain profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
