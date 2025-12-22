
import React, { useState, useEffect } from 'react';
import { User, Post, Comment } from '../types';
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
  const [editSocials, setEditSocials] = useState({ twitter: '', github: '', instagram: '', website: '' });
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
    setEditSocials({
      twitter: user.socials?.twitter || '',
      github: user.socials?.github || '',
      instagram: user.socials?.instagram || '',
      website: user.socials?.website || '',
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
      console.error("Posts Fetch Error:", err);
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
      console.error("Comments Fetch Error:", err);
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
      alert("Display picture updated successfully!");
    } catch (err) {
      alert("Failed to upload image.");
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
        socials: editSocials
      };
      await updateDoc(userRef, updates);
      setProfileUser({ ...profileUser, ...updates });
      setIsEditing(false);
      alert("Profile updated!");
    } catch (err) {
      alert("Failed to save changes.");
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
    } catch (err) {
      alert("Error generating bio.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm("Delete this post permanently?")) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
        setUserPosts(prev => prev.filter(p => p.id !== postId));
      } catch (err) {
        alert("Failed to delete.");
      }
    }
  };

  const startPrivateChat = () => {
    if (!profileUser) return;
    const combinedId = [activeUser.uid, profileUser.uid].sort().join('_');
    navigate(`/chat/${combinedId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center p-20 glass-effect rounded-[2rem] border border-white/5">
        <h2 className="text-xl font-black text-slate-100 uppercase tracking-widest">User Lost</h2>
        <p className="text-slate-500 mt-2 font-medium">This signal has vanished from the forum.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn pb-20">
      <div className="glass-effect rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 relative">
        <div className="h-40 bg-gradient-to-br from-indigo-600 to-purple-800 relative">
           <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]"></div>
        </div>
        <div className="px-10 pb-10 -mt-16 relative">
          <div className="flex justify-between items-end mb-8">
            <div className="relative group">
              <img src={profileUser.photoURL || `https://ui-avatars.com/api/?name=${profileUser.displayName}`} alt="profile" className={`w-32 h-32 rounded-[2rem] object-cover ring-8 ring-slate-950 shadow-2xl transition-transform duration-500 ${dpUploading ? 'opacity-50' : 'group-hover:scale-105'}`} />
              {isOwnProfile && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-[2rem] cursor-pointer transition-opacity">
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpdateDP} disabled={dpUploading} />
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </label>
              )}
              <div className="absolute -bottom-1 -right-1 transform rotate-12">
                <UserBadge role={profileUser.role} className="!px-3 !py-1.5 !text-[10px]" />
              </div>
            </div>
            <div className="flex gap-2">
              {isOwnProfile ? (
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </button>
              ) : (
                <button 
                  onClick={startPrivateChat}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                  Message
                </button>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="space-y-6 animate-fadeIn bg-slate-900/40 p-8 rounded-[2rem] border border-indigo-500/20 mb-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Display Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/5 rounded-2xl px-5 py-3 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/5 rounded-2xl px-5 py-3 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Twitter (URL)</label>
                    <input type="text" value={editSocials.twitter} onChange={(e) => setEditSocials({...editSocials, twitter: e.target.value})} className="w-full bg-slate-950/60 border border-white/5 rounded-2xl px-5 py-3 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500/40 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">GitHub (URL)</label>
                    <input type="text" value={editSocials.github} onChange={(e) => setEditSocials({...editSocials, github: e.target.value})} className="w-full bg-slate-950/60 border border-white/5 rounded-2xl px-5 py-3 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500/40 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Instagram (URL)</label>
                    <input type="text" value={editSocials.instagram} onChange={(e) => setEditSocials({...editSocials, instagram: e.target.value})} className="w-full bg-slate-950/60 border border-white/5 rounded-2xl px-5 py-3 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500/40 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Website (URL)</label>
                    <input type="text" value={editSocials.website} onChange={(e) => setEditSocials({...editSocials, website: e.target.value})} className="w-full bg-slate-950/60 border border-white/5 rounded-2xl px-5 py-3 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500/40 transition-all" />
                  </div>
                </div>
              </div>
              <button 
                onClick={handleSaveProfile} 
                disabled={isSaving}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
              >
                {isSaving ? 'Saving Signal...' : 'Apply Changes'}
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-1 mb-6">
                <h2 className="text-3xl font-black text-slate-100 tracking-tight">{profileUser.displayName}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">@{profileUser.displayName.toLowerCase().replace(/ /g, '_')}</p>
                  <div className="flex gap-3">
                    {profileUser.socials?.twitter && (
                      <a href={profileUser.socials.twitter} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                      </a>
                    )}
                    {profileUser.socials?.github && (
                      <a href={profileUser.socials.github} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                      </a>
                    )}
                    {profileUser.socials?.website && (
                      <a href={profileUser.socials.website} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 mb-8">
                <p className="text-slate-300 font-medium leading-relaxed italic">"{profileUser.bio || "Crafting a unique presence in the forum..."}"</p>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-6 border-t border-white/5 pt-8">
            <div className="bg-slate-900/30 p-4 rounded-2xl border border-white/5 text-center">
              <p className="text-xl font-black text-slate-100">{new Date(profileUser.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Arrival Date</p>
            </div>
            <div className="bg-slate-900/30 p-4 rounded-2xl border border-white/5 text-center">
              <p className={`text-xl font-black ${profileUser.role !== 'user' ? 'text-indigo-400' : 'text-slate-100'}`}>
                {profileUser.role === 'admin' ? 'System Administrator' : 
                 profileUser.role === 'pro' ? 'Pro Elite Citizen' : 
                 profileUser.role === 'premium' ? 'Premium Member' : 'Community Member'}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Citizen Level</p>
            </div>
          </div>
        </div>
      </div>

      {isOwnProfile && (
        <div className="glass-effect rounded-[2rem] p-8 shadow-xl border border-indigo-500/10 relative overflow-hidden">
          <h3 className="text-lg font-black text-slate-100 mb-4 flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">✨</div> 
            AI Bio Personalization
          </h3>
          <p className="text-[10px] text-slate-500 uppercase font-black mb-4 tracking-widest">Generate a unique persona based on your interests</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="What defines you? (e.g., Coding, Gaming, Space...)"
              className="flex-1 bg-slate-950/50 rounded-2xl px-5 py-4 text-slate-100 border border-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all font-medium"
            />
            <button
              onClick={handleGenerateBio}
              disabled={isGenerating || !interests}
              className={`bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95 ${isGenerating ? 'opacity-50 grayscale' : ''}`}
            >
              {isGenerating ? 'Synthesizing...' : 'Synthesize Bio'}
            </button>
          </div>
        </div>
      )}

      {canSeeActivity && (
        <div className="glass-effect rounded-[2.5rem] overflow-hidden shadow-xl border border-white/5">
          <div className="flex border-b border-white/5">
            <button 
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-5 text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'posts' ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Recent Posts
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className={`flex-1 py-5 text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'comments' ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Recent Comments
            </button>
          </div>

          <div className="p-8">
            {activityLoading ? (
              <div className="flex justify-center p-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
              </div>
            ) : activeTab === 'posts' ? (
              <div className="space-y-4">
                {indexErrors.posts ? (
                  <div className="p-10 text-center space-y-4">
                    <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 max-w-sm mx-auto">
                      <p className="text-red-400 text-xs font-bold leading-relaxed">The Posts query requires an index. Please visit the Firebase console to create it.</p>
                    </div>
                  </div>
                ) : userPosts.length === 0 ? (
                  <p className="text-center text-slate-600 text-xs font-bold uppercase py-10">No broadcast signals found</p>
                ) : (
                  userPosts.map(post => (
                    <div key={post.id} className="bg-slate-900/40 rounded-2xl p-5 border border-white/5 group relative animate-slideIn">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] text-slate-500 font-bold">{new Date(post.createdAt).toLocaleDateString()}</span>
                        {(activeUser.role === 'admin' || isOwnProfile) && (
                          <button onClick={() => handleDeletePost(post.id)} className="text-red-500/50 hover:text-red-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2 mb-3">{post.content}</p>
                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase">
                         <span>👍 {post.likes?.length || 0}</span>
                         <span>💬 {post.commentsCount || 0}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {indexErrors.comments ? (
                  <div className="p-10 text-center space-y-4">
                    <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 max-w-sm mx-auto">
                      <p className="text-red-400 text-xs font-bold leading-relaxed">The Comments query requires an index. Please visit the Firebase console to create it.</p>
                    </div>
                  </div>
                ) : userComments.length === 0 ? (
                  <p className="text-center text-slate-600 text-xs font-bold uppercase py-10">No voice recorded in the forum</p>
                ) : (
                  userComments.map(comment => (
                    <div key={comment.id} className="bg-slate-900/40 rounded-2xl p-5 border border-white/5 animate-slideIn">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] text-slate-500 font-bold">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        <Link to="/" className="text-[9px] text-indigo-400 font-black uppercase hover:underline">View Parent Post</Link>
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

      <div className="mt-4">
        <AdsterraAd id="profile-bottom" />
      </div>
    </div>
  );
};

export default ProfileView;
