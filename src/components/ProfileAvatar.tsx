import React, { useState, useEffect } from 'react';

export interface ProfileAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'SM';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getGradientFromName(name?: string | null): string {
  if (!name) return 'from-indigo-600 to-violet-600';
  const gradients = [
    'from-indigo-600 to-violet-600',
    'from-blue-600 to-cyan-600',
    'from-violet-600 to-fuchsia-600',
    'from-emerald-600 to-teal-600',
    'from-amber-600 to-orange-600',
    'from-rose-600 to-pink-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  // Reset error state when avatarUrl changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs font-semibold',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-14 h-14 text-base font-bold',
    xl: 'w-20 h-20 text-xl font-bold',
  };

  const initials = getInitials(name);
  const gradient = getGradientFromName(name);

  if (avatarUrl && !imageError) {
    return (
      <div
        className={`relative rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 ${sizeClasses[size]} ${className}`}
      >
        <img
          src={avatarUrl}
          alt={name || 'Student Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${gradient} text-white shadow-xs select-none border border-white/20 ${sizeClasses[size]} ${className}`}
      title={name || 'Student Profile'}
    >
      <span>{initials}</span>
    </div>
  );
};
