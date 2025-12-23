
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { db } from '../services/firebase';
import * as ReactRouterDOM from 'react-router-dom';
const { useParams, useNavigate, Link } = ReactRouterDOM as any;

import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  where,
  getDocs
} from 'firebase/firestore';
import { UserBadge } from '../components/UserBadge';

interface ChatSummary {
  chatId: string;
  lastMessage: string;
  lastSenderName: string;
  lastTimestamp: number;
  partnerName: string;
  partnerPhoto: string;
}

const ChatView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [recentChats, setRecentChats] = useState<ChatSummary[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isPrivate = !!chatId;

  // Fetch recent private chats for the sidebar
  useEffect(() => {
    // This is a simulation since we don't have a 'chats' collection.
    // We scan the last 200 messages for chats involving activeUser.uid
    const qRecent = query(
      collection(db, 'messages'),
      where('chatId', '!=', null),
      orderBy('chatId'), // Required for != filter in some cases
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(qRecent, (snapshot) => {
      const allDMs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      const myDMs = allDMs.filter(m => m.chatId?.includes(activeUser.uid));
      
      const summaries: Record<string, ChatSummary> = {};
      myDMs.forEach(m => {
        if (!m.chatId) return;
        if (!summaries[m.chatId] || m.createdAt > summaries[m.chatId].lastTimestamp) {
          // Determine partner info from the ID (dm_uid1_uid2)
          const parts = m.chatId.split('_');
          const partnerId = parts[1] === activeUser.uid ? parts[2] : parts[1];
          
          summaries[m.chatId] = {
            chatId: m.chatId,
            lastMessage: m.text,
            lastSenderName: m.senderName || 'Anonymous',
            lastTimestamp: m.createdAt,
            partnerName: m.senderId === activeUser.uid ? 'Chat Session' : (m.senderName || 'Signal'),
            partnerPhoto: m.senderId === activeUser.uid ? `https://ui-avatars.com/api/?name=Chat` : (m.senderPhoto || '')
          };
        }
      });
      setRecentChats(Object.values(summaries).sort((a, b) => b.lastTimestamp - a.lastTimestamp));
    });

    return unsubscribe;
  }, [activeUser.uid]);

  // Sync messages for current chat
  useEffect(() => {
    setLoading(true);
    const q = isPrivate 
      ? query(collection(db, 'messages'), where('chatId', '==', chatId), orderBy('createdAt', 'asc'), limit(100))
      : query(collection(db, 'messages'), where('chatId', '==', null), orderBy('createdAt', 'asc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatMessage[]);
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 100);
    });

    return unsubscribe;
  }, [chatId, isPrivate]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');

    await addDoc(collection(db, 'messages'), {
      senderId: activeUser.uid,
      senderName: activeUser.displayName,
      senderPhoto: activeUser.photoURL,
      senderRole: activeUser.role,
      text: text,
      chatId: chatId || null,
      createdAt: Date.now()
    });
  };

  return (
    <div className="h-[75vh] flex glass-effect rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden animate-fadeIn">
      {/* Messenger List Sidebar */}
      <div className="hidden lg:flex flex-col w-80 border-r border-white/5 bg-slate-950/20">
        <div className="p-6 border-b border-white/5 bg-slate-900/40">
           <h2 className="text-xs font-black text-white uppercase tracking-widest">Messenger Nodes</h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
           <button 
             onClick={() => navigate('/chat')}
             className={`w-full p-5 flex gap-4 items-center border-b border-white/5 transition-all text-left ${!isPrivate ? 'bg-rose-600/10 border-r-4 border-r-rose-500' : 'hover:bg-white/5'}`}
           >
              <div className="w-11 h-11 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg></div>
              <div><p className="text-[11px] font-black text-white uppercase tracking-tighter">Global Signal</p><p className="text-[10px] text-slate-500">Public Community</p></div>
           </button>
           {recentChats.map(rc => (
             <button 
               key={rc.chatId} 
               onClick={() => navigate(`/chat/${rc.chatId}`)}
               className={`w-full p-5 flex gap-4 items-center border-b border-white/5 transition-all text-left ${chatId === rc.chatId ? 'bg-indigo-600/10 border-r-4 border-r-indigo-500' : 'hover:bg-white/5'}`}
             >
                <img src={rc.partnerPhoto} className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-950" alt="p" />
                <div className="flex-1 min-w-0">
                   <p className="text-[11px] font-black text-white uppercase truncate">{rc.partnerName}</p>
                   <p className="text-[10px] text-slate-500 truncate italic">{rc.lastMessage}</p>
                </div>
             </button>
           ))}
        </div>
      </div>

      {/* Active Chat Pane */}
      <div className="flex-1 flex flex-col bg-slate-950/40 relative">
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPrivate ? 'bg-indigo-600' : 'bg-rose-600'} text-white shadow-lg`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   {isPrivate ? <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/> : <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/>}
                </svg>
             </div>
             <div>
                <h2 className="font-black text-white tracking-tight uppercase text-xs">{isPrivate ? 'Private Encrypted Line' : 'Global Community Lobby'}</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{isPrivate ? 'P2P Signal' : 'All Citizens'}</p>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar" ref={scrollRef}>
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div><p className="text-[10px] font-black uppercase tracking-widest">establishing link</p></div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20"><p className="text-xs font-black uppercase tracking-widest">No signals in buffer</p></div>
          ) : (
            messages.map((m, i) => {
              const isMe = m.senderId === activeUser.uid;
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-slideIn`}>
                   <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && (i === 0 || messages[i-1].senderId !== m.senderId) && (
                        <div className="flex items-center gap-2 mb-2 ml-2">
                           <Link to={`/profile/${m.senderId}`} className="text-[10px] font-black text-rose-500 uppercase hover:underline">{m.senderName}</Link>
                           <UserBadge role={m.senderRole} verified={m.senderVerified} />
                        </div>
                      )}
                      <div className={`px-5 py-4 rounded-3xl shadow-xl leading-relaxed text-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'}`}>
                         <p className="font-medium">{m.text}</p>
                      </div>
                      <span className="text-[8px] text-slate-600 font-bold uppercase mt-2 px-2">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 bg-slate-900/60 border-t border-white/5 flex gap-4 backdrop-blur-md">
           <input 
             type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()}
             placeholder="Transmit message..." 
             className="flex-1 bg-slate-950/80 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-rose-500/50"
           />
           <button onClick={handleSend} className="bg-rose-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-600/20 active:scale-90 transition-all"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
