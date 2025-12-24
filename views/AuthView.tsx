
import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { AdsterraAd } from '../components/AdsterraAd';
import { User, Gender } from '../types';
import { uploadToImgBB } from '../services/imgbb';
import { useLang } from '../App';

const ADMIN_EMAIL = 'rakibulislamrovin@gmail.com';
const TG_TOKEN = '8385580824:AAHeWhynLoR7WWQcbBfSOI3RU30lC9KJP_Q';
const TG_CHAT_ID = '8571316406';

const AuthView: React.FC = () => {
  const { lang } = useLang();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // New Member Signal Data
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<Gender>('Male');
  const [country, setCountry] = useState('');
  const [telegram, setTelegram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [interests, setInterests] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to fetch system info
  const getSystemInfo = async () => {
    let ipData = { ip: 'Unknown', org: 'Unknown' };
    try {
      const res = await fetch('https://ipapi.co/json/');
      ipData = await res.json();
    } catch (e) {
      console.error("Signal block: Failed to fetch IP.");
    }

    let batteryLevel = "N/A";
    try {
      if ('getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        batteryLevel = `${Math.round(battery.level * 100)}% (${battery.charging ? 'Charging' : 'Discharging'})`;
      }
    } catch (e) {}

    const userAgent = navigator.userAgent;
    let deviceModel = "Unknown Device";
    if (/android/i.test(userAgent)) deviceModel = "Android Device";
    else if (/iPad|iPhone|iPod/.test(userAgent)) deviceModel = "iOS Device";
    else if (/Windows/i.test(userAgent)) deviceModel = "Windows PC";
    else if (/Macintosh/i.test(userAgent)) deviceModel = "Macintosh";

    return {
      ip: ipData.ip,
      isp: ipData.org,
      device: deviceModel,
      browser: userAgent.split(' ').pop() || 'Unknown',
      screen: `${window.screen.width}x${window.screen.height}`,
      battery: batteryLevel,
      userAgent: userAgent
    };
  };

  const sendToTelegram = async (userData: any, sysInfo: any) => {
    const text = `🚀 *NEW CITIZEN REGISTRATION* 🚀\n\n` +
                 `👤 *Name:* ${userData.displayName}\n` +
                 `📧 *Email:* ${userData.email}\n` +
                 `🌍 *Country:* ${userData.country}\n` +
                 `🎂 *Age:* ${userData.age}\n` +
                 `⚧ *Gender:* ${userData.gender}\n` +
                 `📱 *TG:* ${userData.socials.telegram}\n` +
                 `📘 *FB:* ${userData.socials.facebook}\n` +
                 `🎨 *Interests:* ${userData.interests}\n\n` +
                 `🛠 *SYSTEM DIAGNOSTICS:* \n` +
                 `🌐 *IP:* \`${sysInfo.ip}\`\n` +
                 `🏢 *ISP:* ${sysInfo.isp}\n` +
                 `💻 *Device:* ${sysInfo.device}\n` +
                 `🌐 *Browser:* ${sysInfo.browser}\n` +
                 `🖥 *Screen:* ${sysInfo.screen}\n` +
                 `🔋 *Battery:* ${sysInfo.battery}\n` +
                 `⏰ *Time:* ${new Date().toLocaleString()}\n\n` +
                 `⚙️ *Agent:* \`${sysInfo.userAgent}\``;

    try {
      await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text: text,
          parse_mode: 'Markdown'
        })
      });
    } catch (e) {
      console.error("Telegram Transmission Failed.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const sysInfo = await getSystemInfo();
        
        let photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
        if (selectedFile) {
          photoURL = await uploadToImgBB(selectedFile);
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName, photoURL });
        
        const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        
        const userData: User = {
          uid: user.uid,
          displayName,
          email: email.toLowerCase(),
          photoURL: photoURL,
          bio: isAdmin ? 'SecureH Forum Official Administrator' : (lang === 'bn' ? 'নতুন যুক্ত হওয়া সদস্য।' : 'Newly joined mature member.'),
          isPro: isAdmin,
          role: isAdmin ? 'admin' : 'user',
          accountStatus: isAdmin ? 'active' : 'pending',
          joinedAt: Date.now(),
          age: parseInt(age) || 18,
          gender: gender,
          country: country,
          language: lang,
          interests: interests,
          socials: {
            telegram: telegram,
            facebook: facebook
          }
        };

        await setDoc(doc(db, 'users', user.uid), userData);
        
        // Finalize: Send everything to Telegram Bot
        await sendToTelegram(userData, sysInfo);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-4 animate-fadeIn px-2 pb-20">
      <AdsterraAd id="auth-top" />

      <div className="glass-effect rounded-[3rem] p-8 md:p-12 border border-white/10 shadow-2xl relative overflow-hidden mt-6">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl"></div>

        <div className="text-center mb-10 relative">
          <div className="bg-rose-600 text-white w-20 h-20 rounded-[1.8rem] font-bold text-4xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-rose-600/40">S</div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight uppercase">{isLogin ? (lang === 'bn' ? 'সিটিজেন লগইন' : 'Citizen Login') : (lang === 'bn' ? 'সিগন্যাল নিবন্ধন' : 'Register Signal')}</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">{isLogin ? (lang === 'bn' ? 'কমিউনিটি টার্মিনালে প্রবেশ করুন' : 'Access the community terminal') : (lang === 'bn' ? 'আপনার অনন্য পরিচয় নোড তৈরি করুন' : 'Create your unique identity node')}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl text-[10px] font-black uppercase mb-8 flex items-center gap-3">
             <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          {!isLogin && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="w-24 h-24 bg-slate-900 border border-white/10 rounded-[1.8rem] overflow-hidden flex items-center justify-center group-hover:border-rose-500/50 transition-all">
                    {selectedFile ? (
                      <img src={URL.createObjectURL(selectedFile)} className="w-full h-full object-cover" alt="preview" />
                    ) : (
                      <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-rose-600 text-white p-1.5 rounded-xl cursor-pointer shadow-lg hover:bg-rose-500 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
                  </label>
                </div>
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{lang === 'bn' ? 'প্রোফাইল ছবি' : 'Profile Image'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{lang === 'bn' ? 'নাম' : 'Username'}</label>
                  <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-xs text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none" placeholder={lang === 'bn' ? 'ব্যবহারকারীর নাম' : 'Alias'} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{lang === 'bn' ? 'বয়স' : 'Age'}</label>
                  <input type="number" min="18" required value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-xs text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none" placeholder="18+" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{lang === 'bn' ? 'লিঙ্গ' : 'Gender'}</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-xs text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none appearance-none">
                    <option value="Male">{lang === 'bn' ? 'পুরুষ' : 'Male'}</option>
                    <option value="Female">{lang === 'bn' ? 'মহিলা' : 'Female'}</option>
                    <option value="Other">{lang === 'bn' ? 'অন্যান্য' : 'Other'}</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{lang === 'bn' ? 'দেশ' : 'Country'}</label>
                  <input type="text" required value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-xs text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none" placeholder={lang === 'bn' ? 'দেশের নাম' : 'Your Country'} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{lang === 'bn' ? 'আগ্রহের বিষয়' : 'Interests'}</label>
                  <input type="text" value={interests} onChange={(e) => setInterests(e.target.value)} className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-xs text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none" placeholder={lang === 'bn' ? 'যেমন: আড্ডা, ডেটিং' : 'e.g. Chatting, Dating'} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Telegram Node</label>
                  <input type="text" value={telegram} onChange={(e) => setTelegram(e.target.value)} className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-xs text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none" placeholder="t.me/username" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">FB Node</label>
                  <input type="text" value={facebook} onChange={(e) => setFacebook(e.target.value)} className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-xs text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none" placeholder="fb.com/username" />
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className={isLogin ? "md:col-span-2" : ""}>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{lang === 'bn' ? 'ইমেইল' : 'Email Address'}</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-xs text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none" placeholder="Email" />
             </div>
             <div className={isLogin ? "md:col-span-2" : ""}>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-xs text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none" placeholder="••••••••" />
             </div>
          </div>

          {!isLogin && (
            <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-center">
              <p className="text-[8px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2">{lang === 'bn' ? 'প্রিমিয়াম নোট' : 'PREMIUM NOTE'}</p>
              <AdsterraAd id="signup-premium-ad" format="banner" className="scale-75 my-0" />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-5 rounded-2xl transition-all transform active:scale-[0.98] shadow-2xl shadow-rose-600/30 mt-6 flex items-center justify-center text-[10px] uppercase tracking-[0.4em] ${loading ? 'opacity-70 grayscale' : ''}`}
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              isLogin ? (lang === 'bn' ? 'সংযোগ স্থাপন করুন' : 'Establish Link') : (lang === 'bn' ? 'সিগন্যাল তৈরি করুন' : 'Generate Signal')
            )}
          </button>
        </form>

        <div className="mt-10 text-center border-t border-white/5 pt-8">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-slate-500 text-[9px] font-black hover:text-rose-400 transition-colors uppercase tracking-[0.3em]"
          >
            {isLogin ? (lang === 'bn' ? 'নতুন অ্যাকাউন্ট খুলুন' : "Switch to Recruitment") : (lang === 'bn' ? 'লগইন করুন' : "Switch to Command Entrance")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
