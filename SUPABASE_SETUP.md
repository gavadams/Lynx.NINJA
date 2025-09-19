# Supabase Setup Guide for LinkBio Platform

## 1. Database Setup

### Step 1: Create New Database
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Delete the existing database if you want to start fresh
4. Create a new database

### Step 2: Run the Combined Migration
1. Copy the contents of `migrations/001_combined_schema_with_rls.sql`
2. Go to **SQL Editor** in your Supabase dashboard
3. Paste the SQL and run it
4. This will create all tables, indexes, RLS policies, and functions

### Step 3: Update Environment Variables
Add these to your `.env.local` file:

```env
# Supabase Database URLs
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
TWITTER_CLIENT_ID="your-twitter-client-id"
TWITTER_CLIENT_SECRET="your-twitter-client-secret"

# Stripe
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 2. Supabase Configuration

### Step 1: Get Database URLs
1. Go to **Settings** → **Database**
2. Copy the **Connection string** (URI)
3. Replace `[YOUR-PASSWORD]` with your database password
4. Replace `[YOUR-PROJECT-REF]` with your project reference

### Step 2: Configure RLS
The migration already sets up RLS policies, but you can verify them in:
- **Authentication** → **Policies**
- Make sure all tables have RLS enabled

### Step 3: Test Database Connection
Run this command to test the connection:

```bash
npx prisma db push
```

## 3. OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`

### Twitter OAuth
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Get API key and secret
4. Set callback URL:
   - `http://localhost:3000/api/auth/callback/twitter`
   - `https://yourdomain.com/api/auth/callback/twitter`

## 4. Stripe Setup

### Step 1: Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your API keys from **Developers** → **API keys**
3. Set up webhook endpoints for subscription events

### Step 2: Configure Webhooks
Add these webhook endpoints in Stripe:
- `https://yourdomain.com/api/webhooks/stripe`
- Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

## 5. Testing the Setup

### Step 1: Start Development Server
```bash
npm run dev
```

### Step 2: Test Authentication
1. Go to `http://localhost:3000`
2. Click "Get Started"
3. Try signing in with Google/Twitter
4. Verify you can access the dashboard

### Step 3: Test Database Operations
1. Go to the Links page
2. Try adding a new link
3. Verify it's saved to the database
4. Check that RLS is working (you can only see your own links)

## 6. Production Deployment

### Environment Variables for Production
Make sure to set these in your production environment:
- All the same variables as development
- Update `NEXTAUTH_URL` to your production domain
- Update OAuth redirect URIs to production URLs
- Use production Stripe keys

### Database Security
- RLS policies are already configured
- Make sure to use strong passwords
- Enable connection pooling in Supabase
- Set up database backups

## 7. Troubleshooting

### Common Issues

**RLS Permission Errors**
- Make sure you ran the combined migration
- Check that RLS is enabled on all tables
- Verify the `auth.current_user_id()` function exists

**Connection Issues**
- Check your DATABASE_URL format
- Verify your Supabase project is active
- Make sure your IP is whitelisted (if using IP restrictions)

**OAuth Issues**
- Verify redirect URIs match exactly
- Check that OAuth apps are properly configured
- Make sure environment variables are set correctly

### Getting Help
- Check Supabase logs in the dashboard
- Review NextAuth.js documentation
- Check Prisma logs for database issues
