import { prisma } from "./prisma"

// For Supabase, we don't need to set user context manually
// RLS policies use auth.uid() which is automatically available
// This function is kept for compatibility but doesn't do anything
export async function setUserContext(userId: string) {
  // No-op for Supabase - RLS uses auth.uid() automatically
  return Promise.resolve()
}

// Helper function to get user context from session
export function getUserContextFromSession(session: any): string | null {
  if (!session?.user?.email) return null
  return session.user.email
}

// Wrapper for database operations that need RLS
export async function withUserContext<T>(
  userId: string,
  operation: () => Promise<T>
): Promise<T> {
  // For Supabase, we can call the operation directly
  // RLS policies will automatically filter based on auth.uid()
  return await operation()
}
