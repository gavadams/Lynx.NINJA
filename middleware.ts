import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSystemSettings } from '@/lib/system-settings'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('🚀 MIDDLEWARE RUNNING for path:', pathname)

  // Skip middleware for static files, API routes, and admin routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/maintenance') ||
    pathname.includes('.')
  ) {
    console.log('⏭️ MIDDLEWARE: Skipping path:', pathname)
    return NextResponse.next()
  }

  try {
    console.log('🔍 Middleware: Checking maintenance mode for path:', pathname)
    const settings = await getSystemSettings()
    console.log('🔍 Middleware: Settings loaded:', { 
      maintenanceMode: settings.maintenanceMode,
      registrationEnabled: settings.registrationEnabled 
    })

    // Check maintenance mode
    if (settings.maintenanceMode) {
      console.log('🔍 Middleware: Maintenance mode is ON')
      // Allow admin users to bypass maintenance mode
      const adminSession = request.cookies.get('admin-session')?.value
      console.log('🔍 Middleware: Admin session exists:', !!adminSession)
      
      if (!adminSession) {
        console.log('🔍 Middleware: Redirecting to maintenance page')
        // Redirect to maintenance page
        return NextResponse.redirect(new URL('/maintenance', request.url))
      } else {
        console.log('🔍 Middleware: Admin user, allowing access')
      }
    } else {
      console.log('🔍 Middleware: Maintenance mode is OFF')
    }
  } catch (error) {
    console.error('❌ Middleware error:', error)
    // Continue if there's an error fetching settings
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except API routes, static files, and admin routes
    '/((?!api|_next|admin|maintenance|favicon.ico).*)',
  ],
}
