# OAuth Provider Setup Guide

This guide will help you set up Google, Twitter/X, and Instagram OAuth providers for your Lynx.NINJA application.

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Twitter/X OAuth
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Instagram OAuth
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000  # Change to your production URL
NEXTAUTH_SECRET=your_nextauth_secret_key
```

## 1. Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API

### Step 2: Create OAuth 2.0 Credentials
1. Go to "Credentials" in the Google Cloud Console
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
5. Copy the Client ID and Client Secret

### Step 3: Configure Environment Variables
```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## 2. Twitter/X OAuth Setup

### Step 1: Create Twitter Developer Account
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Apply for a developer account if you don't have one
3. Create a new app

### Step 2: Configure Twitter App
1. In your Twitter app settings, go to "Authentication settings"
2. Enable "OAuth 2.0"
3. Add callback URLs:
   - Development: `http://localhost:3000/api/auth/callback/twitter`
   - Production: `https://yourdomain.com/api/auth/callback/twitter`
4. Copy the Client ID and Client Secret

### Step 3: Configure Environment Variables
```bash
TWITTER_CLIENT_ID=your_twitter_client_id_here
TWITTER_CLIENT_SECRET=your_twitter_client_secret_here
```

## 3. Instagram OAuth Setup

### Step 1: Create Facebook Developer Account
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Instagram Basic Display" product

### Step 2: Configure Instagram App
1. In your Facebook app, go to "Instagram Basic Display"
2. Add Instagram Testers (your Instagram account)
3. Add OAuth Redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/instagram`
   - Production: `https://yourdomain.com/api/auth/callback/instagram`
4. Copy the App ID and App Secret

### Step 3: Configure Environment Variables
```bash
INSTAGRAM_CLIENT_ID=your_instagram_app_id_here
INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret_here
```

## 4. NextAuth Configuration

The NextAuth configuration is already set up in `src/lib/auth.ts` with all three providers:

- ✅ Google Provider
- ✅ Twitter Provider  
- ✅ Instagram Provider
- ✅ Credentials Provider (Email/Password)

## 5. Testing OAuth Integration

### Development Testing
1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/auth/signin`
3. Test each OAuth provider:
   - Click "Continue with Google"
   - Click "Continue with Twitter"
   - Click "Continue with Instagram"

### Production Deployment
1. Update your OAuth app settings with production URLs
2. Deploy your application
3. Test OAuth flows in production

## 6. Troubleshooting

### Common Issues

#### "OAuth sign in failed" Error
- Check that environment variables are set correctly
- Verify callback URLs match exactly
- Ensure OAuth apps are properly configured

#### Instagram OAuth Issues
- Instagram Basic Display requires app review for production
- Test with Instagram Testers in development
- Ensure your Instagram account is added as a tester

#### Twitter OAuth Issues
- Twitter requires app review for production use
- Check that OAuth 2.0 is enabled in Twitter app settings
- Verify callback URLs are correct

### Debug Mode
Enable NextAuth debug mode by setting:
```bash
NODE_ENV=development
```

This will show detailed OAuth flow logs in the console.

## 7. Security Notes

- Never commit OAuth secrets to version control
- Use environment variables for all sensitive data
- Regularly rotate OAuth secrets
- Monitor OAuth usage in provider dashboards
- Use HTTPS in production

## 8. User Experience

The OAuth integration provides:
- ✅ One-click social login
- ✅ Automatic account creation
- ✅ Profile image and name import
- ✅ Seamless user experience
- ✅ Fallback to email/password registration

Users can sign in with any of the three social providers or create an account with email/password.
