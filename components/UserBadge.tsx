
import React from 'react';
import { UserRole } from '../types';

interface UserBadgeProps {
  role?: UserRole;
  verified?: boolean;
  className?: string;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ role, verified, className = "" }) => {
  const styles = {
    admin: "bg-rose-600/20 text-rose-400 border-rose-500/30",
    pro: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    premium: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    verified: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {verified && (
        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[7px] font-black border uppercase tracking-tighter ${styles.verified}`}>
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Verified
        </span>
      )}
      {role && role !== 'user' && (
        <span className={`px-2 py-0.5 rounded-full text-[7px] font-black border uppercase tracking-widest ${styles[role as keyof typeof styles]}`}>
          {role}
        </span>
      )}
    </div>
  );
};
