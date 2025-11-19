const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {

    accountAssociation: {
      header: "eyJmaWQiOjQ1MzQ1NiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGZlNEU4MzRjMzk5MDhiYzc0YzQ1NmYzOTZlRDViZDg2Y0FCYUU0QjUifQ",
      payload: "eyJkb21haW4iOiJwb3YtYWxwaGEudmVyY2VsLmFwcCJ9",
      signature: "dNXoTHkVFP+rKwiitj6fU7H3nd7GE8ArnzMMgs0dWLg5rV54SrnQCpVQ626P455HtrdkUFzB9l1IxxWxHK1LwRw="
    },
  miniapp: {
    version: "1",
    name: "Proof of Voice", 
    subtitle: "Immortalize Your Voice on Base", 
    description: "Record your voice, analyze its humanity, and mint it as an NFT on Base. Each voice is a unique Proof of Voice NFT with emotional analysis, category classification, and on-chain audio storage.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#4C1D95", // Deep indigo matching app gradient
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["voice", "nft", "base", "farcaster", "audio", "humanity", "proof-of-voice"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`,
    tagline: "Your voice, immortalized on-chain",
    ogTitle: "Proof of Voice - Mint Your Voice as an NFT on Base",
    ogDescription: "Record your voice, analyze its humanity score, and mint it as a unique NFT on Base. Each voice is stored on-chain with emotional analysis and category classification.",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
    castShareUrl: `https://warpcast.com/~/compose?text=Check+out+Proof+of+Voice+-+Mint+your+voice+as+an+on-chain+NFT+on+Base+${ROOT_URL}`,
  },
} as const;

