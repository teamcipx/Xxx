
export type UserRole = 'user' | 'premium' | 'pro' | 'admin';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  bio: string;
  isPro: boolean;
  role: UserRole;
  joinedAt: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  authorRole?: UserRole;
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
  text: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  senderPhoto?: string;
  senderRole?: UserRole;
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
