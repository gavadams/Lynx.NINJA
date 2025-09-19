-- Team Collaboration Features
-- Created: 2024-12-19 23:00:00
-- Description: Add team collaboration functionality

-- Create Teams table
CREATE TABLE "Team" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  "ownerId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create TeamMembers table
CREATE TABLE "TeamMember" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "teamId" TEXT NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  "invitedBy" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  "invitedAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "joinedAt" TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE("teamId", "userId")
);

-- Create TeamLinks table for shared links
CREATE TABLE "TeamLink" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "teamId" TEXT NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
  "linkId" TEXT NOT NULL REFERENCES "Link"(id) ON DELETE CASCADE,
  "createdBy" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE("teamId", "linkId")
);

-- Add indexes for performance
CREATE INDEX "idx_team_owner" ON "Team"("ownerId");
CREATE INDEX "idx_team_member_team" ON "TeamMember"("teamId");
CREATE INDEX "idx_team_member_user" ON "TeamMember"("userId");
CREATE INDEX "idx_team_member_status" ON "TeamMember"("status");
CREATE INDEX "idx_team_link_team" ON "TeamLink"("teamId");
CREATE INDEX "idx_team_link_link" ON "TeamLink"("linkId");

-- Add RLS policies (disabled for NextAuth compatibility)
-- Note: Security is handled at the application level

-- Create function to get user's teams
CREATE OR REPLACE FUNCTION get_user_teams(user_id TEXT)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  description TEXT,
  "ownerId" TEXT,
  role TEXT,
  "memberCount" BIGINT,
  "createdAt" TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.description,
    t."ownerId",
    tm.role,
    (SELECT COUNT(*) FROM "TeamMember" WHERE "teamId" = t.id AND status = 'accepted') as "memberCount",
    t."createdAt"
  FROM "Team" t
  JOIN "TeamMember" tm ON t.id = tm."teamId"
  WHERE tm."userId" = user_id 
    AND tm.status = 'accepted'
  ORDER BY t."createdAt" DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get team members
CREATE OR REPLACE FUNCTION get_team_members(team_id TEXT)
RETURNS TABLE (
  id TEXT,
  "userId" TEXT,
  role TEXT,
  status TEXT,
  "invitedAt" TIMESTAMP WITH TIME ZONE,
  "joinedAt" TIMESTAMP WITH TIME ZONE,
  "userName" TEXT,
  "userEmail" TEXT,
  "userDisplayName" TEXT,
  "userProfileImage" TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.id,
    tm."userId",
    tm.role,
    tm.status,
    tm."invitedAt",
    tm."joinedAt",
    u.username as "userName",
    u.email as "userEmail",
    u."displayName" as "userDisplayName",
    u."profileImage" as "userProfileImage"
  FROM "TeamMember" tm
  JOIN "User" u ON tm."userId" = u.id
  WHERE tm."teamId" = team_id
  ORDER BY tm."createdAt" DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get team links
CREATE OR REPLACE FUNCTION get_team_links(team_id TEXT)
RETURNS TABLE (
  id TEXT,
  "linkId" TEXT,
  title TEXT,
  url TEXT,
  "isActive" BOOLEAN,
  clicks INTEGER,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE,
  "creatorName" TEXT,
  "creatorEmail" TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tl.id,
    tl."linkId",
    l.title,
    l.url,
    l."isActive",
    l.clicks,
    tl."createdBy",
    tl."createdAt",
    u."displayName" as "creatorName",
    u.email as "creatorEmail"
  FROM "TeamLink" tl
  JOIN "Link" l ON tl."linkId" = l.id
  JOIN "User" u ON tl."createdBy" = u.id
  WHERE tl."teamId" = team_id
  ORDER BY tl."createdAt" DESC;
END;
$$ LANGUAGE plpgsql;
