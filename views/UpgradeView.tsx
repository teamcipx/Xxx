
import React, { useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { db } from '../services/firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { uploadToImgBB } from '../services/imgbb';
import { useLang } from '../App';
import { AdsterraAd } from '../components/AdsterraAd';
import * as ReactRouterDOM from 'react-router-dom';
const { useNavigate } = ReactRouterDOM as any;

const TELEGRAM_SUPPORT = 'https://t.me/securehx';

const UpgradeView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pendingTx, setPendingTx] = useState<Transaction | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', activeUser.uid),
      where('status', '==', 'pending')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setPendingTx({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Transaction);
      } else {
        setPendingTx(null);
      }
    });
    return unsubscribe;
  }, [activeUser.uid]);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txId.trim() && !selectedFile) {
      alert(lang === 'bn' ? "দয়া করে ট্রান্সজেকশন আইডি অথবা স্ক্রিনশট দিন।" : "Please provide a Transaction ID or Screenshot.");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = '';
      if (selectedFile) {
        imageUrl = await uploadToImgBB(selectedFile);
      }

      await addDoc(collection(db, 'transactions'), {
        userId: activeUser.uid,
        userName: activeUser.displayName,
        userEmail: activeUser.email,
        txId: txId.trim(),
        imageUrl: imageUrl || null,
        status: 'pending',
        createdAt: Date.now(),
        plan: 'SecureH Premium Lifetime'
      });

      setSuccess(true);
      setTxId('');
      setSelectedFile(null);
    } catch (err) {
      alert(lang === 'bn' ? "ব্যর্থ হয়েছে। আবার চেষ্টা করুন।" : "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const t_upgrade = {
    title: lang === 'bn' ? 'আপনার সিগন্যাল আপগ্রেড করুন' : 'UPGRADE YOUR SIGNAL',
    sub: lang === 'bn' ? 'পূর্ণ ট্রান্সমিশন সুবিধা, মিডিয়া ডিক্রিপশন এবং গ্লোবাল চ্যাট নোড আনলক করুন।' : 'Unlock full transmission privileges, media decryption, and global chat nodes.',
    step1: lang === 'bn' ? 'ধাপ ১: পেমেন্ট পাঠান' : 'Step 1: Send Payment',
    step2: lang === 'bn' ? 'ধাপ ২: প্রমাণ জমা দিন' : 'Step 2: Submit Proof',
    amount: lang === 'bn' ? 'ঠিক $০.৫০ ডলার SecureH ওয়ালেটে পাঠান।' : 'Please transfer exactly $0.50 USD to the official SecureH wallet.',
    placeholder: lang === 'bn' ? 'TxID লিখুন...' : 'Enter TxID (e.g. 293842...)',
    button: lang === 'bn' ? 'ভেরিফিকেশন অনুরোধ পাঠান' : 'Request Verification',
    already: lang === 'bn' ? 'আপনি ইতিমধ্যে একজন প্রিমিয়াম সদস্য।' : 'You are already a Premium Member.'
  };

  if (activeUser.role === 'premium' || activeUser.role === 'pro' || activeUser.role === 'admin') {
    return (
      <div className="max-w-xl mx-auto glass-effect rounded-[2.5rem] p-12 text-center space-y-6 border border-amber-500/20 shadow-2xl animate-fadeIn">
        <div className="bg-amber-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/50">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight uppercase">CITIZEN ELITE</h2>
        <p className="text-slate-400 font-medium">{t_upgrade.already}</p>
        <button onClick={() => navigate('/')} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">{lang === 'bn' ? 'ফিরে যান' : 'Return'}</button>
      </div>
    );
  }

  if (success || pendingTx) {
    return (
      <div className="max-w-xl mx-auto glass-effect rounded-[2.5rem] p-12 text-center space-y-6 border border-indigo-500/20 shadow-2xl animate-fadeIn">
        <div className="bg-indigo-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/50 animate-pulse">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight uppercase">{lang === 'bn' ? 'অপেক্ষা করুন' : 'Verification Pending'}</h2>
        <p className="text-slate-400 font-medium leading-relaxed">{lang === 'bn' ? 'আপনার পেমেন্ট তথ্য হাই কমান্ডে পাঠানো হয়েছে।' : 'Your payment info has been transmitted to High Command.'}</p>
        <AdsterraAd id="upgrade-pending-ad" format="banner" className="scale-90" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">{t_upgrade.title}</h1>
        <p className="text-slate-400 max-w-2xl mx-auto font-medium">{t_upgrade.sub}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass-effect rounded-[2.5rem] p-8 border border-white/5 space-y-8">
          <div className="relative">
             <div className="absolute -top-10 -right-4 bg-rose-600 text-white text-[12px] font-black px-6 py-3 rounded-2xl shadow-2xl rotate-12 uppercase tracking-tighter animate-pulse border-2 border-slate-950">Special: $0.50</div>
             <h2 className="text-xl font-black text-indigo-400 uppercase tracking-tight">{t_upgrade.step1}</h2>
             <p className="text-slate-500 text-xs mt-2 font-medium">{t_upgrade.amount}</p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/5 group">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Binance ID / Wallet</p>
              <div className="flex items-center justify-between">
                <code className="text-indigo-300 font-mono text-sm">SH-PREMIUM-NODE-88</code>
                <button onClick={() => navigator.clipboard.writeText('SH-PREMIUM-NODE-88')} className="text-slate-500 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                </button>
              </div>
            </div>
            <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
              <p className="text-[10px] text-amber-500/80 leading-relaxed font-medium italic">"Ensure you capture a screenshot of your success screen. For help, message <a href={TELEGRAM_SUPPORT} target="_blank" rel="noreferrer" className="underline font-bold">@securehx</a> on Telegram."</p>
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative">
          <div className="absolute -top-3 right-8 bg-amber-500 text-white text-[9px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg">Verification Hub</div>
          
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight mb-6">{t_upgrade.step2}</h2>
          
          <form onSubmit={handleSubmitPayment} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Transaction ID</label>
              <input
                type="text"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                placeholder={t_upgrade.placeholder}
                className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-5 py-4 text-slate-100 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-amber-500/20 text-xs uppercase tracking-widest ${loading ? 'opacity-70 grayscale' : ''}`}
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full"></div>
              ) : (
                t_upgrade.button
              )}
            </button>
          </form>
          {/* Ad within the premium form area */}
          <AdsterraAd id="upgrade-form-ad" format="banner" className="mt-6 scale-90" />
        </div>
      </div>
    </div>
  );
};

export default UpgradeView;
