
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { db } from '../services/firebase';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { AdsterraAd } from '../components/AdsterraAd';
import { UserBadge } from '../components/UserBadge';

const ChatView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isPrivate = !!chatId;

  useEffect(() => {
    setLoading(true);
    setError(null);
    let q;
    try {
      if (isPrivate) {
        q = query(
          collection(db, 'messages'),
          where('chatId', '==', chatId),
          orderBy('createdAt', 'asc'),
          limit(100)
        );
      } else {
        q = query(
          collection(db, 'messages'),
          where('chatId', '==', null),
          orderBy('createdAt', 'asc'),
          limit(50)
        );
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ChatMessage[];
        setMessages(msgs);
        setLoading(false);
        
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      }, (err) => {
        console.error("Firestore Chat Error:", err);
        setError("Network signal unstable. Retrying...");
        setLoading(false);
      });

      return unsubscribe;
    } catch (e) {
      console.error("Query building error:", e);
      setLoading(false);
    }
  }, [chatId, isPrivate]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: activeUser.uid,
        senderName: activeUser.displayName,
        senderPhoto: activeUser.photoURL,
        senderRole: activeUser.role,
        text: text,
        chatId: chatId || null,
        createdAt: Date.now()
      });
    } catch (err) {
      alert("Failed to send message.");
    }
  };

  return (
    <div className="h-[75vh] glass-effect rounded-[2.5rem] flex flex-col shadow-2xl border border-white/10 overflow-hidden animate-fadeIn">
      <div className="p-5 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isPrivate && (
            <button onClick={() => navigate('/chat')} className="p-2 hover:bg-white/5 rounded-xl text-slate-400">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <div className="relative">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 {isPrivate ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                 ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                 )}
               </svg>
            </div>
            {!isPrivate && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>}
          </div>
          <div>
            <h2 className="font-black text-slate-100 tracking-tight">{isPrivate ? 'Private Session' : 'Global Lobby'}</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{isPrivate ? 'Encrypted Chat' : 'Public Community'}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6" ref={scrollRef}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-5">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 shadow-lg"></div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] animate-pulse">Loading Room</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-10">
            <p className="text-red-400 font-bold text-sm">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4">
             <div className="w-16 h-16 bg-slate-800/50 rounded-3xl flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
             </div>
             <p className="text-sm font-bold italic">No signals detected. Start the transmission!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === activeUser.uid;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-slideIn`}>
                <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-5 py-4 shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-white/5'}`}>
                  {!isMe && (
                    <div className="flex items-center gap-2 mb-2">
                       <Link to={`/profile/${m.senderId}`} className="text-[10px] font-black text-indigo-400 uppercase tracking-wider hover:text-indigo-300 transition-colors">
                        { m.senderName || 'Anonymous' }
                       </Link>
                       <UserBadge role={m.senderRole} />
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap font-medium leading-relaxed">{m.text}</p>
                  <p className={`text-[9px] mt-2 font-black uppercase tracking-widest ${isMe ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-5 bg-slate-900/20">
        <AdsterraAd id="chat-inline" />
      </div>

      <div className="p-6 bg-slate-900/60 border-t border-white/5 flex gap-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Message..."
          className="flex-1 bg-slate-950/50 rounded-2xl px-6 py-4 text-slate-100 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 border border-white/5 transition-all"
        />
        <button onClick={handleSend} className="bg-indigo-600 hover:bg-indigo-500 text-white w-14 h-14 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-90 flex items-center justify-center">
          <svg className="w-6 h-6 transform rotate-12" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
        </button>
      </div>
    </div>
  );
};

export default ChatView;
