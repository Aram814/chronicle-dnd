import { useState } from 'react';
import { User, Sparkles, Heart, Shield, Footprints } from 'lucide-react';
import ScreenHeader from '@/components/ScreenHeader';
import CharacterBuildForm from '@/components/CharacterBuildForm';
import { PREBUILT_TEMPLATES, buildCharacterFromForm, previewStats } from '@/lib/characterData';

const tabBase = "touch-target flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all border";
const tabActive = `${tabBase} bg-amber-700 border-amber-600 text-amber-50`;
const tabIdle = `${tabBase} bg-muted border-border text-muted-foreground`;

export default function CharacterSetup({ onComplete, saving }) {
  const [mode, setMode] = useState('prebuilt');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);

  const handleCreate = () => {
    if (mode === 'prebuilt') {
      if (selected == null) return;
      onComplete(buildCharacterFromForm(PREBUILT_TEMPLATES[selected].form));
    } else {
      if (!form) return;
      onComplete(buildCharacterFromForm(form));
    }
  };

  const canCreate = mode === 'prebuilt' ? selected != null : !!form;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ScreenHeader title="Create Your Hero" />
      <div className="max-w-3xl mx-auto w-full px-4 py-4 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setMode('prebuilt')} className={mode === 'prebuilt' ? tabActive : tabIdle}>
            <Sparkles className="w-4 h-4" /> Prebuilt
          </button>
          <button onClick={() => setMode('build')} className={mode === 'build' ? tabActive : tabIdle}>
            <User className="w-4 h-4" /> Build from Scratch
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-28 overscroll-none">
          {mode === 'prebuilt' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {PREBUILT_TEMPLATES.map((t, i) => {
                const s = previewStats(t.form);
                const active = selected === i;
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    className={`text-left p-4 rounded-xl border transition-all ${active ? 'bg-amber-900/30 border-amber-600 ring-1 ring-amber-600' : 'bg-card/60 border-border hover:border-amber-700/50'}`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-amber-900/50 border border-amber-700/40 flex items-center justify-center text-amber-300 font-bold font-serif">
                        {t.form.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="font-serif text-amber-100 truncate">{t.form.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{t.tagline}</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{t.highlights}</p>
                    <div className="flex gap-3 text-xs">
                      <span className="flex items-center gap-1 text-rose-300"><Heart className="w-3 h-3" /> {s.hp}</span>
                      <span className="flex items-center gap-1 text-sky-300"><Shield className="w-3 h-3" /> {s.ac}</span>
                      <span className="flex items-center gap-1 text-emerald-300"><Footprints className="w-3 h-3" /> {s.speed}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <CharacterBuildForm onChange={setForm} />
          )}
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur p-4 safe-bottom">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleCreate}
            disabled={!canCreate || saving}
            className="touch-target w-full px-4 py-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-amber-50 rounded-lg font-semibold transition-all"
          >
            {saving ? 'Summoning your hero…' : 'Create Hero & Begin'}
          </button>
        </div>
      </div>
    </div>
  );
}