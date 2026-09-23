import { useState } from 'react';
import { ChevronDown, Heart, Frown, Meh, Smile, Angry, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';

const DISPOSITION_BANDS = [
  { min: 75, label: 'Devoted', color: 'text-rose-300', bar: 'bg-rose-500' },
  { min: 25, label: 'Friendly', color: 'text-emerald-300', bar: 'bg-emerald-500' },
  { min: -24, label: 'Neutral', color: 'text-muted-foreground', bar: 'bg-amber-500' },
  { min: -74, label: 'Unfriendly', color: 'text-orange-300', bar: 'bg-orange-500' },
  { min: -100, label: 'Hostile', color: 'text-red-400', bar: 'bg-red-500' }
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

export default function RelationshipTracker({ npcs }) {
  const [expanded, setExpanded] = useState(null);
  const [portraits, setPortraits] = useState({}); // npcId -> portrait url override
  const [generating, setGenerating] = useState(null);

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

  if (!npcs || npcs.length === 0) {
    return (
      <div className="space-y-2">
        <h4 className="font-serif text-amber-200 text-sm">Relationships</h4>
        <p className="text-xs text-muted-foreground">No NPCs discovered yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="font-serif text-amber-200 text-sm">Relationships</h4>
      {npcs.map(n => {
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
        const hostile = n.is_hostile || n.status === 'hostile' || n.status === 'dead';

        return (
          <div key={n.id} className="bg-background/50 border border-border rounded p-2">
            <div className="flex items-start gap-2">
              {/* Portrait / generate button */}
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
                    : <Sparkles className={`w-4 h-4 ${hostile ? 'text-red-400/70' : 'text-muted-foreground'}`} />}
              </button>

              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : n.id)}
                  className="w-full flex items-center justify-between text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm text-foreground flex items-center gap-1.5 min-w-0">
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${band.color}`} />
                    <span className="truncate">{n.name}</span>
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <span className={`text-xs ${band.color}`}>{band.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </span>
                </button>

                {/* Disposition meter */}
                <div className="mt-2 relative h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`absolute top-0 bottom-0 ${band.bar}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border" />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>-100</span>
                  <span className={band.color}>{disp > 0 ? `+${disp}` : disp}</span>
                  <span>+100</span>
                </div>
              </div>
            </div>

            {n.relationship && <p className="text-xs text-amber-600 mt-1.5">{n.relationship}</p>}

            {isOpen && (
              <div className="mt-2 pt-2 border-t border-border space-y-1.5 max-h-40 overflow-y-auto">
                {n.description && (
                  <p className="text-xs text-foreground/80 leading-snug">{n.description}</p>
                )}
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Interaction Log</p>
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}