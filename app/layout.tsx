import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "../minikit.config";
import { RootProvider } from "./rootProvider";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const ROOT_URL =
    process.env.NEXT_PUBLIC_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000');

  return {
    title: 'Proof of Voice - Immortalize Your Voice on Base',
    description: minikitConfig.miniapp.description,
    keywords: ['voice', 'nft', 'base', 'farcaster', 'audio', 'humanity', 'proof-of-voice', 'blockchain', 'on-chain', 'voice analysis'],
    authors: [{ name: 'Proof of Voice' }],
    openGraph: {
      type: 'website',
      title: minikitConfig.miniapp.ogTitle || minikitConfig.miniapp.name,
      description: minikitConfig.miniapp.ogDescription || minikitConfig.miniapp.description,
      images: [minikitConfig.miniapp.ogImageUrl || `${ROOT_URL}/blue-hero.png`],
      url: ROOT_URL,
      siteName: 'Proof of Voice',
    },
    twitter: {
      card: 'summary_large_image',
      title: minikitConfig.miniapp.ogTitle || minikitConfig.miniapp.name,
      description: minikitConfig.miniapp.ogDescription || minikitConfig.miniapp.description,
      images: [minikitConfig.miniapp.ogImageUrl || `${ROOT_URL}/blue-hero.png`],
    },
    icons: {
      icon: minikitConfig.miniapp.iconUrl || `${ROOT_URL}/blue-icon.png`,
      apple: minikitConfig.miniapp.iconUrl || `${ROOT_URL}/blue-icon.png`,
    },
    metadataBase: new URL(ROOT_URL),
    other: {
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: minikitConfig.miniapp.heroImageUrl,
        button: {
          title: `Mint Your Voice on ${minikitConfig.miniapp.name}`,
          action: {
            name: `Launch ${minikitConfig.miniapp.name}`,
            type: "launch_frame",
          },
        },
      }),
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
          <SafeArea>{children}</SafeArea>
        </body>
      </html>
    </RootProvider>
  );
}
