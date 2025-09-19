# LinkBio - Link in Bio Platform

A modern, aesthetically pleasing link-in-bio platform that addresses current market frustrations with services like Linktree. Built with Next.js 14+, TypeScript, and PostgreSQL.

## 🎯 Current Status

**Phase 1: Core Infrastructure** ✅ **COMPLETE**
- Next.js 15 with TypeScript and Tailwind CSS
- Supabase database integration
- API routes with full CRUD operations
- Authentication system with OAuth providers

**Phase 2: Authentication & User Management** ✅ **COMPLETE**
- User profile management system
- Modern dashboard interface with shadcn/ui
- Link management with modal interface
- Public profile pages with theme support
- Analytics and click tracking
- Theme customization (5 themes available)
- Email/password authentication system
- User registration and signup

**Phase 3: Advanced Features** 🚧 **IN PROGRESS**
- Stripe integration for premium subscriptions ✅
- Advanced analytics dashboard ✅
- Link scheduling and expiration ✅
- Password protection for links ✅
- QR code generation (in progress)
- Custom domains (planned)
- Team collaboration features (planned)

## 🚀 Features

### Free Tier
- **Unlimited Links**: Add as many links as you want with no restrictions
- **Custom Subdomain**: Get your own username.linkbio.com subdomain
- **Drag & Drop Reordering**: Intuitive link management interface
- **5 Professional Themes**: Choose from minimalist, gradient, dark mode, creative, and corporate themes
- **Basic Analytics**: Track total clicks and top performing links
- **SEO Optimization**: Custom meta titles, descriptions, and Open Graph tags

### Premium Tier (£10/month)
- **Custom Domain**: Connect your own domain
- **Advanced Analytics**: Detailed click tracking, geographic data, device analytics
- **Link Scheduling**: Publish/unpublish links on specific dates
- **Password Protection**: Secure sensitive links
- **Email Capture**: Lead generation forms with CSV export
- **QR Code Generation**: Create QR codes for your links
- **Custom CSS**: Complete design customization

## 🛠 Technology Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **Database**: PostgreSQL with Supabase (replaced Prisma for better integration)
- **Authentication**: NextAuth.js (Google, Twitter, Instagram OAuth)
- **Payments**: Stripe integration for subscriptions (Phase 3)
- **Deployment**: Vercel (frontend) + Supabase (database)
- **Analytics**: Custom click tracking with device/browser detection

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd linkbio-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `NEXTAUTH_SECRET`: Random secret for NextAuth.js
   - OAuth provider credentials (Google, Twitter, Instagram)
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
   - `STRIPE_PREMIUM_PRICE_ID`: Your Stripe price ID for premium plan
   - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret

4. **Set up the database**
   ```bash
   # Run the migration in Supabase SQL Editor
   # Copy and paste the contents of migrations/001_final_supabase_schema_fixed.sql
   # Then run migrations/002_phase2_updates.sql
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄 Database Schema

The platform uses the following main models:

- **User**: User profiles, premium status, theme preferences, bio support
- **Link**: Individual links with ordering, scheduling, and click tracking
- **Analytics**: Detailed click analytics with geographic and device data
- **Subscription**: Stripe subscription management (Phase 3)
- **Account/Session**: NextAuth.js authentication data

### Database Functions
- `get_user_by_username(username)`: Get user profile for public pages
- `get_user_links(user_id)`: Get active links for public pages
- `increment_link_clicks(link_id)`: Track link clicks
- `update_updated_at_column()`: Auto-update timestamps

## 🔧 Development

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (Supabase client)
│   │   ├── user/          # User profile management
│   │   ├── links/         # Link CRUD operations
│   │   ├── click/         # Click tracking
│   │   └── public/        # Public profile data
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── [username]/        # Public profile pages
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard-specific components
│   └── link-modal.tsx    # Link management modal
├── lib/                  # Utility functions and configurations
│   ├── auth.ts           # NextAuth.js configuration
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Utility functions
└── migrations/           # Database migrations
    ├── 001_final_supabase_schema_fixed.sql
    └── 002_phase2_updates.sql
```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npx shadcn@latest add [component]`: Add shadcn/ui components

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Database Setup

For production, use a managed PostgreSQL service:
- **Supabase** (recommended)
- **PlanetScale**
- **Railway**
- **Neon**

## 📊 Analytics

The platform includes comprehensive analytics:

- **Click Tracking**: Track every link click with timestamps
- **Geographic Data**: Country and city-level analytics
- **Device Analytics**: Browser, device type, and OS information
- **Referrer Tracking**: See where your traffic comes from
- **UTM Parameters**: Automatic UTM parameter generation for campaigns

## 🎨 Theming

### Available Themes
- **Default**: Clean, modern design with blue gradient
- **Dark**: Sleek dark theme with gray gradients
- **Purple**: Vibrant purple and pink gradients
- **Green**: Fresh green and emerald gradients
- **Orange**: Warm orange and red gradients

### Premium Customization
- Custom CSS editor
- Font integration
- Advanced color schemes
- Custom layouts

## 🔒 Security

- **OAuth Authentication**: Secure social login
- **JWT Sessions**: Stateless authentication
- **Rate Limiting**: API protection
- **Input Validation**: Comprehensive form validation
- **HTTPS Only**: Secure data transmission

## 📈 Performance

- **<2s Load Times**: Optimized for speed
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic bundle optimization
- **CDN**: Global content delivery
- **Caching**: Intelligent caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@linkbio.com or join our Discord community.

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes.

---

**LinkBio** - Simplifying your link in bio experience.