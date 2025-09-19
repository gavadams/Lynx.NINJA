-- Admin System Features
-- Created: 2024-12-19 23:30:00
-- Description: Add admin system with feature flags and system management

-- Create AdminUsers table for admin authentication
CREATE TABLE "AdminUser" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, -- bcrypt hashed
  role TEXT NOT NULL DEFAULT 'admin', -- 'super_admin', 'admin', 'moderator'
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "lastLoginAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create FeatureFlags table for system configuration
CREATE TABLE "FeatureFlag" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  "isEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "enabledForUsers" TEXT[], -- Array of user IDs for user-specific flags
  "enabledForPercentage" INTEGER DEFAULT 100, -- Percentage rollout (0-100)
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create SystemSettings table for general system configuration
CREATE TABLE "SystemSetting" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  "dataType" TEXT NOT NULL DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  "isPublic" BOOLEAN NOT NULL DEFAULT FALSE, -- Whether this setting can be read by non-admins
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create SystemLogs table for audit and monitoring
CREATE TABLE "SystemLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  level TEXT NOT NULL, -- 'info', 'warn', 'error', 'debug'
  message TEXT NOT NULL,
  "userId" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  "adminUserId" TEXT REFERENCES "AdminUser"(id) ON DELETE SET NULL,
  "action" TEXT, -- What action was performed
  "resourceType" TEXT, -- Type of resource affected (user, link, team, etc)
  "resourceId" TEXT, -- ID of the resource affected
  metadata JSONB, -- Additional context data
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create AdminSessions table for admin authentication
CREATE TABLE "AdminSession" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "adminUserId" TEXT NOT NULL REFERENCES "AdminUser"(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX "idx_admin_user_email" ON "AdminUser"("email");
CREATE INDEX "idx_admin_user_role" ON "AdminUser"("role");
CREATE INDEX "idx_feature_flag_name" ON "FeatureFlag"("name");
CREATE INDEX "idx_feature_flag_enabled" ON "FeatureFlag"("isEnabled");
CREATE INDEX "idx_system_setting_key" ON "SystemSetting"("key");
CREATE INDEX "idx_system_setting_public" ON "SystemSetting"("isPublic");
CREATE INDEX "idx_system_log_level" ON "SystemLog"("level");
CREATE INDEX "idx_system_log_created" ON "SystemLog"("createdAt");
CREATE INDEX "idx_system_log_user" ON "SystemLog"("userId");
CREATE INDEX "idx_system_log_admin" ON "SystemLog"("adminUserId");
CREATE INDEX "idx_system_log_action" ON "SystemLog"("action");
CREATE INDEX "idx_admin_session_token" ON "AdminSession"("token");
CREATE INDEX "idx_admin_session_admin" ON "AdminSession"("adminUserId");
CREATE INDEX "idx_admin_session_expires" ON "AdminSession"("expiresAt");

-- Insert default feature flags
INSERT INTO "FeatureFlag" (name, description, "isEnabled") VALUES
('teams', 'Team collaboration features', false),
('customDomains', 'Custom domain support', true),
('emailCapture', 'Email capture forms', true),
('analytics', 'Analytics and reporting', true),
('themes', 'Theme customization', true),
('qrCodes', 'QR code generation', true),
('passwordProtection', 'Link password protection', true),
('linkScheduling', 'Link scheduling', true),
('linkExpiration', 'Link expiration', true),
('adminPanel', 'Admin panel access', true);

-- Insert default system settings
INSERT INTO "SystemSetting" (key, value, description, "dataType", "isPublic") VALUES
('siteName', 'LinkBio', 'The name of the website', 'string', true),
('siteDescription', 'Modern link-in-bio platform', 'Description of the website', 'string', true),
('maxLinksPerUser', '50', 'Maximum links per user account', 'number', false),
('maxLinksPerPremiumUser', '500', 'Maximum links per premium user', 'number', false),
('maintenanceMode', 'false', 'Whether the site is in maintenance mode', 'boolean', true),
('registrationEnabled', 'true', 'Whether new user registration is enabled', 'boolean', true),
('emailNotifications', 'true', 'Whether email notifications are enabled', 'boolean', false),
('analyticsRetentionDays', '365', 'How long to keep analytics data', 'number', false),
('backupFrequency', 'daily', 'How often to backup the database', 'string', false),
('maxFileUploadSize', '10485760', 'Maximum file upload size in bytes (10MB)', 'number', false);

-- Create function to get feature flag status
CREATE OR REPLACE FUNCTION get_feature_flag_status(flag_name TEXT, user_id TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  flag_record RECORD;
  user_percentage INTEGER;
BEGIN
  -- Get the feature flag
  SELECT * INTO flag_record FROM "FeatureFlag" WHERE name = flag_name;
  
  -- If flag doesn't exist, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- If flag is disabled globally, return false
  IF NOT flag_record."isEnabled" THEN
    RETURN FALSE;
  END IF;
  
  -- If user_id is provided, check user-specific enablement
  IF user_id IS NOT NULL THEN
    -- Check if user is in the enabled users list
    IF user_id = ANY(flag_record."enabledForUsers") THEN
      RETURN TRUE;
    END IF;
    
    -- Check percentage rollout
    IF flag_record."enabledForPercentage" < 100 THEN
      -- Simple hash-based percentage rollout
      user_percentage := (hashtext(user_id || flag_name) % 100) + 1;
      IF user_percentage <= flag_record."enabledForPercentage" THEN
        RETURN TRUE;
      END IF;
    END IF;
  END IF;
  
  -- If no user_id or user-specific checks pass, return global status
  RETURN flag_record."isEnabled";
END;
$$ LANGUAGE plpgsql;

-- Create function to log system events
CREATE OR REPLACE FUNCTION log_system_event(
  log_level TEXT,
  log_message TEXT,
  user_id TEXT DEFAULT NULL,
  admin_user_id TEXT DEFAULT NULL,
  action_name TEXT DEFAULT NULL,
  resource_type TEXT DEFAULT NULL,
  resource_id TEXT DEFAULT NULL,
  log_metadata JSONB DEFAULT NULL,
  ip_addr TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  log_id TEXT;
BEGIN
  INSERT INTO "SystemLog" (
    level, message, "userId", "adminUserId", action, "resourceType", 
    "resourceId", metadata, "ipAddress", "userAgent"
  ) VALUES (
    log_level, log_message, user_id, admin_user_id, action_name, 
    resource_type, resource_id, log_metadata, ip_addr, user_agent
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;
