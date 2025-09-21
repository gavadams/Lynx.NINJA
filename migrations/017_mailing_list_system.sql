-- Mailing List System
-- Created: 2024-12-19 23:55:00
-- Description: Add automatic mailing list subscription for new users

-- Create MailingList table for managing email subscriptions
CREATE TABLE "MailingList" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE, -- Only one can be default
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create MailingListSubscription table for user subscriptions
CREATE TABLE "MailingListSubscription" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "mailingListId" TEXT NOT NULL REFERENCES "MailingList"(id) ON DELETE CASCADE,
  "isSubscribed" BOOLEAN NOT NULL DEFAULT TRUE,
  "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unsubscribedAt" TIMESTAMP(3),
  "unsubscribeToken" TEXT UNIQUE, -- For unsubscribe links
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "mailingListId")
);

-- Create MailingListEmail table for storing sent emails
CREATE TABLE "MailingListEmail" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "mailingListId" TEXT NOT NULL REFERENCES "MailingList"(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  "htmlContent" TEXT,
  "sentBy" TEXT REFERENCES "AdminUser"(id) ON DELETE SET NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "openedCount" INTEGER NOT NULL DEFAULT 0,
  "clickedCount" INTEGER NOT NULL DEFAULT 0,
  "isProcessed" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create MailingListEmailRecipient table for tracking individual email delivery
CREATE TABLE "MailingListEmailRecipient" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "emailId" TEXT NOT NULL REFERENCES "MailingListEmail"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "openedAt" TIMESTAMP(3),
  "clickedAt" TIMESTAMP(3),
  "bouncedAt" TIMESTAMP(3),
  "unsubscribedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX "idx_mailing_list_active" ON "MailingList"("isActive");
CREATE INDEX "idx_mailing_list_default" ON "MailingList"("isDefault");
CREATE INDEX "idx_mailing_list_subscription_user" ON "MailingListSubscription"("userId");
CREATE INDEX "idx_mailing_list_subscription_list" ON "MailingListSubscription"("mailingListId");
CREATE INDEX "idx_mailing_list_subscription_subscribed" ON "MailingListSubscription"("isSubscribed");
CREATE INDEX "idx_mailing_list_subscription_token" ON "MailingListSubscription"("unsubscribeToken");
CREATE INDEX "idx_mailing_list_email_list" ON "MailingListEmail"("mailingListId");
CREATE INDEX "idx_mailing_list_email_sent" ON "MailingListEmail"("sentAt");
CREATE INDEX "idx_mailing_list_email_recipient_email" ON "MailingListEmailRecipient"("emailId");
CREATE INDEX "idx_mailing_list_email_recipient_user" ON "MailingListEmailRecipient"("userId");

-- Insert default mailing list
INSERT INTO "MailingList" (name, description, "isDefault", "isActive") VALUES
('Newsletter', 'Platform updates, new features, and tips', TRUE, TRUE),
('Product Updates', 'New features and improvements', FALSE, TRUE),
('Marketing', 'Promotional content and special offers', FALSE, TRUE);

-- Create function to auto-subscribe new users
CREATE OR REPLACE FUNCTION auto_subscribe_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_list_id TEXT;
  unsubscribe_token TEXT;
BEGIN
  -- Get the default mailing list ID
  SELECT id INTO default_list_id 
  FROM "MailingList" 
  WHERE "isDefault" = TRUE AND "isActive" = TRUE 
  LIMIT 1;
  
  -- Generate unsubscribe token
  unsubscribe_token := encode(gen_random_bytes(32), 'hex');
  
  -- Subscribe user to default mailing list
  IF default_list_id IS NOT NULL THEN
    INSERT INTO "MailingListSubscription" (
      "userId", 
      "mailingListId", 
      "isSubscribed", 
      "unsubscribeToken"
    ) VALUES (
      NEW.id, 
      default_list_id, 
      TRUE, 
      unsubscribe_token
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-subscribe new users
CREATE TRIGGER trigger_auto_subscribe_new_user
  AFTER INSERT ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION auto_subscribe_new_user();

-- Create function to get user's mailing list subscriptions
CREATE OR REPLACE FUNCTION get_user_mailing_lists(user_id TEXT)
RETURNS TABLE(
  "mailingListId" TEXT,
  "mailingListName" TEXT,
  "isSubscribed" BOOLEAN,
  "subscribedAt" TIMESTAMP(3),
  "unsubscribeToken" TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mls."mailingListId",
    ml.name as "mailingListName",
    mls."isSubscribed",
    mls."subscribedAt",
    mls."unsubscribeToken"
  FROM "MailingListSubscription" mls
  JOIN "MailingList" ml ON mls."mailingListId" = ml.id
  WHERE mls."userId" = user_id
  AND ml."isActive" = TRUE
  ORDER BY mls."subscribedAt" DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to unsubscribe user from mailing list
CREATE OR REPLACE FUNCTION unsubscribe_from_mailing_list(
  user_id TEXT,
  mailing_list_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE "MailingListSubscription"
  SET 
    "isSubscribed" = FALSE,
    "unsubscribedAt" = CURRENT_TIMESTAMP,
    "updatedAt" = CURRENT_TIMESTAMP
  WHERE "userId" = user_id 
  AND "mailingListId" = mailing_list_id
  AND "isSubscribed" = TRUE;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to subscribe user to mailing list
CREATE OR REPLACE FUNCTION subscribe_to_mailing_list(
  user_id TEXT,
  mailing_list_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  unsubscribe_token TEXT;
  updated_rows INTEGER;
BEGIN
  -- Generate unsubscribe token
  unsubscribe_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert or update subscription
  INSERT INTO "MailingListSubscription" (
    "userId", 
    "mailingListId", 
    "isSubscribed", 
    "unsubscribeToken",
    "subscribedAt"
  ) VALUES (
    user_id, 
    mailing_list_id, 
    TRUE, 
    unsubscribe_token,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT ("userId", "mailingListId") 
  DO UPDATE SET
    "isSubscribed" = TRUE,
    "unsubscribedAt" = NULL,
    "updatedAt" = CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE "MailingList" IS 'Mailing lists for email marketing and newsletters';
COMMENT ON TABLE "MailingListSubscription" IS 'User subscriptions to mailing lists';
COMMENT ON TABLE "MailingListEmail" IS 'Emails sent to mailing lists';
COMMENT ON TABLE "MailingListEmailRecipient" IS 'Individual email delivery tracking';
COMMENT ON FUNCTION auto_subscribe_new_user() IS 'Automatically subscribe new users to default mailing list';
COMMENT ON FUNCTION get_user_mailing_lists(TEXT) IS 'Get all mailing list subscriptions for a user';
COMMENT ON FUNCTION unsubscribe_from_mailing_list(TEXT, TEXT) IS 'Unsubscribe user from a mailing list';
COMMENT ON FUNCTION subscribe_to_mailing_list(TEXT, TEXT) IS 'Subscribe user to a mailing list';
