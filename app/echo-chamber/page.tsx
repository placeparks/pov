"use client";

import { useAllVoices } from '../../hooks/useAllVoices';
import { Volume2, Users, Loader2, ArrowLeft, TrendingUp, Clock, Share2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useComposeCast } from '@coinbase/onchainkit/minikit';
import { useAccount } from 'wagmi';
import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect } from 'react';

function formatTimeAgo(timestamp: bigint): string {
  const now = Date.now();
  const then = Number(timestamp) * 1000;
  const diff = now - then;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}


export default function EchoChamber() {
  const { voices, totalSupply, isLoading } = useAllVoices();
  const { address } = useAccount();
  const { composeCastAsync } = useComposeCast();
  
  // Initialize Farcaster SDK
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        await sdk.actions.ready();
      } catch (error) {
        console.error('Error calling sdk.actions.ready():', error);
      }
    };
    initializeSDK();
  }, []);
  
  // Get current user's address (lowercase for comparison)
  const userAddress = address?.toLowerCase();
  
  const shareOnFarcaster = async (voice: typeof voices[0]) => {
    // Get the correct base URL - prefer production URL over localhost
    const getBaseUrl = () => {
      if (typeof window === 'undefined') {
        // Server-side: use environment variables
        return process.env.NEXT_PUBLIC_URL || 
               (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 
               (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'));
      }
      // Client-side: use window.location but prefer production URL from env if available
      const envUrl = process.env.NEXT_PUBLIC_URL;
      if (envUrl && !envUrl.includes('localhost')) {
        return envUrl;
      }
      return window.location.origin;
    };
    
    const baseUrl = getBaseUrl();
    // Use a dedicated NFT page URL that has proper meta tags for preview
    const tokenUrl: string = `${baseUrl}/nft/${voice.tokenId}`;
    
    // Simpler share text without special characters that might break encoding
    const shareText = `Just minted my Proof of Voice NFT!\n\n${voice.word} (${voice.category})\nHumanity Score: ${voice.humanityScore}%\n\n#ProofOfVoice #Base`;
    
    console.log('Share initiated for token:', voice.tokenId);
    console.log('Base URL:', baseUrl);
    console.log('Token URL:', tokenUrl);
    console.log('composeCastAsync available:', !!composeCastAsync);
    
    // Priority 1: Try OnchainKit's composeCastAsync (works in Farcaster frames)
    if (composeCastAsync) {
      try {
        // Include both the NFT page URL and the image URL for better preview
        const imageUrl = `${baseUrl}/api/nft-image/${voice.tokenId}`;
        console.log('Attempting to compose cast with:', { text: shareText, embeds: [tokenUrl, imageUrl] });
        
        const result = await composeCastAsync({
          text: shareText,
          embeds: [tokenUrl, imageUrl], // Include both page and image for better preview
        });
        
        console.log('Compose cast result:', result);
        
        if (result?.cast?.hash) {
          console.log('Cast created successfully via OnchainKit:', result.cast.hash);
          return;
        } else {
          console.log('No cast hash returned, user may have cancelled');
          // Don't return here, fall through to manual sharing
        }
      } catch (composeError) {
        console.error('OnchainKit compose failed with error:', composeError);
        // Fall through to manual sharing
      }
    } else {
      console.log('composeCastAsync not available, using manual sharing');
    }
    
    // Priority 2: Copy to clipboard and direct user to Warpcast
    // This is more reliable than trying to open with pre-filled text
    try {
      await navigator.clipboard.writeText(shareText);
      
      // Open Warpcast compose page (without pre-filled text to avoid encoding issues)
      window.open('https://warpcast.com/~/compose', '_blank');
      
      // Show success message
      alert('✅ Share text copied to clipboard!\n\nWarpcast is opening - just paste (Ctrl+V) to share your NFT.\n\nThe link will show your NFT image as a preview!');
      
      return;
    } catch (clipboardError) {
      console.error('Clipboard copy failed:', clipboardError);
    }
    
    // Priority 3: Fallback - show the text for manual copy
    const userConfirmed = confirm(
      'Share your NFT on Farcaster?\n\n' +
      'Click OK to open Warpcast, then paste this text:\n\n' +
      shareText.substring(0, 100) + '...'
    );
    
    if (userConfirmed) {
      // Store in textarea for easy copying
      const textarea = document.createElement('textarea');
      textarea.value = shareText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        document.body.removeChild(textarea);
        window.open('https://warpcast.com/~/compose', '_blank');
        alert('Text copied! Paste it in Warpcast to share.');
      } catch {
        document.body.removeChild(textarea);
        alert('Please copy this text manually:\n\n' + shareText);
        window.open('https://warpcast.com/~/compose', '_blank');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  The Echo Chamber
                </h1>
                <p className="text-sm text-gray-400">A hall of immortalized voices</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">{totalSupply}</div>
                <div className="text-xs text-gray-400">Voices Minted</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
              <p className="text-gray-400">Loading voices from the blockchain...</p>
            </div>
          </div>
        ) : voices.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <Volume2 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h2 className="text-2xl font-bold mb-2">The Chamber Awaits</h2>
              <p className="text-gray-400">
                No voices have been minted yet. Be the first to immortalize your voice on-chain.
              </p>
              <Link
                href="/"
                className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-medium hover:from-purple-500 hover:to-indigo-500 transition-all"
              >
                Mint Your Voice
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-sm text-gray-400">Average Score</div>
                    <div className="text-xl font-bold text-white">
                      {Math.round(
                        voices.reduce((sum, v) => sum + v.humanityScore, 0) / voices.length
                      )}
                      %
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-sm text-gray-400">Unique Categories</div>
                    <div className="text-xl font-bold text-white">
                      {new Set(voices.map((v) => v.category)).size}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="text-sm text-gray-400">Latest Voice</div>
                      <div className="text-xl font-bold text-white">
                        {voices[0] && formatTimeAgo(voices[0].timestamp)}
                      </div>
                    </div>
                </div>
              </div>
            </div>

            {/* Voices Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {voices.map((voice) => {
                return (
                  <div
                    key={voice.tokenId}
                    className="group relative hover:scale-[1.02] transition-all duration-300"
                  >
                    {/* NFT SVG Image */}
                    {voice.svgImage ? (
                      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/20 shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all">
                        <Image 
                          src={voice.svgImage} 
                          alt={`Proof of Voice #${voice.tokenId} - ${voice.word}`}
                          width={800}
                          height={800}
                          className="w-full h-auto"
                          unoptimized
                        />
                        {/* Share Button Overlay - Only show if user owns this NFT */}
                        {userAddress && voice.owner && userAddress === voice.owner && (
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => shareOnFarcaster(voice)}
                              className="bg-purple-600 hover:bg-purple-500 text-white rounded-full p-2.5 shadow-lg transition-all hover:scale-110"
                              title="Share your NFT on Farcaster"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Fallback if SVG not loaded yet
                      <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-2xl p-6">
                        <div className="text-center">
                          <div className="text-sm text-gray-400 mb-2">Loading NFT...</div>
                          <div className="text-2xl font-bold">{voice.word}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

