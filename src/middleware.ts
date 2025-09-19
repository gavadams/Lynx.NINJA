import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSiteConfig } from '@/lib/config'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  // Skip middleware for localhost and Vercel preview URLs
  if (hostname.includes('localhost') || hostname.includes('vercel.app')) {
    return NextResponse.next()
  }

  // Check if this is a custom domain request
  // For production, you would check against your database of custom domains
  // For now, we'll create a simple check
  
  // If it's not the main domain, treat it as a custom domain
  const { mainDomain } = getSiteConfig()
  
  if (!hostname.includes(mainDomain)) {
    // This is a custom domain request
    // In a real implementation, you would:
    // 1. Look up the domain in your database
    // 2. Find the associated user
    // 3. Redirect to their profile page
    
    // For now, we'll redirect to a custom domain handler
    const url = request.nextUrl.clone()
    url.pathname = `/custom-domain`
    url.searchParams.set('domain', hostname)
    
    return NextResponse.rewrite(url)
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
