import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const now = new Date().toISOString();

  try {
    // Get scheduled emails that are ready to be sent
    const { data: scheduledEmails, error: fetchError } = await supabase
      .from('MailingListEmail')
      .select(`
        id,
        subject,
        content,
        htmlContent,
        mailingListId,
        MailingList(name),
        MailingListEmailRecipient(email, unsubscribeToken)
      `)
      .lte('sentAt', now)
      .eq('isProcessed', false)
      .limit(10);

    if (fetchError) {
      console.error('Error fetching scheduled emails:', fetchError);
      throw new Error(fetchError.message);
    }

    if (!scheduledEmails || scheduledEmails.length === 0) {
      return NextResponse.json({
        message: 'No scheduled emails to process',
        processedCount: 0
      });
    }

    let processedCount = 0;

    for (const email of scheduledEmails) {
      try {
        // Send emails to all recipients
        const emailPromises = email.MailingListEmailRecipient.map(async (recipient: any) => {
          const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mailing-list/unsubscribe?token=${recipient.unsubscribeToken}`;
          
          const emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${email.subject}</title>
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                ${email.htmlContent}
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666; text-align: center;">
                  You received this email because you're subscribed to ${email.MailingList.name}.<br>
                  <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> | 
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color: #666;">Manage Preferences</a>
                </p>
              </body>
            </html>
          `;

          return resend.emails.send({
            from: `${process.env.SITE_NAME || 'Lynx.NINJA'} <noreply@${process.env.RESEND_DOMAIN || 'lynxninja.com'}>`,
            to: [recipient.email],
            subject: email.subject,
            html: emailHtml,
            text: email.content || email.subject
          });
        });

        await Promise.all(emailPromises);

        // Mark email as processed
        await supabase
          .from('MailingListEmail')
          .update({ isProcessed: true })
          .eq('id', email.id);

        processedCount++;
      } catch (emailError) {
        console.error(`Error processing email ${email.id}:`, emailError);
        // Continue with other emails even if one fails
      }
    }

    console.log(`Cron job processed ${processedCount} scheduled emails at ${now}`);

    return NextResponse.json({
      message: 'Scheduled emails processed successfully',
      processedCount
    });
  } catch (error: any) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ 
      message: 'Error processing scheduled emails', 
      error: error.message 
    }, { status: 500 });
  }
}
