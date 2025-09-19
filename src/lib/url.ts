/**
 * Get the base URL for the application
 * Handles both development and production environments
 */
export function getBaseUrl(): string {
  // In production, use NEXTAUTH_URL or VERCEL_URL
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // In development, use localhost with the correct port
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  
  // Fallback
  return 'http://localhost:3000'
}
