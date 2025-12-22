
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
import { doc, getDoc, collection, query, orderBy, startAt, endAt, limit, getDocs, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';

const ADMIN_EMAIL = 'rakibulislamrovin@gmail.com';

const MobileBottomNav: React.FC<{ activeUser: User | null }> = ({ activeUser }) => {
  const location = useLocation();
  if (!activeUser) return null;

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] glass-effect border border-white/10 p-2 rounded-[2rem] flex items-center justify-around shadow-2xl backdrop-blur-2xl">
      <Link to="/" className={`flex flex-col items-center p-3 rounded-2xl transition-all ${isActive('/') ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
      </Link>
      <Link to="/chat" className={`flex flex-col items-center p-3 rounded-2xl transition-all ${isActive('/chat') ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
      </Link>
      <Link to="/pro" className={`flex flex-col items-center p-3 rounded-2xl transition-all ${isActive('/pro') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-1.14-10.49c1.066 1.406 1.63 3.12 1.63 4.919V17m0 0a1.65 1.65 0 001.747-1.616l.162-4.108c.038-1.01.21-2.02.512-3m-.512 3a4.05 4.05 0 01-.512-3m.512 3c1.55 4.108 1.71 8.216.512 12.324" /></svg>
      </Link>
      <Link to={`/profile/${activeUser.uid}`} className={`flex flex-col items-center p-1 rounded-2xl transition-all ${isActive(`/profile/${activeUser.uid}`) ? 'ring-2 ring-rose-500/50' : 'opacity-60'}`}>
        <img src={activeUser.photoURL} alt="p" className="w-9 h-9 rounded-xl object-cover" />
      </Link>
    </div>
  );
};

const Navbar: React.FC<{ activeUser: User | null }> = ({ activeUser }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('displayName'),
          startAt(searchQuery),
          endAt(searchQuery + '\uf8ff'),
          limit(5)
        );
        const snapshot = await getDocs(q);
        setSearchResults(snapshot.docs.map(doc => doc.data() as User));
      } catch (e) {}
    };
    const timeout = setTimeout(performSearch, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  return (
    <nav className="sticky top-0 z-40 glass-effect border-b border-white/10 px-6 py-3 flex items-center justify-between gap-4 h-20 shadow-2xl">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-rose-600 text-white w-10 h-10 rounded-[1.2rem] font-black text-xl flex items-center justify-center shadow-lg shadow-rose-600/30 transform group-hover:rotate-6 transition-transform">A</div>
          <span className="font-black text-xs hidden sm:block tracking-[0.2em] text-white uppercase">Akti <span className="text-rose-500">Elite</span></span>
        </Link>
      </div>

      {activeUser && (
        <div className="flex-1 max-w-sm relative" ref={searchRef}>
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Locate Signal..."
              className="w-full bg-slate-900/80 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all placeholder:text-slate-700"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-600 group-focus-within:text-rose-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-slate-900/95 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-fadeIn backdrop-blur-3xl z-50">
              <div className="p-3 space-y-2">
                {searchResults.map((user) => (
                  <button key={user.uid} onClick={() => { setSearchQuery(''); navigate(`/profile/${user.uid}`); }} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-all text-left group">
                    <img src={user.photoURL} alt="u" className="w-10 h-10 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-rose-500/30 transition-all" />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">{user.displayName}</p>
                          {user.isVerified && <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
                        </div>
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter mt-0.5">{user.role} Member</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        {activeUser ? (
           <div className="flex items-center gap-3">
             <Link to="/pro" className="hidden sm:flex px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-[9px] font-black uppercase text-amber-500 transition-all">Go Pro</Link>
             <button onClick={async () => { await signOut(auth); navigate('/auth'); }} className="p-2.5 bg-white/5 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-500 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             </button>
           </div>
        ) : (
          <Link to="/auth" className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-600/30 transition-all active:scale-95">Establish Link</Link>
        )}
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (doc) => {
      if (doc.exists()) setMaintenanceMode(doc.data().maintenanceMode || false);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
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
        } catch (e) {}
      } else { setCurrentUser(null); }
      setLoading(false);
    });
    
    return () => { unsubscribeSettings(); unsubscribeAuth(); };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-8">
      <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-[1.5rem] animate-spin shadow-2xl shadow-rose-600/20"></div>
      <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.8em] animate-pulse">Establishing Signal</p>
    </div>
  );

  if (maintenanceMode && currentUser?.role !== 'admin') return <MaintenanceView />;

  return (
    <Router>
      <SocialBarAd />
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500/30">
        <Navbar activeUser={currentUser} />
        
        <div className="flex-1 flex flex-col lg:flex-row container mx-auto max-w-screen-xl px-4 py-8 gap-8">
          <main className="flex-1 min-w-0">
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
          </main>

          {currentUser && (
            <aside className="hidden lg:block w-80 flex-shrink-0 space-y-8">
              <div className="sticky top-28 space-y-8">
                <div className="glass-effect rounded-[3rem] p-8 border border-white/5 bg-slate-900/40">
                  <div className="flex items-center gap-4 mb-6">
                    <img src={currentUser.photoURL} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-rose-500/20" alt="me" />
                    <div>
                      <p className="font-black text-xs uppercase tracking-widest">{currentUser.displayName}</p>
                      <UserBadge role={currentUser.role} verified={currentUser.isVerified} className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <Link to={`/profile/${currentUser.uid}`} className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-center transition-all">My Node</Link>
                     <Link to="/chat" className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-center transition-all">Lobby</Link>
                  </div>
                </div>
                
                <div className="glass-effect rounded-[3rem] p-8 border border-rose-500/10 bg-rose-500/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:scale-150 transition-transform"></div>
                  <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-3">Community Hub</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Verify your signal identity to join the elite encrypted channels and gain unrestricted access.</p>
                  <Link to="/pro" className="mt-5 block text-center bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-600/20 transition-all active:scale-95">Upgrade Node</Link>
                </div>
                
                <AdsterraAd id="sidebar-sticky" />
              </div>
            </aside>
          )}
        </div>

        <MobileBottomNav activeUser={currentUser} />
        <SupportWidget />
      </div>
    </Router>
  );
};

export default App;
