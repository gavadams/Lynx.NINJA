-- Email Capture Links Page Integration
-- Add email capture form to user's links page

-- Add email capture form selection to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailCaptureId" TEXT REFERENCES "EmailCapture"("id") ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS "User_emailCaptureId_idx" ON "User"("emailCaptureId");

-- Create function to get user's email capture form for links page
CREATE OR REPLACE FUNCTION get_user_email_capture_for_links(user_id TEXT)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  description TEXT,
  button_text TEXT,
  placeholder TEXT,
  success_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.id,
    ec.title,
    ec.description,
    ec."buttonText",
    ec.placeholder,
    ec."successMessage"
  FROM "User" u
  JOIN "EmailCapture" ec ON u."emailCaptureId" = ec.id
  WHERE u.id = user_id
    AND ec."isActive" = true;
END;
$$ LANGUAGE plpgsql;

-- Create function to get public user profile with email capture
CREATE OR REPLACE FUNCTION get_public_profile_with_email_capture(username_param TEXT)
RETURNS TABLE (
  user_id TEXT,
  username TEXT,
  display_name TEXT,
  profile_image TEXT,
  theme TEXT,
  bio TEXT,
  email_capture_id TEXT,
  email_capture_title TEXT,
  email_capture_description TEXT,
  email_capture_button_text TEXT,
  email_capture_placeholder TEXT,
  email_capture_success_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u."displayName",
    u."profileImage",
    u.theme,
    u.bio,
    ec.id,
    ec.title,
    ec.description,
    ec."buttonText",
    ec.placeholder,
    ec."successMessage"
  FROM "User" u
  LEFT JOIN "EmailCapture" ec ON u."emailCaptureId" = ec.id AND ec."isActive" = true
  WHERE u.username = username_param;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN "User"."emailCaptureId" IS 'Email capture form to display on user links page';
