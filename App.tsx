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

const ADMIN_EMAIL = 'rakibulislamrovin@gmail.com';

const MobileBottomNav: React.FC<{ activeUser: User | null }> = ({ activeUser }) => {
  const location = useLocation();
  if (!activeUser) return null;

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-white/10 px-2 py-3 flex items-center justify-around shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
      <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-indigo-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        <span className="text-[7px] font-black uppercase tracking-widest">Feed</span>
      </Link>
      <Link to="/chat" className={`flex flex-col items-center gap-1 ${isActive('/chat') ? 'text-indigo-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        <span className="text-[7px] font-black uppercase tracking-widest">Lobby</span>
      </Link>
      <Link to="/pro" className={`flex flex-col items-center gap-1 ${isActive('/pro') ? 'text-amber-400' : 'text-slate-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
        <span className="text-[7px] font-black uppercase tracking-widest">Pro</span>
      </Link>
      <Link to={`/profile/${activeUser.uid}`} className={`flex flex-col items-center gap-1 ${isActive(`/profile/${activeUser.uid}`) ? 'text-indigo-400' : 'text-slate-500'}`}>
        <img src={activeUser.photoURL} alt="P" className={`w-5 h-5 rounded-lg object-cover border ${isActive(`/profile/${activeUser.uid}`) ? 'border-indigo-400' : 'border-transparent'}`} />
        <span className="text-[7px] font-black uppercase tracking-widest">Me</span>
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

  return (
    <nav className="sticky top-0 z-40 glass-effect border-b border-white/10 px-4 py-2 flex items-center justify-between gap-4 h-16">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-indigo-600 text-white p-2 rounded-xl font-black text-lg shadow-lg shadow-indigo-600/30">A</div>
          <span className="font-black text-sm hidden sm:block tracking-tight text-white uppercase">Akti <span className="text-indigo-500">Forum</span></span>
        </Link>
      </div>

      {activeUser && (
        <div className="flex-1 max-w-sm relative" ref={searchRef}>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search citizens..."
              className="w-full bg-slate-900/60 border border-white/5 rounded-full pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn backdrop-blur-xl z-50">
              <div className="p-2 space-y-1">
                {searchResults.map((user) => (
                  <button key={user.uid} onClick={() => { setSearchQuery(''); navigate(`/profile/${user.uid}`); }} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors text-left">
                    <img src={user.photoURL} alt="u" className="w-8 h-8 rounded-lg object-cover" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-200">{user.displayName}</p>
                        <UserBadge role={user.role} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4" ref={menuRef}>
        {activeUser ? (
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-full border border-white/10 hover:bg-slate-800 transition-all">
              <img src={activeUser.photoURL} alt="p" className="w-8 h-8 rounded-full object-cover" />
              <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2 animate-fadeIn z-50">
                <Link to={`/profile/${activeUser.uid}`} onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                  <span className="text-xs font-bold uppercase tracking-widest">My Signal</span>
                </Link>
                {activeUser.role === 'admin' && (
                  <Link to="/admin" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 p-3 hover:bg-red-500/10 rounded-xl text-red-400 font-bold transition-all">
                    <span className="text-xs font-bold uppercase tracking-widest">Admin Control</span>
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 hover:bg-red-500/10 rounded-xl text-red-500 text-left transition-all">
                  <span className="text-xs font-bold uppercase tracking-widest">Logout</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/auth" className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/30 transition-all">Join</Link>
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
          const userEmail = (firebaseUser.email || '').trim().toLowerCase();
          const isAdmin = userEmail === ADMIN_EMAIL.trim().toLowerCase();
          
          if (userDoc.exists()) {
            const data = userDoc.data() as User;
            if (isAdmin && data.role !== 'admin') {
              setCurrentUser({ ...data, role: 'admin', isPro: true });
              await updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin', isPro: true });
            } else {
              setCurrentUser(data);
            }
          } else {
            const newUser: User = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Citizen_' + Math.floor(Math.random() * 1000),
              email: userEmail,
              photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'U')}&background=random`,
              bio: isAdmin ? 'Official Administrator' : 'Newly recruited member of the Akti Network.',
              isPro: isAdmin,
              role: isAdmin ? 'admin' : 'user',
              joinedAt: Date.now()
            };
            setCurrentUser(newUser);
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          }
        } catch (e) { console.error(e); }
      } else { setCurrentUser(null); }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-600 text-[8px] font-black uppercase tracking-[0.5em] animate-pulse">Syncing Core</p>
    </div>
  );

  return (
    <Router>
      <SocialBarAd />
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
        <Navbar activeUser={currentUser} />
        
        <div className="flex-1 flex flex-col lg:flex-row container mx-auto max-w-screen-xl px-2 md:px-4 py-6 gap-6 mb-20 md:mb-0">
          {/* Main Content Area */}
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

          {/* Desktop Right Ad Sidebar */}
          {currentUser && (
            <aside className="hidden lg:block w-72 flex-shrink-0 space-y-6">
              <div className="sticky top-24 space-y-6">
                <div className="glass-effect rounded-2xl p-4 border border-indigo-500/10">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">Sponsored Content</h4>
                  <AdsterraAd id="sidebar-top" />
                  <div className="h-px bg-white/5 my-4"></div>
                  <AdsterraAd id="sidebar-mid" />
                </div>
                <div className="glass-effect rounded-2xl p-4 border border-white/5 bg-slate-900/40">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Network Updates</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Join our elite Pro citizens for faster verification and ad-free experience.</p>
                  <Link to="/pro" className="mt-3 block text-center bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white py-2 rounded-xl text-[9px] font-black uppercase transition-all">Go Pro Now</Link>
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