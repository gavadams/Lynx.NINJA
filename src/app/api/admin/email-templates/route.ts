import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/admin-auth"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/admin/email-templates - Get all email templates
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

    // Get email templates
    const { data: templates, error } = await supabase
      .from('EmailTemplate')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching email templates:', error)
      return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error('Email templates API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/email-templates - Create new email template
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

    const { name, subject, content, htmlContent } = await request.json()

    if (!name || !subject || !htmlContent) {
      return NextResponse.json({ 
        error: "Name, subject, and content are required" 
      }, { status: 400 })
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

    // Create email template
    const { data: template, error } = await supabase
      .from('EmailTemplate')
      .insert({
        name,
        subject,
        content: content || '',
        htmlContent,
        createdBy: authResult.admin?.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating email template:', error)
      return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Create email template API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
