'use client';

import { useEffect, useState } from 'react';

export function MiniAppWrapper({ children }: { children: React.ReactNode }) {
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    // Detect Base App / Farcaster Frame
    const isBaseApp = window.location.search.includes('baseApp=true') || 
                      window.navigator.userAgent.includes('BaseApp');
    const isFarcaster = window.location.search.includes('farcaster=true') ||
                        window.navigator.userAgent.includes('Farcaster');
    
    setIsMiniApp(isBaseApp || isFarcaster);

    if (isBaseApp || isFarcaster) {
      // Set viewport for mini app
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
  }, []);

  return <>{children}</>;
}


