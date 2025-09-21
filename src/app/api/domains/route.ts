import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import crypto from 'crypto'

// GET /api/domains - Get user's custom domains
export async function GET() {
  try {
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

    // Get user's custom domains
    const { data: domains, error } = await supabase
      .from('CustomDomain')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error("Error fetching domains:", error)
      return NextResponse.json({ error: "Failed to fetch domains" }, { status: 500 })
    }

    return NextResponse.json({ domains: domains || [] })
  } catch (error) {
    console.error("Error in domains GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/domains - Add a new custom domain
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { domain } = body

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 })
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

    // Check if domain already exists
    const { data: existingDomain, error: checkError } = await supabase
      .from('CustomDomain')
      .select('id')
      .eq('domain', domain)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error checking domain:", checkError)
      return NextResponse.json({ error: "Failed to check domain availability" }, { status: 500 })
    }

    if (existingDomain) {
      return NextResponse.json({ error: "Domain already exists" }, { status: 409 })
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Create new domain
    const { data: newDomain, error: createError } = await supabase
      .from('CustomDomain')
      .insert({
        userId: session.user.id,
        domain,
        verificationToken,
        verificationMethod: 'dns'
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating domain:", createError)
      return NextResponse.json({ error: "Failed to create domain" }, { status: 500 })
    }

    return NextResponse.json({ 
      domain: newDomain,
      verificationInstructions: {
        method: 'dns',
        record: 'TXT',
        name: '_lynx-verification',
        value: verificationToken
      }
    })
  } catch (error) {
    console.error("Error in domains POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
