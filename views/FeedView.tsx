
import React, { useState, useEffect } from 'react';
import { User, Post, Comment, PostType } from '../types';
import { uploadToImgBB } from '../services/imgbb';
// Use namespace import and cast to any to resolve "no exported member" compiler errors
import * as ReactRouterDOM from 'react-router-dom';
const { Link, useNavigate } = ReactRouterDOM as any;

import { db } from '../services/firebase';
import { AdsterraAd } from '../components/AdsterraAd';
import { UserBadge } from '../components/UserBadge';
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
  arrayRemove 
} from 'firebase/firestore';

const TruncatedText: React.FC<{ text: string; limit: number }> = ({ text, limit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = text.length > limit;

  if (!shouldTruncate) return <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{text}</p>;

  return (
    <div className="relative">
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
        {isExpanded ? text : `${text.substring(0, limit)}...`}
      </p>
      <button 
        onClick={() => setIsExpanded(!isExpanded)} 
        className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:text-rose-400 transition-colors"
      >
        {isExpanded ? 'Collapse Signal' : 'Show More'}
      </button>
    </div>
  );
};

const CommentSection: React.FC<{ postId: string; user: User }> = ({ postId, user }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'comments'), where('postId', '==', postId), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(data);
    }, (err) => { console.error(err); });
    return unsubscribe;
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'comments'), {
        postId,
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        authorRole: user.role,
        text: newComment,
        createdAt: Date.now()
      });
      await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });
      setNewComment('');
    } finally { setLoading(false); }
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
      <div className="flex gap-2">
        <input 
          type="text" 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
          placeholder="Transmit your thought..."
          className="flex-1 bg-slate-900 border border-white/5 rounded-xl px-4 py-2 text-[11px] font-medium focus:outline-none focus:border-rose-500/40"
        />
        <button onClick={handleAddComment} disabled={loading} className="bg-rose-600 p-2.5 rounded-xl text-white shadow-lg shadow-rose-600/20 active:scale-95 transition-all">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
        </button>
      </div>
      <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
        {comments.map(c => (
          <div key={c.id} className="flex gap-3 animate-fadeIn">
            <Link to={`/profile/${c.authorId}`} className="flex-shrink-0">
              <img src={c.authorPhoto} className="w-8 h-8 rounded-xl object-cover hover:ring-2 hover:ring-rose-500/50 transition-all" alt="u" />
            </Link>
            <div className="bg-slate-900/60 border border-white/5 rounded-[1.2rem] px-4 py-3 flex-1">
              <div className="flex justify-between items-center mb-1">
                <Link to={`/profile/${c.authorId}`} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400 transition-colors">
                  {c.authorName}
                </Link>
                <span className="text-[8px] text-slate-600 font-bold">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FeedView: React.FC<{ user: User }> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newContent, setNewContent] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [postType, setPostType] = useState<PostType>('standard');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  
  const navigate = useNavigate();
  const isPremium = user.role !== 'user';

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[]);
      setFetching(false);
    });
    return unsubscribe;
  }, []);

  const handleCreatePost = async () => {
    if (!isPremium) {
      navigate('/pro');
      return;
    }
    if (!newContent.trim() && !selectedFile) return;
    if (postType === 'article' && !newTitle.trim()) {
        alert("Articles require a headline.");
        return;
    }
    setUploading(true);
    try {
      const imageUrl = selectedFile ? await uploadToImgBB(selectedFile) : null;
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        authorRole: user.role,
        authorVerified: user.isVerified || false,
        type: postType,
        title: postType === 'article' ? newTitle : null,
        content: newContent,
        imageUrl: imageUrl,
        likes: [],
        dislikes: [],
        commentsCount: 0,
        createdAt: Date.now()
      });
      setNewContent('');
      setNewTitle('');
      setSelectedFile(null);
      setPostType('standard');
    } catch (err) { alert("Signal transmission failed."); } finally { setUploading(false); }
  };

  const handleLike = async (post: Post) => {
    const isLiked = post.likes.includes(user.uid);
    await updateDoc(doc(db, 'posts', post.id), {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      dislikes: arrayRemove(user.uid)
    });
  };

  const handleDislike = async (post: Post) => {
    const isDisliked = post.dislikes.includes(user.uid);
    await updateDoc(doc(db, 'posts', post.id), {
      dislikes: isDisliked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      likes: arrayRemove(user.uid)
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-fadeIn">
      {/* Community Context Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Community Wall</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Real-time Community Signals</p>
        </div>
        {!isPremium && (
          <Link to="/pro" className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            Decrypt Media with Premium
          </Link>
        )}
      </div>

      {/* Creation Protocol - Premium Only */}
      <div className={`glass-effect rounded-[2.5rem] p-6 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden group transition-all ${!isPremium ? 'opacity-50 grayscale' : ''}`}>
        {!isPremium && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm p-6 text-center">
             <h3 className="text-white font-black uppercase tracking-tighter text-xl mb-2">Basic Node Restriction</h3>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6 max-w-[200px]">Signal broadcasting is reserved for premium accounts</p>
             <button onClick={() => navigate('/pro')} className="bg-rose-600 text-white px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-rose-600/40">Broadcasting Privileges</button>
          </div>
        )}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/5 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
        
        <div className="flex items-center gap-6 mb-8">
           <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-white/5">
              <button 
                onClick={() => setPostType('standard')}
                className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${postType === 'standard' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Signal
              </button>
              <button 
                onClick={() => setPostType('article')}
                className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${postType === 'article' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Article
              </button>
           </div>
        </div>

        <div className="flex gap-4 md:gap-6">
          <img src={user.photoURL} alt="u" className="w-12 h-12 rounded-2xl object-cover ring-4 ring-slate-950" />
          <div className="flex-1 space-y-4">
            {postType === 'article' && (
               <input 
                 type="text" 
                 value={newTitle}
                 onChange={(e) => setNewTitle(e.target.value)}
                 disabled={!isPremium}
                 placeholder="Signal Headline..."
                 className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-black text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
               />
            )}
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              disabled={!isPremium}
              placeholder={postType === 'standard' ? "Update the community grid..." : "Compose deep signal content..."}
              className="w-full bg-slate-950/50 rounded-2xl p-5 text-sm text-slate-100 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30 border border-white/5 min-h-[120px] transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-8 ml-18 md:ml-20 border-t border-white/5 pt-6">
          <label className="flex items-center gap-3 cursor-pointer text-slate-500 hover:text-rose-400 transition-colors group">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-rose-500/30 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Media</span>
            <input type="file" className="hidden" accept="image/*" disabled={!isPremium} onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
          </label>
          <button 
            onClick={handleCreatePost} 
            disabled={uploading || !isPremium} 
            className="bg-rose-600 hover:bg-rose-500 text-white px-10 py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Transmit'
            )}
          </button>
        </div>
      </div>

      {/* Feed Stream */}
      <div className="space-y-10">
        {fetching ? (
          <div className="py-24 flex flex-col items-center gap-6">
            <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-rose-600/20"></div>
            <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.8em] animate-pulse">Syncing Content Grid</p>
          </div>
        ) : (
          posts.map((post, idx) => (
            <React.Fragment key={post.id}>
              {idx > 0 && idx % 3 === 0 && <AdsterraAd id={`feed-node-${idx}`} />}
              
              <div className="glass-effect rounded-[2.8rem] overflow-hidden border border-white/5 group hover:border-white/10 transition-all shadow-xl">
                <div className="p-8 md:p-10">
                  <div className="flex items-center justify-between mb-8">
                    <Link to={`/profile/${post.authorId}`} className="flex items-center gap-4 group/author">
                      <div className="relative">
                        <img src={post.authorPhoto} className="w-12 h-12 rounded-2xl object-cover ring-4 ring-slate-950 group-hover/author:ring-rose-500/30 transition-all" alt="a" />
                        {post.authorVerified && <div className="absolute -bottom-1 -right-1 bg-cyan-400 text-slate-950 rounded-lg p-0.5 border-2 border-slate-900"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-slate-100 uppercase tracking-widest group-hover/author:text-rose-500 transition-colors">{post.authorName}</span>
                          {post.type === 'article' && <span className="bg-indigo-600/20 text-indigo-400 text-[7px] font-black px-2 py-0.5 rounded-lg border border-indigo-500/20 uppercase tracking-widest">Article</span>}
                        </div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-bold mt-1 block">ID: {post.authorId.substring(0, 8)} | Level: {post.authorRole || 'User'}</span>
                      </div>
                    </Link>
                    <span className="text-[10px] font-black text-slate-700 tracking-widest">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>

                  {post.type === 'article' && post.title && (
                    <h3 className="text-2xl font-black text-white tracking-tighter mb-4 leading-tight group-hover:text-rose-500 transition-colors uppercase">{post.title}</h3>
                  )}

                  <TruncatedText text={post.content} limit={35} />

                  {post.imageUrl && (
                    <div className={`rounded-[2rem] overflow-hidden border border-white/5 bg-slate-950 mt-8 relative group/img ${!isPremium ? 'grayscale blur-md select-none' : ''}`}>
                      <img src={post.imageUrl} className="w-full h-auto max-h-[600px] object-cover transition-transform duration-700 group-hover/img:scale-105" alt="c" />
                      {!isPremium && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40" onClick={(e) => { e.preventDefault(); navigate('/pro'); }}>
                           <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-6 py-3 rounded-2xl shadow-2xl tracking-widest cursor-pointer">Upgrade to View Media</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent"></div>
                    </div>
                  )}

                  <div className="flex items-center gap-8 mt-10 pt-8 border-t border-white/5">
                    <button onClick={() => handleLike(post)} className={`flex items-center gap-3 text-[10px] font-black tracking-widest transition-all ${post.likes.includes(user.uid) ? 'text-rose-500' : 'text-slate-500 hover:text-slate-300'}`}>
                      <div className={`p-2.5 rounded-xl ${post.likes.includes(user.uid) ? 'bg-rose-500/10' : 'bg-slate-900'}`}>
                        <svg className="w-5 h-5" fill={post.likes.includes(user.uid) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                      </div>
                      {post.likes.length}
                    </button>
                    <button onClick={() => handleDislike(post)} className={`flex items-center gap-3 text-[10px] font-black tracking-widest transition-all ${post.dislikes.includes(user.uid) ? 'text-red-600' : 'text-slate-500 hover:text-slate-300'}`}>
                      <div className={`p-2.5 rounded-xl ${post.dislikes.includes(user.uid) ? 'bg-red-500/10' : 'bg-slate-900'}`}>
                        <svg className="w-5 h-5" fill={post.dislikes.includes(user.uid) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.017c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                      </div>
                      {post.dislikes.length}
                    </button>
                    <button onClick={() => setOpenComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))} className={`flex items-center gap-3 text-[10px] font-black tracking-widest transition-all ${openComments[post.id] ? 'text-rose-400' : 'text-slate-500 hover:text-slate-300'}`}>
                      <div className={`p-2.5 rounded-xl ${openComments[post.id] ? 'bg-rose-500/10' : 'bg-slate-900'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      </div>
                      {post.commentsCount} Signals
                    </button>
                  </div>
                  {openComments[post.id] && <CommentSection postId={post.id} user={user} />}
                </div>
              </div>
            </React.Fragment>
          ))
        )}
      </div>
      <AdsterraAd id="feed-terminal-bottom" />
    </div>
  );
};

export default FeedView;
