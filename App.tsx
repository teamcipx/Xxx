
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { User, UserRole } from './types';
import { SupportWidget } from './components/SupportWidget';
import { AdsterraAd } from './components/AdsterraAd';
import { SocialBarAd } from './components/SocialBarAd';
import { UserBadge } from './components/UserBadge';
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

const AktiLogo = () => (
  <div className="flex items-center gap-3 group">
    <div className="relative">
      <div className="absolute -inset-1 bg-rose-600 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
      <div className="relative bg-slate-950 border border-rose-500/50 text-white w-10 h-10 rounded-xl font-black text-xl flex items-center justify-center shadow-2xl transform group-hover:rotate-6 transition-all">
        <span className="relative z-10">A</span>
        <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/20 to-transparent"></div>
      </div>
    </div>
    <div className="flex flex-col">
      <span className="font-black text-[12px] tracking-[0.2em] text-white uppercase leading-none">Akti <span className="text-rose-500">Elite</span></span>
      <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Signal Hub</span>
    </div>
  </div>
);

const MobileBottomNav: React.FC<{ activeUser: User | null }> = ({ activeUser }) => {
  const location = useLocation();
  if (!activeUser) return null;
  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] glass-effect border border-white/10 p-2 rounded-3xl flex items-center justify-around shadow-2xl">
      <Link to="/" className={`p-3 rounded-2xl transition-all ${isActive('/') ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
      </Link>
      <Link to="/chat" className={`p-3 rounded-2xl transition-all ${isActive('/chat') ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
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
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as User;
          const userEmail = (firebaseUser.email || '').trim().toLowerCase();
          if (userEmail === ADMIN_EMAIL.trim().toLowerCase() && data.role !== 'admin') {
            const updated = { ...data, role: 'admin', isPro: true };
            setCurrentUser(updated as User);
            await updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin', isPro: true });
          } else {
            setCurrentUser(data);
          }
        }
      } else { setCurrentUser(null); }
      setLoading(false);
    });
    
    return () => { unsubscribeSettings(); unsubscribeAuth(); };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-8">
      <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Syncing Akti Network</p>
    </div>
  );

  if (maintenanceMode && currentUser?.role !== 'admin') {
    return (
      <Router>
        <Routes><Route path="*" element={<MaintenanceView />} /></Routes>
      </Router>
    );
  }

  return (
    <Router>
      <SocialBarAd />
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <nav className="sticky top-0 z-40 glass-effect border-b border-white/5 px-6 py-4 flex items-center justify-between shadow-xl">
          <Link to="/"><AktiLogo /></Link>
          <div className="flex items-center gap-4">
            {currentUser ? (
               <div className="flex items-center gap-3">
                 {currentUser.role === 'admin' && <Link to="/admin" className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-[9px] font-black uppercase text-indigo-400">HQ</Link>}
                 <button onClick={() => signOut(auth)} className="p-2.5 bg-white/5 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-500 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                 </button>
               </div>
            ) : (
              <Link to="/auth" className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Login</Link>
            )}
          </div>
        </nav>
        
        <div className="flex-1 container mx-auto max-w-6xl px-4 py-8">
          <Routes>
            <Route path="/" element={currentUser ? <FeedView user={currentUser} /> : <Navigate to="/auth" />} />
            <Route path="/auth" element={!currentUser ? <AuthView /> : <Navigate to="/" />} />
            <Route path="/profile/:uid" element={currentUser ? <ProfileView activeUser={currentUser} /> : <Navigate to="/auth" />} />
            <Route path="/chat" element={currentUser ? <ChatView activeUser={currentUser} /> : <Navigate to="/auth" />} />
            <Route path="/chat/:chatId" element={currentUser ? <ChatView activeUser={currentUser} /> : <Navigate to="/auth" />} />
            <Route path="/pro" element={currentUser ? <UpgradeView activeUser={currentUser} /> : <Navigate to="/auth" />} />
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
