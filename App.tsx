
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { User } from './types';
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
import { doc, getDoc, collection, query, where, orderBy, startAt, endAt, limit, getDocs } from 'firebase/firestore';

const ADMIN_EMAIL = 'rakibulislamrovin@gmail.co';

const Navbar: React.FC<{ activeUser: User | null }> = ({ activeUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
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
      } finally {
        setIsSearching(false);
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
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-2 rounded-lg font-bold text-xl tracking-tighter shadow-lg shadow-indigo-600/20">A</div>
          <span className="font-bold text-lg hidden lg:block tracking-tight">Akti Forum</span>
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
              placeholder="Search members..."
              className="w-full bg-slate-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:bg-slate-900 transition-all"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-3 flex items-center">
                <div className="animate-spin h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn backdrop-blur-xl">
              <div className="p-2 space-y-1">
                {searchResults.map((user) => (
                  <button
                    key={user.uid}
                    onClick={() => handleSelectUser(user.uid)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors text-left"
                  >
                    <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-lg object-cover bg-slate-800" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-200 leading-none">{user.displayName}</p>
                        <UserBadge role={user.role} />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">View Profile</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeUser && (
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className={`hover:text-indigo-400 transition-colors text-sm font-medium ${location.pathname === '/' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}>Feed</Link>
          <Link to="/chat" className={`hover:text-indigo-400 transition-colors text-sm font-medium ${location.pathname.startsWith('/chat') ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}>Chat</Link>
          {activeUser.role === 'admin' && (
             <Link to="/admin" className={`hover:text-red-400 transition-colors text-sm font-bold ${location.pathname === '/admin' ? 'text-red-400' : 'text-slate-400'}`}>Dashboard</Link>
          )}
          <Link to="/pro" className={`hover:text-amber-400 transition-colors text-sm font-medium ${location.pathname === '/pro' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>Upgrade</Link>
        </div>
      )}

      <div className="flex items-center gap-3 flex-shrink-0">
        {activeUser ? (
          <div className="flex items-center gap-3">
            <Link to={`/profile/${activeUser.uid}`} className="flex items-center gap-3 bg-slate-800/50 p-1 pr-4 rounded-full border border-white/5 cursor-pointer hover:bg-slate-700/50 transition-all">
              <div className="relative">
                <img src={activeUser.photoURL || `https://ui-avatars.com/api/?name=${activeUser.displayName}`} alt="p" className="w-8 h-8 rounded-full object-cover" />
                <div className="absolute -bottom-0.5 -right-0.5">
                   <div className={`w-2.5 h-2.5 rounded-full border border-slate-900 ${activeUser.role !== 'user' ? 'bg-indigo-500' : 'bg-green-500'}`}></div>
                </div>
              </div>
              <div className="hidden md:block text-[10px]">
                <div className="flex items-center gap-1">
                  <p className="font-bold text-slate-200 leading-none">{activeUser.displayName}</p>
                  <UserBadge role={activeUser.role} />
                </div>
                <p className="text-slate-500 leading-none mt-1">My Profile</p>
              </div>
            </Link>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 p-2 transition-colors" title="Logout">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        ) : (
          <Link to="/auth" className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20">Join Community</Link>
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
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as User);
        } else {
          // If the email matches the hardcoded admin email, assign admin role immediately
          const isAdmin = firebaseUser.email === ADMIN_EMAIL;
          setCurrentUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
            bio: '',
            isPro: isAdmin,
            role: isAdmin ? 'admin' : 'user',
            joinedAt: Date.now()
          });
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-indigo-600 text-white w-12 h-12 rounded-2xl font-bold text-2xl flex items-center justify-center animate-bounce shadow-xl shadow-indigo-600/40">A</div>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <SocialBarAd />
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
        <Navbar activeUser={currentUser} />
        
        <main className="flex-1 container mx-auto max-w-5xl px-4 py-6">
          <AdsterraAd id="header-main" />
          
          <Routes>
            <Route path="/" element={currentUser ? <FeedView user={currentUser} /> : <Navigate to="/auth" />} />
            <Route path="/auth" element={!currentUser ? <AuthView /> : <Navigate to="/" />} />
            <Route path="/profile/:uid" element={currentUser ? <ProfileView activeUser={currentUser} /> : <Navigate to="/auth" />} />
            <Route path="/chat" element={currentUser ? <ChatView activeUser={currentUser} /> : <Navigate to="/auth" />} />
            <Route path="/chat/:chatId" element={currentUser ? <ChatView activeUser={currentUser} /> : <Navigate to="/auth" />} />
            <Route path="/pro" element={currentUser ? <UpgradeView activeUser={currentUser} /> : <Navigate to="/auth" />} />
            <Route path="/admin" element={currentUser?.role === 'admin' ? <AdminView activeUser={currentUser} /> : <Navigate to="/" />} />
          </Routes>
        </main>

        <SupportWidget />
        
        <footer className="p-12 text-center text-slate-700 text-xs border-t border-white/5 bg-slate-900/20">
          <p className="mb-2">Akti Forum Community &bull; Building for the future</p>
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
