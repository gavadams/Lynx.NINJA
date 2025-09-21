import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/admin-auth"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/admin/mailing-lists - Get all mailing lists
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

    // Get mailing lists with subscriber counts
    const { data: mailingLists, error } = await supabase
      .from('MailingList')
      .select(`
        id,
        name,
        description,
        isActive,
        isDefault,
        createdAt,
        updatedAt
      `)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching mailing lists:', error)
      return NextResponse.json({ error: "Failed to fetch mailing lists" }, { status: 500 })
    }

    // Get subscriber counts for each mailing list
    const mailingListsWithCounts = await Promise.all(
      (mailingLists || []).map(async (list) => {
        const { count: subscriberCount } = await supabase
          .from('MailingListSubscription')
          .select('*', { count: 'exact', head: true })
          .eq('mailingListId', list.id)
          .eq('isSubscribed', true)

        return {
          ...list,
          subscriberCount: subscriberCount || 0
        }
      })
    )

    return NextResponse.json({ mailingLists: mailingListsWithCounts })
  } catch (error) {
    console.error('Admin mailing lists API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/mailing-lists - Create new mailing list
export async function POST(request: NextRequest) {
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

    const { name, description, isActive, isDefault } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
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

    // If this is being set as default, unset any existing default
    if (isDefault) {
      await supabase
        .from('MailingList')
        .update({ isDefault: false })
        .eq('isDefault', true)
    }

    // Create new mailing list
    const { data: newList, error } = await supabase
      .from('MailingList')
      .insert({
        name,
        description: description || '',
        isActive: isActive ?? true,
        isDefault: isDefault ?? false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating mailing list:', error)
      return NextResponse.json({ error: "Failed to create mailing list" }, { status: 500 })
    }

    return NextResponse.json({ mailingList: newList }, { status: 201 })
  } catch (error) {
    console.error('Admin create mailing list API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
