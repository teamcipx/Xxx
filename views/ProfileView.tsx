
import React, { useState, useEffect } from 'react';
import { User, Post, Gender } from '../types';
import { generateBio } from '../services/gemini';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
  const [isEditing, setIsEditing] = useState(false);
  const [dpUploading, setDpUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);

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

  const handleUpdateDP = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileUser) return;
    setDpUploading(true);
    try {
      const url = await uploadToImgBB(file);
      await updateDoc(doc(db, 'users', profileUser.uid), { photoURL: url });
      setProfileUser({ ...profileUser, photoURL: url });
      if (isOwnProfile) {
          // Update local activeUser reference conceptually (handled by auth state usually)
      }
    } finally { setDpUploading(false); }
  };

  const handleAiBio = async () => {
    if (!editInterests.trim()) {
      alert("Please specify interests for AI calibration.");
      return;
    }
    setGeneratingBio(true);
    try {
      const bio = await generateBio(editInterests);
      setEditBio(bio);
    } finally { setGeneratingBio(false); }
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

  const handleStartDM = () => {
    // Deterministic chat ID for private messaging protocol
    const participants = [activeUser.uid, targetUid].sort();
    const chatId = `dm_${participants[0]}_${participants[1]}`;
    navigate(`/chat/${chatId}`);
  };

  if (loading) return (
    <div className="py-24 flex flex-col items-center gap-6">
      <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Decrypting Identity Specs</p>
    </div>
  );
  
  if (!profileUser) return (
    <div className="py-24 text-center space-y-6">
       <h2 className="text-4xl font-black text-rose-500 uppercase tracking-tighter">Signal Fragmented</h2>
       <button onClick={() => navigate('/')} className="px-10 py-4 bg-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest">Return to Feed</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fadeIn pb-32">
      <div className="glass-effect rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl relative">
        <div className="h-48 md:h-64 bg-gradient-to-br from-slate-900 via-slate-950 to-rose-950/30 relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-500 via-transparent to-transparent"></div>
        </div>
        
        <div className="px-6 md:px-12 pb-16 -mt-24 relative flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12">
          <div className="relative group flex-shrink-0">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-tr from-rose-600 to-indigo-600 rounded-[2.5rem] blur opacity-40"></div>
              <img 
                src={profileUser.photoURL} 
                className={`relative w-40 h-40 md:w-56 md:h-56 rounded-[2.5rem] object-cover ring-8 ring-slate-950 shadow-2xl transition-all ${dpUploading ? 'opacity-50 blur-sm' : ''}`} 
                alt="p" 
              />
            </div>
            {isOwnProfile && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-[2.5rem] cursor-pointer transition-all backdrop-blur-sm">
                <input type="file" className="hidden" accept="image/*" onChange={handleUpdateDP} />
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
              </label>
            )}
          </div>
          
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-5">
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">{profileUser.displayName}</h2>
              <UserBadge role={profileUser.role} verified={profileUser.isVerified} className="scale-110 md:scale-125 origin-center md:origin-left" />
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-5">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Node Age</span>
                  <div className="px-4 py-2 bg-slate-900/60 rounded-xl border border-white/5 text-[10px] font-black uppercase text-slate-300 tracking-widest">{profileUser.age || '??'} Yrs</div>
               </div>
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Signal Gender</span>
                  <div className="px-4 py-2 bg-slate-900/60 rounded-xl border border-white/5 text-[10px] font-black uppercase text-slate-300 tracking-widest">{profileUser.gender || '??'}</div>
               </div>
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Link Genesis</span>
                  <div className="px-4 py-2 bg-slate-900/60 rounded-xl border border-white/5 text-[10px] font-black uppercase text-slate-300 tracking-widest">{new Date(profileUser.joinedAt).toLocaleDateString()}</div>
               </div>
            </div>

            <p className="text-slate-400 text-base md:text-lg font-medium italic leading-relaxed max-w-2xl mx-auto md:mx-0 border-l-2 border-rose-500/30 pl-4 py-1">
               "{profileUser.bio || 'Initial signal state. No bio protocol defined.'}"
            </p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
               {profileUser.socials?.telegram && (
                 <a href={`https://t.me/${profileUser.socials.telegram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl transition-all group">
                   <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest group-hover:text-white">Telegram Signal</span>
                 </a>
               )}
               {profileUser.socials?.facebook && (
                 <a href={`https://fb.com/${profileUser.socials.facebook}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all group">
                   <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest group-hover:text-white">Facebook Node</span>
                 </a>
               )}
            </div>
          </div>
          
          <div className="flex flex-col gap-3 w-full md:w-auto">
            {isOwnProfile ? (
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                className="w-full md:px-10 py-5 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 shadow-2xl shadow-rose-600/30 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                {isEditing ? 'Cancel Edit' : 'Edit Specs'}
              </button>
            ) : (
              <button 
                onClick={handleStartDM}
                className="w-full md:px-10 py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500 shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                Direct Message
              </button>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="p-8 md:p-12 bg-slate-900/40 border-t border-white/10 space-y-10 animate-fadeIn">
            <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.5em] mb-8">Override Node Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Alias Identity</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Node Name" className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-rose-500/50 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Maturity Age</label>
                    <input type="number" value={editAge} onChange={(e) => setEditAge(parseInt(e.target.value))} placeholder="Age" className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-rose-500/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Gender Sync</label>
                    <select value={editGender} onChange={(e) => setEditGender(e.target.value as Gender)} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-rose-500/50 transition-all appearance-none">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Signal Interests</label>
                  <input type="text" value={editInterests} onChange={(e) => setEditInterests(e.target.value)} placeholder="e.g. Chatting, Tech, Art" className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-rose-500/50 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Telegram Link</label>
                    <input type="text" value={editSocials.telegram} onChange={(e) => setEditSocials({...editSocials, telegram: e.target.value})} placeholder="Username" className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-rose-500/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Facebook ID</label>
                    <input type="text" value={editSocials.facebook} onChange={(e) => setEditSocials({...editSocials, facebook: e.target.value})} placeholder="Profile ID" className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-rose-500/50 transition-all" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Biography Protocol</label>
                  <button 
                    onClick={handleAiBio} 
                    disabled={generatingBio}
                    className="text-[9px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {generatingBio ? 'Syncing Intelligence...' : 'Calibrate with AI'}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </button>
                </div>
                <textarea 
                  value={editBio} 
                  onChange={(e) => setEditBio(e.target.value)} 
                  className="w-full bg-slate-950 border border-white/10 rounded-3xl p-6 text-xs text-slate-300 h-32 outline-none focus:border-rose-500/50 transition-all resize-none" 
                  placeholder="The story of your signal..." 
                />
              </div>
            </div>
            
            <button 
              onClick={handleSaveProfile} 
              disabled={isSaving} 
              className="w-full bg-rose-600 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-rose-600/40 hover:bg-rose-500 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSaving ? 'Encrypting Updates...' : 'Synchronize Identity'}
            </button>
          </div>
        )}
      </div>
      
      <div className="flex justify-center">
        <AdsterraAd id="profile-node-bottom" />
      </div>
    </div>
  );
};

export default ProfileView;
