
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
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 glass-effect rounded-[2rem] p-8 border border-red-500/10 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-24 h-24 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.9L10 1.55l7.834 3.35a1 1 0 01.666.935V10c0 5.165-3.085 9.073-7.834 10.32a1 1 0 01-.666 0C5.085 19.073 2 15.165 2 10V5.835a1 1 0 01.666-.935zM10 4.545L4 7.11v2.89c0 3.79 2.067 6.64 6 7.825 3.933-1.186 6-4.035 6-7.825V7.11l-6-2.565z" clipRule="evenodd" /></svg>
           </div>
           <h2 className="text-2xl font-black text-slate-100 mb-2">Admin Dashboard</h2>
           <p className="text-slate-400 text-sm font-medium">Manage citizens, approve upgrades, and secure the forum.</p>
           
           <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5">
                 <p className="text-3xl font-black text-indigo-400">{stats.totalUsers}</p>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Signals</p>
              </div>
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5">
                 <p className="text-3xl font-black text-amber-500">{stats.proUsers}</p>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Tiered Members</p>
              </div>
           </div>
        </div>

        <div className="md:w-1/3 glass-effect rounded-[2rem] p-8 border border-white/5 flex flex-col justify-center items-center text-center">
           <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-4">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
           </div>
           <h3 className="text-slate-100 font-bold mb-1">Quick Actions</h3>
           <p className="text-slate-500 text-xs mb-4">Moderation shortcuts</p>
           <button onClick={fetchUsers} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-sm font-bold transition-all">Refresh User List</button>
        </div>
      </div>

      <div className="glass-effect rounded-[2rem] overflow-hidden border border-white/5 shadow-xl">
        <div className="p-6 border-b border-white/5 bg-slate-900/40 flex justify-between items-center">
           <h3 className="font-black text-slate-100 uppercase tracking-widest text-xs">Citizen Registry</h3>
           <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-full uppercase tracking-tighter">Recent Arrivals First</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/20">
                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Member</th>
                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Arrival</th>
                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Current Tier</th>
                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Administrative Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-500 italic">No citizens found in the registry.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.uid} className="hover:bg-white/5 transition-colors group">
                    <td className="p-5 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <img src={user.photoURL} alt="u" className="w-10 h-10 rounded-xl object-cover bg-slate-800" />
                        <div>
                          <p className="font-bold text-slate-100 leading-tight group-hover:text-indigo-400 transition-colors">{user.displayName}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 border-b border-white/5 text-xs text-slate-400 font-medium">
                      {new Date(user.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="p-5 border-b border-white/5">
                      <UserBadge role={user.role} />
                    </td>
                    <td className="p-5 border-b border-white/5">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleRoleChange(user.uid, 'pro')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${user.role === 'pro' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' : 'bg-slate-800 text-slate-400 hover:text-amber-400 border border-white/5'}`}
                        >
                          PRO
                        </button>
                        <button 
                          onClick={() => handleRoleChange(user.uid, 'premium')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${user.role === 'premium' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:text-indigo-400 border border-white/5'}`}
                        >
                          PREMIUM
                        </button>
                        <button 
                          onClick={() => handleRoleChange(user.uid, 'admin')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${user.role === 'admin' ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 'bg-slate-800 text-slate-400 hover:text-red-400 border border-white/5'}`}
                        >
                          ADMIN
                        </button>
                        {user.role !== 'user' && (
                          <button 
                            onClick={() => handleRoleChange(user.uid, 'user')}
                            className="px-3 py-1.5 bg-slate-900 text-slate-600 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
                          >
                            REVOKE
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
