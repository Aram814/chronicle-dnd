import { ShieldAlert, ShieldCheck } from 'lucide-react';

// Toggle for a campaign's 18+ / mature-content setting.
export default function MatureToggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      aria-pressed={enabled}
      aria-label={enabled ? 'Mature content enabled. Tap to switch to general.' : 'General content. Tap to enable 18+ mature content.'}
      className={`touch-target inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
        enabled
          ? 'bg-red-900/40 border-red-700/50 text-red-300'
          : 'bg-muted border-border text-muted-foreground'
      }`}
    >
      {enabled ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
      {enabled ? '18+ Mature' : 'General'}
    </button>
  );
}