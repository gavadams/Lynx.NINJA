# Environment Setup Guide

This guide explains how to properly configure environment variables for different deployment environments.

## Required Environment Variables

### Development (.env.local)
```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Admin Panel Configuration
ADMIN_JWT_SECRET=your-admin-jwt-secret-here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret

# Stripe Configuration (Optional)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PREMIUM_PRICE_ID=your-stripe-price-id
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Resend Email Configuration (Optional)
RESEND_API_KEY=re_your-resend-api-key
```

### Production (Vercel)
Set these in your Vercel dashboard under Settings > Environment Variables:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret-key

# Admin Panel Configuration
ADMIN_JWT_SECRET=your-production-admin-jwt-secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret

# Stripe Configuration
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PREMIUM_PRICE_ID=your-stripe-price-id
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Resend Email Configuration
RESEND_API_KEY=re_your-resend-api-key
```

## URL Resolution Logic

The application automatically determines the correct base URL using this priority:

1. **NEXTAUTH_URL** - Explicitly set URL (recommended for production)
2. **VERCEL_URL** - Automatic Vercel deployment URL
3. **Development fallback** - localhost:3000 for local development

## Deployment Checklist

### Before Deploying to Production:

1. ✅ Set `NEXTAUTH_URL` to your production domain
2. ✅ Generate a secure `NEXTAUTH_SECRET` (use `openssl rand -hex 32`)
3. ✅ Configure OAuth providers with production URLs
4. ✅ Set up Stripe webhooks with production endpoints
5. ✅ Configure Resend API key for email notifications
6. ✅ Test all authentication flows in production
7. ✅ Test email sending functionality

### Security Notes:

- Never commit `.env.local` to version control
- Use different secrets for development and production
- Rotate secrets regularly
- Use environment-specific OAuth app configurations

## Troubleshooting

### Common Issues:

1. **Authentication fails in production**
   - Check that `NEXTAUTH_URL` matches your domain exactly
   - Verify OAuth redirect URLs are configured correctly

2. **API calls fail**
   - Ensure `NEXTAUTH_URL` is set correctly
   - Check that all required environment variables are present

3. **Database connection issues**
   - Verify Supabase credentials are correct
   - Check that RLS policies are properly configured

4. **Email sending issues**
   - Verify `RESEND_API_KEY` is set correctly
   - Check that the API key starts with `re_`
   - For development, use `onboarding@resend.dev` as sender
   - For production, verify your domain in Resend dashboard
