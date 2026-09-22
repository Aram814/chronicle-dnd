import { useState, useEffect } from 'react';
import { Wand2, ChevronDown } from 'lucide-react';
import BottomSheetPicker from '@/components/BottomSheetPicker';
import { RACES, CLASSES, BACKGROUNDS, ALIGNMENTS, STANDARD_ARRAY, ABILITIES, validateForm, previewStats, autoAssign } from '@/lib/characterData';
import { abilityModifier } from '@/lib/dndRules';

const inputCls = "w-full bg-background border border-amber-900/40 rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-700/50";
const labelCls = "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

export default function CharacterBuildForm({ onChange }) {
  const [form, setForm] = useState({
    name: '', race: '', subrace: '', class: '', background: '', alignment: '',
    ability_scores: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
    personality: '', ideals: '', bonds: '', flaws: '', backstory: ''
  });
  const [showOptional, setShowOptional] = useState(false);

  useEffect(() => { onChange(validateForm(form) ? form : null); }, [form, onChange]);

  const set = (patch) => setForm(prev => {
    const next = { ...prev, ...patch };
    if (patch.race && patch.race !== prev.race) {
      const r = RACES.find(x => x.name === patch.race);
      next.subrace = r?.subraces[0]?.name || '';
    }
    return next;
  });

  const race = RACES.find(r => r.name === form.race);
  const cls = CLASSES.find(c => c.name === form.class);
  const subrace = race?.subraces.find(s => s.name === form.subrace);
  const bonuses = subrace?.bonuses || {};
  const stats = previewStats(form);

  const usedElsewhere = (key, val) => Object.entries(form.ability_scores).some(([k, v]) => k !== key && v === val);
  const setAbility = (key, val) => set({ ability_scores: { ...form.ability_scores, [key]: val === '' ? null : Number(val) } });

  return (
    <div className="space-y-4">
      {/* Identity */}
      <section className="bg-card/60 border border-border rounded-xl p-4 space-y-3">
        <div>
          <label className={labelCls}>Hero Name</label>
          <input value={form.name} onChange={e => set({ name: e.target.value })} placeholder="Name your hero" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <BottomSheetPicker label="Race" value={form.race} options={RACES.map(r => r.name)} onChange={v => set({ race: v })} />
          <BottomSheetPicker label="Subrace" value={form.subrace} options={race?.subraces.map(s => s.name) || []} onChange={v => set({ subrace: v })} />
        </div>
        <BottomSheetPicker label="Class" value={form.class} options={CLASSES.map(c => c.name)} onChange={v => set({ class: v })} />
        {cls && <p className="text-xs text-muted-foreground -mt-1">{cls.description}</p>}
      </section>

      {/* Background */}
      <section className="bg-card/60 border border-border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <BottomSheetPicker label="Background" value={form.background} options={BACKGROUNDS} onChange={v => set({ background: v })} />
          <BottomSheetPicker label="Alignment" value={form.alignment} options={ALIGNMENTS} onChange={v => set({ alignment: v })} />
        </div>
      </section>

      {/* Ability Scores */}
      <section className="bg-card/60 border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-amber-200">Ability Scores</h3>
          <button onClick={() => cls && set({ ability_scores: autoAssign(cls.abilityPriority) })} disabled={!cls} className="touch-target inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/40 hover:bg-amber-800/50 disabled:opacity-40 border border-amber-700/40 rounded-lg text-amber-200 text-xs font-semibold">
            <Wand2 className="w-3.5 h-3.5" /> Suggest
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Assign the standard array {STANDARD_ARRAY.join(', ')}. Racial bonuses apply automatically.</p>
        <div className="space-y-2">
          {ABILITIES.map(([key, label]) => {
            const base = form.ability_scores[key];
            const bonus = bonuses[key] || 0;
            const final = base != null ? base + bonus : null;
            const mod = final != null ? abilityModifier(final) : 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-10 text-sm font-semibold text-foreground">{label}</span>
                <select value={base ?? ''} onChange={e => setAbility(key, e.target.value)} className="touch-target bg-background border border-amber-900/40 rounded-lg px-2 py-1.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-700/50">
                  <option value="">—</option>
                  {STANDARD_ARRAY.filter(v => !usedElsewhere(key, v)).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                {bonus ? <span className="text-xs text-emerald-400">+{bonus}</span> : <span className="text-xs text-transparent">+0</span>}
                <span className="ml-auto text-sm font-bold text-amber-200">{final ?? '—'}</span>
                <span className="text-xs text-muted-foreground w-8 text-right">{mod >= 0 ? '+' : ''}{mod}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          <StatPill label="HP" value={stats.hp} className="text-rose-300" />
          <StatPill label="AC" value={stats.ac} className="text-sky-300" />
          <StatPill label="Speed" value={stats.speed} className="text-emerald-300" />
          <StatPill label="Init" value={`${stats.initiative >= 0 ? '+' : ''}${stats.initiative}`} className="text-amber-300" />
        </div>
      )}

      {/* Optional backstory */}
      <section className="bg-card/60 border border-border rounded-xl overflow-hidden">
        <button onClick={() => setShowOptional(s => !s)} className="touch-target w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-amber-200">
          Personality & Backstory (optional)
          <ChevronDown className={`w-4 h-4 transition-transform ${showOptional ? 'rotate-180' : ''}`} />
        </button>
        {showOptional && (
          <div className="px-4 pb-4 space-y-3">
            <TextArea label="Personality" value={form.personality} onChange={v => set({ personality: v })} />
            <TextArea label="Ideals" value={form.ideals} onChange={v => set({ ideals: v })} />
            <TextArea label="Bonds" value={form.bonds} onChange={v => set({ bonds: v })} />
            <TextArea label="Flaws" value={form.flaws} onChange={v => set({ flaws: v })} />
            <TextArea label="Backstory" value={form.backstory} onChange={v => set({ backstory: v })} rows={3} />
          </div>
        )}
      </section>
    </div>
  );
}

function StatPill({ label, value, className }) {
  return (
    <div className="bg-card/60 border border-border rounded-lg py-2 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold ${className}`}>{value}</div>
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 2 }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className="w-full bg-background border border-amber-900/40 rounded-lg px-3 py-2 text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-700/50" />
    </div>
  );
}