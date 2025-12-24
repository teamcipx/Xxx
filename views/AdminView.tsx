
import React, { useState, useEffect } from 'react';
import { User, Transaction, Report } from '../types';
import { db } from '../services/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy, 
  limit, 
  getCountFromServer,
  onSnapshot,
  where
} from 'firebase/firestore';
import { UserBadge } from '../components/UserBadge';

type AdminTab = 'overview' | 'recruitment' | 'members' | 'payments' | 'karen' | 'settings';

const AdminView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Transaction[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalComments: 0, totalPayments: 0 });

  useEffect(() => {
    fetchStats();
    
    // System Settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (doc) => {
      if (doc.exists()) setMaintenanceMode(doc.data().maintenanceMode || false);
    });
    
    // Recruitment (Pending Users)
    const qPending = query(collection(db, 'users'), where('accountStatus', '==', 'pending'));
    const unsubscribePending = onSnapshot(qPending, (snapshot) => {
      setPendingUsers(snapshot.docs.map(doc => doc.data() as User));
    });

    // Payments
    const qPayments = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });

    // Members list for the members tab
    const qMembers = query(collection(db, 'users'), orderBy('joinedAt', 'desc'), limit(200));
    const unsubscribeMembers = onSnapshot(qMembers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as User));
    });

    // Moderation (Karen)
    const qReports = query(collection(db, 'reports'), where('status', '==', 'pending'));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setReports(data.sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => { 
      unsubscribeSettings(); 
      unsubscribePending(); 
      unsubscribePayments();
      unsubscribeMembers();
      unsubscribeReports();
    };
  }, []);

  const fetchStats = async () => {
    setLoading(false);
    try {
      const uSnap = await getCountFromServer(collection(db, 'users'));
      const pSnap = await getCountFromServer(collection(db, 'posts'));
      const cSnap = await getCountFromServer(collection(db, 'comments'));
      const paySnap = await getCountFromServer(collection(db, 'transactions'));
      
      setStats({ 
        totalUsers: uSnap.data().count, 
        totalPosts: pSnap.data().count, 
        totalComments: cSnap.data().count,
        totalPayments: paySnap.data().count
      });
    } catch(e) { console.error(e); }
  };

  const handleApproveUser = async (u: User) => {
    try {
      await updateDoc(doc(db, 'users', u.uid), { accountStatus: 'active' });
    } catch (e) { alert("Authorization failed."); }
  };

  const handleUserAction = async (uid: string, action: 'ban' | 'delete' | 'active' | 'premium' | 'pro') => {
    if (!window.confirm(`Are you sure you want to perform: ${action}?`)) return;
    try {
      const userRef = doc(db, 'users', uid);
      if (action === 'delete') {
        await deleteDoc(userRef);
      } else if (action === 'ban') {
        await updateDoc(userRef, { accountStatus: 'banned' });
      } else if (action === 'active') {
        await updateDoc(userRef, { accountStatus: 'active' });
      } else if (action === 'premium' || action === 'pro') {
        await updateDoc(userRef, { role: action, isPro: true });
      }
    } catch (e) {
      alert("Action failed.");
    }
  };

  const handleTransactionAction = async (txId: string, status: 'approved' | 'rejected', userId?: string) => {
    try {
      await updateDoc(doc(db, 'transactions', txId), { status });
      if (status === 'approved' && userId) {
        await updateDoc(doc(db, 'users', userId), { role: 'premium', isPro: true });
      }
    } catch (e) {
      alert("Failed to update transaction.");
    }
  };

  const toggleMaintenance = async () => {
    const newVal = !maintenanceMode;
    await updateDoc(doc(db, 'settings', 'site'), { maintenanceMode: newVal });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fadeIn h-[calc(100vh-140px)]">
      {/* Sidebar Nav */}
      <div className="lg:w-20 xl:w-64 flex-shrink-0 flex flex-col">
        <div className="flex lg:flex-col overflow-x-auto pb-4 lg:pb-0 gap-2 custom-scrollbar snap-x">
          {[
            { id: 'overview', label: 'Monitor', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            { id: 'recruitment', label: 'Recruits', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
            { id: 'payments', label: 'Billing', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'members', label: 'Citizens', icon: 'M12 4.354a4 4 0 110 5.292' },
            { id: 'karen', label: 'Security', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as AdminTab)} 
              className={`flex flex-col lg:flex-row items-center gap-2 lg:gap-4 px-4 py-3 lg:py-4 rounded-2xl text-[8px] lg:text-[10px] font-black uppercase tracking-widest transition-all relative group snap-center min-w-[80px] lg:min-w-0 ${activeTab === item.id ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/20' : 'bg-slate-900/40 text-slate-500 hover:bg-slate-800'}`}
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} /></svg>
              <span className="xl:inline">{item.label}</span>
              {item.id === 'recruitment' && pendingUsers.length > 0 && <span className="absolute top-1 right-1 lg:top-2 lg:right-2 bg-rose-500 text-white w-3 h-3 lg:w-4 lg:h-4 rounded-lg flex items-center justify-center text-[7px] border-2 border-slate-950">{pendingUsers.length}</span>}
              {item.id === 'payments' && payments.filter(p => p.status === 'pending').length > 0 && <span className="absolute top-1 right-1 lg:top-2 lg:right-2 bg-amber-500 text-slate-950 w-3 h-3 lg:w-4 lg:h-4 rounded-lg flex items-center justify-center text-[7px] border-2 border-slate-950 font-black">{payments.filter(p => p.status === 'pending').length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 min-w-0 bg-slate-900/20 rounded-3xl lg:rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col h-full shadow-2xl">
        {activeTab === 'overview' && (
          <div className="p-4 lg:p-8 space-y-4 lg:space-y-8 overflow-y-auto h-full custom-scrollbar">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {[
                { l: 'Citizens', v: stats.totalUsers, c: 'text-rose-500' },
                { l: 'Signals', v: stats.totalPosts, c: 'text-cyan-400' },
                { l: 'Pulses', v: stats.totalComments, c: 'text-indigo-400' },
                { l: 'Revenue', v: stats.totalPayments, c: 'text-amber-400' }
              ].map((s, i) => (
                <div key={i} className="glass-effect p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-white/5 text-center bg-slate-900/40">
                  <p className="text-[7px] lg:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.l}</p>
                  <p className={`text-xl lg:text-3xl font-black ${s.c} tracking-tighter`}>{s.v.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="glass-effect p-6 lg:p-8 rounded-3xl border border-white/10 bg-slate-900/30">
               <h3 className="text-white font-black uppercase tracking-widest text-[9px] lg:text-[10px] mb-4 lg:mb-6">Global Overrides</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                  <button onClick={toggleMaintenance} className={`px-5 py-3 lg:py-4 rounded-2xl text-[8px] lg:text-[9px] font-black uppercase tracking-widest transition-all ${maintenanceMode ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500 border border-white/5'}`}>
                    {maintenanceMode ? 'End Network Lockdown' : 'Init Maintenance'}
                  </button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'recruitment' && (
           <div className="p-5 lg:p-8 space-y-6 overflow-y-auto h-full custom-scrollbar">
              <h2 className="text-lg lg:text-xl font-black text-white uppercase tracking-tight">Recruitment Queue</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingUsers.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-slate-600 font-black uppercase text-[10px] tracking-[0.5em]">No Pending Citizens</div>
                ) : (
                  pendingUsers.map(u => (
                    <div key={u.uid} className="glass-effect p-5 rounded-3xl border border-white/5 space-y-4">
                      <div className="flex items-center gap-3">
                        <img src={u.photoURL} className="w-10 h-10 rounded-xl object-cover" alt="u" />
                        <div className="min-w-0"><h4 className="font-black text-white uppercase truncate text-[11px]">{u.displayName}</h4><p className="text-[8px] text-slate-500 truncate">{u.email}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveUser(u)} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg">Authorize</button>
                        <button onClick={() => handleUserAction(u.uid, 'delete')} className="p-2.5 bg-slate-900 text-red-500 rounded-xl border border-white/5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
           </div>
        )}

        {activeTab === 'payments' && (
           <div className="p-5 lg:p-8 space-y-6 overflow-y-auto h-full custom-scrollbar">
              <h2 className="text-lg lg:text-xl font-black text-white uppercase tracking-tight">Billing Signal Log</h2>
              <div className="space-y-4">
                {payments.length === 0 ? (
                  <div className="py-20 text-center text-slate-600 font-black uppercase text-[10px] tracking-[0.5em]">No Transactions</div>
                ) : (
                  payments.map(p => (
                    <div key={p.id} className="glass-effect p-5 rounded-[2rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${p.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : p.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <div>
                             <h4 className="font-black text-white uppercase text-[11px]">{p.userName}</h4>
                             <p className="text-[9px] text-slate-500 font-mono">TxID: {p.txId}</p>
                             <p className="text-[8px] text-indigo-400 font-bold uppercase mt-1">{p.plan}</p>
                          </div>
                       </div>
                       {p.imageUrl && <a href={p.imageUrl} target="_blank" rel="noreferrer" className="text-[8px] font-black uppercase text-rose-500 hover:underline">View Proof</a>}
                       {p.status === 'pending' ? (
                         <div className="flex gap-2">
                           <button onClick={() => handleTransactionAction(p.id, 'approved', p.userId)} className="px-4 py-2 bg-green-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest">Approve</button>
                           <button onClick={() => handleTransactionAction(p.id, 'rejected')} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest">Reject</button>
                         </div>
                       ) : (
                         <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase ${p.status === 'approved' ? 'bg-green-600/10 text-green-500' : 'bg-red-600/10 text-red-500'}`}>{p.status}</span>
                       )}
                    </div>
                  ))
                )}
              </div>
           </div>
        )}
        
        {activeTab === 'members' && (
           <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left text-[9px] lg:text-[10px]">
                <thead className="bg-slate-900/60 text-slate-500 font-black uppercase tracking-widest border-b border-white/5 sticky top-0 z-10">
                  <tr><th className="px-5 py-3 lg:px-6 lg:py-4">Node</th><th className="px-5 py-3 lg:px-6 lg:py-4">Level</th><th className="px-5 py-3 lg:px-6 lg:py-4">Status</th><th className="px-5 py-3 lg:px-6 lg:py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 lg:px-6 lg:py-4 flex items-center gap-3">
                        <img src={u.photoURL} className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg object-cover" alt="u" />
                        <div className="truncate"><p className="font-black text-white uppercase">{u.displayName}</p><p className="text-[7px] text-slate-600">{u.email}</p></div>
                      </td>
                      <td className="px-5 py-3 lg:px-6 lg:py-4"><UserBadge role={u.role} /></td>
                      <td className="px-5 py-3 lg:px-6 lg:py-4"><span className={`px-2 py-0.5 rounded-lg font-black uppercase border border-white/5 ${u.accountStatus === 'active' ? 'text-green-500' : 'text-red-500'}`}>{u.accountStatus}</span></td>
                      <td className="px-5 py-3 lg:px-6 lg:py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {u.accountStatus === 'pending' && <button onClick={() => handleApproveUser(u)} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg></button>}
                          {u.accountStatus !== 'banned' && <button onClick={() => handleUserAction(u.uid, 'ban')} className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></button>}
                          <button onClick={() => handleUserAction(u.uid, 'delete')} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
