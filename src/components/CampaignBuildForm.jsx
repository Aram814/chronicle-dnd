import { useState } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BottomSheetPicker from '@/components/BottomSheetPicker';
import { TONE_OPTIONS, DIFFICULTY_OPTIONS, DM_STYLE_OPTIONS } from '@/lib/campaignData';

const cardCls = 'bg-card/60 border border-border rounded-xl p-4 space-y-3';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-amber-200 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 bg-background border border-amber-900/40 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-700/50 focus:border-amber-700';

export default function CampaignBuildForm({ onChange }) {
  const [name, setName] = useState('');
  const [setting, setSetting] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState([]);
  const [difficulty, setDifficulty] = useState('Normal');
  const [dmStyle, setDmStyle] = useState('Balanced');
  const [worldState, setWorldState] = useState(null);
  const [generating, setGenerating] = useState(false);

  const toggleTone = (t) => {
    setTone(prev => {
      const next = prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t];
      emit({ tone: next });
      return next;
    });
  };

  // Emit the full payload up to the parent. Partial overrides let a single
  // field change without rebuilding the whole object here.
  const emit = (overrides = {}) => {
    const form = {
      name: overrides.name !== undefined ? overrides.name : name,
      setting: overrides.setting !== undefined ? overrides.setting : setting,
      description: overrides.description !== undefined ? overrides.description : description,
      tone: overrides.tone || tone,
      difficulty: overrides.difficulty || difficulty,
      dm_style: overrides.dm_style || dmStyle,
      world_state: overrides.world_state !== undefined ? overrides.world_state : worldState
    };
    onChange(form);
  };

  const generateWorld = async () => {
    if (!setting.trim() || generating) return;
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('dm_engine', {
        mode: 'generate_world',
        preferences: { setting, tone, difficulty, premise: description }
      });
      const world = res?.data?.world;
      if (world) {
        setWorldState(world);
        emit({ world_state: world });
      }
    } catch (e) {
      /* ignore — user can still proceed with manual fields */
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <Field label="Campaign Name">
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); emit({ name: e.target.value }); }}
            placeholder="e.g. The Curse of Ravenmoor"
            className={inputCls}
          />
        </Field>
        <Field label="Setting / World">
          <input
            value={setting}
            onChange={(e) => { setSetting(e.target.value); emit({ setting: e.target.value }); }}
            placeholder="e.g. Dark fantasy — a haunted mountain village"
            className={inputCls}
          />
        </Field>
        <Field label="Premise">
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); emit({ description: e.target.value }); }}
            placeholder="A short hook: what's the central conflict or situation?"
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </Field>
      </div>

      <div className={cardCls}>
        <Field label="Tone">
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map(t => {
              const active = tone.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTone(t)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${active ? 'bg-amber-700 border-amber-600 text-amber-50' : 'bg-background border-border text-muted-foreground hover:border-amber-700/50'}`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Difficulty">
            <BottomSheetPicker
              label="Difficulty"
              value={difficulty}
              options={DIFFICULTY_OPTIONS.map(d => ({ label: d, value: d }))}
              onChange={(v) => { setDifficulty(v); emit({ difficulty: v }); }}
            />
          </Field>
          <Field label="DM Style">
            <BottomSheetPicker
              label="DM Style"
              value={dmStyle}
              options={DM_STYLE_OPTIONS.map(d => ({ label: d, value: d }))}
              onChange={(v) => { setDmStyle(v); emit({ dm_style: v }); }}
            />
          </Field>
        </div>
      </div>

      <div className={cardCls}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-amber-200 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-amber-400" /> AI World Generation
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Optional — flesh out the world, locations, and conflicts from your setting.</p>
          </div>
          <button
            type="button"
            onClick={generateWorld}
            disabled={!setting.trim() || generating}
            className="touch-target flex-shrink-0 px-3 py-2 bg-amber-800/60 hover:bg-amber-700 disabled:opacity-40 text-amber-50 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Weaving…' : 'Generate'}
          </button>
        </div>
        {worldState && (
          <div className="mt-3 p-3 rounded-lg bg-background/60 border border-amber-900/30 text-sm">
            <div className="font-serif text-amber-200">{worldState.world_name || 'Generated World'}</div>
            {worldState.overview && <p className="text-muted-foreground mt-1 text-xs">{worldState.overview}</p>}
            {worldState.starting_location && <p className="text-amber-300 mt-1 text-xs">Start: {worldState.starting_location}</p>}
          </div>
        )}
      </div>
    </div>
  );
}