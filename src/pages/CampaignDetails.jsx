import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Save, Play, Archive, Trash2, Bookmark, UserPlus } from 'lucide-react';
import BottomSheetPicker from '@/components/BottomSheetPicker';
import ScreenHeader from '@/components/ScreenHeader';
import ConfirmDialog from '@/components/ConfirmDialog';
import MatureToggle from '@/components/MatureToggle';

export default function CampaignDetails() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [character, setCharacter] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    await base44.entities.Campaign.delete(id);
    window.location.href = '/';
  };

  if (!campaign) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScreenHeader
        title="Campaign Details"
        actions={editing ? (
          <button onClick={save} className="touch-target flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg text-sm font-semibold"><Save className="w-4 h-4" /> Save</button>
        ) : (
          <button onClick={() => setEditing(true)} className="touch-target px-4 py-2 bg-muted hover:bg-accent rounded-lg text-sm">Edit</button>
        )}
      />
      <div className="max-w-3xl mx-auto px-4 py-8">

        <div className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-6 mb-4">
          {editing ? (
            <>
              <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="text-xl font-serif bg-background border border-amber-900/40 rounded px-2 py-1 text-amber-200 w-full mb-2" />
              <textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" rows={3} className="w-full bg-background border border-border rounded px-2 py-1 text-foreground text-sm resize-none mb-2" />
              <textarea value={form.setting || ''} onChange={e => setForm({...form, setting: e.target.value})} placeholder="Setting" rows={2} className="w-full bg-background border border-border rounded px-2 py-1 text-foreground text-sm resize-none mb-2" />
              <div className="grid grid-cols-2 gap-2">
                <BottomSheetPicker label="Difficulty" value={form.difficulty} options={['Casual', 'Normal', 'Challenging', 'Hardcore']} onChange={v => setForm({ ...form, difficulty: v })} />
                <BottomSheetPicker label="DM Style" value={form.dm_style} options={['Story-focused', 'Rules-focused', 'Balanced', 'Cinematic', 'Tactical']} onChange={v => setForm({ ...form, dm_style: v })} />
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <div>
                  <p className="text-sm text-foreground">Content Rating</p>
                  <p className="text-xs text-muted-foreground">Allow 18+ mature themes (violence, dark content, romance).</p>
                </div>
                <MatureToggle enabled={!!form.mature_content} onChange={v => setForm({ ...form, mature_content: v })} />
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-serif text-amber-200">{campaign.name}</h2>
              <p className="text-muted-foreground mt-1">{campaign.description || 'No description'}</p>
              {campaign.setting && <p className="text-sm text-muted-foreground mt-2">Setting: {campaign.setting}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs">
                <span className="text-muted-foreground">Difficulty: <span className="text-amber-300">{campaign.difficulty}</span></span>
                <span className="text-muted-foreground">DM Style: <span className="text-amber-300">{campaign.dm_style}</span></span>
                <span className="text-muted-foreground">Status: <span className="text-amber-300 capitalize">{campaign.status}</span></span>
                <span className="text-muted-foreground">Content: <span className={campaign.mature_content ? 'text-red-400' : 'text-amber-300'}>{campaign.mature_content ? '18+ Mature' : 'General'}</span></span>
              </div>
              {character && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">Character: <Link to={`/character/${character.id}`} className="text-amber-300 hover:underline">{character.name}</Link> — {character.species} {character.class} Lvl {character.level}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={`/campaign/${id}`} className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg text-sm font-semibold"><Play className="w-4 h-4" /> Continue Campaign</Link>
          <Link to={`/campaign/${id}/invite`} className="flex items-center gap-2 px-4 py-2 bg-amber-800/60 hover:bg-amber-700/60 border border-amber-700/40 text-amber-100 rounded-lg text-sm font-semibold"><UserPlus className="w-4 h-4" /> Invite Players</Link>
          <button onClick={archive} className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-accent text-foreground rounded-lg text-sm"><Archive className="w-4 h-4" /> Archive</button>
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 px-4 py-2 bg-red-950/40 hover:bg-red-900/40 border border-red-900/40 text-red-400 rounded-lg text-sm"><Trash2 className="w-4 h-4" /> Delete</button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        title="Delete Campaign?"
        description="Delete this campaign and all its data? This cannot be undone."
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}