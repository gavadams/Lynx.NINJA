-- Fix bio column issue
-- Created: 2024-12-19 22:00:00
-- Description: Ensure bio column exists in User table

-- Add bio column if it doesn't exist
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;

-- Add emailCaptureId column if it doesn't exist (from previous migration)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailCaptureId" UUID REFERENCES "EmailCapture"(id) ON DELETE SET NULL;

-- Refresh the schema cache by updating a comment
COMMENT ON COLUMN "User"."bio" IS 'User bio/description text';
COMMENT ON COLUMN "User"."emailCaptureId" IS 'Selected email capture form for links page';

-- Verify the columns exist by selecting them (this will refresh the schema cache)
SELECT "bio", "emailCaptureId" FROM "User" LIMIT 1;
