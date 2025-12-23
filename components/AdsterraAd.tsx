
import React, { useEffect, useRef } from 'react';

interface AdsterraAdProps {
  id: string;
  format?: 'banner' | 'native';
  className?: string;
}

export const AdsterraAd: React.FC<AdsterraAdProps> = ({ id, format = 'banner', className = "" }) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current && !adRef.current.innerHTML.trim()) {
      const container = adRef.current;
      
      if (format === 'banner') {
        const scriptConfig = document.createElement('script');
        scriptConfig.type = 'text/javascript';
        
        // 300x160 Banner
        const atOptions = {
          'key': '11d4ee8945e099177502bfb8765f669a',
          'format': 'iframe',
          'height': 300,
          'width': 160,
          'params': {}
        };

        scriptConfig.innerHTML = `atOptions = ${JSON.stringify(atOptions)};`;
        
        const scriptInvoke = document.createElement('script');
        scriptInvoke.type = 'text/javascript';
        scriptInvoke.src = 'https://www.highperformanceformat.com/11d4ee8945e099177502bfb8765f669a/invoke.js';
        
        container.appendChild(scriptConfig);
        container.appendChild(scriptInvoke);
      } else {
        // Native Container Ad
        const uniqueContainerId = `container-${id}-${Math.random().toString(36).substr(2, 9)}`;
        const adContainer = document.createElement('div');
        adContainer.id = uniqueContainerId;
        container.appendChild(adContainer);

        const scriptNative = document.createElement('script');
        scriptNative.async = true;
        scriptNative.dataset.cfasync = "false";
        scriptNative.src = 'https://pl28318900.effectivegatecpm.com/15c7aafe095e6e54735bf87f23f68ef9/invoke.js';
        
        // Ensure the ID matches what the script expects or just use the global one if it's fixed
        // Adsterra native scripts often target a specific fixed ID provided in their dashboard.
        const fixedContainerId = 'container-15c7aafe095e6e54735bf87f23f68ef9';
        adContainer.id = fixedContainerId;

        container.appendChild(scriptNative);
      }
    }
  }, [format, id]);

  return (
    <div 
      className={`w-full flex justify-center my-6 overflow-hidden rounded-2xl bg-slate-900/40 p-3 border border-white/5 shadow-inner ${className}`} 
      ref={adRef}
    />
  );
};
