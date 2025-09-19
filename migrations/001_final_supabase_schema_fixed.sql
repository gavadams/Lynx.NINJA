-- Fixed database schema for Supabase LinkBio platform
-- Created: 2024-12-19 16:45:00

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid', 'incomplete');

-- Create tables
CREATE TABLE "Account" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "profileImage" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "customDomain" TEXT,
    "theme" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

CREATE TABLE "Link" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "linkId" TEXT,
    "userId" TEXT NOT NULL,
    "clickTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "country" TEXT,
    "city" TEXT,
    "device" TEXT,
    "browser" TEXT,
    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeCurrentPeriodEnd" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- Create foreign key constraints
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Link" ADD CONSTRAINT "Link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "idx_link_user_id" ON "Link"("userId");
CREATE INDEX "idx_link_order" ON "Link"("userId", "order");
CREATE INDEX "idx_analytics_user_id" ON "Analytics"("userId");
CREATE INDEX "idx_analytics_link_id" ON "Analytics"("linkId");
CREATE INDEX "idx_analytics_click_time" ON "Analytics"("clickTime");
CREATE INDEX "idx_user_username" ON "User"("username");
CREATE INDEX "idx_user_email" ON "User"("email");

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Link" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Analytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;

-- RLS Policies using Supabase's built-in auth.uid()
-- Fixed column name references to use proper quoted identifiers

-- User table policies
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING (auth.uid()::text = "id");

CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING (auth.uid()::text = "id");

CREATE POLICY "Users can insert own profile" ON "User"
  FOR INSERT WITH CHECK (auth.uid()::text = "id");

-- Allow public read access to user profiles by username (for public link pages)
CREATE POLICY "Public can view user profiles by username" ON "User"
  FOR SELECT USING (true);

-- Link table policies
CREATE POLICY "Users can view own links" ON "Link"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own links" ON "Link"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own links" ON "Link"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own links" ON "Link"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Allow public read access to active links (for public link pages)
CREATE POLICY "Public can view active links" ON "Link"
  FOR SELECT USING ("isActive" = true);

-- Analytics table policies
CREATE POLICY "Users can view own analytics" ON "Analytics"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert analytics" ON "Analytics"
  FOR INSERT WITH CHECK (true); -- Allow anonymous users to create analytics

-- Subscription table policies
CREATE POLICY "Users can view own subscription" ON "Subscription"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own subscription" ON "Subscription"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own subscription" ON "Subscription"
  FOR UPDATE USING (auth.uid()::text = "userId");

-- Account table policies (NextAuth.js)
CREATE POLICY "Users can view own accounts" ON "Account"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own accounts" ON "Account"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own accounts" ON "Account"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own accounts" ON "Account"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Session table policies (NextAuth.js)
CREATE POLICY "Users can view own sessions" ON "Session"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own sessions" ON "Session"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own sessions" ON "Session"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own sessions" ON "Session"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Create functions for common operations
CREATE OR REPLACE FUNCTION increment_link_clicks(link_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE "Link" 
  SET "clicks" = "clicks" + 1, "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = link_id;
END;
$$;

-- Function to get user by username (for public pages)
CREATE OR REPLACE FUNCTION get_user_by_username(username_param TEXT)
RETURNS TABLE (
  id TEXT,
  username TEXT,
  "displayName" TEXT,
  "profileImage" TEXT,
  theme JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u."id",
    u."username",
    u."displayName",
    u."profileImage",
    u."theme"
  FROM "User" u
  WHERE u."username" = username_param;
END;
$$;

-- Function to get active links for a user (for public pages)
CREATE OR REPLACE FUNCTION get_user_links(user_id_param TEXT)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  url TEXT,
  "order" INTEGER,
  clicks INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l."id",
    l."title",
    l."url",
    l."order",
    l."clicks"
  FROM "Link" l
  WHERE l."userId" = user_id_param 
    AND l."isActive" = true
    AND (l."scheduledAt" IS NULL OR l."scheduledAt" <= CURRENT_TIMESTAMP)
    AND (l."expiresAt" IS NULL OR l."expiresAt" > CURRENT_TIMESTAMP)
  ORDER BY l."order" ASC;
END;
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_link_updated_at BEFORE UPDATE ON "Link" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_updated_at BEFORE UPDATE ON "Subscription" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
