import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sound } from '@/lib/soundManager';

export default function SoundToggle() {
  const [muted, setMuted] = useState(sound.isMuted());

  const toggle = () => {
    const next = sound.toggleMute();
    setMuted(next);
    if (!next) sound.startMusic();
  };

  return (
    <button
      onClick={toggle}
      aria-label={muted ? 'Unmute sound and music' : 'Mute sound and music'}
      title={muted ? 'Unmute' : 'Mute'}
      className="p-3 text-muted-foreground hover:text-amber-300 hover:bg-accent rounded-lg transition-all"
    >
      {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
    </button>
  );
}