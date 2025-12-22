
import React from 'react';
import { UserRole } from '../types';

interface UserBadgeProps {
  role?: UserRole;
  className?: string;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ role, className = "" }) => {
  if (!role || role === 'user') return null;

  const styles = {
    admin: "bg-gradient-to-r from-red-600 to-rose-500 text-white border-red-400 shadow-red-500/20",
    pro: "bg-gradient-to-r from-amber-500 to-orange-400 text-slate-900 border-amber-300 shadow-amber-500/20",
    premium: "bg-gradient-to-r from-indigo-500 to-blue-400 text-white border-indigo-300 shadow-indigo-500/20"
  };

  const labels = {
    admin: "ADMIN",
    pro: "PRO",
    premium: "PREMIUM"
  };

  const icons = {
    admin: (
      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M2.166 4.9L10 1.55l7.834 3.35a1 1 0 01.666.935V10c0 5.165-3.085 9.073-7.834 10.32a1 1 0 01-.666 0C5.085 19.073 2 15.165 2 10V5.835a1 1 0 01.666-.935zM10 4.545L4 7.11v2.89c0 3.79 2.067 6.64 6 7.825 3.933-1.186 6-4.035 6-7.825V7.11l-6-2.565z" clipRule="evenodd" />
      </svg>
    ),
    pro: (
      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
    premium: (
      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.53 6.47a1 1 0 011.415 0 3.5 3.5 0 004.23 0 1 1 0 011.415 1.415 5.5 5.5 0 01-7.06 0 1 1 0 010-1.415z" clipRule="evenodd" />
      </svg>
    )
  };

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black border tracking-wider shadow-sm ${styles[role as keyof typeof styles]} ${className}`}>
      {icons[role as keyof typeof icons]}
      {labels[role as keyof typeof labels]}
    </span>
  );
};
