import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Package, Coins, Swords } from 'lucide-react';
import ScreenHeader from '@/components/ScreenHeader';
import PartyMemberInventory from '@/components/PartyMemberInventory';

export default function PartyInventory() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const camp = await base44.entities.Campaign.get(id);
      setCampaign(camp);

      let memberList = [];
      try {
        const res = await base44.functions.invoke('campaign_members', { action: 'list_members', campaign_id: id });
        memberList = (res.data.members || []).filter(m => m.status === 'active');
      } catch (e) { /* solo campaign */ }

      const charIds = [...new Set([
        camp.character_id,
        ...memberList.map(m => m.character_id).filter(Boolean)
      ])].filter(Boolean);

      const chars = charIds.length
        ? await Promise.all(charIds.map(cid => base44.entities.Character.get(cid).catch(() => null)))
        : [];
      setPlayers(chars.filter(Boolean));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Campaign not found.
      </div>
    );
  }

  // Aggregate totals across the whole party.
  const totalGold = players.reduce((sum, p) => sum + (p.gold || 0), 0);
  const totalItems = players.reduce((sum, p) => sum + (p.inventory || []).length, 0);
  const totalEquipped = players.reduce((sum, p) => sum + (p.weapons || []).length + (p.armor ? 1 : 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ScreenHeader title="Party Inventory" backTo={`/campaign/${id}`} icon={Package} />

      <div className="flex-1 overflow-y-auto pb-tabbar">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Campaign treasury summary */}
          <div className="bg-card/60 border border-border rounded-xl p-4">
            <h2 className="font-serif text-amber-200 mb-3">{campaign.name}</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-background/50 border border-border rounded-lg p-3">
                <Coins className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-amber-200">{totalGold}</div>
                <div className="text-xs text-muted-foreground">Gold</div>
              </div>
              <div className="bg-background/50 border border-border rounded-lg p-3">
                <Swords className="w-5 h-5 text-sky-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-amber-200">{totalEquipped}</div>
                <div className="text-xs text-muted-foreground">Equipped</div>
              </div>
              <div className="bg-background/50 border border-border rounded-lg p-3">
                <Package className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-amber-200">{totalItems}</div>
                <div className="text-xs text-muted-foreground">In Bags</div>
              </div>
            </div>
          </div>

          {/* Per-member inventories */}
          {players.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              No party members found yet.
            </div>
          ) : (
            <div className="space-y-4">
              {players.map(p => (
                <PartyMemberInventory key={p.id} character={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}