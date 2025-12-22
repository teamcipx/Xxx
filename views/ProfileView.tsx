
import React, { useState, useEffect } from 'react';
import { User, Post, Comment, Gender } from '../types';
import { generateBio } from '../services/gemini';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';
import { AdsterraAd } from '../components/AdsterraAd';
import { UserBadge } from '../components/UserBadge';
import { uploadToImgBB } from '../services/imgbb';

const ProfileView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const isOwnProfile = !uid || uid === activeUser.uid;
  const targetUid = uid || activeUser.uid;
  
  const [profileUser, setProfileUser] = useState<User | null>(isOwnProfile ? activeUser : null);
  const [loading, setLoading] = useState(!isOwnProfile);
  const [interests, setInterests] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAge, setEditAge] = useState<number>(18);
  const [editGender, setEditGender] = useState<Gender>('Male');
  const [editInterests, setEditInterests] = useState('');
  const [editSocials, setEditSocials] = useState({ 
    twitter: '', github: '', instagram: '', website: '', telegram: '', facebook: '' 
  });
  const [isSaving, setIsSaving] = useState(false);
  const [dpUploading, setDpUploading] = useState(false);

  // Activity state
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [indexErrors, setIndexErrors] = useState<{ posts?: boolean; comments?: boolean }>({});

  const canSeeActivity = isOwnProfile || activeUser.role === 'admin';

  useEffect(() => {
    const fetchUser = async () => {
      if (!isOwnProfile && uid) {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as User;
          setProfileUser(data);
          initializeEditFields(data);
        }
        setLoading(false);
      } else {
        setProfileUser(activeUser);
        initializeEditFields(activeUser);
      }
    };
    fetchUser();
  }, [uid, activeUser, isOwnProfile]);

  const initializeEditFields = (user: User) => {
    setEditName(user.displayName);
    setEditBio(user.bio);
    setEditAge(user.age || 18);
    setEditGender(user.gender || 'Male');
    setEditInterests(user.interests || '');
    setEditSocials({
      twitter: user.socials?.twitter || '',
      github: user.socials?.github || '',
      instagram: user.socials?.instagram || '',
      website: user.socials?.website || '',
      telegram: user.socials?.telegram || '',
      facebook: user.socials?.facebook || '',
    });
  };

  useEffect(() => {
    if (canSeeActivity && targetUid) {
      fetchActivity();
    }
  }, [targetUid, canSeeActivity]);

  const fetchActivity = async () => {
    setActivityLoading(true);
    setIndexErrors({});
    
    try {
      const postsQ = query(
        collection(db, 'posts'),
        where('authorId', '==', targetUid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const postsSnap = await getDocs(postsQ);
      setUserPosts(postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    } catch (err: any) {
      if (err.code === 'failed-precondition') setIndexErrors(prev => ({ ...prev, posts: true }));
    }

    try {
      const commentsQ = query(
        collection(db, 'comments'),
        where('authorId', '==', targetUid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const commentsSnap = await getDocs(commentsQ);
      setUserComments(commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    } catch (err: any) {
      if (err.code === 'failed-precondition') setIndexErrors(prev => ({ ...prev, comments: true }));
    }

    setActivityLoading(false);
  };

  const handleUpdateDP = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileUser) return;

    setDpUploading(true);
    try {
      const url = await uploadToImgBB(file);
      const userRef = doc(db, 'users', profileUser.uid);
      await updateDoc(userRef, { photoURL: url });
      setProfileUser({ ...profileUser, photoURL: url });
      alert("Display picture updated!");
    } catch (err) {
      alert("Upload failed.");
    } finally {
      setDpUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileUser) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', profileUser.uid);
      const updates = {
        displayName: editName,
        bio: editBio,
        age: editAge,
        gender: editGender,
        interests: editInterests,
        socials: editSocials
      };
      await updateDoc(userRef, updates);
      setProfileUser({ ...profileUser, ...updates });
      setIsEditing(false);
      alert("Signal updated!");
    } catch (err) {
      alert("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateBio = async () => {
    if (!interests.trim()) return;
    setIsGenerating(true);
    try {
      const newBio = await generateBio(interests);
      if (profileUser) {
        const userRef = doc(db, 'users', profileUser.uid);
        await updateDoc(userRef, { bio: newBio });
        setProfileUser({ ...profileUser, bio: newBio });
        setEditBio(newBio);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const startPrivateChat = () => {
    if (!profileUser) return;
    const combinedId = [activeUser.uid, profileUser.uid].sort().join('_');
    navigate(`/chat/${combinedId}`);
  };

  if (loading) return <div className="flex justify-center p-20 animate-pulse text-rose-500">Accessing Signal...</div>;

  if (!profileUser) return <div className="text-center p-20 text-slate-500">Signal lost.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 px-2 md:px-0">
      <div className="glass-effect rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 relative">
        <div className="h-40 bg-gradient-to-br from-rose-900 via-slate-900 to-indigo-900 relative">
           <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"></div>
        </div>
        <div className="px-6 md:px-10 pb-10 -mt-16 relative">
          <div className="flex justify-between items-end mb-8">
            <div className="relative group">
              <img src={profileUser.photoURL} alt="profile" className={`w-32 h-32 rounded-[2rem] object-cover ring-8 ring-slate-950 shadow-2xl transition-all duration-500 ${dpUploading ? 'opacity-50' : 'group-hover:scale-105 group-hover:rotate-1'}`} />
              {isOwnProfile && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-[2rem] cursor-pointer transition-opacity">
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpdateDP} disabled={dpUploading} />
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                </label>
              )}
              <div className="absolute -bottom-1 -right-1 transform rotate-12">
                <UserBadge role={profileUser.role} />
              </div>
            </div>
            <div className="flex gap-2">
              {isOwnProfile ? (
                <button onClick={() => setIsEditing(!isEditing)} className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20">
                  {isEditing ? 'Cancel' : 'Edit Signal'}
                </button>
              ) : (
                <button onClick={startPrivateChat} className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                  Message
                </button>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="space-y-4 bg-slate-900/40 p-6 rounded-[2rem] border border-rose-500/20 mb-8 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Display Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-rose-500/40 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Age</label>
                  <input type="number" value={editAge} onChange={(e) => setEditAge(parseInt(e.target.value))} className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-rose-500/40 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Gender</label>
                  <select value={editGender} onChange={(e) => setEditGender(e.target.value as Gender)} className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2 text-slate-100 text-xs focus:ring-1 focus:ring-rose-500/40 outline-none appearance-none">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Bio</label>
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2 text-slate-100 text-xs h-20 outline-none focus:ring-1 focus:ring-rose-500/40" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Interests</label>
                  <input type="text" value={editInterests} onChange={(e) => setEditInterests(e.target.value)} className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2 text-slate-100 text-xs outline-none focus:ring-1 focus:ring-rose-500/40" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Telegram Link</label>
                  <input type="text" value={editSocials.telegram} onChange={(e) => setEditSocials({...editSocials, telegram: e.target.value})} className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2 text-slate-100 text-xs outline-none focus:ring-1 focus:ring-rose-500/40" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">FB Link</label>
                  <input type="text" value={editSocials.facebook} onChange={(e) => setEditSocials({...editSocials, facebook: e.target.value})} className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2 text-slate-100 text-xs outline-none focus:ring-1 focus:ring-rose-500/40" />
                </div>
              </div>
              <button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-95">
                {isSaving ? 'Processing...' : 'Sync Identity'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-100 tracking-tight">{profileUser.displayName}</h2>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${profileUser.gender === 'Female' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {profileUser.gender || 'Member'} • {profileUser.age || 'Mature'}
                    </span>
                    <span className="text-slate-600 text-[10px] font-bold">Signal established {new Date(profileUser.joinedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {profileUser.socials?.telegram && (
                    <a href={profileUser.socials.telegram.startsWith('http') ? profileUser.socials.telegram : `https://t.me/${profileUser.socials.telegram.replace('@','')}`} target="_blank" rel="noreferrer" className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 p-2.5 rounded-xl transition-all border border-sky-500/20">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.89.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.97 8.24-3.54 3.93-1.63 4.74-1.92 5.28-1.93.12 0 .38.03.55.17.14.12.18.28.19.4z"/></svg>
                    </a>
                  )}
                  {profileUser.socials?.facebook && (
                    <a href={profileUser.socials.facebook.startsWith('http') ? profileUser.socials.facebook : `https://fb.com/${profileUser.socials.facebook}`} target="_blank" rel="noreferrer" className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 p-2.5 rounded-xl transition-all border border-blue-600/20">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24h-1.918c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="md:col-span-2 bg-slate-900/50 rounded-2xl p-6 border border-white/5 h-full">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Member Bio</p>
                    <p className="text-slate-300 font-medium leading-relaxed italic">"{profileUser.bio || "Crafting an elite signal presence..."}"</p>
                 </div>
                 <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Interests</p>
                    <div className="flex flex-wrap gap-2">
                       {(profileUser.interests || "Casual Conversation").split(',').map((tag, i) => (
                         <span key={i} className="bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg text-[9px] font-bold border border-white/5">{tag.trim()}</span>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <AdsterraAd id="profile-signal-mid" />
      </div>

      {canSeeActivity && (
        <div className="glass-effect rounded-[2.5rem] overflow-hidden shadow-xl border border-white/5">
          <div className="flex border-b border-white/5">
            <button onClick={() => setActiveTab('posts')} className={`flex-1 py-5 text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'posts' ? 'text-rose-500 bg-rose-500/5' : 'text-slate-500 hover:text-slate-300'}`}>
              Signals Shared
            </button>
            <button onClick={() => setActiveTab('comments')} className={`flex-1 py-5 text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'comments' ? 'text-rose-500 bg-rose-500/5' : 'text-slate-500 hover:text-slate-300'}`}>
              Voice Records
            </button>
          </div>

          <div className="p-6 md:p-8">
            {activityLoading ? (
              <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500"></div></div>
            ) : activeTab === 'posts' ? (
              <div className="space-y-4">
                {userPosts.length === 0 ? (
                  <p className="text-center text-slate-600 text-[10px] font-black uppercase py-10 tracking-widest">No active signals found</p>
                ) : (
                  userPosts.map(post => (
                    <div key={post.id} className="bg-slate-900/40 rounded-2xl p-5 border border-white/5 hover:border-rose-500/20 transition-all group animate-slideIn">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString()}</span>
                        {isOwnProfile && <button className="text-red-500/40 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2 mb-3">{post.content}</p>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {userComments.length === 0 ? (
                  <p className="text-center text-slate-600 text-[10px] font-black uppercase py-10 tracking-widest">Voice unheard in this sector</p>
                ) : (
                  userComments.map(comment => (
                    <div key={comment.id} className="bg-slate-900/40 rounded-2xl p-5 border border-white/5 animate-slideIn">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-300 italic">"{comment.text}"</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
