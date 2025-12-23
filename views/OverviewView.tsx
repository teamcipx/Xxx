
import React, { useState, useEffect } from 'react';
// Use namespace import and cast to any to resolve "no exported member" compiler errors
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM as any;

import { db } from '../services/firebase';
import { collection, getCountFromServer } from 'firebase/firestore';
import { User } from '../types';
import { AdsterraAd } from '../components/AdsterraAd';

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center group hover:border-white/10 transition-all">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${color} bg-opacity-10 text-opacity-100`}>
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{label}</p>
    <h3 className="text-4xl font-black text-white tracking-tighter">{value}</h3>
  </div>
);

const OverviewView: React.FC<{ activeUser: User | null }> = ({ activeUser }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-16 animate-fadeIn pb-24">
      {/* Hero Section */}
      <section className="text-center space-y-8 relative py-12">
        <div className="absolute inset-0 bg-rose-600/5 blur-[120px] rounded-full -z-10 animate-pulse"></div>
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-slate-900 border border-rose-500/20 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Protocol 3.0 Active</span>
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter uppercase leading-[0.9]">
          The Global <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-700">SecureH Web</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
          High-performance networking with <span className="text-white font-bold">Zero VPN dependency</span>. 
          Military-grade encryption for the 42 synchronized nations. We operate under three unique transmission protocols.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {activeUser ? (
            <Link to="/community" className="px-10 py-5 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-rose-600/40 hover:bg-rose-500 transition-all active:scale-95">
              Access Community Grid
            </Link>
          ) : (
            <Link to="/auth" className="px-10 py-5 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-rose-600/40 hover:bg-rose-500 transition-all active:scale-95">
              Initialize My Node
            </Link>
          )}
          <a href="#about" className="px-10 py-5 bg-slate-900 text-slate-300 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-800 transition-all">
            Security Dossier
          </a>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Nations Online" 
          value="42" 
          color="bg-emerald-500 text-emerald-500"
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a1 1 0 011 1v1a2 2 0 01-2 2h-1m-5 3h.5a2 2 0 002-2V19a2 2 0 012-2h1a2 2 0 002-2v-1a2 2 0 012-2h2.5M12 21a9 9 0 110-18 9 9 0 010 18z" /></svg>}
        />
        <StatCard 
          label="Active Citizens" 
          value="3.9K" 
          color="bg-rose-500 text-rose-500"
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard 
          label="Signal History" 
          value="8.6K" 
          color="bg-indigo-500 text-indigo-500"
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
        />
        <StatCard 
          label="Visual Streams" 
          value="1.6K" 
          color="bg-amber-500 text-amber-500"
          icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
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
                SecureH is a decentralized community infrastructure designed for absolute privacy. We prioritize your signal's integrity over everything else.
              </p>
              <ul className="space-y-4">
                {[
                  "No VPN Required: Connect globally without bypass tools.",
                  "End-to-End Encryption: Complete signal protection.",
                  "No Admin Access: Even High Command cannot view private data.",
                  "42 Nations Synchronized: A truly borderless web.",
                  "Three Security Protocols: Triple-layered transmission safety."
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-sm">
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                    <span className="font-bold text-slate-200">{item}</span>
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
                   <h4 className="text-white font-black uppercase tracking-widest text-lg mb-2">Immutable Privacy</h4>
                   <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No backdoors. No admin intrusion. Pure encryption.</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      <AdsterraAd id="overview-bottom" />
      
      <footer className="text-center py-10 border-t border-white/5">
         <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em]">
           &copy; {new Date().getFullYear()} SecureH Network Infrastructure | 42 Nodes Active
         </p>
      </footer>
    </div>
  );
};

export default OverviewView;
