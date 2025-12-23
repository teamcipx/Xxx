
import React, { useState, useEffect } from 'react';
// Use namespace import and cast to any to resolve "no exported member" compiler errors
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM as any;

import { db } from '../services/firebase';
import { collection, getCountFromServer } from 'firebase/firestore';
import { User } from '../types';
import { AdsterraAd } from '../components/AdsterraAd';

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center group hover:border-white/10 transition-all">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${color} bg-opacity-10 text-opacity-100`}>
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{label}</p>
    <h3 className="text-4xl font-black text-white tracking-tighter">{value}</h3>
  </div>
);

const OverviewView: React.FC<{ activeUser: User | null }> = ({ activeUser }) => {
  const [stats, setStats] = useState({ nodes: 0, signals: 0, pulse: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const uSnap = await getCountFromServer(collection(db, 'users'));
        const pSnap = await getCountFromServer(collection(db, 'posts'));
        const cSnap = await getCountFromServer(collection(db, 'comments'));
        setStats({
          nodes: uSnap.data().count,
          signals: pSnap.data().count,
          pulse: cSnap.data().count
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-16 animate-fadeIn pb-24">
      {/* Hero Section */}
      <section className="text-center space-y-8 relative py-12">
        <div className="absolute inset-0 bg-rose-600/5 blur-[120px] rounded-full -z-10 animate-pulse"></div>
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-slate-900 border border-rose-500/20 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Global Network Online</span>
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter uppercase leading-[0.9]">
          Secure Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-700">Digital Signal</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
          Welcome to <span className="text-white font-bold">SecureH</span>. The elite hub for encrypted discussions, 
          real-time community sync, and high-performance social networking.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {activeUser ? (
            <Link to="/community" className="px-10 py-5 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-rose-600/40 hover:bg-rose-500 transition-all active:scale-95">
              Enter Community Wall
            </Link>
          ) : (
            <Link to="/auth" className="px-10 py-5 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-rose-600/40 hover:bg-rose-500 transition-all active:scale-95">
              Initialize Signal Link
            </Link>
          )}
          <a href="#about" className="px-10 py-5 bg-slate-900 text-slate-300 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-800 transition-all">
            Network Dossier
          </a>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Nodes" 
          value={loading ? "..." : stats.nodes} 
          color="bg-rose-500 text-rose-500"
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>}
        />
        <StatCard 
          label="Active Signals" 
          value={loading ? "..." : stats.signals} 
          color="bg-indigo-500 text-indigo-500"
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <StatCard 
          label="Community Pulse" 
          value={loading ? "..." : stats.pulse} 
          color="bg-amber-500 text-amber-500"
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
        />
      </section>

      <AdsterraAd id="overview-mid" />

      {/* About Section */}
      <section id="about" className="glass-effect rounded-[3rem] p-10 md:p-16 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px]"></div>
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
              About the <br />
              <span className="text-indigo-500">SecureH Protocol</span>
            </h2>
            <div className="space-y-6 text-slate-400 font-medium leading-relaxed">
              <p>
                SecureH is not just a forum; it's a decentralized thinking space designed for modern citizens who value high-fidelity communication and privacy.
              </p>
              <ul className="space-y-4">
                {[
                  "Military-grade UI/UX for elite performance.",
                  "Tier-based access ensures community quality.",
                  "Binance-integrated premium synchronization.",
                  "AI-driven identity calibration and support."
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-sm">
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="relative">
             <div className="aspect-square bg-slate-900/50 rounded-[3rem] border border-white/5 flex items-center justify-center p-8">
                <div className="w-full h-full border-4 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-6">
                   <div className="w-20 h-20 bg-rose-600/10 rounded-2xl flex items-center justify-center mb-6">
                      <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                   </div>
                   <h4 className="text-white font-black uppercase tracking-widest text-lg mb-2">Verified Ecosystem</h4>
                   <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">All transmissions are monitored for community safety.</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      <AdsterraAd id="overview-bottom" />
      
      <footer className="text-center py-10 border-t border-white/5">
         <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em]">
           &copy; {new Date().getFullYear()} SecureH Network Infrastructure
         </p>
      </footer>
    </div>
  );
};

export default OverviewView;
