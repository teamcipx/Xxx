
import React, { useEffect, useRef } from 'react';

interface AdsterraAdProps {
  id?: string;
  format?: 'banner' | 'native';
}

export const AdsterraAd: React.FC<AdsterraAdProps> = ({ id = 'default', format = 'banner' }) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current && !adRef.current.dataset.loaded) {
      const script1 = document.createElement('script');
      script1.type = 'text/javascript';
      
      // Using the user-provided key for the 468x60 banner
      const atOptions = {
        'key' : '9871707d25714d44e7b578d21cc3ff37',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };

      script1.innerHTML = `atOptions = ${JSON.stringify(atOptions)};`;
      
      const script2 = document.createElement('script');
      script2.type = 'text/javascript';
      script2.src = 'https://www.highperformanceformat.com/9871707d25714d44e7b578d21cc3ff37/invoke.js';
      
      adRef.current.appendChild(script1);
      adRef.current.appendChild(script2);
      adRef.current.dataset.loaded = "true";
    }
  }, []);

  return (
    <div 
      className="w-full flex justify-center my-4 overflow-hidden rounded-xl bg-slate-900/40 p-2 min-h-[70px] border border-white/5" 
      ref={adRef}
    >
      {/* Adsterra script will render iframe here */}
    </div>
  );
};
