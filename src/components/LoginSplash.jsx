import React from 'react';
import { Image } from '@/components/ui/image';

const SPLASH_ART = 'https://media.base44.com/images/public/6ab1f1781754d99d63c58e01/1a1d7d32c_ChronicleDD.jpeg';

export default function LoginSplash({ children, footer }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-stone-950">
      {/* Background artwork */}
      <Image
        src={SPLASH_ART}
        fittingType="fill"
        className="absolute inset-0 w-full h-full object-cover"
        alt=""
        aria-hidden="true"
      />
      {/* Darkening overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/85 via-stone-950/75 to-stone-950/90" />
      <div className="absolute inset-0 bg-stone-950/30" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4 py-10">
        {/* Branding */}
        <div className="text-center mb-8 select-none">
          <h1
            className="font-serif text-4xl md:text-5xl font-bold tracking-wider text-amber-200"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 24px rgba(180,120,40,0.25)' }}
          >
            CRITICAL CHRONICLES
          </h1>
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-amber-700/60" />
            <span className="font-serif text-sm md:text-base text-amber-400 tracking-[0.25em] uppercase">
              AI Dungeon Master for TTRPG Campaigns
            </span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-amber-700/60" />
          </div>
        </div>

        {/* Login card */}
        <div className="bg-stone-950/80 backdrop-blur-md rounded-2xl border border-amber-900/40 shadow-2xl shadow-amber-950/30 p-8">
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-amber-200/70 mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}