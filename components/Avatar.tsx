import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

export interface AvatarProps {
  creator: {
    name: string;
    avatarUrl?: string;
    hex?: string;
  };
  className?: string;
}

const getInitials = (name: string): string => {
  if (!name) return 'CR';
  const parts = name.trim().replace(/^@/, '').split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({ creator, className = 'w-full h-full object-cover' }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [creator.avatarUrl]);

  if (!creator.avatarUrl || hasError) {
    return (
      <div
        className={clsx(
          'flex items-center justify-center font-bold text-white select-none uppercase tracking-tighter',
          className
        )}
        style={{ backgroundColor: creator.hex || '#3b82f6' }}
        title={creator.name}
      >
        <span className="text-xs leading-none">{getInitials(creator.name)}</span>
      </div>
    );
  }

  return (
    <img
      src={creator.avatarUrl}
      alt={creator.name}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};

export default Avatar;
