
import React, { useState, useEffect } from 'react';
import { User, Post, Comment } from '../types';
import { generateBio } from '../services/gemini';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';
import { AdsterraAd } from '../components/AdsterraAd';
import { UserBadge } from '../components/UserBadge';

const ProfileView: React.FC<{ activeUser: User }> = ({ activeUser }) => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const isOwnProfile = !uid || uid === activeUser.uid;
  const targetUid = uid || activeUser.uid;
  
  const [profileUser, setProfileUser] = useState<User | null>(isOwnProfile ? activeUser : null);
  const [loading, setLoading] = useState(!isOwnProfile);
  const [interests, setInterests] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Activity state
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  const canSeeActivity = isOwnProfile || activeUser.role === 'admin';

  useEffect(() => {
    const fetchUser = async () => {
      if (!isOwnProfile && uid) {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          setProfileUser(userDoc.data() as User);
        }
        setLoading(false);
      } else {
        setProfileUser(activeUser);
      }
    };
    fetchUser();
  }, [uid, activeUser, isOwnProfile]);

  useEffect(() => {
    if (canSeeActivity && targetUid) {
      fetchActivity();
    }
  }, [targetUid, canSeeActivity]);

  const fetchActivity = async () => {
    setActivityLoading(true);
    setActivityError(null);
    try {
      // Fetch Posts
      const postsQ = query(
        collection(db, 'posts'),
        where('authorId', '==', targetUid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const postsSnap = await getDocs(postsQ);
      setUserPosts(postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));

      // Fetch Comments
      const commentsQ = query(
        collection(db, 'comments'),
        where('authorId', '==', targetUid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const commentsSnap = await getDocs(commentsQ);
      setUserComments(commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    } catch (err: any) {
      console.error("Error fetching activity:", err);
      if (err.code === 'failed-precondition') {
        setActivityError("A database index is required for this view. Please follow the instructions in the administrator console.");
      } else {
        setActivityError("Unable to load activity signals at this time.");
      }
    } finally {
      setActivityLoading(false);
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
      }
    } catch (err) {
      alert("Error generating bio. Please try again later.");
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

  const getTierLabel = () => {
    switch(profileUser.role) {
      case 'admin': return 'System Administrator';
      case 'pro': return 'Pro Elite Citizen';
      case 'premium': return 'Premium Member';
      default: return 'Community Member';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn pb-20">
      <div className="glass-effect rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 relative">
        <div className="h-40 bg-gradient-to-br from-indigo-600 to-purple-800 relative">
           <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]"></div>
        </div>
        <div className="px-10 pb-10 -mt-16 relative">
          <div className="flex justify-between items-end mb-8">
            <div className="relative group">
              <img src={profileUser.photoURL || `https://ui-avatars.com/api/?name=${profileUser.displayName}`} alt="profile" className="w-32 h-32 rounded-[2rem] object-cover ring-8 ring-slate-950 shadow-2xl transition-transform group-hover:scale-105 duration-500" />
              <div className="absolute -bottom-1 -right-1 transform rotate-12">
                <UserBadge role={profileUser.role} className="!px-3 !py-1.5 !text-[10px]" />
              </div>
            </div>
            <div className="flex gap-2">
              {!isOwnProfile && (
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
          
          <div className="space-y-1 mb-6">
            <h2 className="text-3xl font-black text-slate-100 tracking-tight">{profileUser.displayName}</h2>
            <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">@{profileUser.displayName.toLowerCase().replace(/ /g, '_')}</p>
          </div>

          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 mb-8">
            <p className="text-slate-300 font-medium leading-relaxed italic">"{profileUser.bio || "Crafting a unique presence in the forum..."}"</p>
          </div>

          <div className="grid grid-cols-2 gap-6 border-t border-white/5 pt-8">
            <div className="bg-slate-900/30 p-4 rounded-2xl border border-white/5 text-center">
              <p className="text-xl font-black text-slate-100">{new Date(profileUser.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Arrival Date</p>
            </div>
            <div className="bg-slate-900/30 p-4 rounded-2xl border border-white/5 text-center">
              <p className={`text-xl font-black ${profileUser.role !== 'user' ? 'text-indigo-400' : 'text-slate-100'}`}>{getTierLabel()}</p>
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
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="Your passions..."
              className="flex-1 bg-slate-950/50 rounded-2xl px-5 py-4 text-slate-100 border border-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all font-medium"
            />
            <button
              onClick={handleGenerateBio}
              disabled={isGenerating || !interests}
              className={`bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95 ${isGenerating ? 'opacity-50 grayscale' : ''}`}
            >
              Update
            </button>
          </div>
        </div>
      )}

      {/* Activity Section - Visible to owner or admins */}
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
            ) : activityError ? (
              <div className="p-10 text-center space-y-4">
                 <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 max-w-sm mx-auto">
                    <p className="text-red-400 text-xs font-bold">{activityError}</p>
                 </div>
                 {activeUser.role === 'admin' && (
                    <a 
                      href="https://console.firebase.google.com/v1/r/project/usersss-369bb/firestore/indexes?create_composite=Cktwcm9qZWN0cy91c2Vyc3NzLTM2OWJiL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wb3N0cy9pbmRleGVzL18QARoMCghhdXRob3JJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 underline"
                    >
                      Click to create required Firestore index
                    </a>
                 )}
              </div>
            ) : activeTab === 'posts' ? (
              <div className="space-y-4">
                {userPosts.length === 0 ? (
                  <p className="text-center text-slate-600 text-xs font-bold uppercase py-10">No broadcast signals found</p>
                ) : (
                  userPosts.map(post => (
                    <div key={post.id} className="bg-slate-900/40 rounded-2xl p-5 border border-white/5 group relative">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] text-slate-500 font-bold">{new Date(post.createdAt).toLocaleDateString()}</span>
                        {activeUser.role === 'admin' && (
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
                {userComments.length === 0 ? (
                  <p className="text-center text-slate-600 text-xs font-bold uppercase py-10">No voice recorded in the forum</p>
                ) : (
                  userComments.map(comment => (
                    <div key={comment.id} className="bg-slate-900/40 rounded-2xl p-5 border border-white/5">
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
