import { useState } from 'react';
import {
  ChevronDown, Heart, Frown, Meh, Smile, Angry, Sparkles, Loader2,
  Search, MapPin, Flag, Skull, ArrowRightLeft, Users
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';

const DISPOSITION_BANDS = [
  { min: 75, label: 'Devoted', color: 'text-rose-300', bar: 'bg-rose-500', tag: 'bg-rose-900/40 text-rose-300' },
  { min: 25, label: 'Friendly', color: 'text-emerald-300', bar: 'bg-emerald-500', tag: 'bg-emerald-900/30 text-emerald-300' },
  { min: -24, label: 'Neutral', color: 'text-muted-foreground', bar: 'bg-amber-500', tag: 'bg-muted text-muted-foreground' },
  { min: -74, label: 'Unfriendly', color: 'text-orange-300', bar: 'bg-orange-500', tag: 'bg-orange-900/40 text-orange-300' },
  { min: -100, label: 'Hostile', color: 'text-red-400', bar: 'bg-red-500', tag: 'bg-red-900/40 text-red-300' }
];

function bandFor(disposition) {
  return DISPOSITION_BANDS.find(b => disposition >= b.min) || DISPOSITION_BANDS[DISPOSITION_BANDS.length - 1];
}

function dispositionIcon(disposition) {
  if (disposition >= 75) return Heart;
  if (disposition >= 25) return Smile;
  if (disposition >= -24) return Meh;
  if (disposition >= -74) return Frown;
  return Angry;
}

export default function RelationshipTracker({ npcs, onRecategorize }) {
  const [expanded, setExpanded] = useState(null);
  const [portraits, setPortraits] = useState({});
  const [generating, setGenerating] = useState(null);
  const [query, setQuery] = useState('');
  const [moving, setMoving] = useState(null);

  const list = npcs || [];
  const filtered = query.trim()
    ? list.filter(n => (n.name || '').toLowerCase().includes(query.toLowerCase()))
    : list;

  const generatePortrait = async (npc) => {
    setGenerating(npc.id);
    try {
      const res = await base44.functions.invoke('dm_engine', { mode: 'generate_npc_portrait', npc });
      if (res.data?.url) {
        await base44.entities.NPC.update(npc.id, { portrait: res.data.url });
        setPortraits(prev => ({ ...prev, [npc.id]: res.data.url }));
      }
    } catch (e) { /* ignore */ } finally { setGenerating(null); }
  };

  const handleMove = async (npc) => {
    if (!onRecategorize) return;
    setMoving(npc.id);
    try { await onRecategorize(npc); } finally { setMoving(null); }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-serif text-amber-200 text-sm flex items-center gap-1.5"><Users className="w-4 h-4" /> NPCs</h4>
        <span className="text-xs text-muted-foreground">{list.length}</span>
      </div>

      {list.length > 3 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search NPCs…"
            className="w-full pl-7 pr-2 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-amber-700/50"
          />
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-xs text-muted-foreground">No NPCs discovered yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground">No matches.</p>
      ) : filtered.map(n => {
        const disp = n.disposition || 0;
        const band = bandFor(disp);
        const Icon = dispositionIcon(disp);
        const isOpen = expanded === n.id;
        const interactions = n.interactions || [];
        const half = Math.abs(disp) / 2;
        const left = disp >= 0 ? 50 : 50 - half;
        const width = half;
        const portrait = portraits[n.id] || n.portrait;
        const isLoading = generating === n.id;
        const isDead = n.status === 'dead';
        const isHostile = n.is_hostile;

        return (
          <div key={n.id} className={`bg-background/50 border rounded p-2 ${isDead ? 'border-red-900/40 opacity-70' : 'border-border'}`}>
            <div className="flex items-start gap-2">
              <button
                onClick={() => !portrait && generatePortrait(n)}
                disabled={isLoading}
                className="relative w-12 h-12 rounded-md overflow-hidden border border-amber-900/40 bg-stone-800 flex-shrink-0 flex items-center justify-center hover:border-amber-600/60 transition-colors"
                aria-label={portrait ? n.name : `Generate portrait for ${n.name}`}
              >
                {portrait
                  ? <Image src={portrait} alt={n.name} fittingType="fill" className="w-full h-full" />
                  : isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    : <Sparkles className={`w-4 h-4 ${isHostile ? 'text-red-400/70' : 'text-muted-foreground'}`} />}
              </button>

              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : n.id)}
                  className="w-full flex items-center justify-between text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm text-foreground flex items-center gap-1.5 min-w-0">
                    <span className={`truncate ${isDead ? 'line-through' : ''}`}>{n.name}</span>
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    {n.relationship && <span className="text-[10px] text-amber-300/80 capitalize">{n.relationship}</span>}
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </span>
                </button>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {!isDead && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${band.tag}`}>
                      <Icon className="w-2.5 h-2.5" />{band.label}
                    </span>
                  )}
                  {isDead && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 flex items-center gap-0.5"><Skull className="w-2.5 h-2.5" />Dead</span>}
                  {isHostile && !isDead && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-900/40 text-orange-300">Hostile</span>}
                  {n.location && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{n.location}</span>}
                  {n.faction && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-300 flex items-center gap-0.5"><Flag className="w-2.5 h-2.5" />{n.faction}</span>}
                </div>
              </div>
            </div>

            {isOpen && (
              <div className="mt-2 pt-2 border-t border-border space-y-2 max-h-56 overflow-y-auto">
                {n.description && <p className="text-xs text-foreground/80 leading-snug">{n.description}</p>}
                {n.personality && (
                  <p className="text-xs text-muted-foreground leading-snug"><span className="text-amber-600/80">Personality:</span> {n.personality}</p>
                )}
                {n.known_info && (
                  <p className="text-xs text-muted-foreground leading-snug"><span className="text-amber-600/80">Known:</span> {n.known_info}</p>
                )}

                {/* Disposition meter */}
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="uppercase tracking-wide text-muted-foreground">Disposition</span>
                    <span className={band.color}>{disp > 0 ? `+${disp}` : disp}</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`absolute top-0 bottom-0 ${band.bar}`} style={{ left: `${left}%`, width: `${width}%` }} />
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border" />
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                    <span>-100</span><span>0</span><span>+100</span>
                  </div>
                </div>

                <p className="text-[10px] uppercase tracking-wide text-muted-foreground pt-1">Interaction Log</p>
                {interactions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No logged interactions yet.</p>
                ) : (
                  interactions.slice().reverse().map((it, i) => (
                    <div key={i} className="text-xs leading-snug">
                      <span className={it.change >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {it.change >= 0 ? `+${it.change}` : it.change}
                      </span>
                      <span className="text-muted-foreground ml-1">{it.summary}</span>
                    </div>
                  ))
                )}
                {onRecategorize && (
                  <button
                    onClick={() => handleMove(n)}
                    disabled={moving === n.id}
                    className="touch-target mt-1 w-full flex items-center justify-center gap-1.5 text-xs text-red-300 hover:text-red-200 border border-red-900/40 hover:bg-red-950/30 rounded py-1.5 transition-colors disabled:opacity-50"
                  >
                    {moving === n.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                    Move to Bestiary
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}