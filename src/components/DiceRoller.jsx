import { useState } from 'react';
import { Dices } from 'lucide-react';
import RollingDie from '@/components/RollingDie';

export default function DiceRoller({ onRoll, diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] }) {
  const [activeRoll, setActiveRoll] = useState(null); // roll currently animating
  const [lastRoll, setLastRoll] = useState(null);
  const [modifier, setModifier] = useState(0);
  const [reason, setReason] = useState('');

  const roll = (sides) => {
    if (activeRoll) return;
    const result = Math.floor(Math.random() * sides) + 1;
    const total = result + (parseInt(modifier) || 0);
    setActiveRoll({
      dice_type: `d${sides}`,
      sides,
      result,
      modifier: parseInt(modifier) || 0,
      total,
      reason: reason || `Manual d${sides} roll`
    });
  };

  const finishRoll = () => {
    setLastRoll(activeRoll);
    onRoll?.(activeRoll);
    setActiveRoll(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={modifier}
          onChange={(e) => setModifier(e.target.value)}
          placeholder="Mod"
          className="w-16 px-2 py-1 text-sm bg-card/60 border border-amber-900/40 rounded text-amber-100 placeholder-muted-foreground"
        />
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="flex-1 px-2 py-1 text-sm bg-card/60 border border-amber-900/40 rounded text-amber-100 placeholder-muted-foreground"
        />
      </div>
      {activeRoll ? (
        <div className="flex flex-col items-center py-4">
          <RollingDie sides={activeRoll.sides} finalResult={activeRoll.result} onComplete={finishRoll} />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {diceTypes.map((d) => {
            const sides = parseInt(d.slice(1));
            return (
              <button
                key={d}
                onClick={() => roll(sides)}
                className="flex flex-col items-center justify-center py-2 bg-card/60 border border-amber-900/40 rounded-lg hover:bg-amber-900/30 hover:border-amber-700/60 transition-all group"
              >
                <Dices className="w-4 h-4 text-amber-600/70 group-hover:text-amber-500" />
                <span className="text-xs font-semibold text-amber-200/80 mt-1">{d}</span>
              </button>
            );
          })}
        </div>
      )}
      {lastRoll && !activeRoll && (
        <div className="flex items-center justify-between p-3 bg-gradient-to-br from-amber-950/40 to-card/60 border border-amber-800/40 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-amber-900/40 border border-amber-700/50">
              <span className="text-xl font-bold text-amber-200">{lastRoll.result}</span>
            </div>
            <div className="text-sm">
              <div className="text-amber-300 font-semibold">{lastRoll.dice_type}</div>
              <div className="text-muted-foreground text-xs">{lastRoll.reason}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">
              {lastRoll.modifier !== 0 && `${lastRoll.modifier > 0 ? '+' : ''}${lastRoll.modifier} = `}
            </div>
            <div className="text-lg font-bold text-amber-200">Total: {lastRoll.total}</div>
          </div>
        </div>
      )}
    </div>
  );
}