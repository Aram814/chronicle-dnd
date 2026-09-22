import { useState } from 'react';
import { Dices } from 'lucide-react';

export default function DiceRoller({ onRoll, diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] }) {
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState(null);
  const [modifier, setModifier] = useState(0);
  const [reason, setReason] = useState('');

  const roll = (sides) => {
    setRolling(true);
    setTimeout(() => {
      const result = Math.floor(Math.random() * sides) + 1;
      const total = result + (parseInt(modifier) || 0);
      const rollData = {
        dice_type: `d${sides}`,
        result,
        modifier: parseInt(modifier) || 0,
        total,
        reason: reason || `Manual d${sides} roll`
      };
      setLastRoll(rollData);
      setRolling(false);
      if (onRoll) onRoll(rollData);
    }, 500);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={modifier}
          onChange={(e) => setModifier(e.target.value)}
          placeholder="Mod"
          className="w-16 px-2 py-1 text-sm bg-stone-900/60 border border-amber-900/40 rounded text-amber-100 placeholder-stone-500"
        />
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="flex-1 px-2 py-1 text-sm bg-stone-900/60 border border-amber-900/40 rounded text-amber-100 placeholder-stone-500"
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {diceTypes.map((d) => {
          const sides = parseInt(d.slice(1));
          return (
            <button
              key={d}
              onClick={() => roll(sides)}
              disabled={rolling}
              className="flex flex-col items-center justify-center py-2 bg-stone-900/60 border border-amber-900/40 rounded-lg hover:bg-amber-900/30 hover:border-amber-700/60 transition-all disabled:opacity-50 group"
            >
              <Dices className={`w-4 h-4 text-amber-600/70 group-hover:text-amber-500 ${rolling ? 'animate-spin' : ''}`} />
              <span className="text-xs font-semibold text-amber-200/80 mt-1">{d}</span>
            </button>
          );
        })}
      </div>
      {lastRoll && (
        <div className="flex items-center justify-between p-3 bg-gradient-to-br from-amber-950/40 to-stone-900/60 border border-amber-800/40 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 flex items-center justify-center rounded-lg bg-amber-900/40 border border-amber-700/50 ${rolling ? 'animate-pulse' : ''}`}>
              <span className="text-xl font-bold text-amber-200">{lastRoll.result}</span>
            </div>
            <div className="text-sm">
              <div className="text-amber-300 font-semibold">{lastRoll.dice_type}</div>
              <div className="text-stone-400 text-xs">{lastRoll.reason}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-400">
              {lastRoll.modifier !== 0 && `${lastRoll.modifier > 0 ? '+' : ''}${lastRoll.modifier} = `}
            </div>
            <div className="text-lg font-bold text-amber-200">Total: {lastRoll.total}</div>
          </div>
        </div>
      )}
    </div>
  );
}