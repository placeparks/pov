import { Metadata } from 'next';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Props = {
  params: Promise<{ tokenId: string }>
}

// Contract ABI - minimal for fetching data
const contractABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'voices',
    outputs: [
      { name: 'audioData', type: 'bytes' },
      { name: 'word', type: 'string' },
      { name: 'category', type: 'string' },
      { name: 'emotion', type: 'string' },
      { name: 'humanityScore', type: 'uint8' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'waveform', type: 'uint16[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const CONTRACT_ADDRESS = (process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tokenId } = await params;
  const baseUrl = getBaseUrl();
  const nftImageUrl = `${baseUrl}/api/nft-image/${tokenId}`;
  
  // Try to fetch NFT data for better description
  let description = 'View this Proof of Voice NFT on Base';
  try {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      throw new Error('Contract address not configured');
    }
    
    const client = createPublicClient({
      chain: base,
      transport: http(),
    });
    
    const voiceData = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: 'voices',
      args: [BigInt(tokenId)],
    }) as readonly [unknown, string, string, string, number, bigint, number[]];
    
    const [, word, category, emotion, humanityScore] = voiceData;
    description = `${word} (${category}) - ${emotion} - Humanity Score: ${humanityScore}%`;
  } catch (error) {
    // Use default description if fetch fails
    console.warn('Could not fetch NFT data for metadata:', error);
  }
  
  return {
    title: `Proof of Voice #${tokenId}`,
    description,
    openGraph: {
      title: `Proof of Voice #${tokenId}`,
      description,
      images: [
        {
          url: nftImageUrl,
          width: 800,
          height: 800,
          alt: `Proof of Voice #${tokenId}`,
        },
      ],
      url: `${baseUrl}/nft/${tokenId}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Proof of Voice #${tokenId}`,
      description,
      images: [nftImageUrl],
    },
  };
}

export default async function NFTPage({ params }: Props) {
  const { tokenId } = await params;
  const baseUrl = getBaseUrl();
  
  // Fetch NFT data
  let voiceData: {
    word: string;
    category: string;
    emotion: string;
    humanityScore: number;
    timestamp: bigint;
  } | null = null;
  let svgImage: string | null = null;
  let error: string | null = null;
  
  try {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      throw new Error('Contract address not configured');
    }
    
    const client = createPublicClient({
      chain: base,
      transport: http(),
    });
    
    // Fetch voice data
    const data = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: 'voices',
      args: [BigInt(tokenId)],
    }) as readonly [unknown, string, string, string, number, bigint, number[]];
    
    const [, word, category, emotion, humanityScore, timestamp] = data;
    voiceData = { word, category, emotion, humanityScore, timestamp };
    
    // Fetch tokenURI for SVG
    const tokenURI = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    }) as string;
    
    if (tokenURI && tokenURI.startsWith('data:application/json;base64,')) {
      const base64Json = tokenURI.replace('data:application/json;base64,', '');
      const jsonString = Buffer.from(base64Json, 'base64').toString('utf-8');
      const metadata = JSON.parse(jsonString);
      
      if (metadata.image && metadata.image.startsWith('data:image/svg+xml;base64,')) {
        svgImage = metadata.image;
      }
    }
  } catch (err) {
    console.error('Error fetching NFT data:', err);
    error = 'Failed to load NFT data';
  }
  
  const imageUrl = `${baseUrl}/api/nft-image/${tokenId}`;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Link stays within Farcaster frame - no target="_blank" */}
        <Link
          href="/echo-chamber"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Echo Chamber</span>
        </Link>
        
        {error ? (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p className="text-gray-400">{error}</p>
          </div>
        ) : voiceData ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Proof of Voice #{tokenId}
            </h1>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* NFT Image */}
              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/20">
                {svgImage ? (
                  <Image
                    src={svgImage}
                    alt={`Proof of Voice #${tokenId} - ${voiceData.word}`}
                    width={800}
                    height={800}
                    className="w-full h-auto"
                    unoptimized
                  />
                ) : (
                  <Image
                    src={imageUrl}
                    alt={`Proof of Voice #${tokenId} - ${voiceData.word}`}
                    width={800}
                    height={800}
                    className="w-full h-auto"
                    unoptimized
                  />
                )}
              </div>
              
              {/* NFT Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-2">{voiceData.word}</h2>
                  <p className="text-gray-400 text-sm">Word</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">{voiceData.category}</h3>
                  <p className="text-gray-400 text-sm">Category</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">{voiceData.emotion}</h3>
                  <p className="text-gray-400 text-sm">Emotion</p>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-purple-400 mb-2">
                    {voiceData.humanityScore}%
                  </h3>
                  <p className="text-gray-400 text-sm">Humanity Score</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">
                    Minted: {new Date(Number(voiceData.timestamp) * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading NFT...</p>
          </div>
        )}
      </div>
    </div>
  );
}
