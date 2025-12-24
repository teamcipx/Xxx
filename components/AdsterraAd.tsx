
import React, { useEffect, useRef, useContext } from 'react';
import { UserContext } from '../App';

interface AdsterraAdProps {
  id: string;
  format?: 'banner' | 'native';
  className?: string;
}

export const AdsterraAd: React.FC<AdsterraAdProps> = ({ id, format = 'banner', className = "" }) => {
  const adRef = useRef<HTMLDivElement>(null);
  const { user } = useContext(UserContext);

  // No ads for non-basic users (Premium, Pro, Admin)
  const isPremium = user && user.role !== 'user';

  useEffect(() => {
    if (isPremium) return;
    if (adRef.current && !adRef.current.innerHTML.trim()) {
      const container = adRef.current;
      
      if (format === 'banner') {
        const scriptConfig = document.createElement('script');
        scriptConfig.type = 'text/javascript';
        
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
        const scriptNative = document.createElement('script');
        scriptNative.async = true;
        scriptNative.dataset.cfasync = "false";
        scriptNative.src = 'https://pl28318900.effectivegatecpm.com/15c7aafe095e6e54735bf87f23f68ef9/invoke.js';
        
        const adContainer = document.createElement('div');
        adContainer.id = 'container-15c7aafe095e6e54735bf87f23f68ef9';
        
        container.appendChild(adContainer);
        container.appendChild(scriptNative);
      }
    }
  }, [format, id, isPremium]);

  if (isPremium) return null;

  return (
    <div 
      className={`w-full flex justify-center my-6 overflow-hidden rounded-2xl bg-slate-900/40 p-3 border border-white/5 shadow-inner ${className}`} 
      ref={adRef}
    />
  );
};
