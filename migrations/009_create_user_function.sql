-- Create User Function for Signup
-- Created: 2024-12-19 23:55:00
-- Description: Create a function to insert users bypassing RLS for signup

-- Create function to insert user (bypasses RLS)
CREATE OR REPLACE FUNCTION create_user(
    user_id TEXT,
    user_email TEXT,
    user_username TEXT,
    user_display_name TEXT,
    user_password TEXT
)
RETURNS TABLE(
    id TEXT,
    email TEXT,
    username TEXT,
    "displayName" TEXT,
    "isPremium" BOOLEAN,
    theme JSONB,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert user
    INSERT INTO "User" (
        id,
        email,
        username,
        "displayName",
        password,
        "isPremium",
        theme,
        "createdAt",
        "updatedAt"
    ) VALUES (
        user_id,
        user_email,
        user_username,
        user_display_name,
        user_password,
        false,
        '{}',
        NOW(),
        NOW()
    );

    -- Return the created user
    RETURN QUERY
    SELECT
        u.id,
        u.email,
        u.username,
        u."displayName",
        u."isPremium",
        u.theme,
        u."createdAt",
        u."updatedAt"
    FROM "User" u
    WHERE u.id = user_id;
END;
$$;
