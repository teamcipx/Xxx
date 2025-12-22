
import React, { useState, useEffect } from 'react';
import { User, UserRole, Post, Comment, Transaction, VerificationRequest } from '../types';
import { db } from '../services/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  orderBy, 
  limit, 
  getCountFromServer,
  deleteDoc,
  onSnapshot,
  setDoc,
  // Fix: Added missing 'where' import
  where
} from 'firebase/firestore';
import { UserBadge } from '../components/UserBadge';

type AdminTab = 'overview' | 'members' | 'verifications' | 'cashier' | 'settings';

const AdminView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [verRequests, setVerRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalPosts: 0, 
    totalComments: 0
  });

  useEffect(() => {
    fetchStats();
    
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (doc) => {
      if (doc.exists()) setMaintenanceMode(doc.data().maintenanceMode || false);
    });

    const unsubscribeTx = onSnapshot(query(collection(db, 'transactions'), orderBy('createdAt', 'desc')), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });

    // Fix: 'where' is now correctly imported from firebase/firestore
    const unsubscribeVer = onSnapshot(query(collection(db, 'verificationRequests'), where('status', '==', 'pending'), orderBy('createdAt', 'desc')), (snapshot) => {
      setVerRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VerificationRequest)));
    });

    return () => {
      unsubscribeSettings();
      unsubscribeTx();
      unsubscribeVer();
    };
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const uSnap = await getCountFromServer(collection(db, 'users'));
      const pSnap = await getCountFromServer(collection(db, 'posts'));
      const cSnap = await getCountFromServer(collection(db, 'comments'));
      const uSnapshot = await getDocs(query(collection(db, 'users'), orderBy('joinedAt', 'desc'), limit(50)));
      setUsers(uSnapshot.docs.map(doc => doc.data() as User));
      setStats({
        totalUsers: uSnap.data().count,
        totalPosts: pSnap.data().count,
        totalComments: cSnap.data().count
      });
    } finally { setLoading(false); }
  };

  const handleVerify = async (req: VerificationRequest, approve: boolean) => {
    try {
      await updateDoc(doc(db, 'verificationRequests', req.id), { status: approve ? 'approved' : 'rejected' });
      await updateDoc(doc(db, 'users', req.userId), { 
        isVerified: approve,
        verificationStatus: approve ? 'verified' : 'rejected'
      });
      alert(`Identity ${approve ? 'Validated' : 'Rejected'}.`);
    } catch (e) { alert("Action failed."); }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Monitor', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { id: 'members', label: 'Signals', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'verifications', label: 'Shields', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'cashier', label: 'Cashier', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'settings', label: 'Core', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  if (loading) return <div className="py-20 text-center text-[10px] font-black uppercase tracking-[0.5em] text-rose-500">Syncing HQ...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fadeIn pb-24">
      <div className="lg:w-60 flex-shrink-0">
        <div className="flex lg:flex-col overflow-x-auto pb-2 lg:pb-0 gap-2 custom-scrollbar lg:sticky lg:top-24">
          {sidebarItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as AdminTab)} className={`flex items-center gap-4 px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === item.id ? 'bg-rose-600 text-white shadow-2xl shadow-rose-600/30' : 'bg-slate-900/60 text-slate-500 hover:bg-slate-800'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              {item.label}
              {item.id === 'verifications' && verRequests.length > 0 && <span className="ml-auto w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-6">
        {activeTab === 'verifications' && (
          <div className="space-y-4">
             <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-xl font-black text-cyan-400 uppercase tracking-tight">Identity Queue</h3>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{verRequests.length} Pending</span>
             </div>
             {verRequests.map(req => (
               <div key={req.id} className="glass-effect p-6 rounded-[2.5rem] border border-cyan-500/20 flex flex-col md:flex-row gap-6 items-center">
                  <img src={req.userPhoto} className="w-16 h-16 rounded-2xl object-cover" alt="u" />
                  <div className="flex-1 text-center md:text-left">
                     <p className="font-black text-slate-200 uppercase tracking-widest">{req.userName}</p>
                     <p className="text-[9px] text-slate-500 mt-1 uppercase">Signal ID: {req.userId}</p>
                     <a href={req.imageUrl} target="_blank" className="text-cyan-400 text-[10px] font-black uppercase hover:underline mt-2 inline-block">View Proof Signal</a>
                  </div>
                  <div className="flex gap-3">
                     <button onClick={() => handleVerify(req, true)} className="px-6 py-3 bg-cyan-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-600/20">Validate</button>
                     <button onClick={() => handleVerify(req, false)} className="px-6 py-3 bg-red-600/20 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all border border-red-500/20">Discard</button>
                  </div>
               </div>
             ))}
             {verRequests.length === 0 && <div className="py-20 text-center text-[10px] font-black uppercase text-slate-700 tracking-[0.3em]">No identities in queue</div>}
          </div>
        )}

        {/* Other tabs remain similar but with updated rose-500/slate styling */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { l: 'Citizens', v: stats.totalUsers, c: 'text-rose-500' },
              { l: 'Nodes', v: stats.totalPosts, c: 'text-cyan-500' },
              { l: 'Voices', v: stats.totalComments, c: 'text-indigo-500' },
            ].map((s, i) => (
              <div key={i} className="glass-effect p-8 rounded-[2.5rem] border border-white/5 text-center transform hover:scale-[1.02] transition-transform">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{s.l}</p>
                <p className={`text-4xl font-black ${s.c} tracking-tighter`}>{s.v}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
