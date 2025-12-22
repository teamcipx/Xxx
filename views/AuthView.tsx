
import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { AdsterraAd } from '../components/AdsterraAd';
import { User } from '../types';

const ADMIN_EMAIL = 'rakibulislamrovin@gmail.com';

const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName });
        
        const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        
        const userData: User = {
          uid: user.uid,
          displayName,
          email: email.toLowerCase(),
          photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
          bio: isAdmin ? 'Akti Forum Official Administrator' : 'Hey there! I am new to Akti Forum.',
          isPro: isAdmin,
          role: isAdmin ? 'admin' : 'user',
          joinedAt: Date.now()
        };

        await setDoc(doc(db, 'users', user.uid), userData);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-4 animate-fadeIn">
      <div className="mb-6">
        <AdsterraAd id="auth-top" />
      </div>

      <div className="glass-effect rounded-[2.5rem] p-10 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl"></div>

        <div className="text-center mb-10 relative">
          <div className="bg-indigo-600 text-white w-20 h-20 rounded-[2rem] font-bold text-4xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-600/40 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">A</div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-slate-400 text-sm mt-3 font-medium">{isLogin ? 'Enter your credentials to continue' : 'Join thousands of members today'}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-2xl text-xs mb-8 flex items-center gap-3">
             <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2.5 ml-1">Username</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent transition-all"
                placeholder="AktiUser_01"
              />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2.5 ml-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent transition-all"
              placeholder="name@email.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2.5 ml-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[1.2rem] transition-all transform active:scale-[0.98] shadow-xl shadow-indigo-600/30 mt-6 flex items-center justify-center text-lg ${loading ? 'opacity-70 grayscale' : ''}`}
          >
            {loading ? (
              <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div>
            ) : (
              isLogin ? 'Continue to Forum' : 'Create My Account'
            )}
          </button>
        </form>

        <div className="mt-10 text-center border-t border-white/5 pt-8">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 text-sm font-bold hover:text-indigo-400 transition-colors py-2 px-4 rounded-lg hover:bg-white/5"
          >
            {isLogin ? "Don't have an account yet? Create one" : "Already registered? Login here"}
          </button>
        </div>
      </div>

      <div className="mt-8">
        <AdsterraAd id="auth-bottom" />
      </div>
    </div>
  );
};

export default AuthView;
