import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import QRCode from 'qrcode'
import { getBaseUrl } from "@/lib/url"

// GET /api/links/[id]/qr - Generate QR code for a specific link
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get the current user from NextAuth
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

    // Get the link and verify ownership
    const { data: link, error } = await supabase
      .from('Link')
      .select('*')
      .eq('id', id)
      .eq('userId', session.user.email)
      .single()

    if (error || !link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    // Generate the direct URL for this specific link
    const baseUrl = getBaseUrl()
    const publicUrl = link.url

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(publicUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // Return QR code data
    return NextResponse.json({
      qrCode: qrCodeDataURL,
      url: publicUrl,
      linkTitle: link.title
    })

  } catch (error) {
    console.error("Error generating QR code:", error)
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 })
  }
}
