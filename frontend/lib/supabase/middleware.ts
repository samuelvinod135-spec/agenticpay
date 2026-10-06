import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  // If using placeholder credentials, allow demo access through cookie check or guest session
  const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Route protection for /dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const isGuest =
      request.cookies.get('agentic_guest_auth')?.value === 'true' ||
      request.cookies.get('agentic_operator_auth')?.value === 'true' ||
      request.nextUrl.searchParams.get('guest') === 'true' ||
      process.env.NODE_ENV === 'development';

    if (request.nextUrl.searchParams.get('guest') === 'true' || process.env.NODE_ENV === 'development') {
      response.cookies.set({
        name: 'agentic_guest_auth',
        value: 'true',
        path: '/',
        maxAge: 86400,
        sameSite: 'lax',
      });
    }

    // If no user and not guest mode, redirect to /login
    if (!user && !isGuest && !isPlaceholder) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectedFrom', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // If already authenticated and trying to visit login/signup, redirect to dashboard
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && (user || request.cookies.get('agentic_guest_auth')?.value === 'true')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}
