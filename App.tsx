
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
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, startAt, endAt, limit, getDocs, updateDoc, setDoc } from 'firebase/firestore';

// The designated Master Admin email - MUST be exactly this
const ADMIN_EMAIL = 'rakibulislamrovin@gmail.com';

const MobileBottomNav: React.FC<{ activeUser: User | null }> = ({ activeUser }) => {
  const location = useLocation();
  if (!activeUser) return null;

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-white/10 px-4 py-3 flex items-center justify-between shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
      <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-indigo-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        <span className="text-[7px] font-black uppercase tracking-widest">Feed</span>
      </Link>
      <Link to="/chat" className={`flex flex-col items-center gap-1 ${isActive('/chat') ? 'text-indigo-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        <span className="text-[7px] font-black uppercase tracking-widest">Lobby</span>
      </Link>
      {activeUser.role === 'admin' && (
        <Link to="/admin" className={`flex flex-col items-center gap-1 ${isActive('/admin') ? 'text-red-400' : 'text-slate-500'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          <span className="text-[7px] font-black uppercase tracking-widest">Admin</span>
        </Link>
      )}
      <Link to="/pro" className={`flex flex-col items-center gap-1 ${isActive('/pro') ? 'text-amber-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
        <span className="text-[7px] font-black uppercase tracking-widest">Pro</span>
      </Link>
      <Link to={`/profile/${activeUser.uid}`} className={`flex flex-col items-center gap-1 ${isActive(`/profile/${activeUser.uid}`) ? 'text-indigo-400' : 'text-slate-500'}`}>
        <img src={activeUser.photoURL} alt="P" className={`w-5 h-5 rounded-lg object-cover border ${isActive(`/profile/${activeUser.uid}`) ? 'border-indigo-400' : 'border-transparent'}`} />
        <span className="text-[7px] font-black uppercase tracking-widest">Profile</span>
      </Link>
    </div>
  );
};

const Navbar: React.FC<{ activeUser: User | null }> = ({ activeUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

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
        const users = snapshot.docs.map(doc => doc.data() as User);
        setSearchResults(users);
      } catch (error) {
        console.error("Search error:", error);
      }
    };
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchQuery('');
        setSearchResults([]);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = (uid: string) => {
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/profile/${uid}`);
  };
  
  return (
    <nav className="sticky top-0 z-40 glass-effect border-b border-white/10 px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-indigo-600 text-white p-2.5 rounded-xl font-black text-xl tracking-tighter shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform">A</div>
          <span className="font-black text-lg hidden lg:block tracking-tight text-white uppercase">Akti <span className="text-indigo-500">Forum</span></span>
        </Link>
      </div>

      {activeUser && (
        <div className="flex-1 max-w-md relative mx-2 lg:mx-4" ref={searchRef}>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find people..."
              className="w-full bg-slate-900/60 border border-white/5 rounded-2xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn backdrop-blur-xl z-50">
              <div className="p-2 space-y-1">
                {searchResults.map((user) => (
                  <button
                    key={user.uid}
                    onClick={() => handleSelectUser(user.uid)}
                    className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-xl transition-colors text-left"
                  >
                    <img src={user.photoURL} alt={user.displayName} className="w-9 h-9 rounded-xl object-cover" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-200 leading-none">{user.displayName}</p>
                        <UserBadge role={user.role} />
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1 uppercase">Member Signal</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeUser && (
        <div className="hidden md:flex items-center gap-6 px-4">
          <Link to="/" className={`hover:text-indigo-400 transition-all text-xs font-black uppercase tracking-widest ${location.pathname === '/' ? 'text-indigo-400 border-b-2 border-indigo-500 pb-1' : 'text-slate-500'}`}>Feed</Link>
          <Link to="/chat" className={`hover:text-indigo-400 transition-all text-xs font-black uppercase tracking-widest ${location.pathname.startsWith('/chat') ? 'text-indigo-400 border-b-2 border-indigo-500 pb-1' : 'text-slate-500'}`}>Lobby</Link>
          {activeUser.role === 'admin' && (
             <Link to="/admin" className={`hover:text-red-400 transition-all text-xs font-black uppercase tracking-widest ${location.pathname === '/admin' ? 'text-red-400 border-b-2 border-red-500 pb-1' : 'text-slate-500'}`}>Admin</Link>
          )}
          <Link to="/pro" className={`hover:text-amber-400 transition-all text-xs font-black uppercase tracking-widest ${location.pathname === '/pro' ? 'text-amber-400 border-b-2 border-amber-500 pb-1' : 'text-slate-500'}`}>Pro</Link>
        </div>
      )}

      <div className="flex items-center gap-3 flex-shrink-0" ref={menuRef}>
        {activeUser ? (
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 bg-slate-900/80 p-1.5 pr-4 rounded-2xl border border-white/10 hover:bg-slate-800 transition-all active:scale-95 group shadow-lg"
            >
              <img src={activeUser.photoURL} alt="p" className="w-9 h-9 rounded-xl object-cover" />
              <div className="hidden md:block text-left">
                <p className="font-black text-slate-200 text-xs leading-none uppercase tracking-tight">{activeUser.displayName.split(' ')[0]}</p>
                <p className="text-slate-500 text-[9px] font-bold mt-1 uppercase">{activeUser.role}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute top-full right-0 mt-3 w-56 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] shadow-2xl p-2 animate-fadeIn ring-1 ring-white/5 overflow-hidden">
                <div className="p-3 border-b border-white/5 mb-1">
                  <p className="text-xs font-black text-slate-200 truncate">{activeUser.displayName}</p>
                  <p className="text-[9px] text-slate-500 font-bold truncate mt-0.5">{activeUser.email}</p>
                </div>
                <Link to={`/profile/${activeUser.uid}`} onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white group">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span className="text-xs font-black uppercase tracking-widest">Profile</span>
                </Link>
                {activeUser.role === 'admin' && (
                  <Link to="/admin" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 p-3 hover:bg-red-500/10 rounded-xl transition-all text-red-400 group">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <span className="text-xs font-black uppercase tracking-widest font-black">Admin Panel</span>
                  </Link>
                )}
                <div className="h-px bg-white/5 my-1"></div>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 hover:bg-red-500/10 rounded-xl transition-all text-red-500 text-left">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  <span className="text-xs font-black uppercase tracking-widest">Logout</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/auth" className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95">Login</Link>
        )}
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const isAdmin = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
          
          if (userDoc.exists()) {
            const data = userDoc.data() as User;
            // Force admin role if email matches, even if DB is outdated
            if (isAdmin && data.role !== 'admin') {
              const forcedAdmin = { ...data, role: 'admin' as UserRole, isPro: true };
              setCurrentUser(forcedAdmin);
              // Update firestore to keep it permanent
              await updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin', isPro: true });
            } else {
              setCurrentUser(data);
            }
          } else {
            // New user registration
            const newUser: User = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Entity_' + Math.floor(Math.random() * 1000),
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'U')}&background=random`,
              bio: isAdmin ? 'Master Administrator' : 'New Citizen of Akti Forum',
              isPro: isAdmin,
              role: isAdmin ? 'admin' : 'user',
              joinedAt: Date.now()
            };
            setCurrentUser(newUser);
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          }
        } catch (e) {
          console.error("Auth sync error:", e);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-8">
        <div className="bg-indigo-600 text-white w-20 h-20 rounded-[2.5rem] font-black text-4xl flex items-center justify-center animate-bounce shadow-2xl shadow-indigo-600/50">A</div>
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Establishing Connection</p>
      </div>
    );
  }

  return (
    <Router>
      <SocialBarAd />
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 overflow-x-hidden">
        <Navbar activeUser={currentUser} />
        
        <main className="flex-1 container mx-auto max-w-5xl px-4 py-8 mb-20 md:mb-0">
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

        <MobileBottomNav activeUser={currentUser} />
        <SupportWidget />
        
        <footer className="mt-auto py-12 border-t border-white/5 bg-slate-900/10 hidden md:block">
          <div className="container mx-auto px-4 text-center">
            <p className="text-slate-700 text-[10px] font-black uppercase tracking-widest">
              Akti Forum &bull; &copy; {new Date().getFullYear()} &bull; Performance Core
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
