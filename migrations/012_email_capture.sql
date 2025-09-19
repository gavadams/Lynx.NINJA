-- Email Capture Migration
-- Add email capture forms for lead generation

-- Create EmailCapture table
CREATE TABLE IF NOT EXISTS "EmailCapture" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "buttonText" TEXT NOT NULL DEFAULT 'Subscribe',
  "placeholder" TEXT NOT NULL DEFAULT 'Enter your email',
  "successMessage" TEXT NOT NULL DEFAULT 'Thank you for subscribing!',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create EmailSubmission table
CREATE TABLE IF NOT EXISTS "EmailSubmission" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "emailCaptureId" TEXT NOT NULL REFERENCES "EmailCapture"("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "country" TEXT,
  "city" TEXT,
  "device" TEXT,
  "browser" TEXT,
  "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "EmailCapture_userId_idx" ON "EmailCapture"("userId");
CREATE INDEX IF NOT EXISTS "EmailCapture_isActive_idx" ON "EmailCapture"("isActive");
CREATE INDEX IF NOT EXISTS "EmailSubmission_emailCaptureId_idx" ON "EmailSubmission"("emailCaptureId");
CREATE INDEX IF NOT EXISTS "EmailSubmission_email_idx" ON "EmailSubmission"("email");
CREATE INDEX IF NOT EXISTS "EmailSubmission_submittedAt_idx" ON "EmailSubmission"("submittedAt");

-- Create function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_email_capture_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updatedAt
DROP TRIGGER IF EXISTS update_email_capture_updated_at ON "EmailCapture";
CREATE TRIGGER update_email_capture_updated_at
  BEFORE UPDATE ON "EmailCapture"
  FOR EACH ROW
  EXECUTE FUNCTION update_email_capture_updated_at();

-- Create function to get email capture stats
CREATE OR REPLACE FUNCTION get_email_capture_stats(capture_id TEXT)
RETURNS TABLE (
  total_submissions BIGINT,
  unique_emails BIGINT,
  today_submissions BIGINT,
  this_week_submissions BIGINT,
  this_month_submissions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_submissions,
    COUNT(DISTINCT email) as unique_emails,
    COUNT(*) FILTER (WHERE "submittedAt" >= CURRENT_DATE) as today_submissions,
    COUNT(*) FILTER (WHERE "submittedAt" >= CURRENT_DATE - INTERVAL '7 days') as this_week_submissions,
    COUNT(*) FILTER (WHERE "submittedAt" >= CURRENT_DATE - INTERVAL '30 days') as this_month_submissions
  FROM "EmailSubmission"
  WHERE "emailCaptureId" = capture_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's email captures with stats
CREATE OR REPLACE FUNCTION get_user_email_captures(user_id TEXT)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  description TEXT,
  button_text TEXT,
  placeholder TEXT,
  success_message TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  total_submissions BIGINT,
  unique_emails BIGINT,
  today_submissions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.id,
    ec.title,
    ec.description,
    ec."buttonText",
    ec.placeholder,
    ec."successMessage",
    ec."isActive",
    ec."createdAt",
    ec."updatedAt",
    COALESCE(stats.total_submissions, 0) as total_submissions,
    COALESCE(stats.unique_emails, 0) as unique_emails,
    COALESCE(stats.today_submissions, 0) as today_submissions
  FROM "EmailCapture" ec
  LEFT JOIN get_email_capture_stats(ec.id) stats ON true
  WHERE ec."userId" = user_id
  ORDER BY ec."createdAt" DESC;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies (disabled for NextAuth compatibility)
-- Note: Security is handled at the application level

COMMENT ON TABLE "EmailCapture" IS 'Email capture forms for lead generation';
COMMENT ON TABLE "EmailSubmission" IS 'Email submissions from capture forms';
COMMENT ON COLUMN "EmailCapture"."buttonText" IS 'Text displayed on the submit button';
COMMENT ON COLUMN "EmailCapture"."placeholder" IS 'Placeholder text for email input';
COMMENT ON COLUMN "EmailCapture"."successMessage" IS 'Message shown after successful submission';
