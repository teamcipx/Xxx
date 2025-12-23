
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
      const uSnapshot = await getDocs(query(collection(db, 'users'), orderBy('joinedAt', 'desc'), limit(100)));
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
      alert(`Identity ${approve ? 'Validated' : 'Rejected'}. Signal status updated.`);
    } catch (e) { alert("HQ protocol failed."); }
  };

  const toggleMaintenance = async () => {
    const newValue = !maintenanceMode;
    await setDoc(doc(db, 'settings', 'site'), { maintenanceMode: newValue }, { merge: true });
  };

  const sidebarItems = [
    { id: 'overview', label: 'Dashboard', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { id: 'members', label: 'Network Citizens', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'verifications', label: 'Shield Ops', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'cashier', label: 'Financials', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'settings', label: 'System Core', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center gap-6">
      <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-[1.5rem] animate-spin shadow-2xl shadow-rose-600/20"></div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.8em] animate-pulse">Syncing Admin Hub...</p>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn pb-32">
      {/* Sidebar Nav */}
      <div className="lg:w-72 flex-shrink-0">
        <div className="flex lg:flex-col overflow-x-auto pb-4 lg:pb-0 gap-3 custom-scrollbar lg:sticky lg:top-28">
          <div className="hidden lg:block mb-4 px-4">
             <h2 className="text-[11px] font-black text-rose-500 uppercase tracking-[0.4em]">High Command</h2>
             <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">Network Administration</p>
          </div>
          {sidebarItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as AdminTab)} 
              className={`flex items-center gap-4 px-6 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeTab === item.id ? 'bg-rose-600 text-white shadow-2xl shadow-rose-600/30 border-rose-500' : 'bg-slate-900/40 text-slate-500 hover:bg-slate-800 border-white/5'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} /></svg>
              {item.label}
              {item.id === 'verifications' && verRequests.length > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-cyan-400 text-slate-950 rounded-lg text-[8px] animate-pulse">{verRequests.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-8 min-w-0">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { l: 'Network Citizens', v: stats.totalUsers, c: 'text-rose-500', bg: 'bg-rose-500/5', b: 'border-rose-500/10' },
                { l: 'Signal Nodes', v: stats.totalPosts, c: 'text-cyan-400', bg: 'bg-cyan-400/5', b: 'border-cyan-400/10' },
                { l: 'Voice Signals', v: stats.totalComments, c: 'text-indigo-400', bg: 'bg-indigo-400/5', b: 'border-indigo-400/10' },
              ].map((s, i) => (
                <div key={i} className={`glass-effect p-8 rounded-[3rem] border ${s.b} ${s.bg} text-center group hover:scale-[1.02] transition-all`}>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.l}</p>
                  <p className={`text-4xl font-black ${s.c} tracking-tighter drop-shadow-2xl group-hover:scale-110 transition-transform`}>{s.v}</p>
                </div>
              ))}
            </div>

            <div className="glass-effect rounded-[3rem] p-10 border border-white/5">
               <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                  <div className="w-8 h-1 bg-rose-600 rounded-full"></div>
                  Recent System Signals
               </h3>
               <div className="space-y-4">
                  {users.slice(0, 5).map(u => (
                    <div key={u.uid} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div className="flex items-center gap-4">
                          <img src={u.photoURL} className="w-10 h-10 rounded-xl object-cover" alt="u" />
                          <div>
                             <p className="text-xs font-black text-slate-200 uppercase tracking-widest">{u.displayName}</p>
                             <p className="text-[9px] text-slate-500 font-bold">{u.email}</p>
                          </div>
                       </div>
                       <UserBadge role={u.role} verified={u.isVerified} />
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="glass-effect rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-900/80 border-b border-white/5">
                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    <th className="px-8 py-6">Signal ID / Info</th>
                    <th className="px-8 py-6">Identity Specs</th>
                    <th className="px-8 py-6">Social Nodes</th>
                    <th className="px-8 py-6 text-right">Clearance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img src={u.photoURL} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-transparent group-hover:ring-rose-500/20 transition-all" alt="u" />
                          <div>
                            <p className="text-xs font-black text-slate-100 uppercase tracking-widest">{u.displayName}</p>
                            <p className="text-[9px] text-slate-500 font-medium italic mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1.5">
                           <span className={`inline-flex px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${u.gender === 'Female' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                              {u.age || '?'}/{u.gender?.charAt(0) || '?'} cycles
                           </span>
                           <p className="text-[9px] text-slate-600 truncate max-w-[150px]">{u.interests || 'No specs'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex gap-2">
                           {u.socials?.telegram && <div title={u.socials.telegram} className="w-6 h-6 bg-sky-500/10 rounded-lg flex items-center justify-center text-sky-400"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.89.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.97 8.24-3.54 3.93-1.63 4.74-1.92 5.28-1.93.12 0 .38.03.55.17.14.12.18.28.19.4z"/></svg></div>}
                           {u.socials?.facebook && <div title={u.socials.facebook} className="w-6 h-6 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-500"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24h-1.918c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg></div>}
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <UserBadge role={u.role} verified={u.isVerified} className="justify-end" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'verifications' && (
          <div className="space-y-6">
             <div className="flex items-center justify-between px-4">
                <h3 className="text-xl font-black text-cyan-400 uppercase tracking-tight">Identity Shield Queue</h3>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{verRequests.length} Pending Clearances</span>
             </div>
             {verRequests.map(req => (
               <div key={req.id} className="glass-effect p-8 rounded-[3rem] border border-cyan-500/20 flex flex-col md:flex-row gap-8 items-center group hover:bg-cyan-500/[0.02] transition-all">
                  <div className="relative">
                     <img src={req.userPhoto} className="w-20 h-20 rounded-[1.5rem] object-cover ring-4 ring-slate-900 shadow-2xl" alt="u" />
                     <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyan-500 rounded-xl flex items-center justify-center text-slate-950 shadow-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-1.14-10.49c1.066 1.406 1.63 3.12 1.63 4.919V17m0 0a1.65 1.65 0 001.747-1.616l.162-4.108c.038-1.01.21-2.02.512-3m-.512 3a4.05 4.05 0 01-.512-3m.512 3c1.55 4.108 1.71 8.216.512 12.324" /></svg>
                     </div>
                  </div>
                  <div className="flex-1 text-center md:text-left space-y-2">
                     <p className="text-sm font-black text-slate-100 uppercase tracking-[0.2em]">{req.userName}</p>
                     <p className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Signal Source: {req.userId}</p>
                     <a href={req.imageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950/50 border border-white/5 rounded-xl text-cyan-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Examine Proof
                     </a>
                  </div>
                  <div className="flex gap-3">
                     <button onClick={() => handleVerify(req, true)} className="px-8 py-4 bg-cyan-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-xl shadow-cyan-600/20 active:scale-95">Validate</button>
                     <button onClick={() => handleVerify(req, false)} className="px-8 py-4 bg-red-600/10 text-red-500 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all border border-red-500/20">Reject</button>
                  </div>
               </div>
             ))}
             {verRequests.length === 0 && (
               <div className="py-24 text-center glass-effect rounded-[3rem] border border-white/5">
                  <div className="w-16 h-16 bg-slate-900/50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-slate-700">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <p className="text-[11px] font-black uppercase text-slate-700 tracking-[0.5em]">Identity Queue Clear</p>
               </div>
             )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass-effect p-12 rounded-[3.5rem] border border-white/5 space-y-10">
            <div>
               <h3 className="text-2xl font-black text-rose-500 uppercase tracking-tighter">System Core Protocol</h3>
               <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-widest">Global Network Overrides</p>
            </div>
            
            <div className="bg-slate-950/60 p-8 rounded-[2.5rem] border border-white/10 flex items-center justify-between group">
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-200 uppercase tracking-widest">Dark Room (Maintenance)</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">When active, only High Command signals can bypass the lobby.</p>
              </div>
              <button 
                onClick={toggleMaintenance} 
                className={`w-16 h-9 rounded-full p-1.5 transition-all duration-500 ${maintenanceMode ? 'bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.4)]' : 'bg-slate-800'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-500 ${maintenanceMode ? 'translate-x-7' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[2.5rem]">
               <div className="flex items-center gap-4 text-amber-500 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <p className="text-xs font-black uppercase tracking-widest">Cautionary Alert</p>
               </div>
               <p className="text-[11px] text-amber-500/60 font-medium leading-relaxed">System-wide overrides affect all connected nodes. Maintenance mode will disconnect active member signals immediately. Execute only during planned recalibration.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
