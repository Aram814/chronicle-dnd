import React, { useState, useEffect } from 'react';
import { Image } from '@/components/ui/image';

const SPLASH_ART = 'https://media.base44.com/images/public/6ab1f1781754d99d63c58e01/5ed53390b_image.png';

export default function LoginSplash({ children, footer }) {
  // True splash: the branding/art shows immediately, then the login card
  // fades in after a short delay so the title screen gets its moment.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2200);
    return () => clearTimeout(t);
  }, []);

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
      {/* Subtle darkening for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 via-stone-950/20 to-stone-950/55" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4 py-10">
        {/* Branding */}
        <div className="text-center mb-8 select-none">
          <h1
            className="font-display text-4xl md:text-5xl font-extrabold tracking-wider text-amber-50"
            style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95), 0 0 18px rgba(0,0,0,0.8), 0 0 36px rgba(180,120,40,0.35)' }}
          >
            CRITICAL CHRONICLES
          </h1>
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-amber-600/70" />
            <span
              className="font-body text-sm md:text-base font-semibold text-amber-100 tracking-[0.2em] uppercase"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.75)' }}
            >
              AI Dungeon Master for TTRPG Campaigns
            </span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-amber-600/70" />
          </div>
        </div>

        {/* Login card — fades in after the splash delay */}
        <div
          className={`bg-stone-950/40 backdrop-blur-sm rounded-2xl border border-amber-900/30 shadow-2xl shadow-amber-950/20 p-8 transition-all duration-1000 ease-out ${
            ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          {children}
        </div>

        {footer && (
          <p
            className={`text-center text-sm text-amber-200/70 mt-6 transition-all duration-1000 ease-out ${
              ready ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}