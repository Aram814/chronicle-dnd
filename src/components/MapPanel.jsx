import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Compass, Maximize2 } from 'lucide-react';
import { normalizeLocations } from '@/lib/mapLayout';

const TYPE_ICONS = {
  city: '🏰', town: '🏘️', village: '🏚️', dungeon: '🕳️', forest: '🌲',
  mountain: '⛰️', river: '🌊', sea: '🌊', ruins: '🏚️', temple: '⛩️',
  tavern: '🍺', shop: '🏪', castle: '🏰', cave: '🕳️', camp: '⛺',
  wilderness: '🌲', road: '🛤️', region: '🗺️',
};

// Compact visual pin map for the in-game sidebar/drawer. Shows discovered
// locations as pins, the current location highlighted, and a link to the
// full-page map for the complete experience.
export default function MapPanel({ campaign, locations }) {
  const [selectedId, setSelectedId] = useState(null);
  const positioned = useMemo(() => normalizeLocations(locations), [locations]);
  const selected = selectedId ? positioned.find(l => l.id === selectedId) : null;
  const currentName = campaign?.current_location?.toLowerCase();
  const campaignId = campaign?.id;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-serif text-amber-200 text-sm">World Map</h4>
        {campaignId && (
          <Link
            to={`/campaign/${campaignId}/map`}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <Maximize2 className="w-3 h-3" /> Full map
          </Link>
        )}
      </div>

      {positioned.length === 0 ? (
        <div className="text-center py-6">
          <Compass className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">No locations discovered yet</p>
        </div>
      ) : (
        <>
          <div className="relative w-full h-56 rounded-lg overflow-hidden border border-border bg-stone-950">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                radial-gradient(circle at 50% 50%, rgba(120, 53, 15, 0.08) 0%, transparent 70%),
                linear-gradient(rgba(120, 53, 15, 0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(120, 53, 15, 0.04) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 40px 40px, 40px 40px',
            }} />
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)'
            }} />

            {positioned.map(l => {
              const isCurrent = l.name.toLowerCase() === currentName;
              const isDiscovered = l.discovered;
              const isSelected = l.id === selectedId;
              return (
                <button
                  key={l.id}
                  onClick={() => setSelectedId(isSelected ? null : l.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 group touch-target"
                  style={{ left: `${l.normX}%`, top: `${l.normY}%` }}
                  aria-label={isDiscovered ? l.name : 'Unknown location'}
                >
                  {isCurrent && (
                    <span className="absolute w-8 h-8 rounded-full bg-amber-500/20 animate-ping" />
                  )}
                  <span className={`relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all ${
                    isSelected ? 'scale-125 z-10' : 'group-hover:scale-110'
                  } ${
                    isCurrent
                      ? 'bg-amber-600 border-amber-300 shadow-lg shadow-amber-700/50'
                      : isDiscovered
                        ? 'bg-amber-800/80 border-amber-500/60'
                        : 'bg-stone-800 border-stone-600/50'
                  }`}>
                    {isDiscovered
                      ? <MapPin className="w-3 h-3 text-amber-100" />
                      : <span className="text-stone-400 text-xs font-bold">?</span>}
                  </span>
                  {isDiscovered && (
                    <span className={`text-[10px] font-serif px-1 py-0.5 rounded bg-stone-900/80 whitespace-nowrap ${
                      isCurrent ? 'text-amber-200' : 'text-amber-100/80'
                    }`}>{l.name}</span>
                  )}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="bg-background/50 border border-border rounded p-2 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{TYPE_ICONS[selected.type?.toLowerCase()] || '📍'}</span>
                <span className="text-sm text-amber-200 font-serif">{selected.name}</span>
                {selected.type && <span className="text-[10px] text-amber-500 capitalize">{selected.type}</span>}
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