import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { DEMO_HEADER } from '@/config/demo';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)']);

export default clerkMiddleware(async (auth, request) => {
  const host = request.headers.get('host');
  const isDemo = host === 'demo.instructr.uk';

  if (isDemo) {
    const res = NextResponse.next();
    res.headers.set(DEMO_HEADER, 'true');
    return res;
  }

  if (!isPublicRoute(request)) await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
