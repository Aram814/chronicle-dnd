import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ScreenHeader from '@/components/ScreenHeader';
import CampaignMap from '@/components/CampaignMap';

export default function CampaignMapPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [locations, setLocations] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [quests, setQuests] = useState([]);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (id) load();
  }, [id]);

  const load = async () => {
    const [c, locs, npcsList, monstersList, questsList] = await Promise.all([
      base44.entities.Campaign.get(id),
      base44.entities.Location.filter({ campaign_id: id }),
      base44.entities.NPC.filter({ campaign_id: id }),
      base44.entities.Monster.filter({ campaign_id: id }),
      base44.entities.Quest.filter({ campaign_id: id }),
    ]);
    setCampaign(c);
    setLocations(locs || []);
    setNpcs(npcsList || []);
    setMonsters(monstersList || []);
    setQuests(questsList || []);

    // Load party characters (host + active members) so the map can show them.
    let memberList = [];
    try {
      const res = await base44.functions.invoke('campaign_members', { action: 'list_members', campaign_id: id });
      memberList = (res.data.members || []).filter(m => m.status === 'active');
    } catch (e) { /* solo campaign */ }
    const charIds = [...new Set([
      c.character_id,
      ...memberList.map(m => m.character_id).filter(Boolean)
    ])].filter(Boolean);
    const chars = charIds.length
      ? await Promise.all(charIds.map(cid => base44.entities.Character.get(cid).catch(() => null)))
      : [];
    setPlayers(chars.filter(Boolean));
  };

  if (!campaign) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ScreenHeader title="World Map" backTo={`/campaign/${id}`} />
      <div className="flex-1">
        <CampaignMap campaign={campaign} locations={locations} npcs={npcs} monsters={monsters} quests={quests} players={players} />
      </div>
    </div>
  );
}