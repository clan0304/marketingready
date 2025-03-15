import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect unauthenticated users from protected routes to sign in
  const isAuthRoute = req.nextUrl.pathname.startsWith('/auth');
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard');

  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/signin', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages to dashboard
  if (isAuthRoute && session) {
    // Don't redirect users from specific auth routes that are needed even when logged in
    const exceptRoutes = [
      '/auth/complete-profile',
      '/auth/callback',
      '/auth/oauth-callback',
    ];

    if (!exceptRoutes.some((route) => req.nextUrl.pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};
