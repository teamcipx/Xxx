
import React, { useState, useEffect } from 'react';
import { User, UserRole, Post, Comment, Transaction } from '../types';
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
  setDoc
} from 'firebase/firestore';
import { UserBadge } from '../components/UserBadge';

type AdminTab = 'overview' | 'members' | 'cashier' | 'police' | 'settings';

const AdminView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalPosts: 0, 
    totalComments: 0
  });

  useEffect(() => {
    fetchStats();
    
    const siteSettingsRef = doc(db, 'settings', 'site');
    const unsubscribeSettings = onSnapshot(siteSettingsRef, (doc) => {
      if (doc.exists()) setMaintenanceMode(doc.data().maintenanceMode || false);
    });

    const tQ = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const unsubscribeTx = onSnapshot(tQ, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });

    return () => {
      unsubscribeSettings();
      unsubscribeTx();
    };
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const uSnap = await getCountFromServer(collection(db, 'users'));
      const pSnap = await getCountFromServer(collection(db, 'posts'));
      const cSnap = await getCountFromServer(collection(db, 'comments'));
      
      const uQ = query(collection(db, 'users'), orderBy('joinedAt', 'desc'), limit(50));
      const uSnapshot = await getDocs(uQ);

      setUsers(uSnapshot.docs.map(doc => doc.data() as User));
      setStats({
        totalUsers: uSnap.data().count,
        totalPosts: pSnap.data().count,
        totalComments: cSnap.data().count
      });
    } finally { setLoading(false); }
  };

  const toggleMaintenance = async () => {
    const newValue = !maintenanceMode;
    await setDoc(doc(db, 'settings', 'site'), { maintenanceMode: newValue }, { merge: true });
  };

  const sidebarItems = [
    { id: 'overview', label: 'Monitor', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { id: 'members', label: 'Signals', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'cashier', label: 'Cashier', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'police', label: 'Police', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'settings', label: 'Core', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  if (loading) return <div className="py-20 text-center text-[10px] font-black uppercase tracking-[0.5em] text-rose-500 animate-pulse">Syncing Control Center...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fadeIn pb-20">
      <div className="lg:w-48 flex-shrink-0">
        <div className="flex lg:flex-col overflow-x-auto pb-2 lg:pb-0 gap-2 custom-scrollbar lg:sticky lg:top-24">
          {sidebarItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as AdminTab)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === item.id ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-slate-900/60 text-slate-500 hover:bg-slate-800'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { l: 'Members', v: stats.totalUsers, c: 'text-rose-500' },
              { l: 'Signals', v: stats.totalPosts, c: 'text-emerald-500' },
              { l: 'Voices', v: stats.totalComments, c: 'text-sky-500' },
            ].map((s, i) => (
              <div key={i} className="glass-effect p-6 rounded-3xl border border-white/5 text-center">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{s.l}</p>
                <p className={`text-2xl font-black ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="glass-effect rounded-[2rem] overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-900/50">
                  <tr className="text-slate-500 uppercase tracking-widest">
                    <th className="p-4">Signal</th>
                    <th className="p-4">Age/Gen</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={u.photoURL} className="w-8 h-8 rounded-xl object-cover" alt="u" />
                          <div>
                            <p className="font-bold text-slate-200">{u.displayName}</p>
                            <p className="text-slate-600 text-[8px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-lg font-black uppercase tracking-widest ${u.gender === 'Female' ? 'text-rose-400 bg-rose-400/10' : 'text-blue-400 bg-blue-400/10'}`}>
                          {u.age || '?'}/{u.gender?.charAt(0) || '?'}
                        </span>
                      </td>
                      <td className="p-4">
                         <div className="flex gap-2">
                           {u.socials?.telegram && <span className="text-sky-400 font-bold">TG</span>}
                           {u.socials?.facebook && <span className="text-blue-500 font-bold">FB</span>}
                         </div>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-rose-500 font-black uppercase hover:underline">Revoke</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass-effect p-8 rounded-[2rem] border border-white/5 space-y-6">
            <h3 className="text-xl font-black text-rose-500 uppercase tracking-tight">Forum Protocol</h3>
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-200 uppercase">Dark Room (Maintenance)</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1">When active, only high-clearance signals (Admins) can enter.</p>
              </div>
              <button onClick={toggleMaintenance} className={`w-14 h-8 rounded-full p-1 transition-all ${maintenanceMode ? 'bg-rose-600' : 'bg-slate-800'}`}>
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
