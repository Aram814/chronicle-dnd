import { useState } from 'react';
import {
  Skull, ChevronDown, Sparkles, Loader2, Search, MapPin,
  Swords, Heart, ArrowRightLeft
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';

// Bestiary: the campaign's catalog of monsters/creatures. Monsters live in
// their own Monster entity, fully separated from NPCs.
export default function Bestiary({ monsters, onRecategorize }) {
  const [expanded, setExpanded] = useState(null);
  const [portraits, setPortraits] = useState({});
  const [generating, setGenerating] = useState(null);
  const [query, setQuery] = useState('');
  const [moving, setMoving] = useState(null);

  const list = monsters || [];
  const filtered = query.trim()
    ? list.filter(m => (m.name || '').toLowerCase().includes(query.toLowerCase()))
    : list;

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

  const handleMove = async (m) => {
    if (!onRecategorize) return;
    setMoving(m.id);
    try { await onRecategorize(m); } finally { setMoving(null); }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-serif text-amber-200 text-sm flex items-center gap-1.5"><Skull className="w-4 h-4" /> Bestiary</h4>
        <span className="text-xs text-muted-foreground">{list.length}</span>
      </div>

      {list.length > 3 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creatures…"
            className="w-full pl-7 pr-2 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-amber-700/50"
          />
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-xs text-muted-foreground">No monsters encountered yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground">No matches.</p>
      ) : filtered.map(m => {
        const isOpen = expanded === m.id;
        const portrait = portraits[m.id] || m.portrait;
        const isLoading = generating === m.id;
        const defeated = m.status === 'dead' || m.status === 'defeated';
        const interactions = m.interactions || [];

        return (
          <div key={m.id} className={`bg-background/50 border rounded p-2 ${defeated ? 'border-red-900/40 opacity-70' : 'border-border'}`}>
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
                    <span className={`truncate ${defeated ? 'line-through' : ''}`}>{m.name}</span>
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    {m.monster_type && <span className="text-[10px] text-red-300/80 capitalize">{m.monster_type}</span>}
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {defeated
                    ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 flex items-center gap-0.5"><Skull className="w-2.5 h-2.5" />Defeated</span>
                    : <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-300 flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" />Alive</span>}
                  {m.is_hostile && !defeated && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-900/40 text-orange-300 flex items-center gap-0.5"><Swords className="w-2.5 h-2.5" />Hostile</span>}
                  {m.location && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{m.location}</span>}
                </div>
              </div>
            </div>

            {isOpen && (
              <div className="mt-2 pt-2 border-t border-border space-y-1.5 max-h-48 overflow-y-auto">
                {m.description && <p className="text-xs text-foreground/80 leading-snug">{m.description}</p>}
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
                    onClick={() => handleMove(m)}
                    disabled={moving === m.id}
                    className="touch-target mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 border border-amber-900/40 hover:bg-amber-950/30 rounded py-1.5 transition-colors disabled:opacity-50"
                  >
                    {moving === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                    Move to NPCs
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