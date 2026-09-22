import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Scroll, Swords, Sparkles, KeyRound } from 'lucide-react';
import CampaignCard from '@/components/CampaignCard';
import PullToRefresh from '@/components/PullToRefresh';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [camps, chars] = await Promise.all([
        base44.entities.Campaign.filter({}),
        base44.entities.Character.filter({})
      ]);
      const all = camps || [];
      // Purge orphaned placeholder campaigns left behind when a page reload
      // tears down the setup screen before its unmount cleanup can run.
      const orphans = all.filter(c => c.name === 'Untitled Campaign' && c.status === 'setup');
      if (orphans.length) {
        await Promise.all(orphans.map(c =>
          Promise.all([
            base44.entities.Campaign.delete(c.id).catch(() => {}),
            base44.entities.Message.deleteMany({ campaign_id: c.id }).catch(() => {})
          ])
        ));
      }
      const notArchived = all.filter(c => c.status !== 'archived' && c.name !== 'Untitled Campaign');
      setCampaigns(notArchived);
      setCharacters(chars || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getCharacter = (id) => characters.find(c => c.id === id);

  const handleArchive = async (campaign) => {
    const prev = campaigns;
    setCampaigns(campaigns.filter(c => c.id !== campaign.id));
    try {
      await base44.entities.Campaign.update(campaign.id, { status: 'archived' });
    } catch (e) {
      setCampaigns(prev);
    }
  };

  const handleDeleteCampaign = (campaign) => setPendingDelete(campaign);

  const confirmDelete = async () => {
    const target = pendingDelete;
    setPendingDelete(null);
    if (!target) return;
    const prev = campaigns;
    setCampaigns(campaigns.filter(c => c.id !== target.id));
    try {
      await base44.entities.Campaign.delete(target.id);
    } catch (e) {
      setCampaigns(prev);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isEmpty = campaigns.length === 0;

  return (
    <PullToRefresh onRefresh={loadData} className="h-full bg-background text-foreground overscroll-none">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-200 mb-2 flex items-center justify-center gap-3">
            <Swords className="w-7 h-7 md:w-8 md:h-8 text-amber-500" />
            The Adventure Awaits
          </h1>
          <p className="text-muted-foreground">Your campaigns — all in one place.</p>
        </div>

        {isEmpty ? (
          <div className="text-center py-16 mb-8 bg-gradient-to-br from-card/60 to-background/60 border border-amber-900/30 rounded-2xl">
            <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-serif text-amber-200 mb-2">Your adventure begins here</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Create your first campaign and let the AI Dungeon Master guide you into a world of fantasy and adventure.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/new-campaign" className="touch-target inline-flex items-center gap-2 px-6 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg font-semibold transition-all">
                <Plus className="w-5 h-5" /> Start New Campaign
              </Link>
              <Link to="/join" className="touch-target inline-flex items-center gap-2 px-6 py-3 bg-amber-800/40 hover:bg-amber-700/40 border border-amber-700/40 text-amber-100 rounded-lg font-semibold transition-all">
                <KeyRound className="w-5 h-5" /> Join with Code
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-serif text-amber-200 flex items-center gap-2">
                <Scroll className="w-5 h-5 text-amber-500" /> Your Campaigns
              </h2>
              <div className="flex gap-2">
                <Link to="/new-campaign" className="touch-target inline-flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg text-sm font-semibold transition-all">
                  <Plus className="w-4 h-4" /> New Campaign
                </Link>
                <Link to="/join" className="touch-target inline-flex items-center gap-2 px-4 py-2 bg-amber-800/40 hover:bg-amber-700/40 border border-amber-700/40 text-amber-100 rounded-lg text-sm font-semibold transition-all">
                  <KeyRound className="w-4 h-4" /> Join
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map(c => (
                <CampaignCard key={c.id} campaign={c} character={getCharacter(c.character_id)} onArchive={handleArchive} onDelete={handleDeleteCampaign} />
              ))}
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Campaign?"
        description={pendingDelete ? `Delete "${pendingDelete.name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        destructive
      />
    </PullToRefresh>
  );
}