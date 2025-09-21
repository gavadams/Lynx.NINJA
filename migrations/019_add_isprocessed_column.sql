-- Add isProcessed column to MailingListEmail table
-- Created: 2024-12-19 23:59:00
-- Description: Add isProcessed column for email scheduling functionality

-- Add isProcessed column if it doesn't exist
ALTER TABLE "MailingListEmail" ADD COLUMN IF NOT EXISTS "isProcessed" BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN "MailingListEmail"."isProcessed" IS 'Whether the email has been processed and sent';
