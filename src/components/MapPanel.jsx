import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Compass, Maximize2, Users, Skull } from 'lucide-react';
import { Image } from '@/components/ui/image';

const TYPE_ICONS = {
  city: '🏰', town: '🏘️', village: '🏚️', dungeon: '🕳️', forest: '🌲',
  mountain: '⛰️', river: '🌊', sea: '🌊', ruins: '🏚️', temple: '⛩️',
  tavern: '🍺', shop: '🏪', castle: '🏰', cave: '🕳️', camp: '⛺',
  wilderness: '🌲', road: '🛤️', region: '🗺️',
};

// Distribute n points evenly around a circle of the given radius (in %).
function circlePositions(n, radius = 36) {
  if (n <= 0) return [];
  if (n === 1) return [{ x: 50, y: 50 }];
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius };
  });
}

function MarkerDot({ entity, type, pos, onToggle, selected }) {
  const ring = type === 'player' ? 'border-sky-400 bg-sky-900/60'
    : type === 'npc' ? 'border-emerald-400 bg-emerald-900/60'
    : 'border-red-400 bg-red-900/60';
  const portrait = entity.portrait;
  const initial = (entity.name || '?')[0]?.toUpperCase();
  return (
    <button
      onClick={onToggle}
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 touch-target"
      title={entity.name}
      aria-label={entity.name}
    >
      <span className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 overflow-hidden ${ring} ${selected ? 'ring-2 ring-amber-300 scale-110' : ''} transition-transform`}>
        {portrait
          ? <Image src={portrait} alt={entity.name} fittingType="fill" className="w-full h-full" />
          : <span className="text-xs font-bold text-amber-100 font-display">{initial}</span>}
      </span>
      <span className="text-[9px] font-serif px-1 py-0.5 rounded bg-stone-900/85 whitespace-nowrap text-amber-100/90 max-w-[64px] truncate">{entity.name}</span>
    </button>
  );
}

// Compact LOCAL map for the in-game sidebar: shows the party's current
// location as a scene, with markers for everyone present (party, NPCs,
// creatures). A link opens the full world map page.
export default function MapPanel({ campaign, locations, players = [], npcs = [], monsters = [] }) {
  const [selectedId, setSelectedId] = useState(null);
  const currentName = campaign?.current_location?.toLowerCase();
  const current = useMemo(
    () => (locations || []).find(l => (l.name || '').toLowerCase() === currentName) || null,
    [locations, currentName]
  );
  const campaignId = campaign?.id;

  const presentPlayers = players || [];
  const presentNpcs = useMemo(
    () => (npcs || []).filter(n => (n.location || '').toLowerCase() === currentName),
    [npcs, currentName]
  );
  const presentMonsters = useMemo(
    () => (monsters || []).filter(m => (m.location || '').toLowerCase() === currentName),
    [monsters, currentName]
  );

  // Combine all present entities and lay them out around the scene.
  const allPresent = useMemo(() => [
    ...presentPlayers.map(p => ({ entity: p, type: 'player' })),
    ...presentNpcs.map(n => ({ entity: n, type: 'npc' })),
    ...presentMonsters.map(m => ({ entity: m, type: 'monster' })),
  ], [presentPlayers, presentNpcs, presentMonsters]);
  const positions = useMemo(() => circlePositions(allPresent.length), [allPresent.length]);

  const selected = selectedId ? allPresent.find(a => a.entity.id === selectedId)?.entity : null;
  const selectedType = selectedId ? allPresent.find(a => a.entity.id === selectedId)?.type : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-serif text-amber-200 text-sm flex items-center gap-1.5">
          <MapPin className="w-4 h-4" /> {current ? current.name : 'Current Location'}
        </h4>
        {campaignId && (
          <Link to={`/campaign/${campaignId}/map`} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
            <Maximize2 className="w-3 h-3" /> Full map
          </Link>
        )}
      </div>

      {!current ? (
        <div className="text-center py-6">
          <Compass className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">No location discovered yet</p>
        </div>
      ) : (
        <>
          <div className="relative w-full h-60 rounded-lg overflow-hidden border border-border bg-stone-950">
            {/* Scene background */}
            {current.image ? (
              <>
                <div className="absolute inset-0">
                  <Image src={current.image} alt={current.name} fittingType="fill" className="w-full h-full" />
                </div>
                <div className="absolute inset-0 pointer-events-none bg-stone-950/35" />
              </>
            ) : (
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  radial-gradient(circle at 50% 40%, rgba(120, 53, 15, 0.12) 0%, transparent 70%),
                  linear-gradient(rgba(120, 53, 15, 0.05) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(120, 53, 15, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: '100% 100%, 32px 32px, 32px 32px',
              }} />
            )}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)'
            }} />

            {/* Type badge */}
            {current.type && (
              <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-stone-900/80 text-amber-300 capitalize flex items-center gap-1">
                <span>{TYPE_ICONS[current.type?.toLowerCase()] || '📍'}</span>{current.type}
              </span>
            )}

            {/* Presence markers */}
            {allPresent.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-xs text-stone-400">No one here yet</p>
              </div>
            ) : allPresent.map((a, i) => (
              <MarkerDot
                key={a.entity.id}
                entity={a.entity}
                type={a.type}
                pos={positions[i]}
                selected={selectedId === a.entity.id}
                onToggle={() => setSelectedId(selectedId === a.entity.id ? null : a.entity.id)}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border border-sky-400 bg-sky-900/60" /><Users className="w-2.5 h-2.5" /> Party</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border border-emerald-400 bg-emerald-900/60" /> NPCs</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border border-red-400 bg-red-900/60" /><Skull className="w-2.5 h-2.5" /> Creatures</span>
          </div>

          {/* Selected entity detail */}
          {selected && (
            <div className="bg-background/50 border border-border rounded p-2 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs uppercase ${selectedType === 'player' ? 'text-sky-300' : selectedType === 'npc' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {selectedType === 'player' ? 'Party' : selectedType === 'npc' ? 'NPC' : 'Creature'}
                </span>
                <span className="text-sm text-amber-200 font-serif">{selected.name}</span>
              </div>
              {selected.description
                ? <p className="text-xs text-foreground/80 leading-snug">{selected.description}</p>
                : <p className="text-xs text-muted-foreground italic">No description recorded</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}