import { useState, useRef } from 'react';
import { Scroll, Sparkles, Upload, Wand2, MapPin, Swords, MessageSquareQuote, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ScreenHeader from '@/components/ScreenHeader';
import MatureToggle from '@/components/MatureToggle';
import CampaignBuildForm from '@/components/CampaignBuildForm';
import {
  PREBUILT_CAMPAIGNS,
  buildCampaignPayloadFromTemplate,
  buildCampaignPayloadFromForm,
  buildCampaignPayloadFromImport
} from '@/lib/campaignData';

const tabBase = 'touch-target flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg text-sm font-semibold transition-all border';
const tabActive = `${tabBase} bg-amber-700 border-amber-600 text-amber-50`;
const tabIdle = `${tabBase} bg-muted border-border text-muted-foreground`;

export default function CampaignSetup({ onComplete, saving, characterName, mature, onToggleMature }) {
  const [mode, setMode] = useState('prebuilt');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [uploadState, setUploadState] = useState(null); // {payload, name} | {error} | {loading}
  const fileRef = useRef(null);

  const handleChoose = () => {
    if (mode === 'prebuilt') {
      if (selected == null) return;
      onComplete(buildCampaignPayloadFromTemplate(PREBUILT_CAMPAIGNS[selected]));
    } else if (mode === 'custom') {
      if (!form) return;
      onComplete(buildCampaignPayloadFromForm(form));
    } else {
      if (!uploadState || !uploadState.payload) return;
      onComplete(uploadState.payload);
    }
  };

  const handleGuide = () => onComplete({ mode: 'guide' });

  const canChoose =
    mode === 'prebuilt' ? selected != null
      : mode === 'custom' ? !!(form && form.name && form.setting)
        : !!(uploadState && uploadState.payload);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState({ loading: true, name: file.name });
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'json') {
        const text = await file.text();
        const data = JSON.parse(text);
        setUploadState({ payload: buildCampaignPayloadFromImport(data), name: file.name });
      } else if (ext === 'pdf') {
        // PDF — upload and let the DM engine read it via the LLM's file support.
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        const res = await base44.functions.invoke('dm_engine', {
          mode: 'generate_world',
          preferences: { source_file_url: file_url, file_name: file.name }
        });
        const world = res?.data?.world || {};
        const payload = buildCampaignPayloadFromImport({
          name: file.name.replace(/\.[^.]+$/, ''),
          setting: world.world_name || '',
          description: world.overview || '',
          tone: [],
          current_location: world.starting_location || '',
          world_state: world
        });
        setUploadState({ payload, name: file.name });
      } else {
        // Free-form text/markdown — ask the DM engine to structure it into a world.
        const text = await file.text();
        const res = await base44.functions.invoke('dm_engine', {
          mode: 'generate_world',
          preferences: { source_text: text }
        });
        const world = res?.data?.world || {};
        const payload = buildCampaignPayloadFromImport({
          name: file.name.replace(/\.[^.]+$/, ''),
          setting: world.world_name || '',
          description: world.overview || text.slice(0, 280),
          tone: [],
          current_location: world.starting_location || '',
          world_state: world
        });
        setUploadState({ payload, name: file.name });
      }
    } catch (err) {
      setUploadState({ error: 'Could not read that file. Use a .json, .pdf, or text description.', name: file.name });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ScreenHeader
        title="Forge Your Campaign"
        actions={onToggleMature ? <MatureToggle enabled={!!mature} onChange={onToggleMature} /> : null}
      />
      <div className="max-w-3xl mx-auto w-full px-4 py-4 flex-1 flex flex-col">
        {characterName && (
          <p className="text-sm text-muted-foreground mb-3 text-center">
            <span className="text-amber-300">{characterName}</span> is ready. Now choose how the tale begins.
          </p>
        )}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button onClick={() => setMode('prebuilt')} className={mode === 'prebuilt' ? tabActive : tabIdle}>
            <Scroll className="w-4 h-4" /> Prebuilt
          </button>
          <button onClick={() => setMode('custom')} className={mode === 'custom' ? tabActive : tabIdle}>
            <Wand2 className="w-4 h-4" /> Custom
          </button>
          <button onClick={() => setMode('upload')} className={mode === 'upload' ? tabActive : tabIdle}>
            <Upload className="w-4 h-4" /> Upload
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-28 overscroll-none">
          {mode === 'prebuilt' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {PREBUILT_CAMPAIGNS.map((t, i) => {
                const active = selected === i;
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    className={`text-left p-4 rounded-xl border transition-all ${active ? 'bg-amber-900/30 border-amber-600 ring-1 ring-amber-600' : 'bg-card/60 border-border hover:border-amber-700/50'}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Swords className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div className="font-serif text-amber-100 truncate">{t.name}</div>
                    </div>
                    <div className="text-xs text-amber-300 mb-2">{t.tagline}</div>
                    <p className="text-xs text-muted-foreground mb-2">{t.highlights}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {t.tone.map(tn => (
                        <span key={tn} className="text-[11px] px-2 py-0.5 rounded-full bg-amber-900/30 border border-amber-800/40 text-amber-200/80">{tn}</span>
                      ))}
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground">{t.difficulty}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : mode === 'custom' ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGuide}
                className="touch-target w-full flex items-center gap-3 p-3 rounded-xl bg-amber-900/20 border border-amber-800/40 hover:bg-amber-900/30 transition-all text-left"
              >
                <MessageSquareQuote className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-amber-200">Let the DM guide me</div>
                  <div className="text-xs text-muted-foreground">Build the world through conversation — the DM asks you questions.</div>
                </div>
              </button>
              <CampaignBuildForm onChange={setForm} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-card/60 border border-border">
                <div className="text-sm font-semibold text-amber-200 mb-1">Import a campaign</div>
                <p className="text-xs text-muted-foreground mb-3">
                  Upload a <span className="text-amber-300">.json</span> campaign file (name, setting, description, tone, difficulty, dm_style, world_state), a <span className="text-amber-300">.pdf</span>, or a <span className="text-amber-300">.txt/.md</span> description — the DM will shape it into a world.
                  </p>
                  <input
                   ref={fileRef}
                   type="file"
                   accept=".json,.pdf,.txt,.md"
                  onChange={onFile}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-amber-700 file:text-amber-50 file:font-semibold file:cursor-pointer"
                />
              </div>
              {uploadState?.loading && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm px-1">
                  <Loader2 className="w-4 h-4 animate-spin" /> Reading {uploadState.name}…
                </div>
              )}
              {uploadState?.error && (
                <p className="text-sm text-rose-400 px-1">{uploadState.error}</p>
              )}
              {uploadState?.payload && (
                <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-700/40">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <div className="font-serif text-amber-100">{uploadState.payload.name}</div>
                  </div>
                  {uploadState.payload.setting && <p className="text-xs text-amber-300">{uploadState.payload.setting}</p>}
                  {uploadState.payload.description && <p className="text-xs text-muted-foreground mt-1">{uploadState.payload.description.slice(0, 220)}</p>}
                  {uploadState.payload.current_location && <p className="text-xs text-amber-300 mt-1">Start: {uploadState.payload.current_location}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur p-4 safe-bottom">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleChoose}
            disabled={!canChoose || saving}
            className="touch-target w-full px-4 py-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-amber-50 rounded-lg font-semibold transition-all"
          >
            {saving ? 'Forging the realm…' : 'Begin Adventure'}
          </button>
        </div>
      </div>
    </div>
  );
}