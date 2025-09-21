import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Get user by email
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's social media links
    const { data: socialMediaLinks, error } = await supabase
      .from('SocialMediaLink')
      .select('*')
      .eq('userId', user.id)
      .eq('isActive', true)
      .order('order', { ascending: true })

    if (error) {
      console.error('Error fetching social media links:', error)
      return NextResponse.json({ error: 'Failed to fetch social media links' }, { status: 500 })
    }

    return NextResponse.json(socialMediaLinks || [])
  } catch (error) {
    console.error('Error in GET /api/social-media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { platform, url, displayName, order } = body

    if (!platform || !url) {
      return NextResponse.json({ error: 'Platform and URL are required' }, { status: 400 })
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

    // Get user by email
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if platform already exists for this user
    const { data: existingLink } = await supabase
      .from('SocialMediaLink')
      .select('id')
      .eq('userId', user.id)
      .eq('platform', platform)
      .single()

    if (existingLink) {
      return NextResponse.json({ error: 'Social media link for this platform already exists' }, { status: 400 })
    }

    // Create new social media link
    const { data: newLink, error } = await supabase
      .from('SocialMediaLink')
      .insert({
        userId: user.id,
        platform,
        url,
        displayName: displayName || null,
        order: order || 0,
        isActive: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating social media link:', error)
      return NextResponse.json({ error: 'Failed to create social media link' }, { status: 500 })
    }

    return NextResponse.json(newLink, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/social-media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
