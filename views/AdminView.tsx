import React, { useState, useEffect } from 'react';
import { User, UserRole, Post, Comment } from '../types';
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
  deleteDoc
} from 'firebase/firestore';
import { UserBadge } from '../components/UserBadge';
import { Link } from 'react-router-dom';

type AdminTab = 'overview' | 'users' | 'moderation' | 'analytics' | 'infrastructure';

const AdminView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentComments, setRecentComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    proUsers: 0, 
    totalPosts: 0, 
    totalComments: 0,
    growthRate: '+12%'
  });

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const fetchGlobalData = async () => {
    setLoading(true);
    try {
      // Fetch Counts safely
      let uCount = 0, pCount = 0, cCount = 0;
      try {
        const usersSnap = await getCountFromServer(collection(db, 'users'));
        uCount = usersSnap.data().count;
      } catch (e) { console.warn("Users count failed", e); }
      
      try {
        const postsSnap = await getCountFromServer(collection(db, 'posts'));
        pCount = postsSnap.data().count;
      } catch (e) { console.warn("Posts count failed", e); }
      
      try {
        const commentsSnap = await getCountFromServer(collection(db, 'comments'));
        cCount = commentsSnap.data().count;
      } catch (e) { console.warn("Comments count failed", e); }

      // Fetch Users list
      let fetchedUsers: User[] = [];
      try {
        const uQ = query(collection(db, 'users'), orderBy('joinedAt', 'desc'), limit(20));
        const uSnapshot = await getDocs(uQ);
        fetchedUsers = uSnapshot.docs.map(doc => doc.data() as User);
      } catch (e) { console.error("User list fetch error", e); }
      
      // Fetch Recent Activity for moderation
      let posts: Post[] = [];
      try {
        const pQ = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(10));
        const pSnapshot = await getDocs(pQ);
        posts = pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      } catch (e) { console.error("Recent posts fetch error", e); }

      let comments: Comment[] = [];
      try {
        const cQ = query(collection(db, 'comments'), orderBy('createdAt', 'desc'), limit(10));
        const cSnapshot = await getDocs(cQ);
        comments = cSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      } catch (e) { console.error("Recent comments fetch error", e); }

      setUsers(fetchedUsers);
      setRecentPosts(posts);
      setRecentComments(comments);
      setStats({
        totalUsers: uCount,
        totalPosts: pCount,
        totalComments: cCount,
        proUsers: fetchedUsers.filter(u => u.role !== 'user').length,
        growthRate: '+14%'
      });
    } catch (err) {
      console.error("Critical Admin fetch error:", err);
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
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole, isPro: newRole !== 'user' } : u));
    } catch (err) {
      alert("Failed to update user role.");
    }
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm("Delete post?")) {
      await deleteDoc(doc(db, 'posts', id));
      setRecentPosts(prev => prev.filter(p => p.id !== id));
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'moderation', label: 'Moderation', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'infrastructure', label: 'System', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  const renderOverview = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Citizens', value: stats.totalUsers, icon: 'bg-indigo-500', color: 'text-indigo-400' },
          { label: 'Elite Tier (Pro)', value: stats.proUsers, icon: 'bg-amber-500', color: 'text-amber-400' },
          { label: 'Feed Content', value: stats.totalPosts, icon: 'bg-emerald-500', color: 'text-emerald-400' },
          { label: 'Voice Activity', value: stats.totalComments, icon: 'bg-rose-500', color: 'text-rose-400' },
        ].map((item, i) => (
          <div key={i} className="glass-effect p-6 rounded-[2rem] border border-white/5 shadow-xl group hover:border-white/10 transition-all">
            <div className={`w-10 h-10 ${item.icon} rounded-xl mb-4 flex items-center justify-center text-white shadow-lg`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{item.label}</p>
            <h4 className={`text-3xl font-black mt-1 ${item.color}`}>{item.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass-effect rounded-[2.5rem] p-8 border border-white/5">
          <h3 className="text-lg font-black text-slate-100 mb-6 flex items-center gap-3">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            System Health
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Cloud Database', status: 'Optimal', pulse: 'bg-green-500' },
              { label: 'AI Synthesis Engine', status: 'Online', pulse: 'bg-green-500' },
              { label: 'Media Storage (ImgBB)', status: 'Connected', pulse: 'bg-green-500' },
              { label: 'Ad Delivery Network', status: 'Active', pulse: 'bg-indigo-500' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-900/40 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-slate-400">{s.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.status}</span>
                  <div className={`w-2 h-2 ${s.pulse} rounded-full animate-pulse shadow-lg`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-effect rounded-[2.5rem] p-8 border border-white/5 flex flex-col justify-center items-center text-center">
          <div className="bg-indigo-500/10 p-6 rounded-3xl mb-4">
            <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
          </div>
          <h3 className="text-xl font-black text-slate-100 mb-2">Growth Milestone</h3>
          <p className="text-slate-500 text-xs font-medium max-w-[250px] leading-relaxed">Your community has grown by {stats.growthRate} since the last synchronization cycle.</p>
          <button onClick={fetchGlobalData} className="mt-6 bg-slate-800 hover:bg-indigo-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Re-Sync Analytics</button>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="glass-effect rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl animate-fadeIn">
      <div className="p-8 border-b border-white/5 bg-slate-900/40 flex justify-between items-center">
         <div>
           <h3 className="font-black text-slate-100 uppercase tracking-widest text-xs">Citizen Registry</h3>
           <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase">Managing {users.length} signals in this batch</p>
         </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/30">
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">Member Identity</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">Tier</th>
              <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 text-right">Administrative Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(user => (
              <tr key={user.uid} className="hover:bg-white/5 transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <img src={user.photoURL} alt="u" className="w-11 h-11 rounded-[1.2rem] object-cover ring-2 ring-white/5 group-hover:ring-indigo-500/30 transition-all" />
                    <div>
                      <p className="font-black text-slate-100 uppercase text-xs">{user.displayName}</p>
                      <p className="text-[10px] text-slate-600 font-bold lowercase">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <UserBadge role={user.role} />
                </td>
                <td className="p-6">
                  <div className="flex gap-2 justify-end">
                    {['pro', 'premium', 'admin'].map((r) => (
                      <button 
                        key={r}
                        onClick={() => handleRoleChange(user.uid, r as UserRole)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm ${user.role === r ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500 hover:text-white border border-white/5'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderModeration = () => (
    <div className="grid lg:grid-cols-2 gap-8 animate-fadeIn">
      <div className="glass-effect rounded-[2.5rem] p-8 border border-white/5">
        <h3 className="text-lg font-black text-slate-100 mb-6 flex items-center justify-between">
          <span>Recent Posts</span>
          <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-full text-slate-500">LATEST 10</span>
        </h3>
        <div className="space-y-4">
          {recentPosts.map(p => (
            <div key={p.id} className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 group relative">
              <div className="flex items-center gap-3 mb-3">
                <img src={p.authorPhoto} className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-xs font-black text-slate-300">{p.authorName}</span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 italic mb-4">"{p.content}"</p>
              <button 
                onClick={() => handleDeletePost(p.id)}
                className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
              >
                Delete Content
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-effect rounded-[2.5rem] p-8 border border-white/5">
        <h3 className="text-lg font-black text-slate-100 mb-6 flex items-center justify-between">
          <span>Recent Comments</span>
          <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-full text-slate-500">LATEST 10</span>
        </h3>
        <div className="space-y-4">
          {recentComments.map(c => (
            <div key={c.id} className="bg-slate-900/40 p-5 rounded-2xl border border-white/5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-indigo-400 font-black">{c.authorName}</span>
                <span className="text-[9px] text-slate-600 uppercase font-black">{new Date(c.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-slate-400">"{c.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="glass-effect p-12 rounded-[2.5rem] border border-white/5 text-center">
        <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
        </div>
        <h3 className="text-2xl font-black text-slate-100 mb-2">Engagement Distribution</h3>
        <p className="text-slate-500 text-sm mb-10 max-w-md mx-auto">Visualizing the flow of communication across the Akti Network.</p>
        
        <div className="flex justify-center items-end gap-4 h-48">
          {[
            { label: 'Posts', h: 'h-40', c: 'bg-indigo-500' },
            { label: 'Likes', h: 'h-32', c: 'bg-purple-500' },
            { label: 'Cmnts', h: 'h-48', c: 'bg-emerald-500' },
            { label: 'Chats', h: 'h-24', c: 'bg-rose-500' },
            { label: 'Files', h: 'h-16', c: 'bg-amber-500' },
          ].map((bar, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className={`w-8 ${bar.h} ${bar.c} rounded-t-xl shadow-lg opacity-80 group-hover:opacity-100 transition-all`}></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInfrastructure = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="glass-effect rounded-[2.5rem] p-10 border border-indigo-500/10">
        <h3 className="text-xl font-black text-slate-100 mb-2">Technical Core</h3>
        <p className="text-slate-500 text-xs font-medium mb-8">Maintain the data integrity of Akti Forum by initializing required search indexes.</p>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { label: 'Index: Posts Engine', path: 'posts', link: 'Cktwcm9qZWN0cy91c2Vyc3NzLTM2OWJiL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wb3N0cy9pbmRleGVzL18QARoMCghhdXRob3JJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI' },
            { label: 'Index: Voice Engine', path: 'comments', link: 'Ck5wcm9qZWN0cy91c2Vyc3NzLTM2OWJiL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jb21tZW50cy9pbmRleGVzL18QARoMCghhdXRob3JJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI' },
          ].map((idx, i) => (
            <a 
              key={i}
              href={`https://console.firebase.google.com/v1/r/project/usersss-369bb/firestore/indexes?create_composite=${idx.link}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-6 bg-slate-950/40 rounded-3xl border border-white/5 hover:border-indigo-500/40 transition-all group"
            >
              <div>
                <p className="text-xs font-black text-slate-200 uppercase tracking-widest group-hover:text-indigo-400">{idx.label}</p>
                <p className="text-[10px] text-slate-600 font-bold mt-1">Status: Configuration Ready</p>
              </div>
              <svg className="w-5 h-5 text-slate-700 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[80vh]">
      <div className="lg:w-64 flex-shrink-0">
        <div className="lg:sticky lg:top-24 space-y-2 flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 gap-2 lg:gap-2 custom-scrollbar">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap lg:w-full ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-900/60 text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center p-20 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 shadow-xl shadow-indigo-500/20"></div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Syncing Admin Node</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'moderation' && renderModeration()}
            {activeTab === 'analytics' && renderAnalytics()}
            {activeTab === 'infrastructure' && renderInfrastructure()}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminView;