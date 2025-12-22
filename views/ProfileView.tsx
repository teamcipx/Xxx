
import React, { useState, useEffect } from 'react';
import { User, Post, Comment, Gender, VerificationStatus } from '../types';
import { generateBio } from '../services/gemini';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
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
  
  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [verifyingStatus, setVerifyingStatus] = useState<VerificationStatus>('none');

  // Edit fields
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

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', targetUid));
      if (userDoc.exists()) {
        const data = userDoc.data() as User;
        setProfileUser(data);
        setVerifyingStatus(data.verificationStatus || 'none');
        initializeEditFields(data);
      }
      setLoading(false);
    };
    fetchUser();
  }, [targetUid, activeUser]);

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

  const handleUpdateDP = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileUser) return;
    setDpUploading(true);
    try {
      const url = await uploadToImgBB(file);
      await updateDoc(doc(db, 'users', profileUser.uid), { photoURL: url });
      setProfileUser({ ...profileUser, photoURL: url });
    } catch (err) {
      alert("Upload failed.");
    } finally {
      setDpUploading(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!verificationFile || !profileUser) return;
    setIsVerifying(true);
    try {
      const url = await uploadToImgBB(verificationFile);
      await addDoc(collection(db, 'verificationRequests'), {
        userId: profileUser.uid,
        userName: profileUser.displayName,
        userPhoto: profileUser.photoURL,
        imageUrl: url,
        status: 'pending',
        createdAt: Date.now()
      });
      await updateDoc(doc(db, 'users', profileUser.uid), { verificationStatus: 'pending' });
      setVerifyingStatus('pending');
      alert("Identity signal transmitted for verification.");
    } catch (err) {
      alert("Transmission failed.");
    } finally {
      setIsVerifying(false);
    }
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
    } catch (err) {
      alert("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center p-20 animate-pulse text-rose-500 uppercase tracking-[0.5em] font-black text-[10px]">Decoding Identity...</div>;
  if (!profileUser) return <div className="text-center p-20 text-slate-500 font-black uppercase text-[10px]">Signal Terminated.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 px-4 animate-fadeIn">
      {/* Profile Header */}
      <div className="glass-effect rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative">
        <div className="h-48 bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-950 relative overflow-hidden">
           <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        </div>
        
        <div className="px-8 pb-10 -mt-20 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="relative group self-start">
              <div className="absolute -inset-2 bg-gradient-to-tr from-rose-500 to-cyan-400 rounded-[3.5rem] opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
              <img src={profileUser.photoURL} alt="p" className={`relative w-40 h-40 rounded-[3rem] object-cover ring-8 ring-slate-950 shadow-2xl transition-all duration-700 ${dpUploading ? 'opacity-50 grayscale' : 'group-hover:scale-[1.02]'}`} />
              {isOwnProfile && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-[3rem] cursor-pointer transition-all duration-300 backdrop-blur-sm">
                  <input type="file" className="hidden" onChange={handleUpdateDP} />
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                </label>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{profileUser.displayName}</h2>
                <UserBadge role={profileUser.role} verified={profileUser.isVerified} className="mt-1" />
              </div>
              <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> {profileUser.gender || 'Citizen'}</span>
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> {profileUser.age || 'Mature'} Cycles</span>
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div> Established {new Date(profileUser.joinedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {isOwnProfile ? (
                <button onClick={() => setIsEditing(!isEditing)} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                  {isEditing ? 'Discard' : 'Update Protocol'}
                </button>
              ) : (
                <button onClick={() => navigate(`/chat/${[activeUser.uid, profileUser.uid].sort().join('_')}`)} className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 transition-all active:scale-95">
                  Private Link
                </button>
              )}
            </div>
          </div>

          {/* Verification Section for Own Profile */}
          {isOwnProfile && !profileUser.isVerified && (
            <div className="mt-10 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-fadeIn">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400">
                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                </div>
                <div>
                  <h4 className="text-xs font-black text-cyan-100 uppercase tracking-tight">Identity Verification</h4>
                  <p className="text-[10px] text-cyan-500/60 font-medium mt-0.5">Gain the blue shield to establish peak community trust.</p>
                </div>
              </div>
              {verifyingStatus === 'pending' ? (
                <span className="px-5 py-2 bg-slate-900 border border-cyan-500/40 rounded-xl text-[9px] font-black text-cyan-400 uppercase tracking-widest">Awaiting Clearance</span>
              ) : (
                <div className="flex items-center gap-3">
                  <input type="file" id="verify-upload" className="hidden" onChange={(e) => e.target.files && setVerificationFile(e.target.files[0])} />
                  <label htmlFor="verify-upload" className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all">
                    {verificationFile ? 'Change File' : 'Select Proof'}
                  </label>
                  {verificationFile && (
                    <button onClick={handleRequestVerification} disabled={isVerifying} className="px-5 py-2.5 bg-slate-100 text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                      {isVerifying ? 'Sending...' : 'Transmit'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {isEditing && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 p-8 rounded-[2.5rem] border border-white/5 animate-fadeIn">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Bio Protocol</label>
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-slate-100 h-24 outline-none focus:ring-1 focus:ring-rose-500/40" />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Telegram</label>
                 <input value={editSocials.telegram} onChange={(e) => setEditSocials({...editSocials, telegram: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2 text-xs" />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Facebook</label>
                 <input value={editSocials.facebook} onChange={(e) => setEditSocials({...editSocials, facebook: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2 text-xs" />
              </div>
              <button onClick={handleSaveProfile} disabled={isSaving} className="md:col-span-2 mt-4 bg-rose-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-rose-600/20 active:scale-[0.98] transition-all">
                {isSaving ? 'Synchronizing...' : 'Apply Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5">
             <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-4">Signal Content</h3>
             <p className="text-slate-300 leading-relaxed font-medium italic text-sm">"{profileUser.bio || "No data transmitted..."}"</p>
          </div>
          <AdsterraAd id="profile-feed-top" />
        </div>
        
        <div className="space-y-6">
          <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5">
             <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Node Interests</h3>
             <div className="flex flex-wrap gap-2">
                {(profileUser.interests || "Casual, Dating").split(',').map((tag, i) => (
                  <span key={i} className="bg-slate-900 text-slate-400 px-3 py-1.5 rounded-xl text-[9px] font-bold border border-white/5 lowercase">{tag.trim()}</span>
                ))}
             </div>
          </div>
          {profileUser.socials?.telegram && (
            <a href={`https://t.me/${profileUser.socials.telegram.replace('@','')}`} target="_blank" className="flex items-center justify-between p-5 bg-sky-500/10 hover:bg-sky-500/20 rounded-2xl border border-sky-500/20 group transition-all">
               <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Telegram Node</span>
               <svg className="w-5 h-5 text-sky-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
