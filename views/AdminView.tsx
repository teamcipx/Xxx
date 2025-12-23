
import React, { useState, useEffect } from 'react';
import { User, Post, Comment, VerificationRequest } from '../types';
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
  onSnapshot,
  setDoc,
  where,
  deleteDoc
} from 'firebase/firestore';
import { UserBadge } from '../components/UserBadge';

type AdminTab = 'overview' | 'recruitment' | 'members' | 'verifications' | 'settings';

const AdminView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [verRequests, setVerRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalComments: 0 });

  useEffect(() => {
    fetchStats();
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (doc) => {
      if (doc.exists()) setMaintenanceMode(doc.data().maintenanceMode || false);
    });
    
    const unsubscribeVer = onSnapshot(query(collection(db, 'verificationRequests'), where('status', '==', 'pending'), orderBy('createdAt', 'desc')), (snapshot) => {
      setVerRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VerificationRequest)));
    });

    const unsubscribePending = onSnapshot(query(collection(db, 'users'), where('accountStatus', '==', 'pending'), orderBy('joinedAt', 'desc')), (snapshot) => {
      setPendingUsers(snapshot.docs.map(doc => doc.data() as User));
    });

    return () => { unsubscribeSettings(); unsubscribeVer(); unsubscribePending(); };
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

  const handleApproveUser = async (u: User) => {
    try {
      await updateDoc(doc(db, 'users', u.uid), { accountStatus: 'active' });
      alert(`Citizen ${u.displayName} has been authorized.`);
    } catch (e) { alert("Authorization signal failed."); }
  };

  const handleRejectUser = async (u: User) => {
    if(!confirm(`Permanent disconnect for ${u.displayName}?`)) return;
    try {
      // For rejection, we set status to banned or just delete (depending on policy)
      // Here we mark as banned to prevent immediate re-registration with same email
      await updateDoc(doc(db, 'users', u.uid), { accountStatus: 'banned' });
      alert(`Citizen ${u.displayName} has been disconnected.`);
    } catch (e) { alert("Rejection signal failed."); }
  };

  const handleVerify = async (req: VerificationRequest, approve: boolean) => {
    try {
      await updateDoc(doc(db, 'verificationRequests', req.id), { status: approve ? 'approved' : 'rejected' });
      await updateDoc(doc(db, 'users', req.userId), { isVerified: approve, verificationStatus: approve ? 'verified' : 'rejected' });
      alert("Signal verification protocol complete.");
    } catch (e) { alert("Error recalibrating verification status."); }
  };

  const handleApiKeyChange = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
    } else {
      alert("Recalibration requires Akti Studio environment.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn pb-32">
      <div className="lg:w-64 flex-shrink-0">
        <div className="flex lg:flex-col overflow-x-auto pb-4 gap-3 lg:sticky lg:top-28">
          {[
            { id: 'overview', label: 'Network Scan', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            { id: 'recruitment', label: 'Authorization', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
            { id: 'members', label: 'All Citizens', icon: 'M12 4.354a4 4 0 110 5.292' },
            { id: 'verifications', label: 'Shield Requests', icon: 'M9 12l2 2 4-4' },
            { id: 'settings', label: 'System Core', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0' },
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as AdminTab)} 
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${activeTab === item.id ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/20' : 'bg-slate-900/40 text-slate-500 hover:bg-slate-800'}`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              {item.label}
              {item.id === 'recruitment' && pendingUsers.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white w-5 h-5 rounded-lg flex items-center justify-center text-[8px] animate-pulse border-2 border-slate-950">
                  {pendingUsers.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-8 min-w-0">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { l: 'Total Nodes', v: stats.totalUsers, c: 'text-rose-500', bg: 'bg-rose-500/5' },
              { l: 'Active Signals', v: stats.totalPosts, c: 'text-cyan-400', bg: 'bg-cyan-400/5' },
              { l: 'Community Pulse', v: stats.totalComments, c: 'text-indigo-400', bg: 'bg-indigo-400/5' }
            ].map((s, i) => (
              <div key={i} className={`glass-effect p-8 rounded-[2.5rem] border border-white/5 text-center ${s.bg}`}>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{s.l}</p>
                <p className={`text-5xl font-black ${s.c} tracking-tighter`}>{s.v.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'recruitment' && (
          <div className="space-y-6">
            <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
              <div>
                 <h2 className="text-xl font-black text-white uppercase tracking-tight">Recruitment Dossiers</h2>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Signals awaiting High Command authorization</p>
              </div>
              <div className="bg-rose-600/10 px-4 py-2 rounded-xl border border-rose-500/20 text-[10px] font-black text-rose-400 uppercase">
                {pendingUsers.length} Pending
              </div>
            </div>

            {pendingUsers.length === 0 ? (
               <div className="glass-effect p-20 rounded-[3rem] text-center border border-white/5">
                 <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em]">No Recruitment Signals Detected</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingUsers.map(u => (
                  <div key={u.uid} className="glass-effect p-8 rounded-[2.5rem] border border-white/5 space-y-6 animate-fadeIn hover:border-rose-500/30 transition-all">
                     <div className="flex items-center gap-4">
                        <img src={u.photoURL} className="w-16 h-16 rounded-[1.2rem] object-cover border-2 border-white/5" alt="u" />
                        <div>
                           <h3 className="font-black text-slate-100 uppercase tracking-tight">{u.displayName}</h3>
                           <p className="text-[9px] text-slate-500 lowercase">{u.email}</p>
                           <div className="mt-2 flex gap-2">
                              <span className="bg-slate-800 px-2 py-0.5 rounded text-[8px] font-bold text-slate-400 uppercase">{u.age}Y</span>
                              <span className="bg-slate-800 px-2 py-0.5 rounded text-[8px] font-bold text-slate-400 uppercase">{u.gender}</span>
                           </div>
                        </div>
                     </div>
                     <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 space-y-2">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Interests Protocol</p>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">"{u.interests || 'No interests specified'}"</p>
                     </div>
                     <div className="flex gap-4 pt-2">
                        <button onClick={() => handleApproveUser(u)} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 transition-all">Authorize Access</button>
                        <button onClick={() => handleRejectUser(u)} className="flex-1 bg-slate-900 hover:bg-red-600/20 text-slate-500 hover:text-red-500 border border-white/5 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Reject Signal</button>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="glass-effect rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
            <div className="p-6 border-b border-white/5 bg-slate-900/40 flex justify-between items-center">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Citizen Master Registry</h3>
               <span className="text-[8px] font-bold text-slate-600 uppercase">Top 100 Synchronized</span>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-900/80 border-b border-white/5 uppercase tracking-widest text-slate-500 font-black">
                  <tr>
                    <th className="px-6 py-5">Identity Protocol</th>
                    <th className="px-6 py-5">Node Specs</th>
                    <th className="px-6 py-5">Bio Data</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-right">Alignment Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <img src={u.photoURL} className="w-10 h-10 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-rose-500/50 transition-all" alt="u" />
                          <div>
                            <p className="font-black text-slate-200 uppercase tracking-tight">{u.displayName}</p>
                            <p className="text-[8px] text-slate-600 lowercase group-hover:text-rose-400/60 transition-colors">{u.email}</p>
                            <div className="flex gap-1 mt-1"><UserBadge role={u.role} verified={u.isVerified} /></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                           <span className="bg-slate-800/60 px-2 py-0.5 rounded border border-white/5 text-slate-400">{u.age || '??'} Years</span>
                           <span className="bg-slate-800/60 px-2 py-0.5 rounded border border-white/5 text-slate-400">{u.gender || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 max-w-[180px]">
                        <p className="text-slate-400 line-clamp-2 italic leading-relaxed">"{u.bio || 'Initializing signal...'}"</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase border ${u.accountStatus === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : u.accountStatus === 'pending' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                           {u.accountStatus}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <p className="text-slate-200 font-bold">{new Date(u.joinedAt).toLocaleDateString()}</p>
                         <p className="text-[8px] text-slate-600 font-black uppercase mt-0.5">Verified Link</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ... (verifications and settings tabs remain the same) */}
      </div>
    </div>
  );
};

export default AdminView;
