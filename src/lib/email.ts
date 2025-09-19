import { Resend } from 'resend'
import { getSiteConfig } from '@/lib/config'

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

export interface TeamInvitationEmail {
  to: string
  inviterName: string
  teamName: string
  role: string
  acceptUrl: string
}

export async function sendTeamInvitationEmail(emailData: TeamInvitationEmail): Promise<boolean> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured. Email will be logged instead.')
      console.log('📧 Team Invitation Email (Logging Mode):', {
        to: emailData.to,
        subject: `You've been invited to join ${emailData.teamName}`,
        body: `
Hello!

${emailData.inviterName} has invited you to join the team "${emailData.teamName}" as a ${emailData.role}.

Click here to accept the invitation: ${emailData.acceptUrl}

Best regards,
The ${getSiteConfig().siteName} Team
        `.trim()
      })
      return true
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: getSiteConfig().fromEmail,
      to: [emailData.to],
      subject: `You've been invited to join ${emailData.teamName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Team Invitation</h2>
          <p>Hello!</p>
          <p><strong>${emailData.inviterName}</strong> has invited you to join the team <strong>"${emailData.teamName}"</strong> as a <strong>${emailData.role}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${emailData.acceptUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p>If you can't click the button, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${emailData.acceptUrl}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            The LinkBio Team
          </p>
        </div>
      `,
      text: `
Hello!

${emailData.inviterName} has invited you to join the team "${emailData.teamName}" as a ${emailData.role}.

Click here to accept the invitation: ${emailData.acceptUrl}

Best regards,
The ${getSiteConfig().siteName} Team
      `.trim()
    })

    if (error) {
      console.error('❌ Resend email error:', error)
      return false
    }

    console.log('✅ Email sent successfully via Resend:', data)
    return true
  } catch (error) {
    console.error('❌ Failed to send team invitation email:', error)
    return false
  }
}
