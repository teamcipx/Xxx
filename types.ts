
export type UserRole = 'user' | 'premium' | 'pro' | 'admin';
export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type AccountStatus = 'pending' | 'active' | 'banned';
export type PostType = 'standard' | 'article';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  bio: string;
  isPro: boolean;
  isVerified?: boolean;
  verificationStatus?: VerificationStatus;
  accountStatus: AccountStatus;
  role: UserRole;
  joinedAt: number;
  age?: number;
  gender?: Gender;
  interests?: string;
  socials?: {
    twitter?: string;
    github?: string;
    instagram?: string;
    website?: string;
    telegram?: string;
    facebook?: string;
  };
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  imageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  authorRole?: UserRole;
  authorVerified?: boolean;
  type: PostType;
  title?: string;
  content: string;
  imageUrl?: string;
  likes: string[];
  dislikes: string[];
  commentsCount: number;
  createdAt: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  authorRole?: UserRole;
  authorVerified?: boolean;
  text: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  senderPhoto?: string;
  senderRole?: UserRole;
  senderVerified?: boolean;
  text: string;
  createdAt: number;
  chatId?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  txId: string;
  imageUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  plan: string;
}
