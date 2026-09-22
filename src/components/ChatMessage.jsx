import ReactMarkdown from 'react-markdown';
import { Dices, Shield, Heart, Sparkles } from 'lucide-react';

export default function ChatMessage({ message, onRollRequest, isLatest }) {
  const isDM = message.sender === 'dm';
  const isPlayer = message.sender === 'player';
  const isSystem = message.sender === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="text-xs text-muted-foreground italic px-3 py-1 bg-card/40 rounded-full border border-border">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isPlayer ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] ${isPlayer ? 'order-2' : ''}`}>
        <div className={`flex items-center gap-2 mb-1 ${isPlayer ? 'justify-end' : ''}`}>
          <span className={`text-xs font-semibold ${isDM ? 'text-amber-600' : 'text-rose-400'}`}>
            {isDM ? '⚔ Dungeon Master' : (message.sender_name ? `🗡 ${message.sender_name}` : '🗡 You')}
          </span>
        </div>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isDM
              ? 'bg-gradient-to-br from-card/90 to-background/90 border border-amber-900/30 text-foreground'
              : 'bg-gradient-to-br from-rose-950/60 to-card/80 border border-rose-900/40 text-rose-50'
          }`}
        >
          <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-p:leading-relaxed prose-strong:text-amber-300 prose-em:text-amber-200/80">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          {message.dice_roll && <DiceRollCard roll={message.dice_roll} />}
        </div>
        {isDM && message.roll_request && isLatest && onRollRequest && (
          <div className="mt-2">
            <button
              onClick={() => onRollRequest(message.roll_request)}
              className="touch-target inline-flex items-center gap-2 px-4 py-2 bg-amber-900/40 hover:bg-amber-800/50 border border-amber-700/50 rounded-lg text-amber-200 text-sm font-semibold transition-all hover:scale-[1.02]"
            >
              <Dices className="w-4 h-4" />
              Roll {message.roll_request.skillOrAbility}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DiceRollCard({ roll }) {
  return (
    <div className="mt-3 flex items-center gap-3 p-3 bg-background/60 border border-amber-900/40 rounded-lg">
      <div className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 ${
        roll.crit ? 'bg-emerald-900/40 border-emerald-600' :
        roll.fumble ? 'bg-red-900/40 border-red-600' :
        'bg-amber-900/30 border-amber-700/50'
      }`}>
        <span className="text-xl font-bold text-amber-200">{roll.result}</span>
      </div>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{roll.dice_type} · {roll.label || roll.reason}</div>
        <div className="text-sm text-foreground">
          {roll.result} {roll.modifier !== 0 && <span className="text-muted-foreground">({roll.modifier > 0 ? '+' : ''}{roll.modifier})</span>}
          {roll.dc && <span className="text-muted-foreground"> vs DC {roll.dc}</span>}
        </div>
        {roll.crit && <div className="text-xs text-emerald-400 font-semibold">⚡ Critical!</div>}
        {roll.fumble && <div className="text-xs text-red-400 font-semibold">💀 Fumble!</div>}
      </div>
      <div className="text-right">
        <div className="text-xs text-muted-foreground">Total</div>
        <div className={`text-xl font-bold ${roll.success === false ? 'text-red-400' : roll.success === true ? 'text-emerald-400' : 'text-amber-200'}`}>
          {roll.total}
        </div>
      </div>
    </div>
  );
}