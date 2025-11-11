/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */
import Image from 'next/image';
import { useMemo } from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const initial = useMemo(() => {
    return name?.charAt(0).toUpperCase() || '?';
  }, [name]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl'
  };

  const colors = [
    'bg-purple-500',
    'bg-pink-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500'
  ];

  // Generate consistent color based on name
  const colorIndex = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % colors.length);
  }, [name]);

  if (src) {
    return (
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${colors[colorIndex]} 
        rounded-full 
        flex 
        items-center 
        justify-center 
        text-white 
        font-semibold 
        ${className}
      `}
    >
      {initial}
    </div>
  );
} 