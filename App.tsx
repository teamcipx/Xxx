
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { User } from './types';
import { SupportWidget } from './components/SupportWidget';
import { SocialBarAd } from './components/SocialBarAd';
import FeedView from './views/FeedView';
import ProfileView from './views/ProfileView';
import ChatView from './views/ChatView';
import UpgradeView from './views/UpgradeView';
import AuthView from './views/AuthView';
import AdminView from './views/AdminView';
import MaintenanceView from './views/MaintenanceView';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';

const ADMIN_EMAIL = 'rakibulislamrovin@gmail.com';

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

const PendingApprovalView: React.FC<{ user: User }> = ({ user }) => (
  <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
    <div className="relative mb-12">
      <div className="absolute inset-0 bg-rose-600/20 blur-[100px] rounded-full animate-pulse"></div>
      <div className="relative bg-slate-900 border-4 border-rose-500/50 w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center shadow-2xl">
        <svg className="w-16 h-16 md:w-20 md:h-20 text-rose-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0112 3c1.72 0 3.347.433 4.775 1.2a10 10 0 014.472 8.528c0 2.304-.775 4.428-2.083 6.13M12 11c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6zm-6 2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
        </svg>
      </div>
    </div>
    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 uppercase">Identity <span className="text-rose-500">Scanning</span></h1>
    <p className="text-slate-400 max-w-md mx-auto font-medium leading-relaxed mb-8">
      Welcome, Citizen <span className="text-white font-bold">{user.displayName}</span>. Your dossier is being reviewed by SecureH High Command. Access will be granted once your signal is synchronized.
    </p>
    <div className="flex flex-col items-center gap-6">
      <div className="px-6 py-2 bg-slate-900 border border-rose-500/30 rounded-full inline-flex items-center gap-3">
        <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>
        <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">Verification In Progress</span>
      </div>
      <button onClick={() => signOut(auth)} className="text-slate-600 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Disconnect Signal</button>
    </div>
  </div>
);

const MobileBottomNav: React.FC<{ activeUser: User | null }> = ({ activeUser }) => {
  const location = useLocation();
  if (!activeUser || activeUser.accountStatus !== 'active') return null;
  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  const isPremium = activeUser.role !== 'user';

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] glass-effect border border-white/10 p-2 rounded-3xl flex items-center justify-around shadow-2xl">
      <Link to="/" className={`p-3 rounded-2xl transition-all ${isActive('/') ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </Link>
      <Link to={isPremium ? "/chat" : "/pro"} className={`p-3 rounded-2xl transition-all ${isActive('/chat') ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500'}`}>
        <div className="relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          {!isPremium && <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border border-slate-950"></div>}
        </div>
      </Link>
      <Link to="/pro" className={`p-3 rounded-2xl transition-all ${isActive('/pro') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </Link>
      <Link to={`/profile/${activeUser.uid}`} className={`p-1 rounded-2xl transition-all ${isActive(`/profile/${activeUser.uid}`) ? 'ring-2 ring-rose-500/50' : 'opacity-60'}`}>
        <img src={activeUser.photoURL} alt="p" className="w-9 h-9 rounded-xl object-cover" />
      </Link>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setMaintenanceMode(snapshot.data().maintenanceMode || false);
      }
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Setup real-time listener for current user to catch approval state changes immediately
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userRef, async (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data() as User;
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
    <Router>
      <SocialBarAd />
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <nav className="sticky top-0 z-40 glass-effect border-b border-white/5 px-6 py-4 flex items-center justify-between shadow-xl">
          <Link to="/"><SecureHLogo /></Link>
          
          {isApproved && (
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors">Overview</Link>
              <Link to={isPremium ? "/chat" : "/pro"} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2">
                Transmit
                {!isPremium && <span className="bg-amber-500 w-1 h-1 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>}
              </Link>
              <Link to="/pro" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-400 transition-colors">Elite</Link>
            </div>
          )}

          <div className="flex items-center gap-4">
            {currentUser ? (
               <div className="flex items-center gap-3">
                 {currentUser.role === 'admin' && <Link to="/admin" className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-[9px] font-black uppercase text-indigo-400 shadow-lg">HQ Terminal</Link>}
                 <div className="hidden sm:block">
                   <Link to={`/profile/${currentUser.uid}`} className="flex items-center gap-2 group">
                     <img src={currentUser.photoURL} className="w-8 h-8 rounded-lg object-cover ring-2 ring-white/5 group-hover:ring-rose-500/50 transition-all" alt="p" />
                     <span className="text-[10px] font-black text-slate-200 uppercase truncate max-w-[80px]">{currentUser.displayName}</span>
                   </Link>
                 </div>
                 <button onClick={() => signOut(auth)} className="p-2.5 bg-white/5 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-500 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                 </button>
               </div>
            ) : (
              <Link to="/auth" className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/30 transition-all active:scale-95">Link Citizen</Link>
            )}
          </div>
        </nav>
        
        <div className="flex-1 container mx-auto max-w-6xl px-4 py-8">
          <Routes>
            <Route path="/" element={
              currentUser ? (
                isApproved ? <FeedView user={currentUser} /> : <PendingApprovalView user={currentUser} />
              ) : <Navigate to="/auth" />
            } />
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
        <SupportWidget />
      </div>
    </Router>
  );
};

export default App;
