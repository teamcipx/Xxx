
import React, { useState } from 'react';
import { User } from '../types';

const UpgradeView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBinancePay = () => {
    setLoading(true);
    // Simulation of Binance Pay redirect or modal
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      // In a real app, you would verify transaction and update user role in DB
    }, 2000);
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto glass-effect rounded-3xl p-12 text-center space-y-6 shadow-2xl border border-amber-500/20 animate-fadeIn">
        <div className="bg-amber-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/50">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Welcome to Pro!</h2>
        <p className="text-slate-400">Your account has been upgraded successfully using Binance Pay. Enjoy exclusive badges and higher limits.</p>
        <button onClick={() => window.location.hash = '/'} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold transition-all">Back to Feed</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Elevate Your Presence</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">Get the most out of Akti Forum with Pro features. Support the community and stand out from the crowd.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-effect rounded-3xl p-8 border border-white/5 space-y-6">
          <h2 className="text-xl font-bold text-slate-200">Free Tier</h2>
          <ul className="space-y-4 text-slate-400">
            <li className="flex items-center gap-3"><svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> Basic Posting</li>
            <li className="flex items-center gap-3"><svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> Community Chat</li>
            <li className="flex items-center gap-3"><svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg> No Pro Badge</li>
          </ul>
          <div className="pt-8">
            <p className="text-2xl font-black text-slate-100">$0 <span className="text-sm font-normal text-slate-500">/ forever</span></p>
          </div>
        </div>

        <div className="glass-effect rounded-3xl p-8 border-2 border-amber-500/40 relative shadow-2xl shadow-amber-500/10 space-y-6 overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-bl-xl tracking-widest">Recommended</div>
          <h2 className="text-xl font-bold text-amber-500">Akti Pro</h2>
          <ul className="space-y-4 text-slate-300">
            <li className="flex items-center gap-3"><svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> Priority Feed Visibility</li>
            <li className="flex items-center gap-3"><svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> Exclusive Pro Badge</li>
            <li className="flex items-center gap-3"><svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> No Adsterra Ads</li>
            <li className="flex items-center gap-3"><svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> Advanced AI Bio Models</li>
          </ul>
          <div className="pt-8">
            <p className="text-2xl font-black text-slate-100">$9.99 <span className="text-sm font-normal text-slate-500">/ year</span></p>
          </div>
          <button
            onClick={handleBinancePay}
            disabled={loading}
            className={`w-full bg-[#F3BA2F] hover:bg-[#e2ac28] text-slate-900 font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#F3BA2F]/20 ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full"></div>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12.001 4.793l3.393 3.393-3.393 3.394-3.394-3.394L12.001 4.793zM18.788 8.186l3.394 3.394-3.394 3.393-3.393-3.393 3.393-3.394zm-13.575 0l3.393 3.394-3.393 3.393-3.394-3.393 3.394-3.394zm6.787 6.788l3.393 3.393-3.393 3.394-3.394-3.394 3.394-3.393z" /></svg>
                Pay with Binance
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeView;
