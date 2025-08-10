import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  
  // Skip middleware for API routes, static files, and auth callback
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/static/') ||
    url.pathname === '/auth/callback' ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Let client-side routing handle authentication and role-based access
  // The RoleBasedAccess component will handle redirects properly
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|api|static|favicon.ico).*)',
  ],
}; 