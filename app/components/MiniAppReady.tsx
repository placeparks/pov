'use client';

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export function MiniAppReady() {
  useEffect(() => {
    const boot = async () => {
      try {
        // Only signal ready when actually running as a mini app
        const inMiniApp = await sdk.isInMiniApp();
        if (inMiniApp) {
          await sdk.actions.ready();
        }
      } catch (e) {
        console.error('Mini app ready() failed', e);
      }
    };

    void boot();
  }, []);

  return null;
}
