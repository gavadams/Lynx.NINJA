-- Custom Domains Migration
-- Add custom domain support for premium users

-- Create CustomDomain table
CREATE TABLE IF NOT EXISTS "CustomDomain" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "domain" TEXT NOT NULL,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "verificationToken" TEXT,
  "verificationMethod" TEXT CHECK ("verificationMethod" IN ('dns', 'file')) DEFAULT 'dns',
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint on domain
CREATE UNIQUE INDEX IF NOT EXISTS "CustomDomain_domain_key" ON "CustomDomain"("domain");

-- Create index on userId for faster queries
CREATE INDEX IF NOT EXISTS "CustomDomain_userId_idx" ON "CustomDomain"("userId");

-- Create index on isActive for public queries
CREATE INDEX IF NOT EXISTS "CustomDomain_isActive_idx" ON "CustomDomain"("isActive");

-- Add customDomainId to User table (optional - for primary custom domain)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "customDomainId" TEXT REFERENCES "CustomDomain"("id") ON DELETE SET NULL;

-- Create function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_custom_domain_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updatedAt
DROP TRIGGER IF EXISTS update_custom_domain_updated_at ON "CustomDomain";
CREATE TRIGGER update_custom_domain_updated_at
  BEFORE UPDATE ON "CustomDomain"
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_domain_updated_at();

-- Create function to get user's custom domain
CREATE OR REPLACE FUNCTION get_user_custom_domain(user_id TEXT)
RETURNS TABLE (
  id TEXT,
  domain TEXT,
  isVerified BOOLEAN,
  isActive BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.id,
    cd.domain,
    cd."isVerified",
    cd."isActive"
  FROM "CustomDomain" cd
  WHERE cd."userId" = user_id
    AND cd."isActive" = true
    AND cd."isVerified" = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to verify domain ownership
CREATE OR REPLACE FUNCTION verify_domain_ownership(domain_name TEXT, verification_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  domain_exists BOOLEAN;
BEGIN
  -- Check if domain exists and token matches
  SELECT EXISTS(
    SELECT 1 FROM "CustomDomain" 
    WHERE domain = domain_name 
    AND "verificationToken" = verification_token
  ) INTO domain_exists;
  
  RETURN domain_exists;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies (disabled for NextAuth compatibility)
-- Note: Security is handled at the application level

-- Insert some sample data for testing (optional)
-- INSERT INTO "CustomDomain" ("userId", "domain", "isVerified", "isActive", "verificationToken") 
-- VALUES ('test-user-123', 'testuser.example.com', true, true, 'test-token-123');

COMMENT ON TABLE "CustomDomain" IS 'Custom domains for premium users';
COMMENT ON COLUMN "CustomDomain"."verificationToken" IS 'Token used for domain verification';
COMMENT ON COLUMN "CustomDomain"."verificationMethod" IS 'Method used for verification (dns or file)';
COMMENT ON COLUMN "User"."customDomainId" IS 'Primary custom domain for the user';
