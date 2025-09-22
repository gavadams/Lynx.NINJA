import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSystemSettings } from '@/lib/system-settings'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files, API routes, and admin routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/maintenance') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  try {
    const settings = await getSystemSettings()

    // Check maintenance mode
    if (settings.maintenanceMode) {
      // Allow admin users to bypass maintenance mode
      const adminSession = request.cookies.get('admin-session')?.value
      if (!adminSession) {
        // Redirect to maintenance page
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }
    }
  } catch (error) {
    console.error('Middleware error:', error)
    // Continue if there's an error fetching settings
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - admin (admin routes)
     * - maintenance (maintenance page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|admin|maintenance).*)',
  ],
}