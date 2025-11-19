import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    id: "proof-of-voice",
    displayName: "Proof of Voice",
    homepageUrl: "https://pov-alpha.vercel.app/",
    iconUrl: "https://pov-alpha.vercel.app/blue-hero.png",
    imageUrl: "https://pov-alpha.vercel.app/blue-hero.png",
    castShareUrl: "https://warpcast.com/~/compose?text=Check+out+Proof+of+Voice",
    framesUrl: "https://pov-alpha.vercel.app/api/frame"
  });
}
