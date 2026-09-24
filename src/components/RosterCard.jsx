import { useState } from 'react';
import {
  ChevronDown, MapPin, Flag, Skull, Heart, Swords, Sparkles, Loader2,
  ArrowRightLeft, Frown, Meh, Smile, Angry
} from 'lucide-react';
import { Image } from '@/components/ui/image';

const BANDS = [
  { min: 75, label: 'Devoted', color: 'text-rose-300', bar: 'bg-rose-500', tag: 'bg-rose-900/40 text-rose-300' },
  { min: 25, label: 'Friendly', color: 'text-emerald-300', bar: 'bg-emerald-500', tag: 'bg-emerald-900/30 text-emerald-300' },
  { min: -24, label: 'Neutral', color: 'text-muted-foreground', bar: 'bg-amber-500', tag: 'bg-muted text-muted-foreground' },
  { min: -74, label: 'Unfriendly', color: 'text-orange-300', bar: 'bg-orange-500', tag: 'bg-orange-900/40 text-orange-300' },
  { min: -100, label: 'Hostile', color: 'text-red-400', bar: 'bg-red-500', tag: 'bg-red-900/40 text-red-300' }
];
const bandFor = (d) => BANDS.find(b => d >= b.min) || BANDS[BANDS.length - 1];
const dispIcon = (d) => d >= 75 ? Heart : d >= 25 ? Smile : d >= -24 ? Meh : d >= -74 ? Frown : Angry;

/**
 * A clean management card for an NPC or Monster. Shows portrait, name, status
 * tags, and a clamped description; expands to reveal full details, disposition
 * (NPCs), the interaction log, and management actions.
 */
export default function RosterCard({ entity, kind, portrait, generating, moving, onGeneratePortrait, onRecategorize }) {
  const [open, setOpen] = useState(false);
  const isNpc = kind === 'npc';
  const isDead = entity.status === 'dead' || entity.status === 'defeated';
  const isHostile = entity.is_hostile;
  const interactions = entity.interactions || [];
  const disp = isNpc ? (entity.disposition || 0) : 0;
  const band = isNpc ? bandFor(disp) : null;
  const DispIcon = isNpc ? dispIcon(disp) : null;

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-shadow hover:shadow-lg ${isDead ? 'border-red-900/40' : 'border-border'}`}>
      <div className="flex gap-3 p-3">
        {/* Portrait */}
        <button
          onClick={() => !portrait && onGeneratePortrait?.(entity)}
          disabled={generating}
          className={`relative w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0 flex items-center justify-center transition-colors ${
            isNpc ? 'border-amber-900/40 hover:border-amber-600/60' : 'border-red-900/40 hover:border-red-600/60'
          } bg-stone-800`}
          aria-label={portrait ? entity.name : `Generate portrait for ${entity.name}`}
        >
          {portrait
            ? <Image src={portrait} alt={entity.name} fittingType="fill" className="w-full h-full" />
            : generating
              ? <Loader2 className={`w-5 h-5 animate-spin ${isNpc ? 'text-amber-400' : 'text-red-400'}`} />
              : <Sparkles className={`w-5 h-5 ${isHostile ? 'text-red-400/70' : 'text-muted-foreground'}`} />}
        </button>

        {/* Identity + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-serif text-amber-100 leading-tight ${isDead ? 'line-through text-muted-foreground' : ''}`}>{entity.name}</h3>
            <button
              onClick={() => setOpen(o => !o)}
              aria-expanded={open}
              aria-label={open ? 'Collapse' : 'Expand'}
              className="text-muted-foreground hover:text-foreground p-1 -mr-1 -mt-1"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Status tags */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {isDead
              ? <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 flex items-center gap-1"><Skull className="w-3 h-3" />{isNpc ? 'Dead' : 'Defeated'}</span>
              : <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-300 flex items-center gap-1"><Heart className="w-3 h-3" />Alive</span>}
            {isHostile && !isDead && <span className="text-[11px] px-1.5 py-0.5 rounded bg-orange-900/40 text-orange-300 flex items-center gap-1"><Swords className="w-3 h-3" />Hostile</span>}
            {isNpc && band && !isDead && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1 ${band.tag}`}><DispIcon className="w-3 h-3" />{band.label}</span>
            )}
            {!isNpc && entity.monster_type && <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-950/40 text-red-300/80 capitalize">{entity.monster_type}</span>}
            {entity.location && <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{entity.location}</span>}
            {isNpc && entity.faction && <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-300 flex items-center gap-1"><Flag className="w-3 h-3" />{entity.faction}</span>}
          </div>

          {/* Description (clamped) */}
          {entity.description && (
            <p className={`text-xs text-muted-foreground leading-snug mt-2 ${open ? '' : 'line-clamp-2'}`}>{entity.description}</p>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {open && (
        <div className="px-3 pb-3 pt-2 border-t border-border space-y-2.5">
          {isNpc && entity.personality && (
            <p className="text-xs text-muted-foreground leading-snug"><span className="text-amber-600/80 font-medium">Personality:</span> {entity.personality}</p>
          )}
          {isNpc && entity.known_info && (
            <p className="text-xs text-muted-foreground leading-snug"><span className="text-amber-600/80 font-medium">Known:</span> {entity.known_info}</p>
          )}
          {isNpc && entity.relationship && (
            <p className="text-xs text-amber-300/90"><span className="text-amber-600/80 font-medium">Role:</span> {entity.relationship}</p>
          )}

          {/* Disposition meter (NPCs only) */}
          {isNpc && (
            <div>
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="uppercase tracking-wide text-muted-foreground">Disposition</span>
                <span className={band.color}>{disp > 0 ? `+${disp}` : disp}</span>
              </div>
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div className={`absolute top-0 bottom-0 ${band.bar}`} style={{ left: `${disp >= 0 ? 50 : 50 - Math.abs(disp) / 2}%`, width: `${Math.abs(disp) / 2}%` }} />
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border" />
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5"><span>-100</span><span>0</span><span>+100</span></div>
            </div>
          )}

          {/* Interaction log */}
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Interaction Log</p>
            {interactions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No logged interactions yet.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {interactions.slice().reverse().map((it, i) => (
                  <div key={i} className="text-xs leading-snug">
                    <span className={it.change >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                      {it.change >= 0 ? `+${it.change}` : it.change}
                    </span>
                    <span className="text-muted-foreground ml-1">{it.summary}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {!portrait && (
              <button
                onClick={() => onGeneratePortrait?.(entity)}
                disabled={generating}
                className="touch-target flex-1 flex items-center justify-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 border border-amber-900/40 hover:bg-amber-950/30 rounded-lg py-1.5 transition-colors disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Generate Portrait
              </button>
            )}
            {onRecategorize && (
              <button
                onClick={() => onRecategorize(entity)}
                disabled={moving}
                className="touch-target flex-1 flex items-center justify-center gap-1.5 text-xs text-red-300 hover:text-red-200 border border-red-900/40 hover:bg-red-950/30 rounded-lg py-1.5 transition-colors disabled:opacity-50"
              >
                {moving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                Move to {isNpc ? 'Bestiary' : 'NPCs'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}