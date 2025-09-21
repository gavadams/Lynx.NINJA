-- Email Templates System (Standalone)
-- Created: 2024-12-19 23:59:00
-- Description: Create email templates table if it doesn't exist

-- Create EmailTemplate table for storing reusable email templates
CREATE TABLE IF NOT EXISTS "EmailTemplate" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT, -- Plain text version
  "htmlContent" TEXT NOT NULL, -- HTML version
  "createdBy" TEXT REFERENCES "AdminUser"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS "idx_email_template_created_by" ON "EmailTemplate"("createdBy");
CREATE INDEX IF NOT EXISTS "idx_email_template_created_at" ON "EmailTemplate"("createdAt");

-- Add comments for documentation
COMMENT ON TABLE "EmailTemplate" IS 'Reusable email templates for admin email composer';
COMMENT ON COLUMN "EmailTemplate"."name" IS 'Template name for easy identification';
COMMENT ON COLUMN "EmailTemplate"."subject" IS 'Email subject line template';
COMMENT ON COLUMN "EmailTemplate"."content" IS 'Plain text version of the email';
COMMENT ON COLUMN "EmailTemplate"."htmlContent" IS 'HTML version of the email';
COMMENT ON COLUMN "EmailTemplate"."createdBy" IS 'Admin user who created the template';

-- Insert some default templates (only if table is empty)
INSERT INTO "EmailTemplate" (name, subject, content, "htmlContent", "createdBy") 
SELECT * FROM (VALUES
  (
    'Welcome Email',
    'Welcome to {{siteName}}!',
    'Welcome to {{siteName}}! We''re excited to have you on board. This is your plain text welcome message.',
    '<h1>Welcome to {{siteName}}!</h1><p>We''re excited to have you on board. This is your HTML welcome message.</p><p>Get started by <a href="{{profileUrl}}">customizing your profile</a>.</p>',
    NULL
  ),
  (
    'Feature Update',
    'New Feature: {{featureName}}',
    'We''ve added a new feature: {{featureName}}. Check it out in your dashboard!',
    '<h2>New Feature: {{featureName}}</h2><p>We''ve added an exciting new feature to help you manage your links better.</p><p><a href="{{dashboardUrl}}">Check it out in your dashboard</a></p>',
    NULL
  ),
  (
    'Newsletter',
    '{{siteName}} Newsletter - {{date}}',
    'Here''s what''s new this week at {{siteName}}...',
    '<h1>{{siteName}} Newsletter</h1><p>Here''s what''s new this week:</p><ul><li>Feature updates</li><li>Tips and tricks</li><li>Community highlights</li></ul>',
    NULL
  )
) AS new_templates(name, subject, content, htmlContent, createdBy)
WHERE NOT EXISTS (SELECT 1 FROM "EmailTemplate" LIMIT 1);
