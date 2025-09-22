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

    // Get all links (we'll filter for scheduling info on the frontend)
    console.log('Starting to fetch links from database...')
    
    // First, let's try a simple query to see if we can get any links at all
    const { data: simpleLinks, error: simpleError } = await supabase
      .from('Link')
      .select('id, title, url, userId')
      .limit(5)
    
    console.log('Simple query result:', { 
      hasError: !!simpleError, 
      error: simpleError, 
      linksCount: simpleLinks?.length || 0,
      sampleLinks: simpleLinks
    })
    
    // If simple query works, try to get user data separately
    let userData = {}
    if (simpleLinks && simpleLinks.length > 0) {
      const userIds = [...new Set(simpleLinks.map(link => link.userId))]
      console.log('Fetching user data for userIds:', userIds)
      
      const { data: users, error: usersError } = await supabase
        .from('User')
        .select('id, username, displayName')
        .in('id', userIds)
      
      console.log('Users query result:', { 
        hasError: !!usersError, 
        error: usersError, 
        usersCount: users?.length || 0,
        users: users
      })
      
      if (users) {
        userData = users.reduce((acc, user) => {
          acc[user.id] = user
          return acc
        }, {})
      }
    }
    
    // Now try the full query
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
        userId
      `)
      .order('createdAt', { ascending: false })
      .limit(100) // Limit to prevent too much data

    console.log('Database query result:', { 
      hasError: !!linksError, 
      error: linksError, 
      linksCount: links?.length || 0,
      sampleLinks: links?.slice(0, 2)
    })

    if (linksError) {
      console.error('Error fetching scheduled links:', linksError)
      return NextResponse.json({ error: "Failed to fetch scheduled links" }, { status: 500 })
    }

    console.log('Scheduled links fetched successfully:', { count: links?.length || 0, links: links?.slice(0, 3) })

    // Combine links with user data
    const linksWithUsers = (links || []).map(link => ({
      ...link,
      user: userData[link.userId] || { id: link.userId, username: 'Unknown', displayName: 'Unknown User' }
    }))

    console.log('Final response:', { 
      linksCount: linksWithUsers.length, 
      sampleLinks: linksWithUsers.slice(0, 2) 
    })

    return NextResponse.json({
      links: linksWithUsers,
      count: linksWithUsers.length
    })

  } catch (error) {
    console.error('Error in scheduled links API:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
