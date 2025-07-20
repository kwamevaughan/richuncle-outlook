import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  const userCookie = request.cookies.get('user');
  let user = null;

  if (userCookie) {
    try {
      user = JSON.parse(decodeURIComponent(userCookie.value));
    } catch (e) {}
  }

  // If user is a cashier and not on /pos, redirect to /pos
  if (user && user.role === 'cashier' && url.pathname !== '/pos') {
    url.pathname = '/pos';
    return NextResponse.redirect(url);
  }

  // Allow all other requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|api|static|favicon.ico).*)',
  ],
}; 