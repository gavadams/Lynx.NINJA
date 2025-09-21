-- Social Media Links Feature
-- Created: 2024-12-19 23:30:00
-- Description: Add social media links to user profiles

-- Create SocialMediaLink table
CREATE TABLE IF NOT EXISTS "SocialMediaLink" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- e.g., 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok', 'facebook', 'github', 'website'
  url TEXT NOT NULL,
  "displayName" TEXT, -- Custom display name for the link (optional)
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_social_media_userid_order" ON "SocialMediaLink"("userId", "order");
CREATE INDEX IF NOT EXISTS "idx_social_media_platform" ON "SocialMediaLink"("platform");

-- Add unique constraint to prevent duplicate platforms per user
CREATE UNIQUE INDEX IF NOT EXISTS "idx_social_media_user_platform" ON "SocialMediaLink"("userId", "platform");

-- Add RLS policies
CREATE POLICY "Users can view own social media links" ON "SocialMediaLink"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own social media links" ON "SocialMediaLink"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own social media links" ON "SocialMediaLink"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own social media links" ON "SocialMediaLink"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Allow public read access to active social media links (for public profiles)
CREATE POLICY "Public can view active social media links" ON "SocialMediaLink"
  FOR SELECT USING ("isActive" = true);

-- Add comments for documentation
COMMENT ON TABLE "SocialMediaLink" IS 'Social media links for user profiles';
COMMENT ON COLUMN "SocialMediaLink"."platform" IS 'Social media platform identifier (twitter, instagram, linkedin, etc.)';
COMMENT ON COLUMN "SocialMediaLink"."url" IS 'Full URL to the social media profile';
COMMENT ON COLUMN "SocialMediaLink"."displayName" IS 'Custom display name for the link (optional)';
COMMENT ON COLUMN "SocialMediaLink"."order" IS 'Display order for the social media links';

-- Create function to get user's social media links (for public profiles)
CREATE OR REPLACE FUNCTION get_user_social_media_links(user_id_param TEXT)
RETURNS TABLE(
    "id" TEXT,
    "platform" TEXT,
    "url" TEXT,
    "displayName" TEXT,
    "order" INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sml."id",
        sml."platform",
        sml."url",
        sml."displayName",
        sml."order"
    FROM "SocialMediaLink" sml
    WHERE sml."userId" = user_id_param
    AND sml."isActive" = true
    ORDER BY sml."order" ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
