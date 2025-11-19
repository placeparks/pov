import { NextResponse } from "next/server";

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjQ1MzQ1NiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGZlNEU4MzRjMzk5MDhiYzc0YzQ1NmYzOTZlRDViZDg2Y0FCYUU0QjUifQ",
      payload: "eyJkb21haW4iOiJwb3YtYWxwaGEudmVyY2VsLmFwcCJ9",
      signature: "dNXoTHkVFP+rKwiitj6fU7H3nd7GE8ArnzMMgs0dWLg5rV54SrnQCpVQ626P455HtrdkUFzB9l1IxxWxHK1LwRw="
    },
    miniapp: {
      version: "1.0.0",
      name: "Proof of Voice",
      iconUrl: "https://pov-alpha.vercel.app/blue-icon.png",
      homeUrl: "https://pov-alpha.vercel.app",
      imageUrl: "https://pov-alpha.vercel.app/blue-hero.png",
      buttonTitle: "🎤 Mint Your Voice",
      splashImageUrl: "https://pov-alpha.vercel.app/blue-hero.png",
      splashBackgroundColor: "#4C1D95",
      webhookUrl: "https://pov-alpha.vercel.app/api/webhook"
    }
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
