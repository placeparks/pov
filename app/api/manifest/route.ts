import { NextResponse } from "next/server";

const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

export function GET() {
  return NextResponse.json({
    id: "proof-of-voice",
    displayName: "Proof of Voice",
    homepageUrl: `${ROOT_URL}/`,
    iconUrl: `${ROOT_URL}/blue-hero.png`,
    imageUrl: `${ROOT_URL}/blue-hero.png`,
    castShareUrl: ROOT_URL, // Must be same domain as homepageUrl
    framesUrl: `${ROOT_URL}/api/frame`
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
