import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "../minikit.config";
import { RootProvider } from "./rootProvider";
import { FarcasterSDKInit } from "./components/FarcasterSDKInit";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const ROOT_URL =
    process.env.NEXT_PUBLIC_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000');

  const FRAME_URL = `${ROOT_URL}/api/frame`;

  return {
    title: 'Proof of Voice - Immortalize Your Voice on Base',
    description: minikitConfig.miniapp.description,
    keywords: ['voice', 'nft', 'base', 'farcaster', 'audio', 'humanity', 'proof-of-voice', 'blockchain', 'on-chain', 'voice analysis'],
    authors: [{ name: 'Proof of Voice' }],
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
      // Standard Frame Protocol metadata tags
      'fc:frame': 'vNext',
      'fc:frame:image': minikitConfig.miniapp.heroImageUrl,
      'fc:frame:image:aspect_ratio': '1:1',
      'fc:frame:button:1': '🎤 Mint Your Voice',
      'fc:frame:button:1:action': 'post',
      'fc:frame:button:1:target': FRAME_URL,
      'fc:frame:button:2': '🌐 Open Full App',
      'fc:frame:button:2:action': 'link',
      'fc:frame:button:2:target': ROOT_URL,
      'fc:frame:post_url': FRAME_URL,
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
  return (
    <RootProvider>
      <html lang="en">
        <body className={`${inter.variable} ${sourceCodePro.variable}`}>
          <FarcasterSDKInit />
          <SafeArea>{children}</SafeArea>
        </body>
      </html>
    </RootProvider>
  );
}
