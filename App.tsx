
import React, { useState, useEffect, createContext, useContext } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { BrowserRouter: Router, Routes, Route, Link, useNavigate, useLocation, Navigate } = ReactRouterDOM as any;

import { User, Language } from './types';
import { SocialBarAd } from './components/SocialBarAd';
import FeedView from './views/FeedView';
import ProfileView from './views/ProfileView';
import ChatView from './views/ChatView';
import UpgradeView from './views/UpgradeView';
import AuthView from './views/AuthView';
import AdminView from './views/AdminView';
import OverviewView from './views/OverviewView';
import MaintenanceView from './views/MaintenanceView';
import VideoView from './views/VideoView';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';

const ADMIN_EMAIL = 'rakibulislamrovin@gmail.com';
const TELEGRAM_SUPPORT = 'https://t.me/securehx';

// --- Translation Dictionary ---
const translations = {
  en: {
    home: "Overview",
    community: "Community",
    streams: "Streams",
    chat: "Transmit",
    elite: "Elite",
    hq: "HQ Terminal",
    link: "Link Citizen",
    identity: "Identity Scanning",
    review: "Your dossier is being reviewed by SecureH High Command. Access will be granted once your signal is synchronized.",
    verification: "Verification In Progress",
    support: "Contact Support via Telegram",
    disconnect: "Disconnect Signal",
    establishing: "Establishing Signal Link",
    welcome: "Welcome, Citizen",
    profile: "Profile Node",
    logout: "Exit Grid",
    menu: "Signal Menu",
    protocolActive: "Protocol 3.0 Active",
    heroTitle: "The Global SecureH Web",
    heroSub: "High-performance networking with Zero VPN dependency. Military-grade encryption for the 42 synchronized nations.",
    accessGrid: "Access Community Grid",
    initNode: "Initialize My Node",
    dossier: "Security Dossier",
    statNations: "Nations Online",
    statCitizens: "Active Citizens",
    statSignals: "Signal History",
    statStreams: "Visual Streams",
    aboutTitle: "About the SecureH Protocol",
    aboutText: "SecureH is a decentralized community infrastructure designed for absolute privacy. We prioritize your signal's integrity over everything else.",
    aboutFeature1: "No VPN Required: Connect globally without bypass tools.",
    aboutFeature2: "End-to-End Encryption: Complete signal protection.",
    aboutFeature3: "No Admin Access: Even High Command cannot view private data.",
    aboutFeature4: "42 Nations Synchronized: A truly borderless web.",
    aboutFeature5: "Three Security Protocols: Triple-layered transmission safety.",
    immutablePrivacy: "Immutable Privacy",
    noBackdoors: "No backdoors. No admin intrusion. Pure encryption.",
    copyright: "SecureH Network Infrastructure | 42 Nodes Active"
  },
  bn: {
    home: "এক নজরে",
    community: "কমিউনিটি",
    streams: "ভিডিও",
    chat: "বার্তা প্রেরণ",
    elite: "এলিট",
    hq: "হেডকোয়ার্টার",
    link: "নাগরিক সংযোগ",
    identity: "পরিচয় স্ক্যানিং",
    review: "আপনার ডসিয়ার সিকিউরএইচ হাই কমান্ড দ্বারা পর্যালোচনা করা হচ্ছে। আপনার সিগন্যাল সিনক্রোনাইজ হয়ে গেলে অ্যাক্সেস দেওয়া হবে।",
    verification: "ভেরিফিকেশন চলছে",
    support: "টেলিগ্রামের মাধ্যমে সহায়তা নিন",
    disconnect: "সিগন্যাল বিচ্ছিন্ন করুন",
    establishing: "সিগন্যাল লিঙ্ক স্থাপন করা হচ্ছে",
    welcome: "স্বাগতম, নাগরিক",
    profile: "প্রোফাইল নোড",
    logout: "লগআউট",
    menu: "মেনু",
    protocolActive: "প্রোটোকল ৩.০ সক্রিয়",
    heroTitle: "গ্লোবাল সিকিউরএইচ ওয়েব",
    heroSub: "জিরো ভিপিএন নির্ভরতা সহ উচ্চ-ক্ষমতাসম্পন্ন নেটওয়ার্কিং। ৪২টি সিঙ্ক্রোনাইজড জাতির জন্য মিলিটারী-গ্রেড এনক্রিপশন।",
    accessGrid: "কমিউনিটি গ্রিডে প্রবেশ করুন",
    initNode: "আমার নোড শুরু করুন",
    dossier: "সিকিউরিটি ডসিয়ার",
    statNations: "অনলাইন দেশসমূহ",
    statCitizens: "সক্রিয় নাগরিক",
    statSignals: "সিগন্যাল ইতিহাস",
    statStreams: "ভিজ্যুয়াল স্ট্রিমস",
    aboutTitle: "সিকিউরএইচ প্রোটোকল সম্পর্কে",
    aboutText: "সিকিউরএইচ একটি বিকেন্দ্রেভূত কমিউনিটি অবকাঠামো যা সম্পূর্ণ গোপনীয়তার জন্য ডিজাইন করা হয়েছে। আমরা আপনার সিগন্যালের অখণ্ডতাকে সবকিছুর উপরে গুরুত্ব দেই।",
    aboutFeature1: "কোন ভিপিএন প্রয়োজন নেই: বাইপাস টুল ছাড়াই বিশ্বব্যাপী সংযোগ করুন।",
    aboutFeature2: "এন্ড-টু-এন্ড এনক্রিপশন: সম্পূর্ণ সিগন্যাল সুরক্ষা।",
    aboutFeature3: "অ্যাডমিন অ্যাক্সেস নেই: এমনকি হাই কমান্ডও ব্যক্তিগত ডেটা দেখতে পারে না।",
    aboutFeature4: "৪২টি জাতি সিঙ্ক্রোনাইজড: একটি সত্যিকারের সীমানাহীন ওয়েব।",
    aboutFeature5: "তিনটি নিরাপত্তা প্রোটোকল: ট্রিপল-লেয়ার ট্রান্সমিশন নিরাপত্তা।",
    immutablePrivacy: "অপরিবর্তনীয় গোপনীয়তা",
    noBackdoors: "কোন ব্যাকডোর নেই। কোন অ্যাডমিন অনুপ্রবেশ নেই। খাঁটি এনক্রিপশন।",
    copyright: "সিকিউরএইচ নেটওয়ার্ক অবকাঠামো | ৪২টি নোড সক্রিয়"
  }
};

type LangContextType = {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
};

const LangContext = createContext<LangContextType | undefined>(undefined);
export const UserContext = createContext<{ user: User | null }>({ user: null });

export const useLang = () => {
  const context = useContext(LangContext);
  if (!context) throw new Error("useLang must be used within LangProvider");
  return context;
};

const SecureHLogo = () => (
  <div className="flex items-center gap-3 group">
    <div className="relative">
      <div className="absolute -inset-1 bg-rose-600 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
      <div className="relative bg-slate-950 border border-rose-500/50 text-white w-10 h-10 rounded-xl font-black text-xl flex items-center justify-center shadow-2xl transform group-hover:rotate-6 transition-all">
        <span className="relative z-10">S</span>
        <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/20 to-transparent"></div>
      </div>
    </div>
    <div className="flex flex-col">
      <span className="font-black text-[12px] tracking-[0.2em] text-white uppercase leading-none">Secure<span className="text-rose-500">H</span></span>
      <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Signal Hub</span>
    </div>
  </div>
);

const LanguageSwitcher = () => {
  const { lang, setLang } = useLang();
  return (
    <div className="flex bg-slate-900/80 rounded-2xl p-1 border border-white/5 backdrop-blur-md shadow-inner">
      <button 
        onClick={() => setLang('en')} 
        className={`px-3 py-1.5 text-[9px] font-black rounded-xl transition-all ${lang === 'en' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'text-slate-500 hover:text-slate-300'}`}
      >
        EN
      </button>
      <button 
        onClick={() => setLang('bn')} 
        className={`px-3 py-1.5 text-[9px] font-black rounded-xl transition-all ${lang === 'bn' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'text-slate-500 hover:text-slate-300'}`}
      >
        BN
      </button>
    </div>
  );
};

const TelegramSupportButton = () => (
  <a 
    href={TELEGRAM_SUPPORT} 
    target="_blank" 
    rel="noreferrer"
    className="fixed bottom-24 md:bottom-6 right-6 z-50 bg-[#229ED9] hover:bg-[#229ED9]/80 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110 flex items-center justify-center border border-white/20"
    title="Telegram Support"
  >
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.38-.49 1.04-.74 4.06-1.77 6.76-2.93 8.11-3.47 3.84-1.54 4.63-1.81 5.15-1.82.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.13-.02.19z"/>
    </svg>
  </a>
);

const MobileDrawer: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  user: User | null; 
  t: (k: any) => string;
  isApproved: boolean;
  isPremium: boolean;
}> = ({ isOpen, onClose, user, t, isApproved, isPremium }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] md:hidden">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      <div className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-white/10 shadow-2xl p-8 flex flex-col animate-slideIn">
        <div className="flex items-center justify-between mb-8">
          <SecureHLogo />
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-8 p-1 border-b border-white/5 pb-6">
           <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] mb-3">Signal Dialect</p>
           <LanguageSwitcher />
        </div>

        {user ? (
          <div className="flex-1 flex flex-col gap-6">
            <Link to={`/profile/${user.uid}`} onClick={onClose} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-rose-600/10 transition-all">
              <img src={user.photoURL} className="w-12 h-12 rounded-xl object-cover ring-2 ring-rose-500/50" alt="p" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white uppercase truncate">{user.displayName}</p>
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">{user.role}</p>
              </div>
            </Link>

            <nav className="flex flex-col gap-2">
              <Link to="/" onClick={onClose} className="p-4 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-500 flex items-center gap-4 transition-all">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                {t('home')}
              </Link>
              {isApproved && (
                <>
                  <Link to="/community" onClick={onClose} className="p-4 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-500 flex items-center gap-4 transition-all">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    {t('community')}
                  </Link>
                  <Link to="/video" onClick={onClose} className="p-4 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-500 flex items-center gap-4 transition-all">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    {t('streams')}
                  </Link>
                  <Link to={isPremium ? "/chat" : "/pro"} onClick={onClose} className="p-4 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-indigo-400 flex items-center gap-4 transition-all">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    {t('chat')}
                  </Link>
                </>
              )}
              <Link to="/pro" onClick={onClose} className="p-4 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-amber-400 flex items-center gap-4 transition-all">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {t('elite')}
              </Link>
              {user.role === 'admin' && (
                 <Link to="/admin" onClick={onClose} className="p-4 text-[11px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 flex items-center gap-4 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2-2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                    {t('hq')}
                 </Link>
              )}
            </nav>

            <div className="mt-auto flex flex-col gap-4">
              <button onClick={() => { signOut(auth); onClose(); }} className="w-full py-4 bg-slate-950 border border-red-500/30 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                {t('logout')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">Identity node not detected. Please link to established signal.</p>
            <Link to="/auth" onClick={onClose} className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-600/30">
              {t('link')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const PendingApprovalView: React.FC<{ user: User }> = ({ user }) => {
  const { t } = useLang();
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-rose-600/20 blur-[100px] rounded-full animate-pulse"></div>
        <div className="relative bg-slate-900 border-4 border-rose-500/50 w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center shadow-2xl">
          <svg className="w-16 h-16 md:w-20 md:h-20 text-rose-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0112 3c1.72 0 3.347.433 4.775 1.2a10 10 0 014.472 8.528c0 2.304-.775 4.428-2.083 6.13M12 11c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6-2.686 6-6 6-6-2.686-6-6zm-6 2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3-3-3 3 1.343 3 3z" />
          </svg>
        </div>
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 uppercase">{t('identity')}</h1>
      <p className="text-slate-400 max-w-md mx-auto font-medium leading-relaxed mb-8">
        {t('welcome')} <span className="text-white font-bold">{user.displayName}</span>. {t('review')}
      </p>
      <div className="flex flex-col items-center gap-6">
        <div className="px-6 py-2 bg-slate-900 border border-rose-500/30 rounded-full inline-flex items-center gap-3">
          <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">{t('verification')}</span>
        </div>
        <a href={TELEGRAM_SUPPORT} target="_blank" rel="noreferrer" className="text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:underline">{t('support')}</a>
        <button onClick={() => signOut(auth)} className="text-slate-600 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">{t('disconnect')}</button>
      </div>
    </div>
  );
};

const MobileBottomNav: React.FC<{ activeUser: User | null }> = ({ activeUser }) => {
  const location = useLocation();
  if (!activeUser || activeUser.accountStatus !== 'active') return null;
  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  
  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] glass-effect border border-white/10 p-2 rounded-3xl flex items-center justify-around shadow-2xl">
      <Link to="/" className={`p-3 rounded-2xl transition-all ${isActive('/') ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
      </Link>
      <Link to="/community" className={`p-3 rounded-2xl transition-all ${isActive('/community') ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </Link>
      <Link to="/video" className={`p-3 rounded-2xl transition-all ${isActive('/video') ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      </Link>
      <Link to="/chat" className={`p-3 rounded-2xl transition-all ${isActive('/chat') ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
      </Link>
      <Link to="/pro" className={`p-3 rounded-2xl transition-all ${isActive('/pro') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </Link>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setMaintenanceMode(snapshot.data().maintenanceMode || false);
      }
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userRef, async (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data() as User;
            if (data.language) setLang(data.language);
            const userEmail = (firebaseUser.email || '').trim().toLowerCase();
            if (userEmail === ADMIN_EMAIL.trim().toLowerCase() && (data.role !== 'admin' || data.accountStatus !== 'active')) {
              const updated = { ...data, role: 'admin', isPro: true, accountStatus: 'active' };
              setCurrentUser(updated as User);
              await updateDoc(userRef, { role: 'admin', isPro: true, accountStatus: 'active' });
            } else {
              setCurrentUser(data);
            }
          }
          setLoading(false);
        });
        return () => unsubscribeUser();
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    
    return () => { unsubscribeSettings(); unsubscribeAuth(); };
  }, []);

  const t = (key: keyof typeof translations['en']) => translations[lang][key] || key;

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-8">
      <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-rose-600/20"></div>
      <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Establishing Signal Link</p>
    </div>
  );

  if (maintenanceMode && currentUser?.role !== 'admin') {
    return (
      <Router>
        <Routes><Route path="*" element={<MaintenanceView />} /></Routes>
      </Router>
    );
  }

  const isApproved = currentUser?.accountStatus === 'active' || currentUser?.role === 'admin';
  const isPremium = currentUser?.role !== 'user';

  return (
    <UserContext.Provider value={{ user: currentUser }}>
      <LangContext.Provider value={{ lang, setLang, t }}>
        <Router>
          <SocialBarAd />
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            <nav className="sticky top-0 z-40 glass-effect border-b border-white/5 px-6 py-4 flex items-center justify-between shadow-xl">
              <Link to="/"><SecureHLogo /></Link>
              
              <div className="hidden md:flex items-center gap-8">
                <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors">{t('home')}</Link>
                {isApproved && (
                  <>
                    <Link to="/community" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors">{t('community')}</Link>
                    <Link to="/video" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors">{t('streams')}</Link>
                    <Link to={isPremium ? "/chat" : "/pro"} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2">
                      {t('chat')}
                      {!isPremium && <span className="bg-amber-500 w-1 h-1 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>}
                    </Link>
                  </>
                )}
                <Link to="/pro" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-400 transition-colors">{t('elite')}</Link>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex">
                   <LanguageSwitcher />
                </div>

                {currentUser ? (
                   <div className="flex items-center gap-3">
                     {currentUser.role === 'admin' && <Link to="/admin" className="hidden lg:block px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-[9px] font-black uppercase text-indigo-400 shadow-lg">{t('hq')}</Link>}
                     <div className="hidden sm:block">
                       <Link to={`/profile/${currentUser.uid}`} className="flex items-center gap-2 group">
                         <img src={currentUser.photoURL} className="w-8 h-8 rounded-lg object-cover ring-2 ring-white/5 group-hover:ring-rose-500/50 transition-all" alt="p" />
                         <span className="text-[10px] font-black text-slate-200 uppercase truncate max-w-[80px]">{currentUser.displayName}</span>
                       </Link>
                     </div>
                     <button onClick={() => signOut(auth)} className="hidden sm:block p-2.5 bg-white/5 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-500 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                     </button>
                     <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-3 bg-slate-900 border border-white/5 rounded-xl text-slate-400 hover:text-rose-500 transition-all shadow-lg active:scale-95">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                     </button>
                   </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link to="/auth" className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/30 transition-all active:scale-95">{t('link')}</Link>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-3 bg-slate-900 border border-white/5 rounded-xl text-slate-400 hover:text-rose-500 transition-all shadow-lg active:scale-95">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                     </button>
                  </div>
                )}
              </div>
            </nav>
            
            <div className="flex-1 container mx-auto max-w-6xl px-4 py-8">
              <Routes>
                <Route path="/" element={<OverviewView activeUser={currentUser} />} />
                <Route path="/community" element={currentUser ? (isApproved ? <FeedView user={currentUser} /> : <PendingApprovalView user={currentUser} />) : <Navigate to="/auth" />} />
                <Route path="/video" element={currentUser ? (isApproved ? <VideoView user={currentUser} /> : <PendingApprovalView user={currentUser} />) : <Navigate to="/auth" />} />
                <Route path="/auth" element={!currentUser ? <AuthView /> : <Navigate to="/" />} />
                <Route path="/profile/:uid" element={currentUser ? (isApproved ? <ProfileView activeUser={currentUser} /> : <PendingApprovalView user={currentUser} />) : <Navigate to="/auth" />} />
                <Route path="/chat" element={currentUser ? (isApproved ? (isPremium ? <ChatView activeUser={currentUser} /> : <Navigate to="/pro" />) : <PendingApprovalView user={currentUser} />) : <Navigate to="/auth" />} />
                <Route path="/chat/:chatId" element={currentUser ? (isApproved ? (isPremium ? <ChatView activeUser={currentUser} /> : <Navigate to="/pro" />) : <PendingApprovalView user={currentUser} />) : <Navigate to="/auth" />} />
                <Route path="/pro" element={currentUser ? (isApproved ? <UpgradeView activeUser={currentUser} /> : <PendingApprovalView user={currentUser} />) : <Navigate to="/auth" />} />
                <Route path="/admin" element={currentUser?.role === 'admin' ? <AdminView activeUser={currentUser} /> : <Navigate to="/" />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>

            <MobileBottomNav activeUser={currentUser} />
            <TelegramSupportButton />
            
            <MobileDrawer 
              isOpen={isMobileMenuOpen} 
              onClose={() => setIsMobileMenuOpen(false)} 
              user={currentUser} 
              t={t} 
              isApproved={isApproved}
              isPremium={isPremium}
            />
          </div>
        </Router>
      </LangContext.Provider>
    </UserContext.Provider>
  );
};

export default App;
