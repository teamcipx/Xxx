
import React, { useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { db } from '../services/firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { uploadToImgBB } from '../services/imgbb';

const UpgradeView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pendingTx, setPendingTx] = useState<Transaction | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if user already has a pending transaction
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
      alert("Please provide a Transaction ID or Screenshot.");
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
        plan: 'Akti Premium Lifetime'
      });

      setSuccess(true);
      setTxId('');
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (activeUser.role === 'premium' || activeUser.role === 'pro' || activeUser.role === 'admin') {
    return (
      <div className="max-w-xl mx-auto glass-effect rounded-[2.5rem] p-12 text-center space-y-6 border border-amber-500/20 shadow-2xl animate-fadeIn">
        <div className="bg-amber-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/50">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">CITIZEN ELITE</h2>
        <p className="text-slate-400 font-medium">You are already a Premium Member. All exclusive channels and features are unlocked for your signal.</p>
        <button onClick={() => window.location.hash = '/'} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">Return to Feed</button>
      </div>
    );
  }

  if (success || pendingTx) {
    return (
      <div className="max-w-xl mx-auto glass-effect rounded-[2.5rem] p-12 text-center space-y-6 border border-indigo-500/20 shadow-2xl animate-fadeIn">
        <div className="bg-indigo-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/50 animate-pulse">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight uppercase">Verification Pending</h2>
        <p className="text-slate-400 font-medium leading-relaxed">Your payment information has been transmitted to the High Command. An admin will verify your transaction shortly.</p>
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 inline-block mx-auto">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status: Waiting for Admin Approval</p>
        </div>
        <div className="pt-4">
          <button onClick={() => window.location.hash = '/'} className="text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:underline">Back to Community</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">UPGRADE YOUR SIGNAL</h1>
        <p className="text-slate-400 max-w-2xl mx-auto font-medium">Unlock full transmission privileges, media decryption, and global chat nodes for a nominal fee.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass-effect rounded-[2.5rem] p-8 border border-white/5 space-y-8">
          <div className="relative">
             <div className="absolute -top-10 -right-4 bg-rose-600 text-white text-[12px] font-black px-6 py-3 rounded-2xl shadow-2xl rotate-12 uppercase tracking-tighter animate-pulse border-2 border-slate-950">Special: $0.50</div>
             <h2 className="text-xl font-black text-indigo-400 uppercase tracking-tight">Step 1: Send Payment</h2>
             <p className="text-slate-500 text-xs mt-2 font-medium">Please transfer exactly <span className="text-white font-bold">$0.50 USD</span> to the official Akti wallet.</p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/5 group">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Binance ID / Wallet</p>
              <div className="flex items-center justify-between">
                <code className="text-indigo-300 font-mono text-sm">AKT-PREMIUM-NODE-88</code>
                <button onClick={() => navigator.clipboard.writeText('AKT-PREMIUM-NODE-88')} className="text-slate-500 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                </button>
              </div>
            </div>
            <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
              <p className="text-[10px] text-amber-500/80 leading-relaxed font-medium italic">"Ensure you capture a screenshot of your success screen or copy the Transaction ID for the next step."</p>
            </div>
          </div>
          
          <div className="space-y-3 pt-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Premium Features</h3>
            {[
              "View Full Post Content",
              "Decrypt Media & Images",
              "Post Comments & Likes",
              "Access Global Chat Nodes",
              "Direct Messaging Privileges"
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-effect rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative">
          <div className="absolute -top-3 right-8 bg-amber-500 text-white text-[9px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg">Verification Hub</div>
          
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight mb-6">Step 2: Submit Proof</h2>
          
          <form onSubmit={handleSubmitPayment} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Transaction ID</label>
              <input
                type="text"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                placeholder="Enter TxID (e.g. 293842...)"
                className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-5 py-4 text-slate-100 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Payment Screenshot</label>
              <div className="relative">
                <input 
                  type="file" 
                  id="screenshot"
                  accept="image/*"
                  onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                  className="hidden" 
                />
                <label 
                  htmlFor="screenshot"
                  className="w-full flex flex-col items-center justify-center p-6 bg-slate-900/40 border-2 border-dashed border-white/5 rounded-2xl cursor-pointer hover:bg-slate-900 hover:border-amber-500/30 transition-all group"
                >
                  {selectedFile ? (
                    <div className="text-center">
                      <p className="text-amber-400 text-xs font-bold">{selectedFile.name}</p>
                      <p className="text-slate-500 text-[10px] uppercase mt-1">Image Ready for Upload</p>
                    </div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-slate-700 mb-2 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Proof Image</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-amber-500/20 text-xs uppercase tracking-widest ${loading ? 'opacity-70 grayscale' : ''}`}
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full"></div>
              ) : (
                'Request Verification'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpgradeView;
