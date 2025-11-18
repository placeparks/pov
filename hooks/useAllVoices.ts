import { useReadContract, usePublicClient } from 'wagmi';
import { type Address } from 'viem';
import { useState, useEffect } from 'react';

type ProofOfVoiceABI = readonly unknown[];

let ProofOfVoiceABI: ProofOfVoiceABI = [];
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ProofOfVoiceABI = require('../app/abis/ProofOfVoice.json') as ProofOfVoiceABI;
} catch {
  console.warn('ProofOfVoice ABI not found. Please create abis/ProofOfVoice.json');
}

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;

export interface VoiceFromContract {
  tokenId: number;
  word: string;
  category: string;
  emotion: string;
  humanityScore: number;
  timestamp: bigint;
  waveform: number[];
  owner?: string;
  svgImage?: string; // Base64 SVG image from tokenURI
}

export function useAllVoices() {
  const [voices, setVoices] = useState<VoiceFromContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  // First, get total supply
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ProofOfVoiceABI,
    functionName: 'totalSupply',
  });

  const totalSupplyNumber = totalSupply ? Number(totalSupply) : 0;

  // Fetch all voices when totalSupply is available
  useEffect(() => {
    // Check if contract address is valid
    if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000' || !CONTRACT_ADDRESS) {
      console.warn('Contract address not set. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local');
      setVoices([]);
      setIsLoading(false);
      return;
    }

    if (!totalSupplyNumber || totalSupplyNumber === 0) {
      setVoices([]);
      setIsLoading(false);
      return;
    }

    if (!publicClient) {
      // Wait for publicClient to be available
      setIsLoading(true);
      return;
    }

    const fetchAllVoices = async () => {
      setIsLoading(true);
      try {
        const tokenIds = Array.from({ length: totalSupplyNumber }, (_, i) => i + 1);
        
        // Fetch all voices in parallel
        const voicePromises = tokenIds.map(async (tokenId) => {
          try {
            // Fetch voice data
            const voiceData = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: ProofOfVoiceABI,
              functionName: 'voices',
              args: [BigInt(tokenId)],
            }) as readonly [
              audioData: `0x${string}`,
              word: string,
              category: string,
              emotion: string,
              humanityScore: number,
              timestamp: bigint,
              waveform?: number[]
            ];

            // Destructure the tuple
            const [
              audioData,
              word,
              category,
              emotion,
              humanityScore,
              timestamp,
              waveform
            ] = voiceData;

            // Fetch tokenURI to get the SVG image
            let svgImage: string | undefined;
            let owner: string | undefined;
            try {
              const tokenURI = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: ProofOfVoiceABI,
                functionName: 'tokenURI',
                args: [BigInt(tokenId)],
              }) as string;

              // Parse the base64 JSON from tokenURI
              // Format: "data:application/json;base64,{base64_json}"
              if (tokenURI && tokenURI.startsWith('data:application/json;base64,')) {
                const base64Json = tokenURI.replace('data:application/json;base64,', '');
                const jsonString = atob(base64Json);
                const metadata = JSON.parse(jsonString);
                
                // Extract SVG from image field
                // Format: "data:image/svg+xml;base64,{base64_svg}"
                if (metadata.image && metadata.image.startsWith('data:image/svg+xml;base64,')) {
                  svgImage = metadata.image; // Keep the full data URI for direct use
                }
              }
              
              // Fetch owner of the token
              try {
                owner = await publicClient.readContract({
                  address: CONTRACT_ADDRESS,
                  abi: ProofOfVoiceABI,
                  functionName: 'ownerOf',
                  args: [BigInt(tokenId)],
                }) as string;
              } catch (ownerError) {
                console.warn(`Could not fetch owner for token ${tokenId}:`, ownerError);
              }
            } catch (uriError) {
              console.warn(`Could not fetch tokenURI for token ${tokenId}:`, uriError);
            }

            console.log(`Voice ${tokenId} data:`, { word, category, emotion, humanityScore, timestamp });

            return {
              tokenId,
              word: word || 'Unknown',
              category: category || 'unknown',
              emotion: emotion || 'unknown',
              humanityScore: Number(humanityScore) || 0,
              timestamp: timestamp || BigInt(0),
              waveform: waveform || [],
              svgImage,
              owner: owner?.toLowerCase(),
            };
          } catch (error) {
            console.error(`Error fetching voice ${tokenId}:`, error);
            return null;
          }
        });

        const fetchedVoices = await Promise.all(voicePromises);
        const validVoices = fetchedVoices.filter((voice): voice is VoiceFromContract => voice !== null);
        
        // Sort by tokenId descending (newest first)
        validVoices.sort((a, b) => b.tokenId - a.tokenId);
        
        setVoices(validVoices);
      } catch (error) {
        console.error('Error fetching voices:', error);
        setVoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllVoices();
  }, [totalSupplyNumber, publicClient]);

  return {
    voices,
    totalSupply: totalSupplyNumber,
    isLoading,
  };
}

