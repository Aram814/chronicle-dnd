import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Upload, FileText, Loader2 } from 'lucide-react';
import ScreenHeader from '@/components/ScreenHeader';
import InfoDialog from '@/components/InfoDialog';

export default function ImportCharacter() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const res = await base44.functions.invoke('import_character', { file_uri });
      if (res.data?.error) throw new Error(res.data.error);
      const character = res.data?.character;
      if (!character) throw new Error('No character data could be read from that file.');
      navigate('/character/new/edit', { state: { imported: character }, replace: true });
    } catch (e) {
      setError(e.message || 'Import failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ScreenHeader title="Import Character" backTo="/characters" />
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-6 text-center">
          <FileText className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="font-serif text-amber-200 text-lg mb-2">Import a Character Sheet</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Upload an exported character sheet (PDF or screenshot) or a character JSON file. We'll read the stats and pre-fill the editor so you can review before saving.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.json"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            aria-label="Choose a file to import"
            className="touch-target inline-flex items-center gap-2 px-5 py-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-amber-50 rounded-lg font-semibold transition-all"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {busy ? 'Reading sheet...' : 'Choose File'}
          </button>
          <p className="text-xs text-muted-foreground mt-4">Supported: PDF, PNG, JPG, JSON</p>
        </div>
      </div>
      <InfoDialog open={!!error} onClose={() => setError(null)} title="Import Failed" description={error} />
    </div>
  );
}