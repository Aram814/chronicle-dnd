import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import RollingDie from '@/components/RollingDie';

// 4d6 drop the lowest — the classic D&D ability-score roll.
function rollSet() {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  const sorted = [...rolls].sort((a, b) => b - a);
  return { rolls, total: sorted[0] + sorted[1] + sorted[2] };
}

export default function AbilityRollDialog({ abilities, onUse, onClose }) {
  // Precompute the final results once so the dice animate toward them.
  const resultsRef = useRef(null);
  if (!resultsRef.current) {
    resultsRef.current = abilities.map((a) => ({ key: a.key, label: a.label, ...rollSet() }));
  }
  const [done, setDone] = useState(0);
  const totalDice = abilities.length * 4;
  const allDone = done >= totalDice;

  const use = () => {
    const map = {};
    resultsRef.current.forEach((r) => { map[r.key] = r.total; });
    onUse(map);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 safe-top safe-bottom"
      onClick={onClose}
    >
      <div
        className="bg-card border border-amber-700/40 rounded-2xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto overscroll-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-serif text-amber-200 text-lg">Roll Ability Scores</h3>
          <button onClick={onClose} aria-label="Close" className="touch-target text-muted-foreground hover:text-foreground p-2">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">4d6, drop the lowest, for each ability.</p>
        <div className="space-y-4">
          {resultsRef.current.map((r) => (
            <div key={r.key} className="flex items-center gap-3">
              <span className="w-10 text-sm font-semibold text-foreground flex-shrink-0">{r.label}</span>
              <div className="flex gap-1.5 flex-wrap">
                {r.rolls.map((final, i) => (
                  <RollingDie
                    key={i}
                    sides={6}
                    finalResult={final}
                    size={38}
                    duration={900}
                    onComplete={() => setDone((c) => c + 1)}
                  />
                ))}
              </div>
              <span className="ml-auto text-lg font-bold text-amber-200 w-8 text-right">
                {allDone ? r.total : ''}
              </span>
            </div>
          ))}
        </div>
        {allDone && (
          <button
            onClick={use}
            className="touch-target w-full mt-5 px-4 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg font-semibold transition-all"
          >
            Use These Scores
          </button>
        )}
      </div>
    </div>
  );
}