import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import QRCode from 'qrcode'
import { getBaseUrl } from "@/lib/url"

// GET /api/user/profile/qr - Generate QR code for user's profile page
export async function GET() {
  try {
    // Get the current user from NextAuth
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

    // Get user profile to get username
    const { data: user, error } = await supabase
      .from('User')
      .select('username, displayName')
      .eq('id', session.user.email)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate the public profile URL
    const baseUrl = getBaseUrl()
    const publicUrl = `${baseUrl}/${user.username}`

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
      profileName: user.displayName || user.username
    })

  } catch (error) {
    console.error("Error generating profile QR code:", error)
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 })
  }
}
