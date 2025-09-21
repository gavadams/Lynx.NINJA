import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dns from 'dns'
import { promisify } from 'util'

const resolveTxt = promisify(dns.resolveTxt)

// POST /api/domains/[id]/verify - Verify domain DNS configuration
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
      .eq('userId', session.user.email)
      .single()

    if (domainError || !domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 })
    }

    if (domain.status === 'active') {
      return NextResponse.json({ 
        message: "Domain is already verified and active",
        status: 'active'
      })
    }

    try {
      // Check DNS TXT record
      const txtRecords = await resolveTxt(domain.domain)
      
      // Look for the verification record
      const verificationRecord = txtRecords.find(record => 
        record.some(txt => txt.includes(domain.verificationCode))
      )

      if (verificationRecord) {
        // DNS record found, update domain status
        const { data: updatedDomain, error: updateError } = await supabase
          .from('CustomDomain')
          .update({ 
            status: 'verified',
            updatedAt: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()

        if (updateError) {
          console.error("Error updating domain status:", updateError)
          return NextResponse.json({ error: "Failed to update domain status" }, { status: 500 })
        }

        return NextResponse.json({
          message: "Domain verified successfully! You can now activate it.",
          status: 'verified',
          domain: updatedDomain
        })
      } else {
        return NextResponse.json({
          message: "DNS record not found. Please add the TXT record and try again.",
          status: 'pending',
          instructions: {
            type: 'TXT',
            name: domain.domain,
            value: domain.verificationCode,
            ttl: 300
          }
        }, { status: 400 })
      }
    } catch (dnsError) {
      console.error("DNS lookup error:", dnsError)
      return NextResponse.json({
        message: "Unable to verify DNS record. Please check your domain configuration.",
        status: 'error',
        error: dnsError instanceof Error ? dnsError.message : 'Unknown DNS error'
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in domain verification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}