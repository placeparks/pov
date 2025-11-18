import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Your contract ABI - just the tokenURI function
const contractABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Your contract address from environment variable
const CONTRACT_ADDRESS = (process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;

    // Validate contract address
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      throw new Error('Contract address not configured');
    }

    // Create a public client to read from the blockchain
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    // Read the tokenURI from the contract
    const tokenURI = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    });

    // The tokenURI is a base64 encoded JSON with the SVG
    // Format: data:application/json;base64,{base64data}
    if (tokenURI.startsWith('data:application/json;base64,')) {
      const base64Data = tokenURI.replace('data:application/json;base64,', '');
      const jsonData = Buffer.from(base64Data, 'base64').toString('utf-8');
      const metadata = JSON.parse(jsonData);

      // Extract the SVG from the image field
      // Format: data:image/svg+xml;base64,{base64svg}
      const svgImage = metadata.image;

      if (svgImage && svgImage.startsWith('data:image/svg+xml;base64,')) {
        const svgBase64 = svgImage.replace('data:image/svg+xml;base64,', '');
        const svgContent = Buffer.from(svgBase64, 'base64').toString('utf-8');

        // Return the SVG with proper headers for Farcaster/Open Graph
        return new NextResponse(svgContent, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
          },
        });
      }
    }

    // Fallback: return a placeholder SVG
    const placeholderSVG = `
      <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="800" fill="#1a1a2e"/>
        <text x="400" y="400" font-family="Arial" font-size="48" fill="#ffffff" text-anchor="middle">
          Proof of Voice #${tokenId}
        </text>
      </svg>
    `;

    return new NextResponse(placeholderSVG, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('Error fetching NFT image:', error);

    // Return error SVG
    const errorSVG = `
      <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="800" fill="#ff0000"/>
        <text x="400" y="400" font-family="Arial" font-size="32" fill="#ffffff" text-anchor="middle">
          Error loading NFT
        </text>
      </svg>
    `;

    return new NextResponse(errorSVG, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
      status: 500,
    });
  }
}
