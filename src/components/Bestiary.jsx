import { useState } from 'react';
import { Skull, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';

// Bestiary: the campaign's catalog of monsters/creatures. Monsters now live
// in their own Monster entity, fully separated from NPCs.
export default function Bestiary({ monsters }) {
  const [expanded, setExpanded] = useState(null);
  const [portraits, setPortraits] = useState({}); // monsterId -> portrait url override
  const [generating, setGenerating] = useState(null);

  const list = monsters || [];

  const generatePortrait = async (m) => {
    setGenerating(m.id);
    try {
      const res = await base44.functions.invoke('dm_engine', { mode: 'generate_npc_portrait', npc: m });
      if (res.data?.url) {
        await base44.entities.Monster.update(m.id, { portrait: res.data.url });
        setPortraits(prev => ({ ...prev, [m.id]: res.data.url }));
      }
    } catch (e) { /* ignore */ } finally { setGenerating(null); }
  };

  if (list.length === 0) {
    return (
      <div className="space-y-2">
        <h4 className="font-serif text-amber-200 text-sm flex items-center gap-1.5"><Skull className="w-4 h-4" /> Bestiary</h4>
        <p className="text-xs text-muted-foreground">No monsters encountered yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="font-serif text-amber-200 text-sm flex items-center gap-1.5"><Skull className="w-4 h-4" /> Bestiary</h4>
      {list.map(m => {
        const isOpen = expanded === m.id;
        const portrait = portraits[m.id] || m.portrait;
        const isLoading = generating === m.id;
        const defeated = m.status === 'dead' || m.status === 'defeated';
        return (
          <div key={m.id} className="bg-background/50 border border-border rounded p-2">
            <div className="flex items-start gap-2">
              <button
                onClick={() => !portrait && generatePortrait(m)}
                disabled={isLoading}
                className="relative w-12 h-12 rounded-md overflow-hidden border border-red-900/40 bg-stone-800 flex-shrink-0 flex items-center justify-center hover:border-red-600/60 transition-colors"
                aria-label={portrait ? m.name : `Generate illustration for ${m.name}`}
              >
                {portrait
                  ? <Image src={portrait} alt={m.name} fittingType="fill" className="w-full h-full" />
                  : isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                    : <Sparkles className="w-4 h-4 text-red-400/70" />}
              </button>
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : m.id)}
                  className="w-full flex items-center justify-between text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm text-foreground flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{m.name}</span>
                    {defeated && <span className="text-[10px] text-muted-foreground line-through">defeated</span>}
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    {m.monster_type && <span className="text-[10px] text-red-300/80 capitalize">{m.monster_type}</span>}
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                {m.location && <p className="text-[10px] text-muted-foreground mt-0.5">{m.location}</p>}
              </div>
            </div>
            {isOpen && m.description && (
              <p className="text-xs text-foreground/80 leading-snug mt-2 pt-2 border-t border-border">{m.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}