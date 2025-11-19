import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "../minikit.config";
import { RootProvider } from "./rootProvider";
import { FarcasterSDKInit } from "./components/FarcasterSDKInit";
import "./globals.css";

const resolveRootUrl = () =>
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const buildMiniAppMetaContent = (rootUrl: string) => {
  // Use 3:2 image for embed preview (or fallback to hero image)
  // Note: For best results, create a 3:2 image (e.g., 1200x800px) at /blue-hero-3x2.png
  const embedImageUrl = minikitConfig.miniapp.heroImageUrl; // Will use hero image, but ideally should be 3:2
  const splashImageUrl = minikitConfig.miniapp.iconUrl || `${rootUrl}/blue-icon.png`;
  
  return JSON.stringify({
    version: "1", // Must be exactly "1" as string
    imageUrl: embedImageUrl, // Should be 3:2 aspect ratio, absolute HTTPS URL
    button: {
      title: minikitConfig.miniapp.name || "Proof of Voice", // <= 32 chars
      action: {
        type: "launch_frame", // Must be "launch_frame" or "view_token" (not "launch_miniapp")
        name: minikitConfig.miniapp.name || "Proof of Voice", // Required field
        url: rootUrl, // Launch URL
        splashImageUrl: splashImageUrl, // 200x200px recommended
        splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor || "#000000",
      },
    },
  });
};

export async function generateMetadata(): Promise<Metadata> {
  const ROOT_URL = resolveRootUrl();
  const FRAME_URL = `${ROOT_URL}/api/frame`;
  const miniAppMetaContent = buildMiniAppMetaContent(ROOT_URL);

  return {
    title: "Proof of Voice - Immortalize Your Voice on Base",
    description: minikitConfig.miniapp.description,
    keywords: [
      "voice",
      "nft",
      "base",
      "farcaster",
      "audio",
      "humanity",
      "proof-of-voice",
      "blockchain",
      "on-chain",
      "voice analysis",
    ],
    authors: [{ name: "Proof of Voice" }],
    icons: {
      icon: minikitConfig.miniapp.iconUrl || `${ROOT_URL}/blue-icon.png`,
      apple: minikitConfig.miniapp.iconUrl || `${ROOT_URL}/blue-icon.png`,
    },
    metadataBase: new URL(ROOT_URL),
    openGraph: {
      title: minikitConfig.miniapp.ogTitle,
      description: minikitConfig.miniapp.ogDescription,
      images: [minikitConfig.miniapp.ogImageUrl],
    },
    other: {
      // Mini App meta tag - enables embedding as Mini App
      "fc:miniapp": miniAppMetaContent,
      // Standard Frame Protocol metadata tags
      "fc:frame": "vNext",
      "fc:frame:image": minikitConfig.miniapp.heroImageUrl,
      "fc:frame:image:aspect_ratio": "1:1",
      "fc:frame:button:1": (() => {
        const miniapp = minikitConfig.miniapp as typeof minikitConfig.miniapp & { buttonTitle?: string };
        return miniapp.buttonTitle || "🎤 Mint Your Voice";
      })(),
      "fc:frame:button:1:action": "post",
      "fc:frame:button:1:target": FRAME_URL,
      "fc:frame:button:2": "🌐 Open Full App",
      "fc:frame:button:2:action": "link",
      "fc:frame:button:2:target": ROOT_URL,
      "fc:frame:post_url": FRAME_URL,
    },
  };
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const rootUrl = resolveRootUrl();
  const miniAppMetaContent = buildMiniAppMetaContent(rootUrl);

  return (
    <RootProvider>
      <html lang="en">
      <head>
  <meta name="fc:miniapp" content={miniAppMetaContent} />

  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content={`${rootUrl}/blue-hero.png`} />
  <meta property="fc:frame:image:aspect_ratio" content="1:1" />
  <meta property="fc:frame:post_url" content={`${rootUrl}/api/frame`} />

  <meta property="fc:frame:button:1" content="🎤 Mint Your Voice" />
  <meta property="fc:frame:button:1:action" content="post" />
  <meta property="fc:frame:button:1:target" content={`${rootUrl}/api/frame`} />

  <meta property="fc:frame:button:2" content="🌐 Open Full App" />
  <meta property="fc:frame:button:2:action" content="link" />
  <meta property="fc:frame:button:2:target" content={rootUrl} />

  <meta property="og:title" content="Proof of Voice" />
  <meta
    property="og:description"
    content="Record your voice, analyze its humanity score, and mint it on Base."
  />
  <meta property="og:image" content={`${rootUrl}/blue-hero.png`} />
</head>


        <body className={`${inter.variable} ${sourceCodePro.variable}`}>
          <FarcasterSDKInit />
          <SafeArea>{children}</SafeArea>
        </body>
      </html>
    </RootProvider>
  );
}
