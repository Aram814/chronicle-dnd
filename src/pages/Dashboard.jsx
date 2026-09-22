import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Scroll, Users, BookOpen, Swords, Sparkles, ChevronRight } from 'lucide-react';
import CampaignCard from '@/components/CampaignCard';
import CharacterCard from '@/components/CharacterCard';
import PullToRefresh from '@/components/PullToRefresh';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('campaigns');
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [camps, chars, sts] = await Promise.all([
        base44.entities.Campaign.filter({}),
        base44.entities.Character.filter({}),
        base44.entities.SavedStory.filter({})
      ]);
      const notArchived = (camps || []).filter(c => c.status !== 'archived');
      setCampaigns(notArchived);
      setCharacters(chars || []);
      setStories(sts || []);
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

  const handleDeleteCampaign = (campaign) => setPendingDelete({ kind: 'campaign', item: campaign });

  const handleDuplicate = async (character) => {
    const { id, created_date, updated_date, created_by_id, ...rest } = character;
    const tempId = `temp-${Date.now()}`;
    const tempChar = { ...character, id: tempId, name: `${character.name} (Copy)` };
    const prev = characters;
    setCharacters([...characters, tempChar]);
    try {
      const created = await base44.entities.Character.create({ ...rest, name: `${character.name} (Copy)` });
      setCharacters(chars => chars.map(c => c.id === tempId ? created : c));
    } catch (e) {
      setCharacters(prev);
    }
  };

  const handleDeleteCharacter = (character) => setPendingDelete({ kind: 'character', item: character });

  const confirmDelete = async () => {
    const target = pendingDelete;
    setPendingDelete(null);
    if (!target) return;
    if (target.kind === 'campaign') {
      const prev = campaigns;
      setCampaigns(campaigns.filter(c => c.id !== target.item.id));
      try {
        await base44.entities.Campaign.delete(target.item.id);
      } catch (e) {
        setCampaigns(prev);
      }
    } else {
      const prev = characters;
      setCharacters(characters.filter(c => c.id !== target.item.id));
      try {
        await base44.entities.Character.delete(target.item.id);
      } catch (e) {
        setCharacters(prev);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isEmpty = campaigns.length === 0 && characters.length === 0;

  return (
    <PullToRefresh onRefresh={loadData} className="h-full bg-background text-foreground overscroll-none">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-200 mb-2 flex items-center justify-center gap-3">
            <Swords className="w-7 h-7 md:w-8 md:h-8 text-amber-500" />
            The Adventure Awaits
          </h1>
          <p className="text-muted-foreground">Your campaigns, characters, and stories — all in one place.</p>
        </div>

        {isEmpty && (
          <div className="text-center py-16 mb-8 bg-gradient-to-br from-card/60 to-background/60 border border-amber-900/30 rounded-2xl">
            <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-serif text-amber-200 mb-2">Your adventure begins here</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Create your first campaign and let the AI Dungeon Master guide you into a world of fantasy and adventure.</p>
            <Link to="/new-campaign" className="touch-target inline-flex items-center gap-2 px-6 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg font-semibold transition-all">
              <Plus className="w-5 h-5" /> Start New Campaign
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto" role="tablist">
          <TabButton active={tab === 'campaigns'} onClick={() => setTab('campaigns')} icon={<Scroll className="w-4 h-4" />} label="Campaigns" count={campaigns.length} />
          <TabButton active={tab === 'characters'} onClick={() => setTab('characters')} icon={<Users className="w-4 h-4" />} label="Characters" count={characters.length} />
          <TabButton active={tab === 'stories'} onClick={() => setTab('stories')} icon={<BookOpen className="w-4 h-4" />} label="Saved Stories" count={stories.length} />
        </div>

        {tab === 'campaigns' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-serif text-amber-200">Your Campaigns</h2>
              <Link to="/new-campaign" className="touch-target inline-flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg text-sm font-semibold transition-all">
                <Plus className="w-4 h-4" /> New Campaign
              </Link>
            </div>
            {campaigns.length === 0 ? (
              <EmptyState text="No campaigns yet. Begin your first adventure!" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.map(c => (
                  <CampaignCard key={c.id} campaign={c} character={getCharacter(c.character_id)} onArchive={handleArchive} onDelete={handleDeleteCampaign} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'characters' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-serif text-amber-200">Your Characters</h2>
              <Link to="/character/new/edit" className="touch-target inline-flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg text-sm font-semibold transition-all">
                <Plus className="w-4 h-4" /> New Character
              </Link>
            </div>
            {characters.length === 0 ? (
              <EmptyState text="No characters yet. Create a hero for your adventures!" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {characters.map(c => (
                  <CharacterCard key={c.id} character={c} onDuplicate={handleDuplicate} onDelete={handleDeleteCharacter} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'stories' && (
          <div>
            <h2 className="text-xl font-serif text-amber-200 mb-4">Saved Stories</h2>
            {stories.length === 0 ? (
              <EmptyState text="No saved stories yet. Save a campaign's story to continue it later." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stories.map(s => (
                  <div key={s.id} className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-5">
                    <h3 className="text-lg font-serif text-amber-200 mb-2">{s.name}</h3>
                    {s.premise && <p className="text-sm text-muted-foreground mb-3">{s.premise}</p>}
                    {s.current_situation && <p className="text-sm text-muted-foreground italic mb-3">"{s.current_situation}"</p>}
                    <Link to={`/new-campaign?story=${s.id}`} className="touch-target inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm font-semibold">
                      Continue this story <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete?"
        description={pendingDelete ? `Delete "${pendingDelete.item.name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        destructive
      />
    </PullToRefresh>
  );
}

function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`touch-target flex items-center gap-2 px-3 md:px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
        active ? 'border-amber-500 text-amber-200' : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon} {label}
      <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{count}</span>
    </button>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
      {text}
    </div>
  );
}