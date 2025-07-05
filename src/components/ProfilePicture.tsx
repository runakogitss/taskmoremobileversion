import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import './ProfilePicture.css';

interface ProfilePictureProps {
  authUser: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({ authUser, size = 'md', className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const profilePicUrl = authUser.user_metadata?.avatar_url || '/pictures/noprofile.jpg';
  const displayName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';

  return (
    <div className={`relative flex flex-row items-center ${className} profile-picture-root`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
    >
      <span className={`profile-picture-gradient ${sizeClasses[size]}`}>
        <img
          src={profilePicUrl}
          alt={`${displayName} profile`}
          className={`rounded-full object-cover w-full h-full border-2 border-white dark:border-gray-800`}
          onError={e => {
            const target = e.target as HTMLImageElement;
            target.src = '/pictures/noprofile.jpg';
          }}
        />
      </span>
      {showTooltip && (
        <div className="profile-picture-tooltip profile-picture-tooltip-horizontal">
          {displayName}
        </div>
      )}
    </div>
  );
};

export default ProfilePicture; 