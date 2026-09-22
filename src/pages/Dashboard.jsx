import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Scroll, Users, BookOpen, Swords, Sparkles, ChevronRight } from 'lucide-react';
import CampaignCard from '@/components/CampaignCard';
import CharacterCard from '@/components/CharacterCard';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('campaigns');

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
    await base44.entities.Campaign.update(campaign.id, { status: 'archived' });
    loadData();
  };

  const handleDeleteCampaign = async (campaign) => {
    if (!confirm(`Delete "${campaign.name}"? This cannot be undone.`)) return;
    await base44.entities.Campaign.delete(campaign.id);
    loadData();
  };

  const handleDuplicate = async (character) => {
    const { id, created_date, updated_date, created_by_id, ...rest } = character;
    await base44.entities.Character.create({ ...rest, name: `${character.name} (Copy)` });
    loadData();
  };

  const handleDeleteCharacter = async (character) => {
    if (!confirm(`Delete ${character.name}? This cannot be undone.`)) return;
    await base44.entities.Character.delete(character.id);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isEmpty = campaigns.length === 0 && characters.length === 0;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-200 mb-2 flex items-center justify-center gap-3">
            <Swords className="w-7 h-7 md:w-8 md:h-8 text-amber-500" />
            The Adventure Awaits
          </h1>
          <p className="text-stone-400">Your campaigns, characters, and stories — all in one place.</p>
        </div>

        {isEmpty && (
          <div className="text-center py-16 mb-8 bg-gradient-to-br from-stone-900/60 to-stone-950/60 border border-amber-900/30 rounded-2xl">
            <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-serif text-amber-200 mb-2">Your adventure begins here</h2>
            <p className="text-stone-400 mb-6 max-w-md mx-auto">Create your first campaign and let the AI Dungeon Master guide you into a world of fantasy and adventure.</p>
            <Link to="/new-campaign" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg font-semibold transition-all">
              <Plus className="w-5 h-5" /> Start New Campaign
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-stone-800 overflow-x-auto" role="tablist">
          <TabButton active={tab === 'campaigns'} onClick={() => setTab('campaigns')} icon={<Scroll className="w-4 h-4" />} label="Campaigns" count={campaigns.length} />
          <TabButton active={tab === 'characters'} onClick={() => setTab('characters')} icon={<Users className="w-4 h-4" />} label="Characters" count={characters.length} />
          <TabButton active={tab === 'stories'} onClick={() => setTab('stories')} icon={<BookOpen className="w-4 h-4" />} label="Saved Stories" count={stories.length} />
        </div>

        {tab === 'campaigns' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-serif text-amber-200">Your Campaigns</h2>
              <Link to="/new-campaign" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg text-sm font-semibold transition-all">
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
              <Link to="/character/new" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg text-sm font-semibold transition-all">
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
                  <div key={s.id} className="bg-gradient-to-br from-stone-900/80 to-stone-950/80 border border-amber-900/30 rounded-xl p-5">
                    <h3 className="text-lg font-serif text-amber-200 mb-2">{s.name}</h3>
                    {s.premise && <p className="text-sm text-stone-400 mb-3">{s.premise}</p>}
                    {s.current_situation && <p className="text-sm text-stone-500 italic mb-3">"{s.current_situation}"</p>}
                    <Link to={`/new-campaign?story=${s.id}`} className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm font-semibold">
                      Continue this story <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`flex items-center gap-2 px-3 md:px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
        active ? 'border-amber-500 text-amber-200' : 'border-transparent text-stone-500 hover:text-stone-300'
      }`}
    >
      {icon} {label}
      <span className="text-xs bg-stone-800 px-1.5 py-0.5 rounded-full">{count}</span>
    </button>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-12 text-stone-500 border border-dashed border-stone-800 rounded-xl">
      {text}
    </div>
  );
}