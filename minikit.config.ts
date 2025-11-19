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
    description: "Record your voice, analyze its humanity, and mint it as an NFT on Base.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#4C1D95", 
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["voice", "nft", "base", "farcaster", "proofofvoice"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`,
    tagline: "Your voice, immortalized",
    buttonTitle: "🎤 Mint Your Voice",
    ogTitle: "Proof of Voice",
    ogDescription: "Record your voice, analyze its humanity score, and mint it as a unique NFT on Base.",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
    castShareUrl: ROOT_URL,
  },
    baseBuilder: {
      ownerAddress: "0xA76ff0ad851dc9357A1BAf5FE65b12E821EC5bE7",
    },
} as const;

