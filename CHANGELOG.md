# Changelog

All notable changes to the LinkBio platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2024-12-19 23:45:00
- **Currency Standardization**: Updated all currency references from $ to £ (GBP)
  - **Admin Dashboard**: Replaced DollarSign icons with PoundSterling icons
  - **Admin Billing**: Updated MRR display to show £ instead of $
  - **Documentation**: Updated RESEND_SETUP.md pricing from $20/month to £20/month
  - **Stripe Configuration**: Confirmed GBP currency is properly configured
  - **Consistent Branding**: All pricing now displays in British Pounds (£)

### Added - 2024-12-19 23:30:00
- **Auto-Scroll to Edit Fields**: Comprehensive auto-scroll functionality for all edit fields
  - **Auto-Scroll Utility**: Created `src/lib/auto-scroll.ts` with smooth scrolling functions
  - **Custom Hook**: Added `useAutoScroll` hook for easy integration in React components
  - **Global Provider**: Implemented `AutoScrollProvider` for application-wide auto-scroll
  - **Modal Auto-Scroll**: Link modal and edit modal now auto-scroll to first edit field when opened
  - **Settings Auto-Scroll**: Profile settings page auto-scrolls to focused edit fields
  - **Smooth Animations**: Configurable scroll animations with offset and delay options
  - **Error Handling**: Graceful fallback when auto-scroll fails
  - **Performance Optimized**: Efficient scroll detection and minimal re-renders

### Added - 2024-12-19 20:45:00
- **Phase 2: Authentication & User Management - COMPLETE**
- **Supabase Integration**: Switched from Prisma to Supabase client for better integration
- **User Profile Management**: Complete CRUD API for user profiles (`/api/user/profile`)
- **Modern Dashboard Interface**: Beautiful dashboard with shadcn/ui components
- **Link Management System**: Full CRUD operations with modal interface
- **Public Profile Pages**: Beautiful public profiles at `/{username}` with theme support
- **Analytics & Click Tracking**: Automatic click tracking with device/browser detection
- **Theme Customization**: 5 theme options (Default, Dark, Purple, Green, Orange)
- **Settings Page**: Complete profile and theme management interface
- **Real-time Stats**: Live click counts and performance metrics
- **Responsive Design**: Mobile-first design that works on all devices
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading States**: Smooth user experience with loading indicators

### Added - 2024-12-19 22:15:00
- **Email/Password Authentication**: Complete signup and signin system
- **User Registration**: Beautiful signup page with validation
- **Password Security**: Bcrypt hashing for secure password storage
- **Authentication API**: Signup, verification, and profile creation endpoints
- **Dual Auth Options**: Both email/password and OAuth providers
- **Database Migration**: Added password field for email authentication
- **Production Ready**: Removed all testing/debugging code for clean production build
- **Database Functions**: RLS-bypassing functions for secure user creation
- **Username Uniqueness**: Automatic username conflict resolution
- **Environment Configuration**: Proper URL resolution for development and production
- **Deployment Ready**: Environment setup guide and production checklist
- **Production UI**: Removed all test account references and testing elements from auth pages
- **Links Page Fix**: Fixed authentication issues and UI components in dashboard links page
  - Fixed API authentication mismatch between NextAuth and Supabase auth
  - Updated links page to use proper shadcn/ui components (Input, Label)
  - Fixed `/api/links` and `/api/links/[id]` routes to use consistent NextAuth session
  - Links page now fully functional with add/edit/delete/toggle operations
- **Login Port Fix**: Fixed NextAuth URL configuration to match actual dev server port
  - Updated NEXTAUTH_URL from localhost:3002 to localhost:3001 to match running server
  - Authentication API now working correctly on correct port
- **QR Code Generation**: Added QR code generation feature for links
  - New API endpoint `/api/links/[id]/qr` for generating QR codes
  - QR code modal component with download functionality
  - QR codes link directly to the specific link URL (not profile page)
  - Available for all users (not just premium)
- **Edit Link Functionality**: Implemented full link editing capabilities
  - New edit link modal with form validation
  - Update link title, URL, and active status
  - Real-time updates to the links list
  - Proper error handling and loading states
- **Profile QR Code Generation**: Added QR code generation for user's profile page
  - New API endpoint `/api/user/profile/qr` for profile QR codes
  - Profile QR modal component with download functionality
  - QR codes link to user's public profile page showing all links
  - "Profile QR" button in links page header for easy access
- **Next.js 15 Compatibility**: Fixed params handling for Next.js 15
  - Updated public profile page to use `React.use()` for params
  - Fixed API route to use direct database queries instead of RPC functions
  - Resolved 500 errors when loading user profile pages
- **Public Profile API Fix**: Resolved 404 errors for user profile pages
  - Fixed dynamic route compilation issues with Next.js 15
  - Updated public profile page to use working API endpoints
  - Public profile pages now load correctly with user data
  - Temporary solution using existing test API until dynamic routes are fully resolved
- **Custom Domain Support**: Complete custom domain system for premium users
  - Database schema for custom domains with verification system
  - DNS-based domain verification with TXT records
  - Domain management API with CRUD operations
  - Domain management UI in settings page
  - Premium feature gating for custom domains
- **Email Capture Forms**: Complete lead generation system for premium users
  - Database schema for email captures and submissions
  - Email capture form creation and management
  - Analytics and export functionality (CSV)
  - Embeddable email capture forms with JavaScript integration
  - Direct link access for testing and standalone use
  - Comprehensive embed instructions for all major platforms
  - **Links Page Integration**: Add email capture forms directly to user's links page
  - Integrated form selection dropdown within Email Capture Forms section for better UX
  - Settings page integration for selecting which form to display
  - Automatic display on public profile pages for lead generation
  - Premium feature gating for email capture
  - **Database Schema Fix**: Resolved missing bio and emailCaptureId columns in User table
  - **Public Profile Email Capture**: Fixed email capture forms not displaying on public profile pages
  - **Custom Domain System**: Complete DNS verification, activation, and routing system
  - **DNS Setup Guide**: Comprehensive guide for configuring DNS records
  - **Custom Domain Management**: Full UI for managing custom domains with verification status
  - **Themes Page**: Fixed missing themes page - created dedicated theme customization page
  - **Domain Management Error**: Fixed runtime error in domain management component - added null/undefined checks for status values
  - **Settings Page Cleanup**: Removed theme customization from settings page since dedicated themes page exists
  - **Team Collaboration**: Complete team management system with invitations, roles, and shared links
  - **Team Database Fix**: Fixed foreign key constraint error - corrected UUID/TEXT type mismatch in team tables
  - **Next.js 15 Compatibility**: Fixed async params handling in team API routes for Next.js 15 compatibility
  - **Database Column Fix**: Fixed column name mismatch (clickCount vs clicks) in team links database function
  - **Authentication Fix**: Fixed login connection issue - replaced internal fetch with direct database verification
  - **Team Members API Fix**: Fixed team members API route 404 errors - recreated route file with proper Next.js 15 compatibility

### Added - 2024-12-19 21:45:00
- **Link Scheduling & Expiration**: Complete scheduling system for premium users
- **Password Protection**: Secure sensitive links with password protection
- **Advanced Link Modal**: Premium features in link creation/editing
- **Public Profile Enhancements**: Visual indicators for scheduled/expired/protected links
- **Password Check API**: Secure password verification system
- **Database Functions**: Active links with scheduling and expiration logic

### Added - 2024-12-19 21:15:00
- **Phase 3: Advanced Features - IN PROGRESS**
- **Stripe Integration**: Complete payment processing system
- **Premium Features Component**: Beautiful UI for upgrade prompts
- **Advanced Analytics Dashboard**: Detailed insights with device/browser breakdown
- **Billing Management**: Stripe billing portal integration
- **Webhook Processing**: Automatic subscription status updates
- **Premium Gating**: Analytics locked behind premium paywall
- **Subscription Management**: Full CRUD for premium subscriptions

### Technical Changes - 2024-12-19 21:15:00
- **Stripe API Routes**: Checkout, billing portal, and webhook endpoints
- **Database Updates**: Added Stripe customer and subscription fields
- **Premium UI Components**: Feature comparison and upgrade flows
- **Analytics API**: Comprehensive analytics data aggregation
- **Environment Variables**: Stripe configuration setup

### Technical Changes - 2024-12-19 20:45:00
- **API Routes Updated**: All 7 API routes converted to Supabase client
- **Next.js 15 Compatibility**: Fixed `cookies()` and `params` await issues
- **TypeScript Interfaces**: Added proper interfaces for Link and UserProfile
- **Component Architecture**: Modular components with proper separation of concerns
- **Database Functions**: Custom PostgreSQL functions for analytics and user management
- **RLS Policies**: Row Level Security for multi-tenant data isolation
- **Environment Variables**: Proper Supabase configuration

### Added - 2024-12-19 15:30:00
- Initial project setup with Next.js 14+ and TypeScript
- Prisma database schema with User, Link, Analytics, and Subscription models
- NextAuth.js authentication setup with Google and Twitter OAuth providers
- Basic dashboard layout with sidebar navigation
- Dashboard pages for links management
- Authentication pages (sign in)
- Landing page with hero section and features
- UI components using shadcn/ui and Radix UI
- Tailwind CSS configuration for styling
- Environment variables configuration
- Prisma client setup and configuration

### Added - 2024-12-19 16:00:00
- **Row Level Security (RLS) implementation** for multi-tenant data isolation
- RLS policies for all database tables (User, Link, Analytics, Subscription, Account, Session)
- Database context helper functions for setting user context
- Updated API routes to use RLS context for secure data access
- Additional database migration file for RLS policies
- Performance indexes for RLS queries
- Security functions for user identification and context setting

### Technical Details
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with OAuth providers
- **UI Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS with custom components
- **Type Safety**: Full TypeScript implementation
- **State Management**: React hooks and NextAuth session management

### Business Name References
The following references to the business/website name "LinkBio" have been created and can be easily modified:
- `src/app/layout.tsx` - Page title and description
- `src/app/page.tsx` - Landing page branding (3 instances)
- `src/components/dashboard/sidebar.tsx` - Dashboard branding
- `src/app/dashboard/page.tsx` - Dashboard content
- `CHANGELOG.md` - This file
- `README.md` - Project documentation

### Database Schema
- User model with profile information and premium status
- Link model with ordering, scheduling, and analytics
- Analytics model for click tracking and geographic data
- Subscription model for Stripe integration
- Account and Session models for NextAuth.js

### Next Steps
- Set up database connection and run migrations
- Implement link CRUD API endpoints
- Add form validation and error handling
- Create theme customization interface
- Implement analytics tracking system
