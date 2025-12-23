
import React, { useState, useEffect, useRef } from 'react';
import { User, AdminMessage } from '../types';
import { db } from '../services/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

const UserInboxView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [subject, setSubject] = useState('General Support Signal');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Users see their own conversationId (which is their UID)
    const q = query(
      collection(db, 'adminMessages'),
      where('conversationId', '==', activeUser.uid),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminMessage));
      setMessages(msgs);
      setLoading(false);
      
      // Auto-mark admin replies as read when user sees them
      msgs.forEach(async m => {
        if (m.isAdminReply && !m.read) {
          await updateDoc(doc(db, 'adminMessages', m.id), { read: true });
        }
      });

      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    });

    return unsubscribe;
  }, [activeUser.uid]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText('');

    try {
      await addDoc(collection(db, 'adminMessages'), {
        conversationId: activeUser.uid,
        senderId: activeUser.uid,
        senderName: activeUser.displayName,
        senderEmail: activeUser.email,
        senderPhoto: activeUser.photoURL,
        subject: subject,
        message: text,
        createdAt: Date.now(),
        read: false,
        isAdminReply: false
      });
    } catch (err) {
      alert("Transmission failed. Retrying signal...");
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[75vh] glass-effect rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col shadow-2xl animate-fadeIn">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
           </div>
           <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">HQ Communications</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Direct Link to High Command</p>
           </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Protocol</span>
           <div className="px-3 py-1 bg-rose-600/10 border border-rose-500/20 text-rose-500 rounded-lg text-[9px] font-black uppercase">Encrypted Signal</div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 custom-scrollbar flex flex-col" ref={scrollRef}>
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
             <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Syncing Inbox</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
             <div className="w-20 h-20 bg-slate-900/50 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5">
                <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
             </div>
             <h3 className="text-white font-black uppercase tracking-widest mb-2">No Signal History</h3>
             <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-xs">Have a question or need verification assistance? Send a signal to the High Command below.</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const isMe = !m.isAdminReply;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                 <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                       <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1.5 ml-2">High Command</p>
                    )}
                    <div className={`px-5 py-4 rounded-3xl shadow-lg border ${isMe ? 'bg-slate-900 text-slate-100 rounded-tr-none border-white/5' : 'bg-rose-600 text-white rounded-tl-none border-rose-500'}`}>
                       {(!isMe || (i === 0 || messages[i-1].subject !== m.subject)) && (
                         <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-3 pb-1 border-b ${isMe ? 'border-white/5 text-slate-500' : 'border-white/10 text-rose-200'}`}>Topic: {m.subject}</p>
                       )}
                       <p className="text-sm font-medium leading-relaxed">{m.message}</p>
                    </div>
                    <span className="text-[8px] text-slate-600 font-bold uppercase mt-2 px-2">
                       {new Date(m.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                 </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <div className="p-6 border-t border-white/5 bg-slate-900/60">
        <div className="mb-4">
           <select 
             value={subject} 
             onChange={(e) => setSubject(e.target.value)}
             className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 focus:text-rose-500 outline-none appearance-none cursor-pointer"
           >
              <option value="General Support Signal">General Support Signal</option>
              <option value="Verification Assistance">Verification Assistance</option>
              <option value="Billing / Premium Node">Billing / Premium Node</option>
              <option value="Technical Glitch">Technical Glitch</option>
              <option value="Reporting Citizen">Reporting Citizen</option>
           </select>
        </div>
        <form onSubmit={handleSendMessage} className="flex gap-4">
           <input 
             type="text" 
             value={inputText}
             onChange={(e) => setInputText(e.target.value)}
             placeholder="Transmit message to High Command..." 
             className="flex-1 bg-slate-950/80 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-rose-500/50 transition-all placeholder-slate-700"
           />
           <button type="submit" className="bg-rose-600 hover:bg-rose-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-600/30 transition-all active:scale-90 group">
              <svg className="w-6 h-6 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
           </button>
        </form>
      </div>
    </div>
  );
};

export default UserInboxView;
