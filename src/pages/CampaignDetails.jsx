import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Save, Play, Archive, Trash2, Bookmark } from 'lucide-react';

export default function CampaignDetails() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [character, setCharacter] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (id) load();
  }, [id]);

  const load = async () => {
    const c = await base44.entities.Campaign.get(id);
    setCampaign(c);
    setForm(c);
    if (c.character_id) {
      try { setCharacter(await base44.entities.Character.get(c.character_id)); } catch (e) {}
    }
  };

  const save = async () => {
    const updated = await base44.entities.Campaign.update(id, form);
    setCampaign(updated);
    setEditing(false);
  };

  const archive = async () => {
    await base44.entities.Campaign.update(id, { status: 'archived' });
    load();
  };

  const remove = async () => {
    if (!confirm('Delete this campaign and all its data?')) return;
    await base44.entities.Campaign.delete(id);
    window.location.href = '/';
  };

  if (!campaign) return <div className="min-h-screen bg-stone-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-stone-400 hover:text-amber-300"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-serif text-amber-200 flex-1">Campaign Details</h1>
          {editing ? (
            <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg text-sm font-semibold"><Save className="w-4 h-4" /> Save</button>
          ) : (
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-sm">Edit</button>
          )}
        </div>

        <div className="bg-gradient-to-br from-stone-900/80 to-stone-950/80 border border-amber-900/30 rounded-xl p-6 mb-4">
          {editing ? (
            <>
              <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="text-xl font-serif bg-stone-950 border border-amber-900/40 rounded px-2 py-1 text-amber-200 w-full mb-2" />
              <textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" rows={3} className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-stone-300 text-sm resize-none mb-2" />
              <textarea value={form.setting || ''} onChange={e => setForm({...form, setting: e.target.value})} placeholder="Setting" rows={2} className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-stone-300 text-sm resize-none mb-2" />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})} className="bg-stone-950 border border-stone-700 rounded px-2 py-1 text-stone-200">
                  <option>Casual</option><option>Normal</option><option>Challenging</option><option>Hardcore</option>
                </select>
                <select value={form.dm_style} onChange={e => setForm({...form, dm_style: e.target.value})} className="bg-stone-950 border border-stone-700 rounded px-2 py-1 text-stone-200">
                  <option>Story-focused</option><option>Rules-focused</option><option>Balanced</option><option>Cinematic</option><option>Tactical</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-serif text-amber-200">{campaign.name}</h2>
              <p className="text-stone-400 mt-1">{campaign.description || 'No description'}</p>
              {campaign.setting && <p className="text-sm text-stone-500 mt-2">Setting: {campaign.setting}</p>}
              <div className="flex gap-3 mt-3 text-xs">
                <span className="text-stone-500">Difficulty: <span className="text-amber-300">{campaign.difficulty}</span></span>
                <span className="text-stone-500">DM Style: <span className="text-amber-300">{campaign.dm_style}</span></span>
                <span className="text-stone-500">Status: <span className="text-amber-300 capitalize">{campaign.status}</span></span>
              </div>
              {character && (
                <div className="mt-4 pt-4 border-t border-stone-800">
                  <p className="text-sm text-stone-400">Character: <Link to={`/character/${character.id}`} className="text-amber-300 hover:underline">{character.name}</Link> — {character.species} {character.class} Lvl {character.level}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={`/campaign/${id}`} className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg text-sm font-semibold"><Play className="w-4 h-4" /> Continue Campaign</Link>
          <button onClick={archive} className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-sm"><Archive className="w-4 h-4" /> Archive</button>
          <button onClick={remove} className="flex items-center gap-2 px-4 py-2 bg-red-950/40 hover:bg-red-900/40 border border-red-900/40 text-red-400 rounded-lg text-sm"><Trash2 className="w-4 h-4" /> Delete</button>
        </div>
      </div>
    </div>
  );
}