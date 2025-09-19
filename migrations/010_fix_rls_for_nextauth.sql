-- Fix RLS policies to work with NextAuth instead of Supabase auth
-- Since NextAuth doesn't set auth.uid(), we need to disable RLS and handle security at the application level

-- Disable RLS on all tables since we're using NextAuth
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Link" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Analytics" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" DISABLE ROW LEVEL SECURITY;

-- Drop existing policies since they won't work with NextAuth
DROP POLICY IF EXISTS "Users can view own profile" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Users can view own links" ON "Link";
DROP POLICY IF EXISTS "Users can insert own links" ON "Link";
DROP POLICY IF EXISTS "Users can update own links" ON "Link";
DROP POLICY IF EXISTS "Users can delete own links" ON "Link";
DROP POLICY IF EXISTS "Public can view active links" ON "Link";
DROP POLICY IF EXISTS "Users can view own analytics" ON "Analytics";
DROP POLICY IF EXISTS "Users can insert own analytics" ON "Analytics";
DROP POLICY IF EXISTS "Users can view own subscription" ON "Subscription";
DROP POLICY IF EXISTS "Users can update own subscription" ON "Subscription";

-- Note: Security is now handled at the application level through NextAuth session validation
-- All API routes check for valid NextAuth sessions before performing database operations
