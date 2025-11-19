import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Remove X-Frame-Options header if it exists (Next.js or Vercel might set it by default)
  // This is critical for Farcaster Mini Apps which need to be embedded in iframes
  response.headers.delete('X-Frame-Options');

  // Set Content-Security-Policy to allow embedding in Farcaster frames
  // Allow embedding from Farcaster domains and same origin
  const cspHeader = [
    "frame-ancestors 'self' https://*.farcaster.xyz https://*.warpcast.com https://*.farcaster.org https://farcaster.xyz https://warpcast.com",
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "media-src 'self' blob:",
    "connect-src 'self' https: wss:",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);

  // Allow CORS for Farcaster domains
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

  // Handle OPTIONS requests for CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    });
  }

  return response;
}

// Apply middleware to all routes including API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Note: We include API routes to ensure headers are set correctly
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

