
import React, { useState, useEffect } from 'react';
import { User, Post, Comment, Gender, VerificationStatus } from '../types';
import { generateBio } from '../services/gemini';
import { useParams, useNavigate } from 'react-router-dom';
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
      try {
        const userDoc = await getDoc(doc(db, 'users', targetUid));
        if (userDoc.exists()) {
          const data = userDoc.data() as User;
          setProfileUser(data);
          setVerifyingStatus(data.verificationStatus || 'none');
          initializeEditFields(data);
        }
      } catch (e) {
        console.error("Error fetching user signal:", e);
      } finally {
        setLoading(false);
      }
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
      alert("Signal transmission failed. Profile image not updated.");
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
      alert("Verification protocol initiated. Await HQ clearance.");
    } catch (err) {
      alert("Verification signal failed to transmit.");
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
      alert("Failed to synchronize profile data.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-24 gap-6">
      <div className="w-14 h-14 border-4 border-rose-600 border-t-transparent rounded-[1.5rem] animate-spin shadow-2xl shadow-rose-600/20"></div>
      <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-[10px] animate-pulse">Decrypting Identity Specs...</p>
    </div>
  );

  if (!profileUser) return (
    <div className="text-center p-20 glass-effect rounded-[3rem] border border-white/5">
      <h2 className="text-rose-500 font-black uppercase text-2xl tracking-tighter">Signal Aborted</h2>
      <p className="text-slate-500 text-xs mt-3 font-bold uppercase tracking-widest">Node identifier not found in the Akti Elite matrix.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32 px-4 animate-fadeIn">
      {/* Profile Master Block */}
      <div className="glass-effect rounded-[4rem] overflow-hidden border border-white/10 shadow-2xl relative">
        <div className="h-64 bg-gradient-to-br from-slate-900 via-rose-950/40 to-slate-950 relative overflow-hidden">
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
        </div>
        
        <div className="px-12 pb-14 -mt-32 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="relative group self-start">
              <div className="absolute -inset-3 bg-gradient-to-tr from-rose-600 to-cyan-500 rounded-[4rem] opacity-20 blur-3xl group-hover:opacity-60 transition-all duration-1000"></div>
              <img src={profileUser.photoURL} alt="p" className={`relative w-48 h-48 rounded-[3.5rem] object-cover ring-[12px] ring-slate-950 shadow-2xl transition-all duration-700 ${dpUploading ? 'opacity-40 grayscale blur-sm' : 'group-hover:scale-[1.04]'}`} />
              {isOwnProfile && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-[3.5rem] cursor-pointer transition-all duration-500 backdrop-blur-md">
                  <input type="file" className="hidden" onChange={handleUpdateDP} />
                  <svg className="w-12 h-12 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                </label>
              )}
            </div>

            <div className="flex-1 space-y-6">
              <div className="flex flex-wrap items-center gap-5">
                <h2 className="text-5xl font-black text-white tracking-tighter uppercase drop-shadow-[0_10px_10px_rgba(225,29,72,0.3)]">{profileUser.displayName}</h2>
                <UserBadge role={profileUser.role} verified={profileUser.isVerified} className="scale-150 transform translate-y-1" />
              </div>
              <div className="flex flex-wrap gap-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                <span className="flex items-center gap-3 px-4 py-2 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400">
                  <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.8)]"></div> 
                  {profileUser.gender || 'Citizen Node'}
                </span>
                <span className="flex items-center gap-3 px-4 py-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div> 
                  Maturity: {profileUser.age || 'Mature'}
                </span>
                <span className="flex items-center gap-3 px-4 py-2 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div> 
                  Signal Link: {new Date(profileUser.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              {isOwnProfile ? (
                <button onClick={() => setIsEditing(!isEditing)} className={`px-10 py-4 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl ${isEditing ? 'bg-slate-800 text-slate-400 border border-white/5' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 active:scale-95 border border-rose-500'}`}>
                  {isEditing ? 'Discard Override' : 'Update Protocol'}
                </button>
              ) : (
                <button onClick={() => navigate(`/chat/${[activeUser.uid, profileUser.uid].sort().join('_')}`)} className="px-12 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-rose-600/40 transition-all active:scale-95 flex items-center gap-3 border border-rose-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                  Connect Link
                </button>
              )}
            </div>
          </div>

          {/* Verification Shield HUD */}
          {isOwnProfile && !profileUser.isVerified && (
            <div className="mt-14 p-10 bg-cyan-500/[0.03] border border-cyan-500/20 rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-10 animate-fadeIn relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[60px] group-hover:bg-cyan-500/10 transition-all"></div>
              <div className="flex items-center gap-8 relative z-10">
                <div className="w-16 h-16 bg-cyan-500/10 rounded-[1.8rem] flex items-center justify-center text-cyan-400 shadow-[inset_0_0_15px_rgba(34,211,238,0.2)] border border-cyan-500/20">
                   <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                </div>
                <div>
                  <h4 className="text-lg font-black text-cyan-50 uppercase tracking-widest">Elite Shield Clearance</h4>
                  <p className="text-[11px] text-cyan-500/50 font-bold uppercase tracking-tight mt-1">Submit identity specs to acquire the blue shield and join premium voice signals.</p>
                </div>
              </div>
              {verifyingStatus === 'pending' ? (
                <div className="flex items-center gap-4 px-8 py-4 bg-slate-900/80 border border-cyan-500/30 rounded-[1.8rem] shadow-xl">
                   <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping"></div>
                   <span className="text-[11px] font-black text-cyan-400 uppercase tracking-widest">Awaiting HQ Decryption</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4 relative z-10">
                  <input type="file" id="verify-hud-input" className="hidden" onChange={(e) => e.target.files && setVerificationFile(e.target.files[0])} />
                  <label htmlFor="verify-hud-input" className="px-8 py-4 bg-cyan-600/5 hover:bg-cyan-600/10 text-cyan-400 border border-cyan-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95">
                    {verificationFile ? `SPEC: ${verificationFile.name.substring(0, 12)}...` : 'Select Proof Data'}
                  </label>
                  {verificationFile && (
                    <button onClick={handleRequestVerification} disabled={isVerifying} className="px-10 py-4 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95">
                      {isVerifying ? 'Uploading Signal...' : 'Transmit Proof'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Identity Protocol (Edit Form) */}
          {isEditing && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-900/60 p-12 rounded-[4rem] border border-white/10 animate-fadeIn shadow-inner">
              <div className="md:col-span-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-5">
                   <div className="w-12 h-1.5 bg-rose-600 rounded-full shadow-[0_0_10px_rgba(225,29,72,0.5)]"></div>
                   Identity Protocol Override
                </h3>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-3 mb-3 block">Network Alias</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-3xl px-8 py-5 text-sm font-bold text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none transition-all" />
                 </div>
                 <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-3 mb-3 block">Maturity cycles</label>
                      <input type="number" value={editAge} onChange={(e) => setEditAge(parseInt(e.target.value))} className="w-full bg-slate-950 border border-white/10 rounded-3xl px-8 py-5 text-sm font-bold text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-3 mb-3 block">Gender Type</label>
                      <select value={editGender} onChange={(e) => setEditGender(e.target.value as Gender)} className="w-full bg-slate-950 border border-white/10 rounded-3xl px-8 py-5 text-sm font-bold text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none appearance-none">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-3 mb-3 block">Interest Tags (CSV)</label>
                    <input type="text" value={editInterests} onChange={(e) => setEditInterests(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-3xl px-8 py-5 text-sm font-bold text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none" />
                 </div>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-3 mb-3 block">Signal Biography</label>
                    <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-[2.5rem] p-8 text-sm font-medium text-slate-300 h-44 outline-none focus:ring-2 focus:ring-rose-500/30 resize-none transition-all" />
                 </div>
                 <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-3 mb-3 block">Telegram Node</label>
                      <input placeholder="t.me/username" value={editSocials.telegram} onChange={(e) => setEditSocials({...editSocials, telegram: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-3xl px-8 py-5 text-sm font-bold text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-3 mb-3 block">Facebook Node</label>
                      <input placeholder="fb.com/username" value={editSocials.facebook} onChange={(e) => setEditSocials({...editSocials, facebook: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-3xl px-8 py-5 text-sm font-bold text-slate-100 focus:ring-2 focus:ring-rose-500/30 outline-none" />
                    </div>
                 </div>
              </div>
              <div className="md:col-span-2 pt-6">
                <button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-rose-600 hover:bg-rose-500 text-white py-6 rounded-3xl text-[12px] font-black uppercase tracking-[0.5em] shadow-2xl shadow-rose-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-5 border border-rose-500">
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Encrypting Specs...
                    </>
                  ) : 'Synchronize Identity Specs'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-10">
        {/* Signal Content Stream */}
        <div className="md:col-span-2 space-y-10">
          <div className="glass-effect p-12 rounded-[4rem] border border-white/5 shadow-2xl relative group overflow-hidden">
             <div className="absolute top-0 left-0 w-2 h-full bg-rose-600/20 group-hover:bg-rose-600/40 transition-all"></div>
             <div className="flex items-center gap-5 mb-8">
                <h3 className="text-[12px] font-black text-rose-500 uppercase tracking-[0.5em]">Identity Bio Signal</h3>
                <div className="flex-1 h-px bg-white/5"></div>
             </div>
             <p className="text-slate-100 leading-relaxed font-medium italic text-xl pr-10 selection:bg-rose-500/30">
               "{profileUser.bio || "Initial biography signal missing from database..."}"
             </p>
          </div>
          
          <div className="glass-effect rounded-[4rem] overflow-hidden border border-white/5 shadow-xl">
             <div className="flex border-b border-white/5">
                <div className="px-12 py-8 border-b-2 border-rose-600 text-rose-500 text-[11px] font-black uppercase tracking-[0.4em] bg-rose-600/5">Transmitted Signals</div>
             </div>
             <div className="p-16 text-center">
                <div className="w-16 h-16 bg-slate-900/50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-700">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                </div>
                <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.3em]">Content archive locked to premium nodes</p>
             </div>
          </div>
          
          <AdsterraAd id="profile-master-bottom" />
        </div>
        
        {/* Node Metadata Sidebar */}
        <div className="space-y-10">
          <div className="glass-effect p-10 rounded-[3.5rem] border border-white/5 shadow-xl">
             <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-8">Node Specs</h3>
             <div className="flex flex-wrap gap-4">
                {(profileUser.interests || "Casual Chat, Mature Content, Networking").split(',').map((tag, i) => (
                  <span key={i} className="bg-slate-900 text-slate-400 px-5 py-2.5 rounded-2xl text-[10px] font-black border border-white/5 uppercase tracking-tighter hover:border-indigo-500/40 hover:text-indigo-300 transition-all cursor-default shadow-sm">{tag.trim()}</span>
                ))}
             </div>
          </div>

          <div className="space-y-5">
             {profileUser.socials?.telegram && (
               <a href={profileUser.socials.telegram.startsWith('http') ? profileUser.socials.telegram : `https://t.me/${profileUser.socials.telegram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-7 bg-sky-500/10 hover:bg-sky-500/20 rounded-[2.5rem] border border-sky-500/20 group transition-all transform hover:-translate-y-2 shadow-2xl shadow-sky-500/10">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-sky-500/20 rounded-[1.2rem] flex items-center justify-center text-sky-400 shadow-[inset_0_0_10px_rgba(14,165,233,0.3)] border border-sky-500/20">
                       <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.89.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.97 8.24-3.54 3.93-1.63 4.74-1.92 5.28-1.93.12 0 .38.03.55.17.14.12.18.28.19.4z"/></svg>
                    </div>
                    <span className="text-[12px] font-black text-sky-400 uppercase tracking-widest">Telegram Node</span>
                  </div>
                  <svg className="w-6 h-6 text-sky-400 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
               </a>
             )}
             
             {profileUser.socials?.facebook && (
               <a href={profileUser.socials.facebook.startsWith('http') ? profileUser.socials.facebook : `https://fb.com/${profileUser.socials.facebook}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-7 bg-blue-600/10 hover:bg-blue-600/20 rounded-[2.5rem] border border-blue-600/20 group transition-all transform hover:-translate-y-2 shadow-2xl shadow-blue-600/10">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-[1.2rem] flex items-center justify-center text-blue-500 shadow-[inset_0_0_10px_rgba(37,99,235,0.3)] border border-blue-600/20">
                       <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24h-1.918c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                    </div>
                    <span className="text-[12px] font-black text-blue-500 uppercase tracking-widest">Facebook Node</span>
                  </div>
                  <svg className="w-6 h-6 text-blue-500 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
               </a>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
