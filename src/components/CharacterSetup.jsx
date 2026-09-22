import { useState, useEffect } from 'react';
import { User, Sparkles, Heart, Shield, Footprints, Users, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ScreenHeader from '@/components/ScreenHeader';
import CharacterBuildForm from '@/components/CharacterBuildForm';
import { Image } from '@/components/ui/image';
import { PREBUILT_TEMPLATES, buildCharacterFromForm, previewStats } from '@/lib/characterData';

const tabBase = "touch-target flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg text-sm font-semibold transition-all border";
const tabActive = `${tabBase} bg-amber-700 border-amber-600 text-amber-50`;
const tabIdle = `${tabBase} bg-muted border-border text-muted-foreground`;

export default function CharacterSetup({ onComplete, saving }) {
  const [mode, setMode] = useState('existing');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loadingChars, setLoadingChars] = useState(true);
  const [pickedExisting, setPickedExisting] = useState(null);

  useEffect(() => {
    let done = false;
    base44.entities.Character.list('-updated_date', 50)
      .then((list) => {
        if (done) return;
        setCharacters(list || []);
        if (!list || list.length === 0) setMode('prebuilt');
      })
      .catch(() => { if (!done) setMode('prebuilt'); })
      .finally(() => { if (!done) setLoadingChars(false); });
    return () => { done = true; };
  }, []);

  const handleCreate = () => {
    if (mode === 'existing') {
      if (!pickedExisting) return;
      onComplete(pickedExisting);
    } else if (mode === 'prebuilt') {
      if (selected == null) return;
      onComplete(buildCharacterFromForm(PREBUILT_TEMPLATES[selected].form));
    } else {
      if (!form) return;
      onComplete(buildCharacterFromForm(form));
    }
  };

  const canCreate =
    mode === 'existing' ? !!pickedExisting
      : mode === 'prebuilt' ? selected != null
        : !!form;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ScreenHeader title="Choose Your Hero" />
      <div className="max-w-3xl mx-auto w-full px-4 py-4 flex-1 flex flex-col">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button onClick={() => setMode('existing')} className={mode === 'existing' ? tabActive : tabIdle}>
            <Users className="w-4 h-4" /> Existing
          </button>
          <button onClick={() => setMode('prebuilt')} className={mode === 'prebuilt' ? tabActive : tabIdle}>
            <Sparkles className="w-4 h-4" /> Prebuilt
          </button>
          <button onClick={() => setMode('build')} className={mode === 'build' ? tabActive : tabIdle}>
            <User className="w-4 h-4" /> Custom
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-28 overscroll-none">
          {mode === 'existing' ? (
            loadingChars ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin"></div>
              </div>
            ) : characters.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">You don't have any characters yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Pick a prebuilt hero or build one from scratch.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {characters.map((c) => {
                  const active = pickedExisting?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setPickedExisting(c)}
                      className={`text-left p-4 rounded-xl border transition-all ${active ? 'bg-amber-900/30 border-amber-600 ring-1 ring-amber-600' : 'bg-card/60 border-border hover:border-amber-700/50'}`}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-amber-900/50 border border-amber-700/40 flex items-center justify-center text-amber-300 font-bold font-serif flex-shrink-0">
                          {c.portrait ? (
                            <Image src={c.portrait} alt={c.name} fittingType="fill" className="w-full h-full" />
                          ) : (
                            c.name?.[0]?.toUpperCase() || '?'
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-serif text-amber-100 truncate">{c.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{c.species} {c.class}</div>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="text-amber-300">Lvl {c.level || 1}</span>
                        <span className="flex items-center gap-1 text-rose-300"><Heart className="w-3 h-3" /> {c.hp}/{c.max_hp}</span>
                        <span className="flex items-center gap-1 text-sky-300"><Shield className="w-3 h-3" /> {c.ac}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : mode === 'prebuilt' ? (
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
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-amber-900/50 border border-amber-700/40 flex items-center justify-center text-amber-300 font-bold font-serif flex-shrink-0">
                        {t.form.portrait ? (
                          <Image src={t.form.portrait} alt={t.form.name} fittingType="fill" className="w-full h-full" />
                        ) : (
                          t.form.name[0]
                        )}
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
            <>
              <a
                href="https://www.dndbeyond.com/characters/builder"
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target flex items-center gap-3 p-3 mb-4 rounded-xl bg-amber-900/20 border border-amber-800/40 hover:bg-amber-900/30 transition-all"
              >
                <ExternalLink className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-amber-200">Build on D&D Beyond</div>
                  <div className="text-xs text-muted-foreground">Opens their builder in a new tab — then transcribe the stats into the form below.</div>
                </div>
              </a>
              <CharacterBuildForm onChange={setForm} />
            </>
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
            {saving ? 'Summoning your hero…' : 'Begin Adventure'}
          </button>
        </div>
      </div>
    </div>
  );
}