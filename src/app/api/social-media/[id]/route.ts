import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { platform, url, displayName, order, isActive } = body

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

    // Check if the social media link belongs to the user
    const { data: existingLink, error: linkError } = await supabase
      .from('SocialMediaLink')
      .select('id, platform')
      .eq('id', resolvedParams.id)
      .eq('userId', user.id)
      .single()

    if (linkError || !existingLink) {
      return NextResponse.json({ error: 'Social media link not found' }, { status: 404 })
    }

    // If platform is being changed, check if new platform already exists
    if (platform !== existingLink.platform) {
      const { data: duplicateLink } = await supabase
        .from('SocialMediaLink')
        .select('id')
        .eq('userId', user.id)
        .eq('platform', platform)
        .neq('id', resolvedParams.id)
        .single()

      if (duplicateLink) {
        return NextResponse.json({ error: 'Social media link for this platform already exists' }, { status: 400 })
      }
    }

    // Update the social media link
    const { data: updatedLink, error } = await supabase
      .from('SocialMediaLink')
      .update({
        platform,
        url,
        displayName: displayName || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .eq('userId', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating social media link:', error)
      return NextResponse.json({ error: 'Failed to update social media link' }, { status: 500 })
    }

    return NextResponse.json(updatedLink)
  } catch (error) {
    console.error('Error in PUT /api/social-media/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
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

    // Delete the social media link
    const { error } = await supabase
      .from('SocialMediaLink')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('userId', user.id)

    if (error) {
      console.error('Error deleting social media link:', error)
      return NextResponse.json({ error: 'Failed to delete social media link' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/social-media/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
