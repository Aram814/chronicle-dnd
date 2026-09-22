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
  const [quests, setQuests] = useState([]);

  useEffect(() => {
    if (id) load();
  }, [id]);

  const load = async () => {
    const [c, locs, npcsList, questsList] = await Promise.all([
      base44.entities.Campaign.get(id),
      base44.entities.Location.filter({ campaign_id: id }),
      base44.entities.NPC.filter({ campaign_id: id }),
      base44.entities.Quest.filter({ campaign_id: id }),
    ]);
    setCampaign(c);
    setLocations(locs || []);
    setNpcs(npcsList || []);
    setQuests(questsList || []);
  };

  if (!campaign) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ScreenHeader title="World Map" backTo={`/campaign/${id}/details`} />
      <div className="flex-1">
        <CampaignMap campaign={campaign} locations={locations} npcs={npcs} quests={quests} />
      </div>
    </div>
  );
}