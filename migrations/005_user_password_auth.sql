-- User Password Authentication
-- Created: 2024-12-19 22:00:00
-- Description: Add password field for email/password authentication

-- Add password field to User table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'password') THEN
        ALTER TABLE "User" ADD COLUMN "password" TEXT;
    END IF;
END $$;

-- Create index for email lookups (for authentication)
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");

-- Add comment for documentation
COMMENT ON COLUMN "User"."password" IS 'Hashed password for email/password authentication (nullable for OAuth users)';
