import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Remove conflicting headers
  response.headers.delete('X-Frame-Options');
  
  // CRITICAL: Don't set CSP in middleware when embedded in Farcaster
  // Farcaster's iframe will enforce its own CSP that you cannot override
  // Instead, work within their allowed domains
  
  // Only set frame-ancestors, which controls who can embed YOU
  response.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://*.farcaster.xyz https://*.warpcast.com https://farcaster.xyz https://warpcast.com https://base.dev https://*.base.dev;"
  );

  // Set Permissions-Policy for microphone (this CAN work in iframe)
  response.headers.set(
    'Permissions-Policy',
    'microphone=(self "https://farcaster.xyz" "https://warpcast.com"), camera=(), geolocation=()'
  );

  // CORS headers for Farcaster
  const origin = request.headers.get('origin');
  if (origin && (
    origin.includes('farcaster.xyz') ||
    origin.includes('warpcast.com') ||
    origin.includes('farcaster.org')
  )) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg).*)'],
};

