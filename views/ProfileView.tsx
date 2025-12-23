
import React, { useState, useEffect } from 'react';
import { User, Post, Comment, Gender, VerificationStatus } from '../types';
import { generateBio } from '../services/gemini';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, collection, addDoc, onSnapshot } from 'firebase/firestore';
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
          setEditSocials({ telegram: data.socials?.telegram || '', facebook: data.socials?.facebook || '' });
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

  const handleSaveProfile = async () => {
    if (!profileUser) return;
    setIsSaving(true);
    try {
      const updates = { displayName: editName, bio: editBio, age: editAge, gender: editGender, interests: editInterests, socials: editSocials };
      await updateDoc(doc(db, 'users', profileUser.uid), updates);
      setProfileUser({ ...profileUser, ...updates });
      setIsEditing(false);
    } finally { setIsSaving(false); }
  };

  if (loading) return <div className="py-24 text-center text-slate-500 uppercase font-black text-[10px] animate-pulse">Decrypting Node Specs...</div>;
  if (!profileUser) return <div className="py-24 text-center text-rose-500 font-black uppercase">Signal Lost</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fadeIn pb-32">
      <div className="glass-effect rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative">
        <div className="h-48 bg-gradient-to-br from-slate-900 to-rose-950/20"></div>
        <div className="px-10 pb-12 -mt-24 relative flex flex-col md:flex-row items-end gap-8">
          <div className="relative group">
            <img src={profileUser.photoURL} className={`w-40 h-40 rounded-3xl object-cover ring-8 ring-slate-950 shadow-2xl ${dpUploading ? 'opacity-50' : ''}`} alt="p" />
            {isOwnProfile && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-3xl cursor-pointer transition-all">
                <input type="file" className="hidden" accept="image/*" onChange={handleUpdateDP} />
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
              </label>
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4"><h2 className="text-4xl font-black text-white uppercase">{profileUser.displayName}</h2><UserBadge role={profileUser.role} verified={profileUser.isVerified} /></div>
            <p className="text-slate-400 text-sm font-medium italic">"{profileUser.bio || 'New signal detected.'}"</p>
          </div>
          {isOwnProfile && <button onClick={() => setIsEditing(!isEditing)} className="px-8 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 shadow-xl transition-all">{isEditing ? 'Close' : 'Update Protocol'}</button>}
        </div>

        {isEditing && (
          <div className="p-10 bg-slate-900/40 border-t border-white/5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Alias" className="bg-slate-950 border border-white/10 rounded-xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-rose-500" />
              <input type="number" value={editAge} onChange={(e) => setEditAge(parseInt(e.target.value))} placeholder="Age" className="bg-slate-950 border border-white/10 rounded-xl px-6 py-4 text-xs font-bold text-white outline-none" />
              <select value={editGender} onChange={(e) => setEditGender(e.target.value as Gender)} className="bg-slate-950 border border-white/10 rounded-xl px-6 py-4 text-xs font-bold text-white outline-none"><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
              <input type="text" value={editInterests} onChange={(e) => setEditInterests(e.target.value)} placeholder="Interests" className="bg-slate-950 border border-white/10 rounded-xl px-6 py-4 text-xs font-bold text-white outline-none" />
              <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="md:col-span-2 bg-slate-950 border border-white/10 rounded-xl p-6 text-xs text-slate-300 h-24 outline-none" placeholder="Signal Biography..." />
            </div>
            <button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-rose-600 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] shadow-xl">{isSaving ? 'Encrypting...' : 'Apply Overrides'}</button>
          </div>
        )}
      </div>
      <AdsterraAd id="profile-bottom" />
    </div>
  );
};

export default ProfileView;
