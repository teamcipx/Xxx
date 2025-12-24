
import React, { useState, useEffect } from 'react';
import { User, Gender, Post, Comment } from '../types';
import * as ReactRouterDOM from 'react-router-dom';
const { useParams, useNavigate, Link } = ReactRouterDOM as any;

import { db } from '../services/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  increment,
  arrayUnion,
  arrayRemove,
  addDoc
} from 'firebase/firestore';
import { AdsterraAd } from '../components/AdsterraAd';
import { UserBadge } from '../components/UserBadge';
import { uploadToImgBB } from '../services/imgbb';

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

const ProfileView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const isOwnProfile = !uid || uid === activeUser.uid;
  const targetUid = uid || activeUser.uid;
  
  const [profileUser, setProfileUser] = useState<User | null>(isOwnProfile ? activeUser : null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(!isOwnProfile);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [dpUploading, setDpUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAge, setEditAge] = useState<number>(18);
  const [editGender, setEditGender] = useState<Gender>('Male');
  const [editInterests, setEditInterests] = useState('');
  const [editSocials, setEditSocials] = useState({ telegram: '', facebook: '' });

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', targetUid));
        if (userDoc.exists()) {
          const data = userDoc.data() as User;
          setProfileUser(data);
          setEditName(data.displayName);
          setEditBio(data.bio);
          setEditAge(data.age || 18);
          setEditGender(data.gender || 'Male');
          setEditInterests(data.interests || '');
          setEditSocials({ 
            telegram: data.socials?.telegram || '', 
            facebook: data.socials?.facebook || '' 
          });
        }
      } finally { setLoading(false); }
    };
    fetchUser();
  }, [targetUid]);

  useEffect(() => {
    setLoadingPosts(true);
    const q = query(
      collection(db, 'posts'), 
      where('authorId', '==', targetUid), 
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[]);
      setLoadingPosts(false);
    });
    return unsubscribe;
  }, [targetUid]);

  const handleUpdateDP = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileUser) return;
    setDpUploading(true);
    try {
      const url = await uploadToImgBB(file);
      await updateDoc(doc(db, 'users', profileUser.uid), { photoURL: url });
      setProfileUser({ ...profileUser, photoURL: url });
    } finally { setDpUploading(false); }
  };

  const handleSaveProfile = async () => {
    if (!profileUser) return;
    setIsSaving(true);
    try {
      const updates = { 
        displayName: editName, 
        bio: editBio, 
        age: editAge, 
        gender: editGender, 
        interests: editInterests, 
        socials: editSocials 
      };
      await updateDoc(doc(db, 'users', profileUser.uid), updates);
      setProfileUser({ ...profileUser, ...updates });
      setIsEditing(false);
    } finally { setIsSaving(false); }
  };

  const handleLike = async (post: Post) => {
    const isLiked = post.likes.includes(activeUser.uid);
    await updateDoc(doc(db, 'posts', post.id), {
      likes: isLiked ? arrayRemove(activeUser.uid) : arrayUnion(activeUser.uid),
      dislikes: arrayRemove(activeUser.uid)
    });
  };

  const handleStartDM = () => {
    const participants = [activeUser.uid, targetUid].sort();
    const chatId = `dm_${participants[0]}_${participants[1]}`;
    navigate(`/chat/${chatId}`);
  };

  if (loading) return (
    <div className="py-24 flex flex-col items-center gap-6">
      <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.5em]">Establishing Signal</p>
    </div>
  );
  
  if (!profileUser) return (
    <div className="py-24 text-center space-y-6">
       <h2 className="text-2xl font-black text-rose-500 uppercase">Lost Signal</h2>
       <button onClick={() => navigate('/')} className="px-8 py-3 bg-slate-900 rounded-xl text-[9px] font-black uppercase">Home</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 animate-fadeIn pb-32">
      <div className="glass-effect rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl relative">
        <div className="h-32 md:h-64 bg-gradient-to-br from-slate-900 via-slate-950 to-rose-950/30 relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-500 via-transparent to-transparent"></div>
        </div>
        
        <div className="px-5 md:px-12 pb-12 md:pb-16 -mt-16 md:-mt-24 relative flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-12">
          <div className="relative group shrink-0">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-tr from-rose-600 to-indigo-600 rounded-3xl md:rounded-[2.5rem] blur opacity-30"></div>
              <img 
                src={profileUser.photoURL} 
                className={`relative w-32 h-32 md:w-56 md:h-56 rounded-3xl md:rounded-[2.5rem] object-cover ring-4 md:ring-8 ring-slate-950 shadow-2xl transition-all ${dpUploading ? 'opacity-50 blur-sm' : ''}`} 
                alt="p" 
              />
            </div>
            {isOwnProfile && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-3xl md:rounded-[2.5rem] cursor-pointer transition-all">
                <input type="file" className="hidden" accept="image/*" onChange={handleUpdateDP} />
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
              </label>
            )}
          </div>
          
          <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-5">
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter truncate max-w-[280px] md:max-w-none">{profileUser.displayName}</h2>
              <UserBadge role={profileUser.role} verified={profileUser.isVerified} className="scale-100 md:scale-125" />
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-5">
               {[
                 { l: 'Node Age', v: profileUser.age || '??' },
                 { l: 'Gender', v: profileUser.gender || '??' },
                 { l: 'Linked', v: new Date(profileUser.joinedAt).toLocaleDateString() }
               ].map((stat, i) => (
                 <div key={i} className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{stat.l}</span>
                    <div className="px-3 py-1 bg-slate-900/60 rounded-lg border border-white/5 text-[9px] font-black uppercase text-slate-400">{stat.v}</div>
                 </div>
               ))}
            </div>

            <p className="text-slate-400 text-sm md:text-lg font-medium italic leading-relaxed max-w-2xl mx-auto md:mx-0 border-l-2 border-rose-500/30 pl-4 py-0.5">
               "{profileUser.bio || 'Signal pending initialization...'}"
            </p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 pt-1">
               {profileUser.socials?.telegram && (
                 <a href={`https://t.me/${profileUser.socials.telegram}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[8px] font-black uppercase text-indigo-400">Telegram</a>
               )}
               {profileUser.socials?.facebook && (
                 <a href={`https://fb.com/${profileUser.socials.facebook}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[8px] font-black uppercase text-blue-400">Facebook</a>
               )}
            </div>
          </div>
          
          <div className="flex flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
            {isOwnProfile ? (
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                className="w-full md:px-8 py-4 bg-rose-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                {isEditing ? 'Cancel Override' : 'Override Specs'}
              </button>
            ) : (
              <button 
                onClick={handleStartDM}
                className="w-full md:px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                Signal Citizen
              </button>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="p-6 md:p-12 bg-slate-900/40 border-t border-white/10 space-y-8 animate-fadeIn">
            <h3 className="text-[9px] font-black text-rose-500 uppercase tracking-[0.4em]">Node Calibration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              <div className="space-y-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 ml-1">Alias</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-3 text-xs font-bold text-white outline-none focus:border-rose-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 ml-1">Age</label>
                    <input type="number" value={editAge} onChange={(e) => setEditAge(parseInt(e.target.value))} className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-3 text-xs font-bold text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 ml-1">Gender</label>
                    <select value={editGender} onChange={(e) => setEditGender(e.target.value as Gender)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-3 text-xs font-bold text-white outline-none appearance-none">
                      <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 ml-1">Interests</label>
                  <input type="text" value={editInterests} onChange={(e) => setEditInterests(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-3 text-xs font-bold text-white outline-none" placeholder="Tech, Music, Art" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 ml-1">Telegram</label>
                    <input type="text" value={editSocials.telegram} onChange={(e) => setEditSocials({...editSocials, telegram: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-3 text-xs font-bold text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 ml-1">FB ID</label>
                    <input type="text" value={editSocials.facebook} onChange={(e) => setEditSocials({...editSocials, facebook: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-3 text-xs font-bold text-white outline-none" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="block text-[8px] font-black text-slate-500 uppercase ml-1">Protocol Bio</label>
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-2xl p-5 text-xs text-slate-300 h-24 outline-none focus:border-rose-500/50 transition-all resize-none" />
              </div>
            </div>
            
            <button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-rose-600 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-2xl hover:bg-rose-500 transition-all active:scale-[0.98] disabled:opacity-50">Synchronize Node</button>
          </div>
        )}
      </div>

      {/* Profile Broadcast History (Posts) */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Signal Logs</h3>
           <div className="h-px flex-1 mx-6 bg-white/5"></div>
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{posts.length} Transmissions</span>
        </div>

        <div className="space-y-6 md:space-y-10">
          {loadingPosts ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center glass-effect rounded-[2.5rem] border border-white/5">
               <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.5em]">No signal history found for this node.</p>
            </div>
          ) : posts.map((post, idx) => (
            <div key={post.id} className="glass-effect rounded-3xl md:rounded-[2.8rem] overflow-hidden border border-white/5 shadow-xl transition-all duration-300 hover:scale-[1.01] hover:shadow-rose-600/5 group/post">
              <div className="p-5 md:p-10">
                <div className="flex items-center justify-between mb-5 md:mb-8">
                  <div className="flex items-center gap-3 md:gap-4">
                    <img src={post.authorPhoto} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl object-cover ring-2 md:ring-4 ring-slate-950 transition-transform group-hover/post:scale-110" alt="a" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] md:text-sm font-black text-slate-100 uppercase tracking-tight">{post.authorName}</span>
                        <UserBadge role={post.authorRole} />
                      </div>
                      <span className="text-[7px] md:text-[8px] text-slate-600 uppercase tracking-widest font-black mt-0.5 block">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                {post.type === 'article' && post.title && <h3 className="text-lg md:text-2xl font-black text-white tracking-tighter mb-3 leading-tight uppercase">{post.title}</h3>}
                <TruncatedText text={post.content} limit={240} />
                {post.imageUrl && <div className={`rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/5 bg-slate-950 mt-5 md:mt-8 relative transition-transform duration-500 group-hover/post:translate-y-[-4px]`}><img src={post.imageUrl} className="w-full h-auto max-h-[400px] md:max-h-[600px] object-cover" alt="c" /></div>}
                
                <div className="flex items-center gap-5 md:gap-8 mt-6 md:mt-10 pt-6 md:pt-8 border-t border-white/5">
                  <button onClick={() => handleLike(post)} className={`flex items-center gap-2 text-[9px] md:text-[10px] font-black tracking-widest transition-all ${post.likes.includes(activeUser.uid) ? 'text-rose-500' : 'text-slate-500'}`}>
                    <div className={`p-2 rounded-xl transition-all transform active:scale-150 active:rotate-12 ${post.likes.includes(activeUser.uid) ? 'bg-rose-500/10' : 'bg-slate-900'}`}>
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill={post.likes.includes(activeUser.uid) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
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
                {openComments[post.id] && <CommentSection postId={post.id} user={activeUser} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-2">
        <AdsterraAd id="profile-mid-native" format="native" />
      </div>
      
      <div className="flex justify-center px-4"><AdsterraAd id="profile-node-bottom" format="banner" /></div>
    </div>
  );
};

export default ProfileView;
