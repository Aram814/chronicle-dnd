import React from 'react';
import { Image } from '@/components/ui/image';

/**
 * Renders a character's portrait image when available, falling back to a
 * monogram (first letter of the name) so the UI never shows an empty box.
 *
 * `full` mode renders a large portrait-orientation image for the character
 * sheet; otherwise it renders a rounded avatar thumbnail.
 */
export default function CharacterAvatar({ character, size = 'md', full = false, className = '' }) {
  const name = character?.name || '?';
  const initial = name[0]?.toUpperCase() || '?';
  const portrait = character?.portrait;

  if (full) {
    if (!portrait) {
      return (
        <div className={`w-full aspect-[3/4] rounded-lg bg-gradient-to-br from-amber-900/40 to-muted border border-amber-700/40 flex items-center justify-center text-5xl font-bold text-amber-400 font-display ${className}`}>
          {initial}
        </div>
      );
    }
    return (
      <Image
        src={portrait}
        fittingType="fill"
        alt={`${name} portrait`}
        className={`w-full aspect-[3/4] object-cover rounded-lg border border-amber-700/40 ${className}`}
      />
    );
  }

  const sizeClasses = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl'
  };
  const box = sizeClasses[size] || sizeClasses.md;

  if (!portrait) {
    return (
      <div className={`${box} rounded-lg bg-gradient-to-br from-amber-900/50 to-muted border border-amber-700/40 flex items-center justify-center font-bold text-amber-400 font-display ${className}`}>
        {initial}
      </div>
    );
  }

  return (
    <div className={`${box} rounded-lg overflow-hidden border border-amber-700/40 ${className}`}>
      <Image
        src={portrait}
        fittingType="fill"
        alt={`${name} portrait`}
        className="w-full h-full object-cover"
      />
    </div>
  );
}