import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/domains/[id] - Get specific domain details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
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

    // Get domain details
    const { data: domain, error } = await supabase
      .from('CustomDomain')
      .select('*')
      .eq('id', id)
      .eq('userId', session.user.id)
      .single()

    if (error || !domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 })
    }

    return NextResponse.json({ domain })
  } catch (error) {
    console.error("Error in domain GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/domains/[id] - Update domain settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { isActive, verificationMethod } = body

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

    // Update domain
    const { data: updatedDomain, error } = await supabase
      .from('CustomDomain')
      .update({
        isActive: isActive !== undefined ? isActive : undefined,
        verificationMethod: verificationMethod || undefined
      })
      .eq('id', id)
      .eq('userId', session.user.id)
      .select()
      .single()

    if (error || !updatedDomain) {
      return NextResponse.json({ error: "Failed to update domain" }, { status: 500 })
    }

    return NextResponse.json({ domain: updatedDomain })
  } catch (error) {
    console.error("Error in domain PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/domains/[id] - Delete domain
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
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

    // Delete domain
    const { error } = await supabase
      .from('CustomDomain')
      .delete()
      .eq('id', id)
      .eq('userId', session.user.id)

    if (error) {
      console.error("Error deleting domain:", error)
      return NextResponse.json({ error: "Failed to delete domain" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in domain DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
