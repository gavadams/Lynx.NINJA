import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/admin-auth"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// POST /api/admin/email-composer/send - Send email to mailing list
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

    const { 
      subject, 
      content, 
      htmlContent, 
      mailingListId, 
      scheduledAt, 
      previewText 
    } = await request.json()

    if (!subject || !htmlContent || !mailingListId) {
      return NextResponse.json({ 
        error: "Subject, content, and mailing list are required" 
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

    // Get mailing list details
    const { data: mailingList, error: listError } = await supabase
      .from('MailingList')
      .select('name, description')
      .eq('id', mailingListId)
      .single()

    if (listError || !mailingList) {
      return NextResponse.json({ error: "Mailing list not found" }, { status: 404 })
    }

    // Get subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('MailingListSubscription')
      .select(`
        id,
        userId,
        unsubscribeToken,
        User(email, displayName, username)
      `)
      .eq('mailingListId', mailingListId)
      .eq('isSubscribed', true)

    if (subscribersError) {
      console.error('Error fetching subscribers:', subscribersError)
      return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 })
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: "No subscribers found for this mailing list" }, { status: 400 })
    }

    // Create email record
    const { data: emailRecord, error: emailError } = await supabase
      .from('MailingListEmail')
      .insert({
        mailingListId,
        subject,
        content: content || '',
        htmlContent,
        sentBy: authResult.admin?.id,
        recipientCount: subscribers.length,
        sentAt: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
        isProcessed: !scheduledAt // Mark as processed if sending immediately
      })
      .select()
      .single()

    if (emailError) {
      console.error('Error creating email record:', emailError)
      return NextResponse.json({ error: "Failed to create email record" }, { status: 500 })
    }

    // Create recipient records
    const recipientRecords = subscribers.map(subscriber => ({
      emailId: emailRecord.id,
      userId: subscriber.userId,
      email: subscriber.User.email,
      sentAt: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString()
    }))

    const { error: recipientsError } = await supabase
      .from('MailingListEmailRecipient')
      .insert(recipientRecords)

    if (recipientsError) {
      console.error('Error creating recipient records:', recipientsError)
      // Don't fail the request, just log the error
    }

    // If not scheduled, send emails immediately
    if (!scheduledAt) {
      try {
        // Send emails via Resend
        const emailPromises = subscribers.map(async (subscriber) => {
          const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mailing-list/unsubscribe?token=${subscriber.unsubscribeToken}`
          
          const emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${subject}</title>
                ${previewText ? `<meta name="description" content="${previewText}">` : ''}
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                ${htmlContent}
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666; text-align: center;">
                  You received this email because you're subscribed to ${mailingList.name}.<br>
                  <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> | 
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color: #666;">Manage Preferences</a>
                </p>
              </body>
            </html>
          `

          return resend.emails.send({
            from: `${process.env.SITE_NAME || 'Lynx.NINJA'} <noreply@${process.env.RESEND_DOMAIN || 'lynxninja.com'}>`,
            to: [subscriber.User.email],
            subject,
            html: emailHtml,
            text: content || subject
          })
        })

        await Promise.all(emailPromises)
      } catch (emailSendError) {
        console.error('Error sending emails:', emailSendError)
        return NextResponse.json({ 
          error: "Failed to send emails", 
          details: emailSendError 
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: scheduledAt 
        ? `Email scheduled for ${new Date(scheduledAt).toLocaleString()}` 
        : `Email sent successfully to ${subscribers.length} subscribers`,
      emailId: emailRecord.id,
      recipientCount: subscribers.length,
      scheduled: !!scheduledAt
    })
  } catch (error) {
    console.error('Email composer send API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
