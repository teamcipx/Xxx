
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const q = query(collection(db, 'comments'), where('postId', '==', postId), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(data);
    }, (err) => {
      console.error("Firestore Comment Error:", err);
      if (err.code === 'failed-precondition') {
        setError("Comments index required. Admin needs to create it.");
      }
    });
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-fadeIn">
      <div className="flex gap-3">
        <img src={user.photoURL} className="w-8 h-8 rounded-lg object-cover" alt="me" />
        <div className="flex-1 flex gap-2">
          <input 
            type="text" 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            placeholder="Write a comment..."
            className="flex-1 bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
          />
          <button 
            onClick={handleAddComment}
            disabled={loading}
            className="bg-indigo-600 p-2 rounded-xl hover:bg-indigo-500 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
          </button>
        </div>
      </div>
      
      {error && <p className="text-[10px] text-red-400 font-bold italic">{error}</p>}
      
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {comments.map(c => (
          <div key={c.id} className="flex gap-3 animate-slideIn">
            <img src={c.authorPhoto} className="w-7 h-7 rounded-lg object-cover" alt="u" />
            <div className="bg-slate-800/50 rounded-2xl px-3 py-2 flex-1">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-400">{c.authorName}</span>
                  <UserBadge role={c.authorRole} />
                </div>
                <span className="text-[9px] text-slate-500">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-xs text-slate-300">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface FeedViewProps {
  user: User;
}

const FeedView: React.FC<FeedViewProps> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newContent, setNewContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setFetching(false);
    }, (err) => {
      console.error("Feed Fetch Error:", err);
      setFetching(false);
    });
    return unsubscribe;
  }, []);

  const handleCreatePost = async () => {
    if (!newContent.trim() && !selectedFile) return;

    setUploading(true);
    try {
      let imageUrl = undefined;
      if (selectedFile) {
        imageUrl = await uploadToImgBB(selectedFile);
      }

      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        authorRole: user.role,
        content: newContent,
        imageUrl: imageUrl || null,
        likes: [],
        dislikes: [],
        commentsCount: 0,
        createdAt: Date.now()
      });

      setNewContent('');
      setSelectedFile(null);
    } catch (err) {
      alert("Error posting your content. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (post: Post) => {
    const postRef = doc(db, 'posts', post.id);
    const isLiked = post.likes.includes(user.uid);
    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      dislikes: arrayRemove(user.uid)
    });
  };

  const handleDislike = async (post: Post) => {
    const postRef = doc(db, 'posts', post.id);
    const isDisliked = post.dislikes.includes(user.uid);
    await updateDoc(postRef, {
      dislikes: isDisliked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      likes: arrayRemove(user.uid)
    });
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post? This action is irreversible.")) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
      } catch (err) {
        alert("Failed to delete post.");
      }
    }
  };

  const toggleComments = (postId: string) => {
    setOpenComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="glass-effect rounded-[2rem] p-6 space-y-4 shadow-xl border border-indigo-500/10">
        <div className="flex gap-4">
          <img src={user.photoURL} alt="user" className="w-14 h-14 rounded-2xl ring-2 ring-indigo-500/20 object-cover" />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={`What's happening, ${user.displayName.split(' ')[0]}?`}
            className="w-full bg-slate-900/50 rounded-2xl p-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none min-h-[120px] transition-all"
          />
        </div>

        {selectedFile && (
          <div className="relative inline-block ml-16">
            <img src={URL.createObjectURL(selectedFile)} alt="preview" className="max-h-56 rounded-2xl border border-white/5 shadow-2xl" />
            <button 
              onClick={() => setSelectedFile(null)}
              className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/5 pt-5 ml-16">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-400 group-hover:bg-indigo-500/20 transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-400 group-hover:text-slate-200 transition-colors">Attach Media</span>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
          </label>

          <button
            onClick={handleCreatePost}
            disabled={uploading || (!newContent.trim() && !selectedFile)}
            className={`bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black transition-all transform active:scale-95 shadow-lg shadow-indigo-600/20 ${uploading ? 'opacity-50 grayscale' : ''}`}
          >
            {uploading ? 'Publishing...' : 'Publish Post'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {fetching ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
            <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">Fetching Stories</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <React.Fragment key={post.id}>
              {index > 0 && index % 3 === 0 && <AdsterraAd id={`feed-ad-${index}`} />}

              <div className="glass-effect rounded-[2rem] overflow-hidden shadow-lg border border-white/5 transition-all hover:border-indigo-500/20 group">
                <div className="p-6 flex gap-5">
                  <Link to={`/profile/${post.authorId}`} className="flex-shrink-0">
                    <img src={post.authorPhoto} alt="author" className="w-12 h-12 rounded-[1.2rem] object-cover ring-2 ring-white/5 group-hover:ring-indigo-500/30 transition-all shadow-lg" />
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link to={`/profile/${post.authorId}`} className="font-black text-slate-100 hover:text-indigo-400 transition-colors">{post.authorName}</Link>
                          <UserBadge role={post.authorRole} />
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Contributor</p>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-bold text-slate-600 bg-slate-900/50 px-2.5 py-1 rounded-full">{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                         {user.role === 'admin' && (
                           <button onClick={() => handleDeletePost(post.id)} className="text-red-500/50 hover:text-red-500 p-1 transition-colors" title="Delete Post">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                         )}
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed mb-5 whitespace-pre-wrap font-medium">{post.content}</p>
                    {post.imageUrl && (
                      <div className="rounded-2xl overflow-hidden border border-white/5 mb-5 bg-slate-900 shadow-2xl">
                        <img src={post.imageUrl} alt="content" className="w-full h-auto max-h-[600px] object-cover transition-transform duration-700 hover:scale-105" />
                      </div>
                    )}

                    <div className="flex items-center gap-8 pt-4 border-t border-white/5">
                      <button 
                        onClick={() => handleLike(post)}
                        className={`flex items-center gap-2 text-xs font-black transition-all transform active:scale-90 ${post.likes?.includes(user.uid) ? 'text-indigo-400' : 'text-slate-500 hover:text-indigo-400'}`}
                      >
                        <div className={`p-2 rounded-xl ${post.likes?.includes(user.uid) ? 'bg-indigo-500/10' : 'bg-transparent group-hover:bg-indigo-500/5'}`}>
                          <svg className="w-5 h-5" fill={post.likes?.includes(user.uid) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                        </div>
                        {post.likes?.length || 0}
                      </button>

                      <button 
                        onClick={() => handleDislike(post)}
                        className={`flex items-center gap-2 text-xs font-black transition-all transform active:scale-90 ${post.dislikes?.includes(user.uid) ? 'text-red-400' : 'text-slate-500 hover:text-red-400'}`}
                      >
                        <div className={`p-2 rounded-xl ${post.dislikes?.includes(user.uid) ? 'bg-red-500/10' : 'bg-transparent group-hover:bg-red-500/5'}`}>
                          <svg className="w-5 h-5" fill={post.dislikes?.includes(user.uid) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.017c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                        </div>
                        {post.dislikes?.length || 0}
                      </button>

                      <button 
                        onClick={() => toggleComments(post.id)}
                        className={`flex items-center gap-2 text-xs font-black transition-all ${openComments[post.id] ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-200'}`}
                      >
                        <div className={`p-2 rounded-xl ${openComments[post.id] ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        {post.commentsCount || 0} Comments
                      </button>
                    </div>

                    {openComments[post.id] && <CommentSection postId={post.id} user={user} />}
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedView;
