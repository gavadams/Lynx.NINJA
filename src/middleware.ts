import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Simple test - just log every request
  console.log('🚀 MIDDLEWARE RUNNING for path:', pathname)
  
  // Add a custom header to prove middleware is working
  const response = NextResponse.next()
  response.headers.set('x-middleware-test', 'working')
  
  return response
}

export const config = {
  matcher: [
    // Match all paths - very permissive for testing
    '/(.*)',
  ],
}