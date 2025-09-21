import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/admin-auth"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// PUT /api/admin/mailing-lists/[id] - Update mailing list
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
        .neq('id', id)
    }

    // Update mailing list
    const { data: updatedList, error } = await supabase
      .from('MailingList')
      .update({
        name,
        description: description || '',
        isActive: isActive ?? true,
        isDefault: isDefault ?? false,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating mailing list:', error)
      return NextResponse.json({ error: "Failed to update mailing list" }, { status: 500 })
    }

    return NextResponse.json({ mailingList: updatedList })
  } catch (error) {
    console.error('Admin update mailing list API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/mailing-lists/[id] - Delete mailing list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Check if this is the default mailing list
    const { data: mailingList } = await supabase
      .from('MailingList')
      .select('isDefault')
      .eq('id', id)
      .single()

    if (mailingList?.isDefault) {
      return NextResponse.json({ 
        error: "Cannot delete the default mailing list" 
      }, { status: 400 })
    }

    // Delete mailing list (this will cascade to subscriptions and emails)
    const { error } = await supabase
      .from('MailingList')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting mailing list:', error)
      return NextResponse.json({ error: "Failed to delete mailing list" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete mailing list API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
