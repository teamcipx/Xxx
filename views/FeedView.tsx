
import React, { useState, useEffect } from 'react';
import { User, Post, Comment, PostType } from '../types';
import { uploadToImgBB } from '../services/imgbb';
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
  arrayRemove,
  deleteDoc 
} from 'firebase/firestore';

const TruncatedText: React.FC<{ text: string; limit: number }> = ({ text, limit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = text.length > limit;

  if (!shouldTruncate) return <p className="text-[13px] md:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{text}</p>;

  return (
    <div className="relative">
      <p className="text-[13px] md:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
        {isExpanded ? text : `${text.substring(0, limit)}...`}
      </p>
      <button 
        onClick={() => setIsExpanded(!isExpanded)} 
        className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-rose-500 hover:text-rose-400 transition-colors"
      >
        {isExpanded ? 'Collapse Signal' : 'Decipher More'}
      </button>
    </div>
  );
};

const CommentSection: React.FC<{ postId: string; user: User }> = ({ postId, user }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'comments'), where('postId', '==', postId), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(data);
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
    <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
      <div className="flex gap-2">
        <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddComment()} placeholder="Transmit thought..." className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-[10px] md:text-[11px] focus:border-rose-500/40 outline-none" />
        <button onClick={handleAddComment} disabled={loading} className="bg-rose-600 p-2 rounded-xl text-white shadow-lg active:scale-90 transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
      </div>
      <div className="space-y-3 max-h-48 md:max-h-64 overflow-y-auto custom-scrollbar">
        {comments.map(c => (
          <div key={c.id} className="flex gap-2 animate-fadeIn">
            <img src={c.authorPhoto} className="w-7 h-7 rounded-lg object-cover" alt="u" />
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl px-3 py-2 flex-1">
              <div className="flex justify-between items-center mb-0.5"><span className="text-[9px] font-black text-rose-500 uppercase">{c.authorName}</span><span className="text-[7px] text-slate-600">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
              <p className="text-[10px] md:text-[11px] text-slate-300 leading-snug">{c.text}</p>
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
    if (!isPremium) { navigate('/pro'); return; }
    if (!newContent.trim() && !selectedFile) return;
    setUploading(true);
    try {
      const imageUrl = selectedFile ? await uploadToImgBB(selectedFile) : null;
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid, authorName: user.displayName, authorPhoto: user.photoURL, authorRole: user.role, authorVerified: user.isVerified || false,
        type: postType, title: postType === 'article' ? newTitle : null, content: newContent, imageUrl: imageUrl, likes: [], dislikes: [], commentsCount: 0, createdAt: Date.now()
      });
      setNewContent(''); setNewTitle(''); setSelectedFile(null); setPostType('standard');
    } catch (err) { alert("Fail."); } finally { setUploading(false); }
  };

  const handleLike = async (post: Post) => {
    const isLiked = post.likes.includes(user.uid);
    await updateDoc(doc(db, 'posts', post.id), {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      dislikes: arrayRemove(user.uid)
    });
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Delete this transmission forever?")) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (e) {
      alert("Permission denied or link lost.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-10 animate-fadeIn px-1 md:px-0 pb-20">
      <AdsterraAd id="feed-top-banner" format="banner" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 px-2 md:px-0">
        <div><h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Community Wall</h1></div>
        {!isPremium && <Link to="/pro" className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all inline-flex items-center gap-2 self-start md:self-auto">Premium Decryption</Link>}
      </div>

      <div className={`glass-effect rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 border border-white/10 relative overflow-hidden transition-all ${!isPremium ? 'opacity-40 select-none' : ''}`}>
        {!isPremium && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 text-center cursor-pointer" onClick={() => navigate('/pro')}>
             <p className="text-white font-black uppercase text-[10px] md:text-xs tracking-widest">Upgrade to Broadcast Signal</p>
          </div>
        )}
        <div className="flex gap-2 md:gap-4 mb-4 md:mb-6"><button onClick={() => setPostType('standard')} className={`px-4 py-1.5 md:px-6 md:py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase transition-all ${postType === 'standard' ? 'bg-rose-600 text-white' : 'text-slate-500'}`}>Signal</button><button onClick={() => setPostType('article')} className={`px-4 py-1.5 md:px-6 md:py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase transition-all ${postType === 'article' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Article</button></div>
        <div className="flex gap-3 md:gap-5"><img src={user.photoURL} alt="u" className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover shrink-0" /><div className="flex-1 space-y-3">{postType === 'article' && <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Headline..." className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-white focus:outline-none" />}<textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder={postType === 'standard' ? "Update grid..." : "Compose deep signal..."} className="w-full bg-slate-950/50 rounded-2xl p-4 text-xs md:text-sm text-slate-100 placeholder-slate-700 border border-white/5 min-h-[80px] md:min-h-[120px] focus:outline-none focus:border-rose-500/30 transition-all resize-none" /></div></div>
        <div className="flex items-center justify-between mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/5"><label className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-rose-400 group"><div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-rose-500/30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2.5}/></svg></div><span className="text-[9px] font-black uppercase hidden sm:inline">Media</span><input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} /></label><button onClick={handleCreatePost} disabled={uploading} className="bg-rose-600 hover:bg-rose-500 text-white px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50">{uploading ? 'Transmitting...' : 'Transmit'}</button></div>
      </div>

      <div className="space-y-6 md:space-y-10">
        {fetching ? <div className="py-20 flex flex-col items-center gap-4"><div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div></div> : posts.map((post, idx) => (
          <React.Fragment key={post.id}>
            {idx > 0 && idx % 4 === 0 && <AdsterraAd id={`feed-node-${idx}`} format="native" />}
            <div className="glass-effect rounded-3xl md:rounded-[2.8rem] overflow-hidden border border-white/5 shadow-xl transition-all duration-300 hover:scale-[1.01] hover:shadow-rose-600/5 group/post">
              <div className="p-5 md:p-10">
                <div className="flex items-center justify-between mb-5 md:mb-8">
                  <Link to={`/profile/${post.authorId}`} className="flex items-center gap-3 md:gap-4">
                    <img src={post.authorPhoto} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl object-cover ring-2 md:ring-4 ring-slate-950 transition-transform group-hover/post:scale-110" alt="a" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] md:text-sm font-black text-slate-100 uppercase tracking-tight">{post.authorName}</span>
                        <UserBadge role={post.authorRole} />
                      </div>
                      <span className="text-[7px] md:text-[8px] text-slate-600 uppercase tracking-widest font-black mt-0.5 block">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                  {(post.authorId === user.uid || user.role === 'admin') && (
                    <button onClick={() => handleDeletePost(post.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
                
                {post.type === 'article' && <AdsterraAd id={`article-ad-${post.id}`} format="banner" className="mb-6" />}
                
                {post.type === 'article' && post.title && <h3 className="text-lg md:text-2xl font-black text-white tracking-tighter mb-3 leading-tight uppercase">{post.title}</h3>}
                <TruncatedText text={post.content} limit={240} />
                {post.imageUrl && <div className={`rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/5 bg-slate-950 mt-5 md:mt-8 relative transition-transform duration-500 group-hover/post:translate-y-[-4px] ${!isPremium ? 'grayscale blur-md select-none' : ''}`}><img src={post.imageUrl} className="w-full h-auto max-h-[400px] md:max-h-[600px] object-cover" alt="c" />{!isPremium && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => navigate('/pro')}><span className="bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-4 py-2 rounded-xl shadow-2xl cursor-pointer">Premium to Decrypt</span></div>}</div>}
                <div className="flex items-center gap-5 md:gap-8 mt-6 md:mt-10 pt-6 md:pt-8 border-t border-white/5">
                  <button onClick={() => handleLike(post)} className={`flex items-center gap-2 text-[9px] md:text-[10px] font-black tracking-widest transition-all ${post.likes.includes(user.uid) ? 'text-rose-500' : 'text-slate-500'}`}>
                    <div className={`p-2 rounded-xl transition-all transform active:scale-150 active:rotate-12 ${post.likes.includes(user.uid) ? 'bg-rose-500/10' : 'bg-slate-900'}`}>
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill={post.likes.includes(user.uid) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    </div>
                    {post.likes.length}
                  </button>
                  <button onClick={() => setOpenComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))} className={`flex items-center gap-2 text-[9px] md:text-[10px] font-black tracking-widest transition-all ${openComments[post.id] ? 'text-rose-400' : 'text-slate-500'}`}>
                    <div className={`p-2 rounded-xl transition-all transform active:scale-150 active:-rotate-12 ${openComments[post.id] ? 'bg-rose-500/10' : 'bg-slate-900'}`}>
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    {post.commentsCount}
                  </button>
                </div>
                {openComments[post.id] && <CommentSection postId={post.id} user={user} />}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
      <AdsterraAd id="feed-bottom" format="banner" />
    </div>
  );
};

export default FeedView;
