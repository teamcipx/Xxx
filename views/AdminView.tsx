
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
  onSnapshot,
  setDoc,
  where
} from 'firebase/firestore';
import { UserBadge } from '../components/UserBadge';

// The aistudio property and AIStudio type are already defined in the global scope by the environment.
// Manual re-declaration causes conflicts with existing types and modifiers.

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
      setStats({ totalUsers: uSnap.data().count, totalPosts: pSnap.data().count, totalComments: cSnap.data().count });
    } finally { setLoading(false); }
  };

  const handleVerify = async (req: VerificationRequest, approve: boolean) => {
    try {
      await updateDoc(doc(db, 'verificationRequests', req.id), { status: approve ? 'approved' : 'rejected' });
      await updateDoc(doc(db, 'users', req.userId), { isVerified: approve, verificationStatus: approve ? 'verified' : 'rejected' });
      alert("Signal processing complete.");
    } catch (e) { alert("Error updating signal."); }
  };

  const handleApiKeyChange = async () => {
    // Relying on the global window.aistudio object provided by the environment.
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
    } else {
      alert("API Key Management requires the Akti Studio Environment.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn pb-32">
      <div className="lg:w-64 flex-shrink-0">
        <div className="flex lg:flex-col overflow-x-auto pb-4 gap-3 lg:sticky lg:top-28">
          {[
            { id: 'overview', label: 'Monitor', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            { id: 'members', label: 'Citizens', icon: 'M12 4.354a4 4 0 110 5.292' },
            { id: 'verifications', label: 'Shields', icon: 'M9 12l2 2 4-4' },
            { id: 'settings', label: 'System', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0' },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as AdminTab)} className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === item.id ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-900/40 text-slate-500 hover:bg-slate-800'}`}>
              {item.label}
              {item.id === 'verifications' && verRequests.length > 0 && <span className="ml-auto w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-8 min-w-0">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{ l: 'Users', v: stats.totalUsers, c: 'text-rose-500' }, { l: 'Signals', v: stats.totalPosts, c: 'text-cyan-400' }, { l: 'Voices', v: stats.totalComments, c: 'text-indigo-400' }].map((s, i) => (
              <div key={i} className="glass-effect p-8 rounded-[2.5rem] border border-white/5 text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.l}</p>
                <p className={`text-4xl font-black ${s.c} tracking-tighter`}>{s.v}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="glass-effect rounded-[2.5rem] overflow-hidden border border-white/5">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-900/80 border-b border-white/5 uppercase tracking-widest text-slate-500 font-black">
                  <tr>
                    <th className="px-6 py-4">Identity</th>
                    <th className="px-6 py-4">Specs</th>
                    <th className="px-6 py-4">Bio</th>
                    <th className="px-6 py-4 text-right">Join Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={u.photoURL} className="w-8 h-8 rounded-lg object-cover" alt="u" />
                          <div><p className="font-black text-slate-200 uppercase">{u.displayName}</p><p className="text-[8px] text-slate-600 lowercase">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                           <span className="bg-slate-800 px-2 py-0.5 rounded border border-white/5">{u.age || '?'}Y</span>
                           <span className="bg-slate-800 px-2 py-0.5 rounded border border-white/5">{u.gender || '?'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[150px] truncate text-slate-400">{u.bio || 'No signal data'}</td>
                      <td className="px-6 py-4 text-right text-slate-600">{new Date(u.joinedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass-effect p-10 rounded-[2.5rem] border border-white/5 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-200 uppercase tracking-widest">Dark Room Protocol</p>
                <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">Maintenance mode activation.</p>
              </div>
              <button onClick={() => setDoc(doc(db, 'settings', 'site'), { maintenanceMode: !maintenanceMode }, { merge: true })} className={`w-14 h-8 rounded-full p-1 transition-all ${maintenanceMode ? 'bg-rose-600' : 'bg-slate-800'}`}>
                <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
            <div className="pt-6 border-t border-white/5">
              <button onClick={handleApiKeyChange} className="w-full bg-slate-900 border border-white/10 hover:border-rose-500/50 text-slate-300 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                Change API Access Key
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
