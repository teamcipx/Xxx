
import React, { useState, useEffect } from 'react';
import { User, Gender } from '../types';
import { generateBio } from '../services/gemini';
import * as ReactRouterDOM from 'react-router-dom';
const { useParams, useNavigate } = ReactRouterDOM as any;

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
    } finally { setDpUploading(false); }
  };

  const handleAiBio = async () => {
    if (!editInterests.trim()) {
      alert("Calibration requires interests.");
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
                <div className="flex justify-between items-center">
                  <label className="block text-[8px] font-black text-slate-500 uppercase ml-1">Protocol Bio</label>
                  <button onClick={handleAiBio} disabled={generatingBio} className="text-[8px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300 disabled:opacity-50">AI Calibrate</button>
                </div>
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-2xl p-5 text-xs text-slate-300 h-24 outline-none focus:border-rose-500/50 transition-all resize-none" />
              </div>
            </div>
            
            <button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-rose-600 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-2xl hover:bg-rose-500 transition-all active:scale-[0.98] disabled:opacity-50">Synchronize Node</button>
          </div>
        )}
      </div>
      
      <div className="flex justify-center px-4"><AdsterraAd id="profile-node-bottom" /></div>
    </div>
  );
};

export default ProfileView;
