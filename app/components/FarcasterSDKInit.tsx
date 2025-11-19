"use client";

import { useEffect } from 'react';
import { sdk } from "@farcaster/miniapp-sdk";

/**
 * Component that initializes the Farcaster SDK by calling sdk.actions.ready()
 * This should be included in the layout to ensure it runs on all pages
 */
export function FarcasterSDKInit() {
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Call Farcaster SDK ready() to dismiss splash screen
        await sdk.actions.ready();
      } catch (error) {
        // Silently fail if not in Farcaster context (e.g., regular browser)
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Error calling sdk.actions.ready():', error);
        }
      }
    };
    
    initializeSDK();
  }, []);

  // This component doesn't render anything
  return null;
}

