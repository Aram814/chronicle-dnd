import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Skull, Search, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ScreenHeader from '@/components/ScreenHeader';
import RosterCard from '@/components/RosterCard';
import { toast } from '@/components/ui/use-toast';

export default function CampaignRoster() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [npcs, setNpcs] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [tab, setTab] = useState('npcs');
  const [query, setQuery] = useState('');
  const [portraits, setPortraits] = useState({});
  const [generating, setGenerating] = useState(null);
  const [moving, setMoving] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        const [camp, npcList, monsterList] = await Promise.all([
          base44.entities.Campaign.get(id),
          base44.entities.NPC.filter({ campaign_id: id }),
          base44.entities.Monster.filter({ campaign_id: id })
        ]);
        if (!alive) return;
        setCampaign(camp);
        setNpcs(npcList || []);
        setMonsters(monsterList || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const reload = useCallback(async () => {
    const [npcList, monsterList] = await Promise.all([
      base44.entities.NPC.filter({ campaign_id: id }),
      base44.entities.Monster.filter({ campaign_id: id })
    ]);
    setNpcs(npcList || []);
    setMonsters(monsterList || []);
  }, [id]);

  const generatePortrait = async (entity) => {
    const isNpc = tab === 'npcs';
    setGenerating(entity.id);
    try {
      const res = await base44.functions.invoke('dm_engine', { mode: 'generate_npc_portrait', npc: entity });
      const url = res.data?.url;
      if (url) {
        await base44.entities[isNpc ? 'NPC' : 'Monster'].update(entity.id, { portrait: url });
        setPortraits(prev => ({ ...prev, [entity.id]: url }));
      }
    } catch (e) {
      toast({ title: 'Portrait generation failed', variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  const recategorize = async (entity) => {
    const isNpc = tab === 'npcs';
    setMoving(entity.id);
    try {
      if (isNpc) {
        await base44.entities.Monster.create({
          campaign_id: id, name: entity.name, description: entity.description,
          monster_type: entity.faction || 'Creature', location: entity.location,
          is_hostile: entity.is_hostile ?? true,
          status: entity.status === 'dead' ? 'dead' : 'alive',
          portrait: entity.portrait, interactions: entity.interactions
        });
        await base44.entities.NPC.delete(entity.id);
      } else {
        await base44.entities.NPC.create({
          campaign_id: id, name: entity.name, description: entity.description,
          location: entity.location, faction: entity.monster_type,
          is_hostile: entity.is_hostile ?? false,
          status: entity.status === 'dead' ? 'dead' : 'alive',
          portrait: entity.portrait, interactions: entity.interactions
        });
        await base44.entities.Monster.delete(entity.id);
      }
      await reload();
      toast({ title: `Moved to ${isNpc ? 'Bestiary' : 'NPCs'}`, description: `${entity.name} recategorized.` });
    } catch (e) {
      toast({ title: 'Failed to move', variant: 'destructive' });
    } finally {
      setMoving(null);
    }
  };

  const list = tab === 'npcs' ? npcs : monsters;
  const filtered = query.trim()
    ? list.filter(e => (e.name || '').toLowerCase().includes(query.toLowerCase()))
    : list;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ScreenHeader title="Campaign Roster" backTo={`/campaign/${id}`} containerClassName="max-w-4xl" />

      {/* Tab toggle */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10 safe-top">
        <div className="max-w-4xl mx-auto flex px-4">
          <TabButton active={tab === 'npcs'} onClick={() => setTab('npcs')} icon={Users} label="NPCs" count={npcs.length} />
          <TabButton active={tab === 'bestiary'} onClick={() => setTab('bestiary')} icon={Skull} label="Bestiary" count={monsters.length} />
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 pb-tabbar">
        {/* Search */}
        {list.length > 4 && (
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${tab === 'npcs' ? 'NPCs' : 'creatures'}…`}
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700/50"
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Skull className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {list.length === 0 ? `No ${tab === 'npcs' ? 'NPCs' : 'creatures'} discovered yet.` : 'No matches.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(entity => (
              <RosterCard
                key={entity.id}
                entity={entity}
                kind={tab === 'npcs' ? 'npc' : 'monster'}
                portrait={portraits[entity.id] || entity.portrait}
                generating={generating === entity.id}
                moving={moving === entity.id}
                onGeneratePortrait={generatePortrait}
                onRecategorize={recategorize}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`touch-target flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active ? 'border-amber-500 text-amber-200' : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="w-4 h-4" />{label}
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-amber-900/40 text-amber-300' : 'bg-muted text-muted-foreground'}`}>{count}</span>
    </button>
  );
}