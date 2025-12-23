
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
  where
} from 'firebase/firestore';
import { UserBadge } from '../components/UserBadge';

type AdminTab = 'overview' | 'members' | 'verifications' | 'settings';

const AdminView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
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
    return () => { unsubscribeSettings(); unsubscribeVer(); };
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
            { id: 'members', label: 'All Citizens', icon: 'M12 4.354a4 4 0 110 5.292' },
            { id: 'verifications', label: 'Shield Requests', icon: 'M9 12l2 2 4-4' },
            { id: 'settings', label: 'System Core', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0' },
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as AdminTab)} 
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === item.id ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/20' : 'bg-slate-900/40 text-slate-500 hover:bg-slate-800'}`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              {item.label}
              {item.id === 'verifications' && verRequests.length > 0 && (
                <span className="ml-auto bg-cyan-400 text-slate-950 w-5 h-5 rounded-lg flex items-center justify-center text-[8px] animate-pulse">
                  {verRequests.length}
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
                    <th className="px-6 py-5">Connections</th>
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
                        <div className="flex flex-col gap-1">
                           <span className="text-indigo-400 lowercase truncate max-w-[100px]">{u.socials?.telegram || 'No TG'}</span>
                           <span className="text-indigo-400 lowercase truncate max-w-[100px]">{u.socials?.facebook || 'No FB'}</span>
                        </div>
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

        {activeTab === 'verifications' && (
          <div className="grid grid-cols-1 gap-6">
            {verRequests.length === 0 ? (
               <div className="glass-effect p-20 rounded-[3rem] text-center border border-white/5">
                 <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em]">No Pending Shield Signals</p>
               </div>
            ) : (
              verRequests.map(req => (
                <div key={req.id} className="glass-effect p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row gap-8 items-center animate-fadeIn">
                   <img src={req.imageUrl} className="w-full md:w-64 h-48 object-cover rounded-3xl border border-white/10" alt="v" />
                   <div className="flex-1 space-y-4 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-4">
                        <img src={req.userPhoto} className="w-12 h-12 rounded-xl" alt="p" />
                        <div>
                          <h4 className="text-xl font-black text-white uppercase">{req.userName}</h4>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Citizen Alignment Request</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                         <button onClick={() => handleVerify(req, true)} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95">Approve Shield</button>
                         <button onClick={() => handleVerify(req, false)} className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">Reject Signal</button>
                      </div>
                   </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass-effect p-12 rounded-[3rem] border border-white/5 space-y-12">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">Dark Room Protocol</h3>
                <p className="text-[10px] text-slate-600 font-bold uppercase mt-2 tracking-widest">Isolate network for maintenance.</p>
              </div>
              <button 
                onClick={() => setDoc(doc(db, 'settings', 'site'), { maintenanceMode: !maintenanceMode }, { merge: true })} 
                className={`w-20 h-10 rounded-full p-1.5 transition-all relative ${maintenanceMode ? 'bg-rose-600' : 'bg-slate-800'}`}
              >
                <div className={`w-7 h-7 bg-white rounded-full shadow-2xl transition-transform duration-500 ${maintenanceMode ? 'translate-x-10' : 'translate-x-0'}`}></div>
              </button>
            </div>
            
            <div className="pt-12 border-t border-white/5">
              <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight mb-6">Network Intelligence</h3>
              <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-white/5 space-y-6">
                 <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                   Akti Elite relies on high-tier Gemini intelligence for bio generation and support responses. Recalibrate the access key if signal degradation occurs.
                 </p>
                 <button onClick={handleApiKeyChange} className="w-full bg-slate-900 border border-white/10 hover:border-indigo-500/50 text-indigo-400 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] transition-all shadow-xl">
                   Recalibrate API Access
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
