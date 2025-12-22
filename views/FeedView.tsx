import React, { useState, useEffect } from 'react';
import { User, Post, Comment } from '../types';
import { uploadToImgBB } from '../services/imgbb';
import { Link } from 'react-router-dom';
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
  deleteDoc,
  increment,
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';

const CommentSection: React.FC<{ postId: string; user: User }> = ({ postId, user }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

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
          placeholder="Speak your mind..."
          className="flex-1 bg-slate-900 border border-white/5 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500/40"
        />
        <button onClick={handleAddComment} disabled={loading} className="bg-indigo-600 p-2 rounded-xl">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
        </button>
      </div>
      <div className="space-y-3 max-h-56 overflow-y-auto custom-scrollbar">
        {comments.map(c => (
          <div key={c.id} className="flex gap-3">
            <img src={c.authorPhoto} className="w-6 h-6 rounded-lg object-cover" alt="u" />
            <div className="bg-slate-800/30 rounded-xl px-3 py-2 flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-indigo-400">{c.authorName}</span>
                <span className="text-[8px] text-slate-500">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-[11px] text-slate-300">{c.text}</p>
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[]);
      setFetching(false);
    });
    return unsubscribe;
  }, []);

  const handleCreatePost = async () => {
    if (!newContent.trim() && !selectedFile) return;
    setUploading(true);
    try {
      const imageUrl = selectedFile ? await uploadToImgBB(selectedFile) : null;
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        authorRole: user.role,
        content: newContent,
        imageUrl: imageUrl,
        likes: [],
        dislikes: [],
        commentsCount: 0,
        createdAt: Date.now()
      });
      setNewContent('');
      setSelectedFile(null);
    } catch (err) { alert("Error posting."); } finally { setUploading(false); }
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
    <div className="space-y-6">
      <div className="glass-effect rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-white/5">
        <div className="flex gap-3 md:gap-4">
          <img src={user.photoURL} alt="u" className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover" />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Share something with the community..."
            className="w-full bg-slate-900/50 rounded-xl p-3 md:p-4 text-xs md:text-sm text-slate-100 placeholder-slate-600 focus:outline-none min-h-[80px] md:min-h-[100px]"
          />
        </div>
        {selectedFile && (
          <div className="mt-4 relative inline-block pl-13 md:pl-16">
            <img src={URL.createObjectURL(selectedFile)} alt="p" className="max-h-48 rounded-xl border border-white/10" />
            <button onClick={() => setSelectedFile(null)} className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        )}
        <div className="flex items-center justify-between mt-4 pl-13 md:pl-16 border-t border-white/5 pt-4">
          <label className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-indigo-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Media</span>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
          </label>
          <button onClick={handleCreatePost} disabled={uploading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            {uploading ? '...' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {fetching ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          posts.map((post, idx) => (
            <React.Fragment key={post.id}>
              {/* Ad placement every 2 posts */}
              {idx > 0 && idx % 2 === 0 && <AdsterraAd id={`feed-ad-${idx}`} />}
              
              <div className="glass-effect rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/5">
                <div className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Link to={`/profile/${post.authorId}`} className="flex items-center gap-3">
                      <img src={post.authorPhoto} className="w-9 h-9 md:w-10 md:h-10 rounded-lg object-cover" alt="a" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-100">{post.authorName}</span>
                          <UserBadge role={post.authorRole} />
                        </div>
                        <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Signal detected</span>
                      </div>
                    </Link>
                    <span className="text-[9px] font-bold text-slate-600">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
                  {post.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-white/5 bg-slate-900 mb-4">
                      <img src={post.imageUrl} className="w-full h-auto max-h-[500px] object-cover" alt="c" />
                    </div>
                  )}
                  <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                    <button onClick={() => handleLike(post)} className={`flex items-center gap-2 text-[10px] font-black ${post.likes.includes(user.uid) ? 'text-indigo-400' : 'text-slate-500'}`}>
                      <svg className="w-4 h-4" fill={post.likes.includes(user.uid) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                      {post.likes.length}
                    </button>
                    <button onClick={() => handleDislike(post)} className={`flex items-center gap-2 text-[10px] font-black ${post.dislikes.includes(user.uid) ? 'text-red-400' : 'text-slate-500'}`}>
                      <svg className="w-4 h-4" fill={post.dislikes.includes(user.uid) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.017c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                      {post.dislikes.length}
                    </button>
                    <button onClick={() => setOpenComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))} className={`flex items-center gap-2 text-[10px] font-black ${openComments[post.id] ? 'text-indigo-400' : 'text-slate-500'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      {post.commentsCount}
                    </button>
                  </div>
                  {openComments[post.id] && <CommentSection postId={post.id} user={user} />}
                </div>
              </div>
            </React.Fragment>
          ))
        )}
      </div>
      <AdsterraAd id="feed-bottom" />
    </div>
  );
};

export default FeedView;