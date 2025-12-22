
import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { AdsterraAd } from '../components/AdsterraAd';
import { User, Gender } from '../types';

const ADMIN_EMAIL = 'rakibulislamrovin@gmail.com';

const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // New Member Signal Data
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<Gender>('Male');
  const [telegram, setTelegram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [interests, setInterests] = useState('');

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
          bio: isAdmin ? 'Akti Forum Official Administrator' : 'Newly joined mature member.',
          isPro: isAdmin,
          role: isAdmin ? 'admin' : 'user',
          joinedAt: Date.now(),
          age: parseInt(age) || 18,
          gender: gender,
          interests: interests,
          socials: {
            telegram: telegram,
            facebook: facebook
          }
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
    <div className="max-w-xl mx-auto mt-4 animate-fadeIn px-2">
      <div className="mb-6">
        <AdsterraAd id="auth-top" />
      </div>

      <div className="glass-effect rounded-[2.5rem] p-6 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl"></div>

        <div className="text-center mb-8 relative">
          <div className="bg-rose-600 text-white w-20 h-20 rounded-[2rem] font-bold text-4xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-rose-600/40 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">A</div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase">{isLogin ? 'Member Login' : 'Join Elite Signal'}</h2>
          <p className="text-slate-400 text-sm mt-3 font-medium">{isLogin ? 'Enter the mature community lobby' : 'Complete your signal profile below'}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-2xl text-xs mb-8 flex items-center gap-3">
             <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          {!isLogin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Display Name</label>
                <input
                  type="text" required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-rose-500/40 outline-none"
                  placeholder="Username"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Age</label>
                <input
                  type="number" min="18" required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-rose-500/40 outline-none"
                  placeholder="Must be 18+"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-rose-500/40 outline-none appearance-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Interests</label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-rose-500/40 outline-none"
                  placeholder="e.g. Chatting, Dating, Gaming"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Telegram Link</label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-rose-500/40 outline-none"
                  placeholder="t.me/username"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">FB Link</label>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-rose-500/40 outline-none"
                  placeholder="fb.com/username"
                />
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className={isLogin ? "md:col-span-2" : ""}>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Email</label>
                <input
                  type="email" required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-rose-500/40 outline-none"
                  placeholder="Email"
                />
             </div>
             <div className={isLogin ? "md:col-span-2" : ""}>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Password</label>
                <input
                  type="password" required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-rose-500/40 outline-none"
                  placeholder="••••••••"
                />
             </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-4 rounded-2xl transition-all transform active:scale-[0.98] shadow-xl shadow-rose-600/30 mt-4 flex items-center justify-center text-sm uppercase tracking-widest ${loading ? 'opacity-70 grayscale' : ''}`}
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              isLogin ? 'Enter Lobby' : 'Establish Signal'
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-500 text-xs font-bold hover:text-rose-400 transition-colors py-2 px-4 rounded-lg hover:bg-white/5 uppercase tracking-widest"
          >
            {isLogin ? "Recruit as New Member" : "Already a Signal? Login"}
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
