-- Stripe Integration for LinkBio Platform
-- Created: 2024-12-19 21:00:00
-- Description: Add Stripe fields and subscription management

-- Add Stripe fields to User table (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'stripeCustomerId') THEN
        ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'stripeSubscriptionId') THEN
        ALTER TABLE "User" ADD COLUMN "stripeSubscriptionId" TEXT;
    END IF;
END $$;

-- Create index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS "idx_user_stripe_customer" ON "User"("stripeCustomerId");

-- Update Subscription table to match Stripe data (if columns don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Subscription' AND column_name = 'stripeSubscriptionId') THEN
        ALTER TABLE "Subscription" ADD COLUMN "stripeSubscriptionId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Subscription' AND column_name = 'stripeCustomerId') THEN
        ALTER TABLE "Subscription" ADD COLUMN "stripeCustomerId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Subscription' AND column_name = 'currentPeriodStart') THEN
        ALTER TABLE "Subscription" ADD COLUMN "currentPeriodStart" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Subscription' AND column_name = 'currentPeriodEnd') THEN
        ALTER TABLE "Subscription" ADD COLUMN "currentPeriodEnd" TIMESTAMP(3);
    END IF;
END $$;

-- Create indexes for subscription lookups
CREATE INDEX IF NOT EXISTS "idx_subscription_stripe_id" ON "Subscription"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "idx_subscription_stripe_customer" ON "Subscription"("stripeCustomerId");

-- Note: Unique constraint for stripeSubscriptionId already exists from previous migration

-- Update RLS policies for Subscription table
DROP POLICY IF EXISTS "Users can view own subscription" ON "Subscription";
CREATE POLICY "Users can view own subscription" ON "Subscription"
    FOR SELECT USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can insert own subscription" ON "Subscription";
CREATE POLICY "Users can insert own subscription" ON "Subscription"
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can update own subscription" ON "Subscription";
CREATE POLICY "Users can update own subscription" ON "Subscription"
    FOR UPDATE USING (auth.uid()::text = "userId");

-- Add comments for documentation
COMMENT ON COLUMN "User"."stripeCustomerId" IS 'Stripe customer ID for billing management';
COMMENT ON COLUMN "User"."stripeSubscriptionId" IS 'Current Stripe subscription ID';
COMMENT ON COLUMN "Subscription"."stripeSubscriptionId" IS 'Stripe subscription ID for webhook processing';
COMMENT ON COLUMN "Subscription"."stripeCustomerId" IS 'Stripe customer ID for billing management';
COMMENT ON COLUMN "Subscription"."currentPeriodStart" IS 'Current billing period start date';
COMMENT ON COLUMN "Subscription"."currentPeriodEnd" IS 'Current billing period end date';
