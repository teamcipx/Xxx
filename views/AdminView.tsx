
import React, { useState, useEffect, useRef } from 'react';
import { User, Post, Comment, VerificationRequest, Transaction, Report, AdminMessage } from '../types';
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
  where,
  addDoc
} from 'firebase/firestore';
import { UserBadge } from '../components/UserBadge';

type AdminTab = 'overview' | 'recruitment' | 'members' | 'payments' | 'karen' | 'inbox' | 'settings';

const AdminView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Transaction[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  // Inbox State
  const [conversations, setConversations] = useState<AdminMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<AdminMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalComments: 0, totalPayments: 0 });

  const chatEndRef = useRef<HTMLDivElement>(null);

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

    // Moderation (Karen)
    const qReports = query(collection(db, 'reports'), where('status', '==', 'pending'));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setReports(data.sort((a, b) => b.createdAt - a.createdAt));
    });

    // Admin Inbox
    const qInbox = query(collection(db, 'adminMessages'), orderBy('createdAt', 'desc'), limit(200));
    const unsubscribeInbox = onSnapshot(qInbox, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminMessage));
      const uniqueConvos: Record<string, AdminMessage> = {};
      allMsgs.forEach(m => {
        if (!uniqueConvos[m.conversationId] || m.createdAt > uniqueConvos[m.conversationId].createdAt) {
          uniqueConvos[m.conversationId] = m;
        }
      });
      setConversations(Object.values(uniqueConvos).sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => { 
      unsubscribeSettings(); 
      unsubscribePending(); 
      unsubscribePayments();
      unsubscribeReports();
      unsubscribeInbox();
    };
  }, []);

  // Sync thread messages
  useEffect(() => {
    if (!activeConversationId) return;
    const qThread = query(
      collection(db, 'adminMessages'), 
      where('conversationId', '==', activeConversationId),
      orderBy('createdAt', 'asc')
    );
    const unsubscribeThread = onSnapshot(qThread, (snapshot) => {
      setThreadMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminMessage)));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return unsubscribeThread;
  }, [activeConversationId]);

  const fetchStats = async () => {
    setLoading(false);
    try {
      const uSnap = await getCountFromServer(collection(db, 'users'));
      const pSnap = await getCountFromServer(collection(db, 'posts'));
      const cSnap = await getCountFromServer(collection(db, 'comments'));
      const paySnap = await getCountFromServer(collection(db, 'transactions'));
      
      const uSnapshot = await getDocs(query(collection(db, 'users'), orderBy('joinedAt', 'desc'), limit(100)));
      setUsers(uSnapshot.docs.map(doc => doc.data() as User));
      
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

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConversationId) return;
    const lastMsg = threadMessages[threadMessages.length - 1] || conversations.find(c => c.conversationId === activeConversationId);
    if (!lastMsg) return;
    
    const text = replyText;
    setReplyText('');
    try {
      await addDoc(collection(db, 'adminMessages'), {
        conversationId: activeConversationId,
        senderId: activeUser.uid,
        senderName: activeUser.displayName,
        senderEmail: activeUser.email,
        senderPhoto: activeUser.photoURL,
        subject: `RE: ${lastMsg.subject}`,
        message: text,
        createdAt: Date.now(),
        read: true,
        isAdminReply: true
      });
    } catch (e) { alert("Failed to transmit."); }
  };

  const toggleMaintenance = async () => {
    const newVal = !maintenanceMode;
    await updateDoc(doc(db, 'settings', 'site'), { maintenanceMode: newVal });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fadeIn h-[calc(100vh-140px)]">
      {/* Sidebar Nav - Horizontal on Mobile */}
      <div className="lg:w-20 xl:w-64 flex-shrink-0 flex flex-col">
        <div className="flex lg:flex-col overflow-x-auto pb-4 lg:pb-0 gap-2 custom-scrollbar snap-x">
          {[
            { id: 'overview', label: 'Monitor', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            { id: 'recruitment', label: 'Auth', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
            { id: 'payments', label: 'Cash', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'members', label: 'Nodes', icon: 'M12 4.354a4 4 0 110 5.292' },
            { id: 'karen', label: 'Karen', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
            { id: 'inbox', label: 'Inbox', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => { setActiveTab(item.id as AdminTab); setActiveConversationId(null); }} 
              className={`flex flex-col lg:flex-row items-center gap-2 lg:gap-4 px-4 py-3 lg:py-4 rounded-2xl text-[8px] lg:text-[10px] font-black uppercase tracking-widest transition-all relative group snap-center min-w-[80px] lg:min-w-0 ${activeTab === item.id ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/20' : 'bg-slate-900/40 text-slate-500 hover:bg-slate-800'}`}
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} /></svg>
              <span className="xl:inline">{item.label}</span>
              {item.id === 'recruitment' && pendingUsers.length > 0 && <span className="absolute top-1 right-1 lg:top-2 lg:right-2 bg-rose-500 text-white w-3 h-3 lg:w-4 lg:h-4 rounded-lg flex items-center justify-center text-[7px] border-2 border-slate-950">{pendingUsers.length}</span>}
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

        {activeTab === 'inbox' && (
          <div className="flex h-full overflow-hidden">
            <div className={`${activeConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-white/5 flex flex-col bg-slate-950/20`}>
               <div className="p-5 md:p-6 border-b border-white/5"><h2 className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest">HQ Messenger</h2></div>
               <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {conversations.length === 0 ? (
                    <div className="p-10 text-center text-[9px] font-black text-slate-600 uppercase tracking-widest">No Signals Received</div>
                  ) : (
                    conversations.map(c => (
                      <button 
                        key={c.conversationId} 
                        onClick={() => setActiveConversationId(c.conversationId)}
                        className={`w-full p-4 md:p-5 flex gap-3 md:gap-4 items-center transition-all border-b border-white/5 text-left ${activeConversationId === c.conversationId ? 'bg-indigo-600/10 border-r-4 border-r-indigo-500' : 'hover:bg-white/5'}`}
                      >
                        <img src={c.senderPhoto || `https://ui-avatars.com/api/?name=${c.senderName}`} className="w-10 h-10 md:w-11 md:h-11 rounded-2xl object-cover ring-2 ring-slate-950 shadow-lg" alt="s" />
                        <div className="flex-1 min-w-0">
                            <p className={`text-[10px] md:text-[11px] font-black truncate uppercase tracking-tighter ${!c.read && !c.isAdminReply ? 'text-white' : 'text-slate-400'}`}>{c.senderName}</p>
                            <p className="text-[9px] md:text-[10px] text-indigo-400 font-bold truncate uppercase">{c.subject}</p>
                        </div>
                      </button>
                    ))
                  )}
               </div>
            </div>
            <div className={`${activeConversationId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-950/40 relative`}>
               {activeConversationId ? (
                 <>
                    <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/40 backdrop-blur-md">
                       <div className="flex items-center gap-3">
                         <button onClick={() => setActiveConversationId(null)} className="md:hidden p-2 bg-slate-800 rounded-xl text-slate-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/></svg></button>
                         <h3 className="text-[11px] md:text-sm font-black text-white uppercase tracking-tight">Active Stream</h3>
                       </div>
                       <div className="hidden sm:block text-[8px] font-black text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-lg">ENCRYPTED</div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-4 md:space-y-6 custom-scrollbar flex flex-col">
                       {threadMessages.map((m) => (
                         <div key={m.id} className={`flex ${m.isAdminReply ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                            <div className={`max-w-[85%] md:max-w-[80%] flex flex-col ${m.isAdminReply ? 'items-end' : 'items-start'}`}>
                               <div className={`px-4 py-3 md:px-5 md:py-4 rounded-2xl md:rounded-3xl shadow-xl text-[12px] md:text-sm ${m.isAdminReply ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'}`}>
                                  <p>{m.message}</p>
                               </div>
                               <span className="text-[7px] md:text-[8px] text-slate-600 font-black uppercase mt-1.5 px-2">{new Date(m.createdAt).toLocaleTimeString()}</span>
                            </div>
                         </div>
                       ))}
                       <div ref={chatEndRef} />
                    </div>
                    <div className="p-4 md:p-6 border-t border-white/5 bg-slate-900/60 backdrop-blur-md">
                       <form onSubmit={handleSendReply} className="flex gap-3 md:gap-4">
                          <input 
                             type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)}
                             placeholder="Response..." 
                             className="flex-1 bg-slate-950/80 border border-white/10 rounded-2xl px-5 py-3 md:py-4 text-[12px] md:text-xs font-bold text-white outline-none focus:border-indigo-500/50"
                          />
                          <button type="submit" className="bg-indigo-600 text-white w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-2xl active:scale-90"><svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
                       </form>
                    </div>
                 </>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center opacity-20"><p className="text-[10px] font-black uppercase tracking-widest text-white">Select Stream</p></div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'recruitment' && (
           <div className="p-5 lg:p-8 space-y-6 overflow-y-auto h-full custom-scrollbar">
              <h2 className="text-lg lg:text-xl font-black text-white uppercase tracking-tight">Queue</h2>
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
                      <button onClick={() => handleApproveUser(u)} className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg">Authorize</button>
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
                  <tr><th className="px-5 py-3 lg:px-6 lg:py-4">Node</th><th className="px-5 py-3 lg:px-6 lg:py-4">Level</th><th className="px-5 py-3 lg:px-6 lg:py-4">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 lg:px-6 lg:py-4 flex items-center gap-3"><img src={u.photoURL} className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg object-cover" alt="u" /><div className="truncate"><p className="font-black text-white uppercase">{u.displayName}</p></div></td>
                      <td className="px-5 py-3 lg:px-6 lg:py-4"><UserBadge role={u.role} /></td>
                      <td className="px-5 py-3 lg:px-6 lg:py-4"><span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 font-black uppercase border border-white/5">{u.accountStatus}</span></td>
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
