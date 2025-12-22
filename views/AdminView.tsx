
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/firebase';
import { collection, query, getDocs, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { UserBadge } from '../components/UserBadge';

const AdminView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, proUsers: 0 });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('joinedAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const fetchedUsers = snapshot.docs.map(doc => doc.data() as User);
      setUsers(fetchedUsers);
      
      setStats({
        totalUsers: fetchedUsers.length,
        proUsers: fetchedUsers.filter(u => u.isPro || u.role !== 'user').length
      });
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { 
        role: newRole,
        isPro: newRole !== 'user'
      });
      // Refresh local state
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole, isPro: newRole !== 'user' } : u));
    } catch (err) {
      alert("Failed to update user role.");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 glass-effect rounded-[2.5rem] p-8 border border-red-500/10 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-24 h-24 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.9L10 1.55l7.834 3.35a1 1 0 01.666.935V10c0 5.165-3.085 9.073-7.834 10.32a1 1 0 01-.666 0C5.085 19.073 2 15.165 2 10V5.835a1 1 0 01.666-.935zM10 4.545L4 7.11v2.89c0 3.79 2.067 6.64 6 7.825 3.933-1.186 6-4.035 6-7.825V7.11l-6-2.565z" clipRule="evenodd" /></svg>
           </div>
           <h2 className="text-2xl font-black text-slate-100 mb-2">Admin Dashboard</h2>
           <p className="text-slate-400 text-sm font-medium">Manage citizens, approve upgrades, and secure the forum.</p>
           
           <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                 <p className="text-3xl font-black text-indigo-400 tracking-tighter">{stats.totalUsers}</p>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Signals Registered</p>
              </div>
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                 <p className="text-3xl font-black text-amber-500 tracking-tighter">{stats.proUsers}</p>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Elite Entities</p>
              </div>
           </div>
        </div>

        <div className="md:w-1/3 glass-effect rounded-[2.5rem] p-8 border border-white/5 flex flex-col justify-center gap-4">
           <h3 className="text-slate-100 font-black text-xs uppercase tracking-widest">System Health</h3>
           <div className="space-y-3">
             <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-white/5">
                <span className="text-[10px] font-bold text-slate-400">Database Status</span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/20"></span>
             </div>
             <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-white/5">
                <span className="text-[10px] font-bold text-slate-400">GenAI Connection</span>
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-lg shadow-indigo-500/20"></span>
             </div>
           </div>
           <button onClick={fetchUsers} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95">Sync Data</button>
        </div>
      </div>

      {/* "Links koi?" - Important setup links for Admin */}
      <div className="glass-effect rounded-[2rem] p-8 border border-indigo-500/10 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <svg className="w-20 h-20 text-indigo-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
        </div>
        <h3 className="text-lg font-black text-slate-100 mb-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
          Infrastructure Links
        </h3>
        <p className="text-slate-500 text-xs font-medium mb-6">Initialize the following Firestore composite indexes for profile activity to function properly:</p>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <a 
            href="https://console.firebase.google.com/v1/r/project/usersss-369bb/firestore/indexes?create_composite=Cktwcm9qZWN0cy91c2Vyc3NzLTM2OWJiL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wb3N0cy9pbmRleGVzL18QARoMCghhdXRob3JJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-5 bg-slate-950/50 rounded-2xl border border-white/5 hover:border-indigo-500/40 transition-all group"
          >
            <div>
              <p className="text-xs font-black text-slate-200 uppercase tracking-widest group-hover:text-indigo-400">Index: Posts Activity</p>
              <p className="text-[10px] text-slate-600 font-bold mt-1">authorId + createdAt</p>
            </div>
            <svg className="w-5 h-5 text-slate-700 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
          
          <a 
            href="https://console.firebase.google.com/v1/r/project/usersss-369bb/firestore/indexes?create_composite=Ck5wcm9qZWN0cy91c2Vyc3NzLTM2OWJiL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jb21tZW50cy9pbmRleGVzL18QARoMCghhdXRob3JJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-5 bg-slate-950/50 rounded-2xl border border-white/5 hover:border-indigo-500/40 transition-all group"
          >
            <div>
              <p className="text-xs font-black text-slate-200 uppercase tracking-widest group-hover:text-indigo-400">Index: Comments Activity</p>
              <p className="text-[10px] text-slate-600 font-bold mt-1">authorId + createdAt</p>
            </div>
            <svg className="w-5 h-5 text-slate-700 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>
      </div>

      <div className="glass-effect rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-slate-900/40 flex justify-between items-center">
           <h3 className="font-black text-slate-100 uppercase tracking-widest text-[10px]">Citizen Registry (Latest 50)</h3>
           <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-4 py-1 rounded-full uppercase tracking-widest">Active Database View</span>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/30">
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">Member Identity</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">Signal Arrival</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">Current Tier</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 border-b-2 border-transparent mx-auto"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-slate-600 font-black uppercase text-xs tracking-widest italic">No citizen signals detected in the registry.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.uid} className="hover:bg-white/5 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <img src={user.photoURL} alt="u" className="w-11 h-11 rounded-[1.2rem] object-cover bg-slate-800 ring-2 ring-white/5 group-hover:ring-indigo-500/30 transition-all" />
                        <div>
                          <p className="font-black text-slate-100 leading-tight group-hover:text-indigo-400 transition-colors uppercase text-xs">{user.displayName}</p>
                          <p className="text-[10px] text-slate-600 font-bold mt-1 lowercase">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                      {new Date(user.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-6">
                      <UserBadge role={user.role} className="!px-3 !py-1 !text-[9px]" />
                    </td>
                    <td className="p-6">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => handleRoleChange(user.uid, 'pro')}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm ${user.role === 'pro' ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 text-slate-500 hover:text-amber-500 border border-white/5 hover:bg-slate-800'}`}
                        >
                          PRO
                        </button>
                        <button 
                          onClick={() => handleRoleChange(user.uid, 'premium')}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm ${user.role === 'premium' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500 hover:text-indigo-400 border border-white/5 hover:bg-slate-800'}`}
                        >
                          PREMIUM
                        </button>
                        <button 
                          onClick={() => handleRoleChange(user.uid, 'admin')}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm ${user.role === 'admin' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-500 hover:text-red-400 border border-white/5 hover:bg-slate-800'}`}
                        >
                          ADMIN
                        </button>
                        {user.role !== 'user' && (
                          <button 
                            onClick={() => handleRoleChange(user.uid, 'user')}
                            className="p-1.5 bg-slate-950 text-slate-800 hover:text-white hover:bg-red-900/20 rounded-xl transition-all"
                            title="Revoke Special Access"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
