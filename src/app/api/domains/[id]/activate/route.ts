import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// POST /api/domains/[id]/activate - Activate a verified domain
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
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

    // Get the domain record
    const { data: domain, error: domainError } = await supabase
      .from('CustomDomain')
      .select('*')
      .eq('id', id)
      .eq('userId', session.user.id)
      .single()

    if (domainError || !domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 })
    }

    if (domain.status !== 'verified') {
      return NextResponse.json({ 
        error: "Domain must be verified before activation",
        currentStatus: domain.status
      }, { status: 400 })
    }

    // Deactivate any other active domains for this user
    const { error: deactivateError } = await supabase
      .from('CustomDomain')
      .update({ status: 'verified' })
      .eq('userId', session.user.id)
      .eq('status', 'active')

    if (deactivateError) {
      console.error("Error deactivating other domains:", deactivateError)
      return NextResponse.json({ error: "Failed to deactivate other domains" }, { status: 500 })
    }

    // Activate the current domain
    const { data: updatedDomain, error: updateError } = await supabase
      .from('CustomDomain')
      .update({ 
        status: 'active',
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error("Error activating domain:", updateError)
      return NextResponse.json({ error: "Failed to activate domain" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Domain activated successfully! Your profile is now available at this custom domain.",
      status: 'active',
      domain: updatedDomain,
      nextSteps: [
        "Configure your DNS to point to our servers",
        "Set up SSL certificate (automatic)",
        "Test your custom domain URL"
      ]
    })
  } catch (error) {
    console.error("Error in domain activation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
