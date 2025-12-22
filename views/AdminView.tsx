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
  onSnapshot
} from 'firebase/firestore';
import { UserBadge } from '../components/UserBadge';

type AdminTab = 'overview' | 'users' | 'payments' | 'moderation' | 'analytics';

const AdminView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    proUsers: 0, 
    totalPosts: 0, 
    totalComments: 0
  });

  useEffect(() => {
    fetchStats();
    const tQ = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(tQ, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });
    return unsubscribe;
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const uSnap = await getCountFromServer(collection(db, 'users'));
      const pSnap = await getCountFromServer(collection(db, 'posts'));
      const cSnap = await getCountFromServer(collection(db, 'comments'));
      
      const uQ = query(collection(db, 'users'), orderBy('joinedAt', 'desc'), limit(20));
      const uSnapshot = await getDocs(uQ);
      
      const pQ = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(10));
      const pSnapshot = await getDocs(pQ);

      setUsers(uSnapshot.docs.map(doc => doc.data() as User));
      setRecentPosts(pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
      setStats({
        totalUsers: uSnap.data().count,
        totalPosts: pSnap.data().count,
        totalComments: cSnap.data().count,
        proUsers: 0 // Placeholder
      });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Stats', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { id: 'users', label: 'Members', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'payments', label: 'Cashier', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'moderation', label: 'Police', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  ];

  if (loading) return <div className="py-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Accessing Dashboard...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Tab Navigation - Scrollable on Mobile */}
      <div className="lg:w-48 flex-shrink-0">
        <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 gap-2 custom-scrollbar lg:sticky lg:top-24">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-500 hover:bg-slate-800'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { l: 'Users', v: stats.totalUsers, c: 'text-indigo-400' },
              { l: 'Posts', v: stats.totalPosts, c: 'text-emerald-400' },
              { l: 'Voices', v: stats.totalComments, c: 'text-rose-400' },
              { l: 'Pending', v: transactions.filter(t => t.status === 'pending').length, c: 'text-amber-400' },
            ].map((s, i) => (
              <div key={i} className="glass-effect p-4 rounded-2xl border border-white/5 text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.l}</p>
                <p className={`text-xl font-black ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-effect rounded-2xl overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-900/50">
                  <tr><th className="p-4 uppercase tracking-widest text-slate-500">Citizen</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-white/5">
                      <td className="p-4 flex items-center gap-3">
                        <img src={u.photoURL} className="w-6 h-6 rounded-lg object-cover" alt="u" />
                        <span className="font-bold text-slate-300">{u.displayName}</span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-indigo-400 font-black uppercase hover:underline">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-4">
            {transactions.filter(t => t.status === 'pending').map(tx => (
              <div key={tx.id} className="glass-effect p-4 rounded-2xl border border-amber-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-200">{tx.userName}</p>
                  <p className="text-[9px] text-indigo-400 font-mono mt-1">{tx.txId}</p>
                </div>
                <div className="flex gap-2">
                  <button className="bg-emerald-600/20 text-emerald-400 p-2 rounded-xl"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                  <button className="bg-red-600/20 text-red-400 p-2 rounded-xl"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              </div>
            ))}
            {transactions.filter(t => t.status === 'pending').length === 0 && <p className="text-center py-10 text-[9px] text-slate-600 font-bold uppercase tracking-widest">No pending transactions</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;