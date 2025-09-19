-- Phase 2 Updates for LinkBio Platform
-- Created: 2024-12-19 20:45:00
-- Description: Updates for user profile management, theme customization, and analytics

-- Add bio field to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;

-- Update theme column to be a simple string instead of JSONB
ALTER TABLE "User" ALTER COLUMN "theme" TYPE TEXT DEFAULT 'default';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_user_username" ON "User"("username");
CREATE INDEX IF NOT EXISTS "idx_link_userid_order" ON "Link"("userId", "order");
CREATE INDEX IF NOT EXISTS "idx_analytics_linkid_created" ON "Analytics"("linkId", "createdAt");

-- Create function to get user by username (for public profiles)
CREATE OR REPLACE FUNCTION get_user_by_username(username_param TEXT)
RETURNS TABLE(
    "id" TEXT,
    "username" TEXT,
    "displayName" TEXT,
    "profileImage" TEXT,
    "theme" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u."id",
        u."username",
        u."displayName",
        u."profileImage",
        u."theme",
        u."bio",
        u."createdAt"
    FROM "User" u
    WHERE u."username" = username_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's active links (for public profiles)
CREATE OR REPLACE FUNCTION get_user_links(user_id_param TEXT)
RETURNS TABLE(
    "id" TEXT,
    "title" TEXT,
    "url" TEXT,
    "isActive" BOOLEAN,
    "clickCount" INTEGER,
    "order" INTEGER,
    "createdAt" TIMESTAMP(3)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l."id",
        l."title",
        l."url",
        l."isActive",
        l."clickCount",
        l."order",
        l."createdAt"
    FROM "Link" l
    WHERE l."userId" = user_id_param
    AND l."isActive" = true
    ORDER BY l."order" ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment link clicks
CREATE OR REPLACE FUNCTION increment_link_clicks(link_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE "Link" 
    SET "clickCount" = "clickCount" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for new functions
-- Allow public access to get_user_by_username function
GRANT EXECUTE ON FUNCTION get_user_by_username(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_user_by_username(TEXT) TO authenticated;

-- Allow public access to get_user_links function
GRANT EXECUTE ON FUNCTION get_user_links(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_user_links(TEXT) TO authenticated;

-- Allow public access to increment_link_clicks function
GRANT EXECUTE ON FUNCTION increment_link_clicks(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION increment_link_clicks(TEXT) TO authenticated;

-- Update User table RLS policy to allow public read access for profile data
DROP POLICY IF EXISTS "Users can view own profile" ON "User";
CREATE POLICY "Users can view own profile" ON "User"
    FOR SELECT USING (auth.uid()::text = "id");

-- Allow public read access to user profiles (for public pages)
CREATE POLICY "Public can view user profiles" ON "User"
    FOR SELECT USING (true);

-- Update Link table RLS policy to allow public read access to active links
DROP POLICY IF EXISTS "Users can view own links" ON "Link";
CREATE POLICY "Users can view own links" ON "Link"
    FOR SELECT USING (auth.uid()::text = "userId");

-- Allow public read access to active links (for public pages)
CREATE POLICY "Public can view active links" ON "Link"
    FOR SELECT USING ("isActive" = true);

-- Update Analytics table RLS policy
DROP POLICY IF EXISTS "Users can view own analytics" ON "Analytics";
CREATE POLICY "Users can view own analytics" ON "Analytics"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Link" 
            WHERE "Link"."id" = "Analytics"."linkId" 
            AND "Link"."userId" = auth.uid()::text
        )
    );

-- Allow public insert access to analytics (for click tracking)
CREATE POLICY "Public can insert analytics" ON "Analytics"
    FOR INSERT WITH CHECK (true);

-- Create trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to User table
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to Link table
DROP TRIGGER IF EXISTS update_link_updated_at ON "Link";
CREATE TRIGGER update_link_updated_at
    BEFORE UPDATE ON "Link"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default theme options (this would typically be done in application code)
-- But we can add a comment about available themes
COMMENT ON COLUMN "User"."theme" IS 'Available themes: default, dark, purple, green, orange';

-- Add comments for documentation
COMMENT ON TABLE "User" IS 'User profiles with theme customization and bio support';
COMMENT ON TABLE "Link" IS 'User links with click tracking and ordering';
COMMENT ON TABLE "Analytics" IS 'Click analytics with device and location tracking';
COMMENT ON FUNCTION get_user_by_username(TEXT) IS 'Get user profile by username for public pages';
COMMENT ON FUNCTION get_user_links(TEXT) IS 'Get active links for a user for public pages';
COMMENT ON FUNCTION increment_link_clicks(TEXT) IS 'Increment click count for a link';
