import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// PUT /api/links/reorder - Reorder links
export async function PUT(request: NextRequest) {
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

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { linkIds } = body

    if (!Array.isArray(linkIds)) {
      return NextResponse.json({ error: "linkIds must be an array" }, { status: 400 })
    }

    // Update the order of each link
    const updatePromises = linkIds.map((linkId: string, index: number) =>
      supabase
        .from('Link')
        .update({ order: index })
        .eq('id', linkId)
        .eq('userId', user.id)
    )

    const results = await Promise.all(updatePromises)
    
    // Check for any errors
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      console.error("Error updating link orders:", errors)
      return NextResponse.json({ error: "Failed to reorder links" }, { status: 500 })
    }

    // Return the updated links
    const { data: links, error: fetchError } = await supabase
      .from('Link')
      .select('*')
      .eq('userId', user.id)
      .order('order', { ascending: true })

    if (fetchError) {
      console.error("Error fetching updated links:", fetchError)
      return NextResponse.json({ error: "Failed to fetch updated links" }, { status: 500 })
    }

    return NextResponse.json(links || [])
  } catch (error) {
    console.error("Error reordering links:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}