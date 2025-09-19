-- Link Scheduling and Password Protection
-- Created: 2024-12-19 21:30:00
-- Description: Add scheduling, expiration, and password protection to links

-- Add scheduling and password fields to Link table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Link' AND column_name = 'scheduledAt') THEN
        ALTER TABLE "Link" ADD COLUMN "scheduledAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Link' AND column_name = 'expiresAt') THEN
        ALTER TABLE "Link" ADD COLUMN "expiresAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Link' AND column_name = 'password') THEN
        ALTER TABLE "Link" ADD COLUMN "password" TEXT;
    END IF;
END $$;

-- Create indexes for scheduling queries
CREATE INDEX IF NOT EXISTS "idx_link_scheduled_at" ON "Link"("scheduledAt") WHERE "scheduledAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_link_expires_at" ON "Link"("expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_link_password" ON "Link"("password") WHERE "password" IS NOT NULL;

-- Create function to get active links (respects scheduling and expiration)
CREATE OR REPLACE FUNCTION get_active_links(user_id_param TEXT)
RETURNS TABLE(
    "id" TEXT,
    "title" TEXT,
    "url" TEXT,
    "isActive" BOOLEAN,
    "clickCount" INTEGER,
    "order" INTEGER,
    "scheduledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "password" TEXT,
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
        l."scheduledAt",
        l."expiresAt",
        l."password",
        l."createdAt"
    FROM "Link" l
    WHERE l."userId" = user_id_param
    AND l."isActive" = true
    AND (l."scheduledAt" IS NULL OR l."scheduledAt" <= CURRENT_TIMESTAMP)
    AND (l."expiresAt" IS NULL OR l."expiresAt" > CURRENT_TIMESTAMP)
    ORDER BY l."order" ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if link is accessible (for password protection)
CREATE OR REPLACE FUNCTION check_link_access(link_id_param TEXT, provided_password TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    link_password TEXT;
BEGIN
    SELECT l."password" INTO link_password
    FROM "Link" l
    WHERE l."id" = link_id_param;
    
    -- If no password is set, link is accessible
    IF link_password IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- If password is set, check if provided password matches
    RETURN link_password = provided_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to allow public access to active links function
GRANT EXECUTE ON FUNCTION get_active_links(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_active_links(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_link_access(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_link_access(TEXT, TEXT) TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN "Link"."scheduledAt" IS 'When the link should become active (premium feature)';
COMMENT ON COLUMN "Link"."expiresAt" IS 'When the link should expire (premium feature)';
COMMENT ON COLUMN "Link"."password" IS 'Password to protect the link (premium feature)';
COMMENT ON FUNCTION get_active_links(TEXT) IS 'Get active links respecting scheduling and expiration';
COMMENT ON FUNCTION check_link_access(TEXT, TEXT) IS 'Check if a link is accessible with given password';
