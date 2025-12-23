
import React from 'react';

const MaintenanceView: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-fadeIn relative overflow-hidden">
      {/* Background Video Overlay */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="w-full h-full object-cover"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-circuit-board-1070-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-slate-950/60"></div>
      </div>

      <div className="relative z-10">
        <div className="relative mb-12 flex justify-center">
          <div className="absolute inset-0 bg-indigo-600/20 blur-[100px] rounded-full"></div>
          <div className="relative bg-slate-900 border border-white/10 w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-3">
            <svg className="w-12 h-12 md:w-16 md:h-16 text-indigo-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 uppercase">
          Signal <span className="text-indigo-500">Offline</span>
        </h1>
        
        <div className="space-y-4 mb-8">
          <p className="text-rose-500 font-black uppercase text-xs tracking-widest">
            There was an unexpected error. Finish what you were doing.
          </p>
          <p className="text-slate-400 max-w-md mx-auto font-medium leading-relaxed">
            The SecureH High Command is currently recalibrating the network nodes. Normal transmission will resume shortly.
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="px-6 py-2 bg-slate-900 border border-indigo-500/30 rounded-full inline-flex items-center gap-3">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Maintenance Mode Active</span>
          </div>
          
          <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest mt-12">
            &copy; {new Date().getFullYear()} SecureH Forum Network
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceView;
