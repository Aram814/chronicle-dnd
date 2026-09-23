import { useState, useMemo } from 'react';
import { MapPin, X, Users, ScrollText, Compass, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { normalizeLocations } from '@/lib/mapLayout';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';

const TYPE_ICONS = {
  city: '🏰', town: '🏘️', village: '🏚️', dungeon: '🕳️', forest: '🌲',
  mountain: '⛰️', river: '🌊', sea: '🌊', ruins: '🏚️', temple: '⛩️',
  tavern: '🍺', shop: '🏪', castle: '🏰', cave: '🕳️', camp: '⛺',
  wilderness: '🌲', road: '🛤️', region: '🗺️',
};

export default function CampaignMap({ campaign, locations, npcs, quests }) {
  const [selectedId, setSelectedId] = useState(null);
  const [mapImage, setMapImage] = useState(campaign?.map_image || null);
  const [generatingMap, setGeneratingMap] = useState(false);
  const [locImages, setLocImages] = useState({});   // locationId -> image url override
  const [generatingLoc, setGeneratingLoc] = useState(null);
  const [npcPortraits, setNpcPortraits] = useState({}); // npcId -> portrait url override

  const positioned = useMemo(() => normalizeLocations(locations), [locations]);
  const selected = selectedId ? positioned.find(l => l.id === selectedId) : null;
  const currentName = campaign?.current_location?.toLowerCase();

  const relatedNpcs = selected ? npcs.filter(n =>
    n.location && n.location.toLowerCase() === selected.name.toLowerCase()
  ) : [];
  const relatedQuests = selected ? quests.filter(q => {
    if (q.status !== 'active') return false;
    return relatedNpcs.some(n => n.name.toLowerCase() === (q.giver || '').toLowerCase());
  }) : [];

  const generateMap = async () => {
    setGeneratingMap(true);
    try {
      const res = await base44.functions.invoke('dm_engine', { mode: 'generate_map', campaign });
      if (res.data?.url) {
        await base44.entities.Campaign.update(campaign.id, { map_image: res.data.url });
        setMapImage(res.data.url);
      }
    } catch (e) { /* ignore */ } finally { setGeneratingMap(false); }
  };

  const generateLocImage = async (loc) => {
    setGeneratingLoc(loc.id);
    try {
      const res = await base44.functions.invoke('dm_engine', { mode: 'generate_location_image', location: loc, campaign });
      if (res.data?.url) {
        await base44.entities.Location.update(loc.id, { image: res.data.url });
        setLocImages(prev => ({ ...prev, [loc.id]: res.data.url }));
      }
    } catch (e) { /* ignore */ } finally { setGeneratingLoc(null); }
  };

  const generateNpcPortrait = async (npc) => {
    setGeneratingLoc('npc-' + npc.id);
    try {
      const res = await base44.functions.invoke('dm_engine', { mode: 'generate_npc_portrait', npc });
      if (res.data?.url) {
        await base44.entities.NPC.update(npc.id, { portrait: res.data.url });
        setNpcPortraits(prev => ({ ...prev, [npc.id]: res.data.url }));
      }
    } catch (e) { /* ignore */ } finally { setGeneratingLoc(null); }
  };

  return (
    <div className="relative w-full h-full bg-stone-950 overflow-hidden min-h-[60vh]">
      {/* Background: illustrated map image, or atmospheric grid fallback */}
      {mapImage ? (
        <>
          <div className="absolute inset-0">
            <Image src={mapImage} alt="World map" fittingType="fill" className="w-full h-full" />
          </div>
          <div className="absolute inset-0 pointer-events-none bg-stone-950/30" />
        </>
      ) : (
        <>
          <div className="absolute inset-0" style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(120, 53, 15, 0.08) 0%, transparent 70%),
              linear-gradient(rgba(120, 53, 15, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(120, 53, 15, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px',
          }} />
        </>
      )}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)'
      }} />

      {/* Generate / regenerate map button */}
      <button
        onClick={generateMap}
        disabled={generatingMap}
        className="absolute top-3 right-3 z-20 touch-target flex items-center gap-1.5 px-3 py-2 text-xs bg-stone-900/85 backdrop-blur rounded-lg border border-amber-900/40 text-amber-200 hover:bg-stone-800/90 disabled:opacity-60"
      >
        {generatingMap
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Painting map…</>
          : mapImage
            ? <><RefreshCw className="w-3.5 h-3.5" /> Regenerate map</>
            : <><Sparkles className="w-3.5 h-3.5" /> Generate world map</>}
      </button>

      {/* Markers */}
      {positioned.map(l => {
        const isCurrent = l.name.toLowerCase() === currentName;
        const isDiscovered = l.discovered;
        const isSelected = l.id === selectedId;
        return (
          <button
            key={l.id}
            onClick={() => setSelectedId(l.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 group touch-target z-10"
            style={{ left: `${l.normX}%`, top: `${l.normY}%` }}
            aria-label={isDiscovered ? l.name : 'Unknown location'}
          >
            {isCurrent && (
              <span className="absolute w-10 h-10 rounded-full bg-amber-500/20 animate-ping" />
            )}
            <span className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
              isSelected ? 'scale-125 z-10' : 'group-hover:scale-110'
            } ${
              isCurrent
                ? 'bg-amber-600 border-amber-300 shadow-lg shadow-amber-700/50'
                : isDiscovered
                  ? 'bg-amber-800/80 border-amber-500/60'
                  : 'bg-stone-800 border-stone-600/50'
            }`}>
              {isDiscovered
                ? <MapPin className="w-4 h-4 text-amber-100" />
                : <span className="text-stone-400 text-sm font-bold">?</span>}
            </span>
            {isDiscovered && (
              <span className={`text-xs font-serif px-1.5 py-0.5 rounded bg-stone-900/80 whitespace-nowrap ${
                isCurrent ? 'text-amber-200' : 'text-amber-100/80'
              }`}>{l.name}</span>
            )}
          </button>
        );
      })}

      {/* Empty state */}
      {positioned.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Compass className="w-12 h-12 text-stone-700 mx-auto mb-2" />
            <p className="text-stone-500 text-sm">No locations discovered yet</p>
            <p className="text-stone-600 text-xs mt-1">Explore the world to reveal the map</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 text-xs bg-stone-900/80 backdrop-blur rounded-lg px-3 py-2 border border-stone-700/50 z-10">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-600 border border-amber-300" /> Current</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-800/80 border border-amber-500/60" /> Discovered</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-stone-800 border border-stone-600/50" /> Unknown</div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="absolute inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:right-0 md:w-80 bg-card border-t md:border-t-0 md:border-l border-amber-900/30 overflow-y-auto safe-bottom max-h-[55vh] md:max-h-none z-30">
          <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">{TYPE_ICONS[selected.type?.toLowerCase()] || '📍'}</span>
              <h3 className="font-serif text-amber-200 truncate">{selected.name}</h3>
            </div>
            <button onClick={() => setSelectedId(null)} aria-label="Close" className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            {/* Location illustration */}
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-stone-900">
              {locImages[selected.id] || selected.image ? (
                <Image src={locImages[selected.id] || selected.image} alt={selected.name} fittingType="fill" className="w-full h-full" />
              ) : (
                <button
                  onClick={() => generateLocImage(selected)}
                  disabled={generatingLoc === selected.id}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-amber-200 transition-colors"
                >
                  {generatingLoc === selected.id
                    ? <><Loader2 className="w-5 h-5 animate-spin" /><span className="text-xs">Painting…</span></>
                    : <><Sparkles className="w-5 h-5" /><span className="text-xs">Generate illustration</span></>}
                </button>
              )}
            </div>

            {selected.type && <span className="text-xs text-amber-500 capitalize">{selected.type}</span>}
            {selected.description
              ? <p className="text-sm text-foreground/90 leading-relaxed">{selected.description}</p>
              : <p className="text-sm text-muted-foreground italic">No description recorded</p>}
            {selected.notes && (
              <div className="text-xs text-muted-foreground bg-background/50 rounded p-2 border border-border">{selected.notes}</div>
            )}
            {relatedNpcs.length > 0 && (
              <div>
                <h4 className="text-xs uppercase text-amber-600 font-semibold mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> NPCs Here</h4>
                <ul className="space-y-2">
                  {relatedNpcs.map(n => {
                    const portrait = npcPortraits[n.id] || n.portrait;
                    const loadingNpc = generatingLoc === 'npc-' + n.id;
                    return (
                      <li key={n.id} className="flex items-start gap-2">
                        <button
                          onClick={() => !portrait && generateNpcPortrait(n)}
                          disabled={loadingNpc}
                          className="relative w-11 h-11 rounded-md overflow-hidden border border-amber-900/40 bg-stone-800 flex-shrink-0 flex items-center justify-center hover:border-amber-600/60 transition-colors"
                          aria-label={portrait ? n.name : `Generate portrait for ${n.name}`}
                        >
                          {portrait
                            ? <Image src={portrait} alt={n.name} fittingType="fill" className="w-full h-full" />
                            : loadingNpc
                              ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                              : <Sparkles className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        <div className="min-w-0">
                          <span className="text-sm text-amber-200">{n.name}</span>
                          {n.description && <p className="text-xs text-muted-foreground line-clamp-2">{n.description.slice(0, 80)}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {relatedQuests.length > 0 && (
              <div>
                <h4 className="text-xs uppercase text-amber-600 font-semibold mb-2 flex items-center gap-1"><ScrollText className="w-3 h-3" /> Active Quests</h4>
                <ul className="space-y-1.5">
                  {relatedQuests.map(q => (
                    <li key={q.id} className="text-sm">
                      <span className="text-amber-200">{q.name}</span>
                      {q.description && <p className="text-xs text-muted-foreground">{q.description.slice(0, 80)}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {relatedNpcs.length === 0 && relatedQuests.length === 0 && (
              <p className="text-xs text-muted-foreground">No known NPCs or quests at this location</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}