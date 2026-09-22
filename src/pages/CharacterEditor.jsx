import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Save, Sparkles, Dices } from 'lucide-react';
import BottomSheetPicker from '@/components/BottomSheetPicker';
import ScreenHeader from '@/components/ScreenHeader';
import InfoDialog from '@/components/InfoDialog';

const SPECIES = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling', 'Orc', 'Goblin', 'Firbolg', 'Tabaxi', 'Aasimar', 'Genasi', 'Custom'];
const CLASSES = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard', 'Artificer', 'Custom'];
const ALIGNMENTS = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];
const BACKGROUNDS = ['Acolyte', 'Criminal', 'Folk Hero', 'Noble', 'Sage', 'Soldier', 'Charlatan', 'Entertainer', 'Guild Artisan', 'Hermit', 'Outlander', 'Sailor', 'Urchin', 'Custom'];

export default function CharacterEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new' || !id;
  const [form, setForm] = useState({
    name: '', species: 'Human', class: 'Fighter', subclass: '', background: 'Folk Hero', alignment: 'Neutral Good',
    level: 1, xp: 0, ability_scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    hp: 12, max_hp: 12, ac: 14, speed: 30, gold: 10, proficiency_bonus: 2,
    proficiencies: [], saving_throws: [], weapons: [{ name: 'Longsword', damage: '1d8 slashing' }], inventory: [{ name: 'Backpack' }], spells: [],
    personality: '', ideals: '', bonds: '', flaws: '', backstory: '', appearance: '', goals: '', description: ''
  });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!isNew) load();
  }, [id]);

  const load = async () => {
    const c = await base44.entities.Character.get(id);
    setForm(c);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (isNew) {
        const created = await base44.entities.Character.create(form);
        navigate(`/character/${created.id}`);
      } else {
        await base44.entities.Character.update(id, form);
        navigate(`/character/${id}`);
      }
    } catch (e) {
      setInfo({ title: 'Failed to Save', description: e.message || 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('dm_engine', {
        mode: 'generate_character',
        preferences: { species: form.species, class: form.class, background: form.background }
      });
      if (res.data.character) {
        setForm({ ...form, ...res.data.character, level: 1, xp: 0 });
      }
    } catch (e) {
      setInfo({ title: 'Failed to Generate', description: 'Please try again.' });
    } finally {
      setGenerating(false);
    }
  };

  const rollStats = () => {
    const scores = {};
    for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
      const rolls = [1,2,3,4].map(() => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => b - a);
      scores[key] = rolls[0] + rolls[1] + rolls[2];
    }
    setForm({ ...form, ability_scores: scores });
  };

  const setScore = (key, val) => {
    setForm({ ...form, ability_scores: { ...form.ability_scores, [key]: parseInt(val) || 10 } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScreenHeader
        title={isNew ? 'New Character' : 'Edit Character'}
        actions={
          <>
            <button onClick={generate} disabled={generating} aria-label="Generate character with AI" className="flex items-center gap-2 px-3 py-2 bg-purple-900/40 hover:bg-purple-800/50 border border-purple-700/40 text-purple-200 rounded-lg text-sm flex-shrink-0">
              <Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">{generating ? 'Generating...' : 'AI Generate'}</span>
            </button>
            <button onClick={save} disabled={saving} aria-label="Save character" className="flex items-center gap-2 px-3 md:px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg text-sm font-semibold flex-shrink-0">
              <Save className="w-4 h-4" /> <span className="hidden sm:inline">Save</span>
            </button>
          </>
        }
      />
      <div className="max-w-2xl mx-auto px-4 py-8">

        <div className="space-y-4">
          <Card title="Identity">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Name" value={form.name} onChange={v => setForm({...form, name: v})} />
              <Input label="Species" value={form.species} onChange={v => setForm({...form, species: v})} type="select" options={SPECIES} />
              <Input label="Class" value={form.class} onChange={v => setForm({...form, class: v})} type="select" options={CLASSES} />
              <Input label="Subclass" value={form.subclass} onChange={v => setForm({...form, subclass: v})} />
              <Input label="Background" value={form.background} onChange={v => setForm({...form, background: v})} type="select" options={BACKGROUNDS} />
              <Input label="Alignment" value={form.alignment} onChange={v => setForm({...form, alignment: v})} type="select" options={ALIGNMENTS} />
            </div>
          </Card>

          <Card title="Ability Scores" action={<button onClick={rollStats} className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"><Dices className="w-3 h-3" /> Roll 4d6</button>}>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(key => (
                <div key={key} className="text-center">
                  <label className="text-xs text-stone-500 uppercase">{key}</label>
                  <input type="number" value={form.ability_scores?.[key] || 10} onChange={e => setScore(key, e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-center text-amber-200 mt-1" />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Combat Stats">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              <Input label="Level" type="number" value={form.level} onChange={v => setForm({...form, level: parseInt(v)||1})} />
              <Input label="HP" type="number" value={form.hp} onChange={v => setForm({...form, hp: parseInt(v)||0})} />
              <Input label="Max HP" type="number" value={form.max_hp} onChange={v => setForm({...form, max_hp: parseInt(v)||0})} />
              <Input label="AC" type="number" value={form.ac} onChange={v => setForm({...form, ac: parseInt(v)||0})} />
              <Input label="Speed" type="number" value={form.speed} onChange={v => setForm({...form, speed: parseInt(v)||0})} />
              <Input label="Gold" type="number" value={form.gold} onChange={v => setForm({...form, gold: parseInt(v)||0})} />
              <Input label="XP" type="number" value={form.xp} onChange={v => setForm({...form, xp: parseInt(v)||0})} />
              <Input label="Prof Bonus" type="number" value={form.proficiency_bonus} onChange={v => setForm({...form, proficiency_bonus: parseInt(v)||2})} />
            </div>
          </Card>

          <Card title="Personality & Backstory">
            <div className="space-y-3">
              <TextArea label="Personality" value={form.personality} onChange={v => setForm({...form, personality: v})} />
              <TextArea label="Ideals" value={form.ideals} onChange={v => setForm({...form, ideals: v})} />
              <TextArea label="Bonds" value={form.bonds} onChange={v => setForm({...form, bonds: v})} />
              <TextArea label="Flaws" value={form.flaws} onChange={v => setForm({...form, flaws: v})} />
              <TextArea label="Backstory" value={form.backstory} onChange={v => setForm({...form, backstory: v})} />
              <TextArea label="Appearance" value={form.appearance} onChange={v => setForm({...form, appearance: v})} />
              <TextArea label="Goals" value={form.goals} onChange={v => setForm({...form, goals: v})} />
              <TextArea label="Description" value={form.description} onChange={v => setForm({...form, description: v})} />
            </div>
          </Card>
        </div>
      </div>
      <InfoDialog
        open={!!info}
        onClose={() => setInfo(null)}
        title={info?.title || ''}
        description={info?.description}
      />
    </div>
  );
}

function Card({ title, children, action }) {
  return (
    <div className="bg-gradient-to-br from-stone-900/80 to-stone-950/80 border border-amber-900/30 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-amber-200">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', options }) {
  return (
    <div>
      <label className="text-xs text-stone-500 uppercase">{label}</label>
      {type === 'select' ? (
        <BottomSheetPicker label={label} value={value} options={options} onChange={onChange} />
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-stone-200 mt-1" />
      )}
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-stone-500 uppercase">{label}</label>
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={2} className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-stone-200 mt-1 text-sm resize-none" />
    </div>
  );
}