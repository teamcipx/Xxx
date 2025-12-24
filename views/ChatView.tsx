
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
  where
} from 'firebase/firestore';
import { UserBadge } from '../components/UserBadge';
import { AdsterraAd } from '../components/AdsterraAd';

interface ChatSummary {
  chatId: string;
  lastMessage: string;
  lastSenderName: string;
  lastTimestamp: number;
  partnerId: string;
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
  const [showListOnMobile, setShowListOnMobile] = useState(!chatId);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isPrivate = !!chatId;

  useEffect(() => {
    setShowListOnMobile(!chatId);
  }, [chatId]);

  // Enhanced Inbox logic to fetch all DMs and summarize them like Messenger
  useEffect(() => {
    const qRecent = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(500)
    );

    const unsubscribe = onSnapshot(qRecent, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      
      const summaries: Record<string, ChatSummary> = {};
      
      allMsgs.forEach(m => {
        if (!m.chatId) return; // Skip global chat
        if (!m.chatId.includes(activeUser.uid)) return; // Skip DMs not involving me

        if (!summaries[m.chatId] || m.createdAt > summaries[m.chatId].lastTimestamp) {
          const parts = m.chatId.split('_');
          const partnerId = parts[1] === activeUser.uid ? parts[2] : parts[1];
          
          summaries[m.chatId] = {
            chatId: m.chatId,
            lastMessage: m.text,
            lastSenderName: m.senderName || 'Signal',
            lastTimestamp: m.createdAt,
            partnerId: partnerId,
            partnerName: m.senderId === activeUser.uid ? 'Receiver Node' : (m.senderName || 'Anonymous Citizen'),
            partnerPhoto: m.senderId === activeUser.uid ? `https://ui-avatars.com/api/?name=${partnerId}&background=random` : (m.senderPhoto || '')
          };
        }
      });
      setRecentChats(Object.values(summaries).sort((a, b) => b.lastTimestamp - a.lastTimestamp));
    });

    return unsubscribe;
  }, [activeUser.uid]);

  useEffect(() => {
    setLoading(true);
    const q = isPrivate 
      ? query(collection(db, 'messages'), where('chatId', '==', chatId), orderBy('createdAt', 'asc'), limit(150))
      : query(collection(db, 'messages'), where('chatId', '==', null), orderBy('createdAt', 'asc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatMessage[]);
      setLoading(false);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 200);
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
    <div className="h-[calc(100vh-140px)] md:h-[80vh] flex flex-col md:flex-row glass-effect rounded-3xl md:rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden animate-fadeIn mb-10">
      {/* Messenger Sidebar */}
      <div className={`${showListOnMobile ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-96 border-r border-white/5 bg-slate-950/40`}>
        <div className="p-6 border-b border-white/5 bg-slate-900/60 backdrop-blur-xl flex flex-col gap-4">
           <div className="flex justify-between items-center">
             <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Signal Inbox</h2>
             <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
           </div>
           <AdsterraAd id="chat-sidebar-top-1" format="banner" className="scale-75 -my-4" />
           <AdsterraAd id="chat-sidebar-top-2" format="banner" className="scale-75 -my-4" />
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
           {/* Global Chat Entry */}
           <button 
             onClick={() => { navigate('/chat'); setShowListOnMobile(false); }}
             className={`w-full p-5 flex gap-4 items-center border-b border-white/5 transition-all text-left ${!isPrivate ? 'bg-rose-600/10 border-r-4 border-r-rose-500' : 'hover:bg-white/5'}`}
           >
              <div className="w-12 h-12 bg-rose-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl shadow-rose-600/20"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg></div>
              <div className="flex-1">
                <p className="text-[11px] font-black text-white uppercase tracking-tight">Global Channel</p>
                <p className="text-[10px] text-slate-500 font-medium">Synchronized with all citizens</p>
              </div>
           </button>
           
           <div className="p-4 bg-slate-900/20">
             <AdsterraAd id="chat-sidebar-mid-native" format="native" className="scale-90" />
             <AdsterraAd id="chat-sidebar-mid-banner" format="banner" className="mt-2 scale-90" />
           </div>

           {recentChats.length === 0 ? (
             <div className="p-10 text-center opacity-30 flex flex-col items-center gap-4">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
               <p className="text-[10px] font-black uppercase tracking-widest">No Direct Signals</p>
             </div>
           ) : recentChats.map((rc, idx) => (
             <React.Fragment key={rc.chatId}>
               <button onClick={() => { navigate(`/chat/${rc.chatId}`); setShowListOnMobile(false); }} className={`w-full p-5 flex gap-4 items-center border-b border-white/5 transition-all text-left ${chatId === rc.chatId ? 'bg-indigo-600/10 border-r-4 border-r-indigo-500' : 'hover:bg-white/5'}`}>
                  <div className="relative">
                    <img src={rc.partnerPhoto || `https://ui-avatars.com/api/?name=${rc.partnerName}&background=random`} className="w-12 h-12 rounded-[1.2rem] object-cover ring-2 ring-slate-950 shadow-lg" alt="p" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-950 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="text-[11px] font-black text-white uppercase truncate">{rc.partnerName}</p>
                      <span className="text-[8px] text-slate-600 font-bold">{new Date(rc.lastTimestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate font-medium italic">"{rc.lastMessage}"</p>
                  </div>
               </button>
               {idx % 3 === 0 && <AdsterraAd id={`chat-inbox-ad-${idx}`} format="banner" className="scale-75 -my-2" />}
             </React.Fragment>
           ))}
        </div>
        <div className="p-4 bg-slate-900/40 border-t border-white/5 space-y-2">
           <AdsterraAd id="chat-sidebar-bottom-1" format="banner" className="scale-90" />
           <AdsterraAd id="chat-sidebar-bottom-2" format="banner" className="scale-90" />
        </div>
      </div>

      {/* Message Window */}
      <div className={`${!showListOnMobile ? 'flex' : 'hidden'} lg:flex flex-1 flex-col bg-slate-950/20 relative`}>
        <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/60 backdrop-blur-2xl z-20">
          <div className="flex items-center gap-4">
             <button onClick={() => setShowListOnMobile(true)} className="lg:hidden p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-90 shadow-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button>
             <div className={`w-10 h-10 md:w-12 md:h-12 rounded-[1.2rem] flex items-center justify-center ${isPrivate ? 'bg-indigo-600' : 'bg-rose-600'} text-white shadow-2xl shadow-rose-600/20`}><svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">{isPrivate ? <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/> : <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/>}</svg></div>
             <div>
                <h2 className="font-black text-white tracking-tighter uppercase text-[11px] md:text-sm">{isPrivate ? 'Citizen Direct Line' : 'Global Signal Terminal'}</h2>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="text-[8px] md:text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">{isPrivate ? 'End-to-End Encrypted' : 'Public Transmission'}</p>
                </div>
             </div>
          </div>
          <div className="hidden md:flex flex-col gap-1">
             <AdsterraAd id="chat-header-banner-1" format="banner" className="scale-50 -my-8" />
             <AdsterraAd id="chat-header-banner-2" format="banner" className="scale-50 -my-8" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-8 custom-scrollbar bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/20 via-transparent to-transparent" ref={scrollRef}>
          <AdsterraAd id="chat-window-top-1" format="banner" />
          <AdsterraAd id="chat-window-top-2" format="banner" />
          
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-40">
              <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing Stream</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-10">
              <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] border border-white/5 flex items-center justify-center mb-6"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" strokeWidth={1.5} strokeLinecap="round"/></svg></div>
              <p className="text-[10px] font-black uppercase tracking-widest">Frequency Clear. Awaiting Input.</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const isMe = m.senderId === activeUser.uid;
              return (
                <React.Fragment key={m.id}>
                  {/* Inline Message Ads - More frequent - every 3 messages */}
                  {i > 0 && i % 3 === 0 && (
                    <div className="flex flex-col items-center gap-2 my-8 animate-fadeIn">
                       <AdsterraAd id={`chat-inline-banner-${i}`} format="banner" className="scale-90" />
                       <AdsterraAd id={`chat-inline-native-${i}`} format="native" className="scale-90" />
                    </div>
                  )}
                  
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-slideIn group`}>
                    <div className={`max-w-[85%] md:max-w-[70%] flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isMe && (i === 0 || messages[i-1].senderId !== m.senderId) ? (
                           <Link to={`/profile/${m.senderId}`} className="shrink-0 mt-1">
                              <img src={m.senderPhoto || `https://ui-avatars.com/api/?name=${m.senderName}&background=random`} className="w-8 h-8 rounded-xl object-cover ring-2 ring-slate-900 shadow-xl" alt="p" />
                           </Link>
                        ) : (
                           <div className="w-8 shrink-0" />
                        )}
                        
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && (i === 0 || messages[i-1].senderId !== m.senderId) && (
                              <div className="flex items-center gap-2 mb-2 ml-1">
                                <span className="text-[10px] font-black text-rose-500 uppercase">{m.senderName}</span>
                                <UserBadge role={m.senderRole} verified={m.senderVerified} className="scale-75 origin-left" />
                              </div>
                            )}
                            <div className={`px-5 py-3.5 rounded-[1.5rem] shadow-2xl leading-relaxed text-[13px] md:text-sm font-medium ${isMe ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-600/10' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5 shadow-black/40'}`}>
                               <p className="whitespace-pre-wrap">{m.text}</p>
                            </div>
                            <span className="text-[8px] text-slate-700 font-bold uppercase mt-2 px-2 transition-opacity opacity-0 group-hover:opacity-100">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          
          <AdsterraAd id="chat-window-bottom-1" format="banner" className="mt-10" />
          <AdsterraAd id="chat-window-bottom-2" format="banner" className="mt-4" />
        </div>

        <div className="p-5 md:p-8 bg-slate-900/60 border-t border-white/5 flex flex-col gap-4 backdrop-blur-3xl z-20">
           <AdsterraAd id="chat-input-top-banner" format="banner" className="scale-75 -my-4" />
           <div className="flex gap-4">
             <input 
               type="text" 
               value={input} 
               onChange={(e) => setInput(e.target.value)} 
               onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
               placeholder="Transmit secure signal..." 
               className="flex-1 bg-slate-950/80 border border-white/10 rounded-[1.5rem] px-6 py-4 text-sm font-bold text-white outline-none focus:border-rose-500/50 transition-all placeholder-slate-700 shadow-inner" 
             />
             <button onClick={handleSend} className="bg-rose-600 text-white w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-rose-600/40 active:scale-90 transition-all hover:bg-rose-500">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
