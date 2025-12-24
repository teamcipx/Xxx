
import React, { useState, useEffect } from 'react';
import { User, Post, Comment } from '../types';
import { db } from '../services/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  where,
  onSnapshot, 
  doc, 
  updateDoc, 
  increment,
  arrayUnion, 
  arrayRemove,
  deleteDoc 
} from 'firebase/firestore';
import * as ReactRouterDOM from 'react-router-dom';
const { Link, useNavigate } = ReactRouterDOM as any;

import { AdsterraAd } from '../components/AdsterraAd';
import { UserBadge } from '../components/UserBadge';

const VideoCommentSection: React.FC<{ postId: string; user: User }> = ({ postId, user }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'comments'), where('postId', '==', postId), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    });
    return unsubscribe;
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'comments'), {
        postId, authorId: user.uid, authorName: user.displayName, authorPhoto: user.photoURL, authorRole: user.role, text: newComment, createdAt: Date.now()
      });
      await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });
      setNewComment('');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-slate-900/60 p-4 rounded-b-3xl border-t border-white/5 space-y-4">
      <div className="flex gap-2">
        <input 
          type="text" 
          value={newComment} 
          onChange={(e) => setNewComment(e.target.value)} 
          onKeyPress={(e) => e.key === 'Enter' && handleAddComment()} 
          placeholder="Transmit thought..." 
          className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-[10px] focus:border-rose-500/40 outline-none" 
        />
        <button onClick={handleAddComment} disabled={loading} className="bg-rose-600 p-2 rounded-xl text-white active:scale-90 transition-all">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
        </button>
      </div>
      <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar">
        {comments.map(c => (
          <div key={c.id} className="flex gap-2 text-[10px]">
            <img src={c.authorPhoto} className="w-6 h-6 rounded-lg object-cover" alt="u" />
            <div className="bg-slate-950/40 p-2 rounded-xl flex-1 border border-white/5">
              <div className="flex justify-between items-center mb-0.5"><span className="font-black text-rose-500 uppercase">{c.authorName}</span></div>
              <p className="text-slate-300">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const VideoView: React.FC<{ user: User }> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  
  const navigate = useNavigate();
  const isPremium = user.role !== 'user';

  useEffect(() => {
    const q = query(collection(db, 'posts'), where('type', '==', 'video'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[]);
      setFetching(false);
    });
    return unsubscribe;
  }, []);

  const handleCreateVideo = async () => {
    if (!isPremium) { navigate('/pro'); return; }
    if (!newTitle.trim() || !newUrl.trim()) return;
    setIsPosting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid, authorName: user.displayName, authorPhoto: user.photoURL, authorRole: user.role, authorVerified: user.isVerified || false,
        type: 'video', title: newTitle, content: '', videoUrl: newUrl, likes: [], dislikes: [], commentsCount: 0, createdAt: Date.now()
      });
      setNewTitle(''); setNewUrl('');
    } finally { setIsPosting(false); }
  };

  const handleLike = async (post: Post) => {
    const isLiked = post.likes.includes(user.uid);
    await updateDoc(doc(db, 'posts', post.id), {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  const handleDelete = async (postId: string) => {
    if (window.confirm("Abort stream node?")) {
      await deleteDoc(doc(db, 'posts', postId));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">Visual <span className="text-rose-600">Streams</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Node-to-node video synchronization</p>
        </div>
        {!isPremium && <Link to="/pro" className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all">Enable HQ Decryption</Link>}
      </div>

      <div className={`glass-effect rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden transition-all ${!isPremium ? 'opacity-40 select-none' : ''}`}>
        {!isPremium && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 text-center cursor-pointer" onClick={() => navigate('/pro')}>
             <p className="text-white font-black uppercase text-sm tracking-widest">Upgrade to Host Streams</p>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-6">
           <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Stream Identifier (Title)" className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-xs font-black text-white focus:outline-none focus:border-rose-500/30" />
           <input type="text" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="Visual Source URL (.mp4 / youtube)" className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-xs font-black text-white focus:outline-none focus:border-rose-500/30" />
        </div>
        <button onClick={handleCreateVideo} disabled={isPosting} className="w-full mt-6 bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50">
          {isPosting ? 'Establishing Connection...' : 'Broadcast Visual Signal'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {fetching ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
             <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.5em]">Syncing Streams</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-effect rounded-[3rem] border border-white/5">
             <p className="text-slate-600 font-black uppercase text-xs tracking-[0.5em]">No active streams detected in this sector.</p>
          </div>
        ) : posts.map((post, idx) => (
          <div key={post.id} className="flex flex-col group/stream animate-fadeIn">
            <div className="glass-effect rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl relative transition-all duration-500 group-hover/stream:translate-y-[-8px] group-hover/stream:shadow-rose-600/10">
              <div className="aspect-video bg-slate-950 relative overflow-hidden">
                {post.videoUrl?.includes('youtube.com') || post.videoUrl?.includes('youtu.be') ? (
                   <iframe 
                    className="w-full h-full" 
                    src={`https://www.youtube.com/embed/${post.videoUrl.split('v=')[1] || post.videoUrl.split('/').pop()}`} 
                    title={post.title}
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                ) : (
                  <video controls className="w-full h-full object-cover">
                    <source src={post.videoUrl} type="video/mp4" />
                    Your node does not support this visual codec.
                  </video>
                )}
                <div className="absolute top-4 right-4 z-10">
                   {(post.authorId === user.uid || user.role === 'admin') && (
                     <button onClick={() => handleDelete(post.id)} className="p-3 bg-slate-950/80 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                   )}
                </div>
              </div>
              
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center justify-between">
                   <Link to={`/profile/${post.authorId}`} className="flex items-center gap-3">
                      <img src={post.authorPhoto} className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-950" alt="a" />
                      <div>
                         <p className="text-[11px] font-black text-white uppercase tracking-tight">{post.authorName}</p>
                         <UserBadge role={post.authorRole} className="scale-75 origin-left" />
                      </div>
                   </Link>
                   <span className="text-[8px] font-black text-slate-600 uppercase">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight">{post.title}</h3>
                
                <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                   <button onClick={() => handleLike(post)} className={`flex items-center gap-2 text-[9px] font-black tracking-widest transition-all ${post.likes.includes(user.uid) ? 'text-rose-500' : 'text-slate-500'}`}>
                      <div className={`p-2 rounded-xl ${post.likes.includes(user.uid) ? 'bg-rose-500/10' : 'bg-slate-900'}`}>
                         <svg className="w-4 h-4" fill={post.likes.includes(user.uid) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                      </div>
                      {post.likes.length}
                   </button>
                   <button onClick={() => setOpenComments(prev => ({...prev, [post.id]: !prev[post.id]}))} className={`flex items-center gap-2 text-[9px] font-black tracking-widest transition-all ${openComments[post.id] ? 'text-indigo-400' : 'text-slate-500'}`}>
                      <div className={`p-2 rounded-xl ${openComments[post.id] ? 'bg-indigo-500/10' : 'bg-slate-900'}`}>
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      </div>
                      {post.commentsCount}
                   </button>
                </div>
              </div>
            </div>
            {openComments[post.id] && <VideoCommentSection postId={post.id} user={user} />}
            {idx % 3 === 0 && <AdsterraAd id={`stream-node-${idx}`} format="native" className="mt-8" />}
          </div>
        ))}
      </div>
      
      <div className="flex justify-center"><AdsterraAd id="streams-footer" format="banner" /></div>
    </div>
  );
};

export default VideoView;
