import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// POST /api/email-captures/[id]/submit - Submit email to capture form
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
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

    // Check if email capture exists and is active
    const { data: capture, error: captureError } = await supabase
      .from('EmailCapture')
      .select('*')
      .eq('id', id)
      .eq('isActive', true)
      .single()

    if (captureError || !capture) {
      return NextResponse.json({ error: "Email capture form not found" }, { status: 404 })
    }

    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Simple device detection
    const device = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop'
    const browser = userAgent.includes('Chrome') ? 'Chrome' : 
                   userAgent.includes('Firefox') ? 'Firefox' : 
                   userAgent.includes('Safari') ? 'Safari' : 'Other'

    // Check if email already exists for this capture
    const { data: existingSubmission, error: checkError } = await supabase
      .from('EmailSubmission')
      .select('id')
      .eq('emailCaptureId', id)
      .eq('email', email.toLowerCase())
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error checking existing submission:", checkError)
      return NextResponse.json({ error: "Failed to process submission" }, { status: 500 })
    }

    if (existingSubmission) {
      return NextResponse.json({ 
        success: true, 
        message: capture.successMessage,
        alreadyExists: true 
      })
    }

    // Create new submission
    const { data: submission, error: submitError } = await supabase
      .from('EmailSubmission')
      .insert({
        emailCaptureId: id,
        email: email.toLowerCase(),
        ipAddress,
        userAgent,
        device,
        browser
      })
      .select()
      .single()

    if (submitError) {
      console.error("Error creating submission:", submitError)
      return NextResponse.json({ error: "Failed to submit email" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: capture.successMessage,
      submission 
    })
  } catch (error) {
    console.error("Error in email submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
