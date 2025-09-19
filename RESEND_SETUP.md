# Resend Email Setup Guide

This guide explains how to set up Resend for email notifications in your LinkBio platform.

## 1. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

## 2. Get Your API Key

1. Log into your Resend dashboard
2. Go to **API Keys** in the sidebar
3. Click **Create API Key**
4. Give it a name (e.g., "LinkBio Production")
5. Copy the API key (starts with `re_`)

## 3. Configure Environment Variables

### Development (.env.local)
```bash
# Add this to your .env.local file
RESEND_API_KEY=re_your_api_key_here
```

### Production (Vercel)
1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_your_api_key_here`
   - **Environment**: Production, Preview, Development

## 4. Domain Setup (Optional but Recommended)

### For Production:
1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Add your domain (e.g., `linkbio.app`)
4. Follow DNS verification steps
5. Update the `from` field in `src/lib/email.ts`:
   ```typescript
   from: 'LinkBio <noreply@yourdomain.com>'
   ```

### For Development:
- You can use the default Resend domain: `onboarding@resend.dev`
- Update `src/lib/email.ts`:
   ```typescript
   from: 'LinkBio <onboarding@resend.dev>'
   ```

## 5. Test Email Sending

1. Start your development server: `npm run dev`
2. Go to the Teams page
3. Try inviting a team member
4. Check the terminal for email logs
5. Check your email inbox for the invitation

## 6. Resend Limits

### Free Tier:
- 3,000 emails per month
- 100 emails per day
- Perfect for development and small projects

### Paid Plans:
- Start at $20/month
- Higher limits and additional features
- Custom domains and advanced analytics

## 7. Troubleshooting

### Common Issues:

**"API key not configured" warning:**
- Make sure `RESEND_API_KEY` is set in your environment variables
- Restart your development server after adding the key

**"Invalid API key" error:**
- Double-check your API key starts with `re_`
- Ensure there are no extra spaces or characters

**"Domain not verified" error:**
- Use `onboarding@resend.dev` for development
- Verify your domain in Resend dashboard for production

**Emails not received:**
- Check spam folder
- Verify the recipient email address
- Check Resend dashboard for delivery status

## 8. Production Checklist

- [ ] API key configured in production environment
- [ ] Domain verified in Resend dashboard
- [ ] `from` email address updated to your domain
- [ ] Test email sending in production
- [ ] Monitor email delivery in Resend dashboard

## 9. Advanced Features

### Email Templates:
- Create reusable email templates in Resend dashboard
- Use template IDs in your code for consistent branding

### Webhooks:
- Set up webhooks to track email events
- Monitor delivery, opens, and clicks

### Analytics:
- View email performance in Resend dashboard
- Track open rates and click-through rates

## Support

- [Resend Documentation](https://resend.com/docs)
- [Resend Support](https://resend.com/support)
- [Resend Community](https://github.com/resend/resend)
