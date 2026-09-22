import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Upload, FileText, Loader2, Link as LinkIcon } from 'lucide-react';
import ScreenHeader from '@/components/ScreenHeader';
import InfoDialog from '@/components/InfoDialog';

export default function ImportCharacter() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const goToEditor = (character) => {
    navigate('/character/new/edit', { state: { imported: character }, replace: true });
  };

  const handleLink = async () => {
    if (!link.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('import_character_link', { url: link.trim() });
      if (res.data?.error) throw new Error(res.data.error);
      const character = res.data?.character;
      if (!character) throw new Error('No character data returned.');
      goToEditor(character);
    } catch (e) {
      setError(e.message || 'Import failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

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
      goToEditor(character);
    } catch (e) {
      setError(e.message || 'Import failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ScreenHeader title="Import Character" backTo="/characters" />
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-5">
        <div className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon className="w-5 h-5 text-amber-500" />
            <h2 className="font-serif text-amber-200 text-lg">From D&D Beyond Link</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Paste a shared character link (e.g. dndbeyond.com/characters/33069160). We'll pull the stats, race, class, and more straight into the editor.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLink(); }}
              placeholder="https://www.dndbeyond.com/characters/..."
              aria-label="D&D Beyond character link"
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-700/50 focus:border-amber-700"
            />
            <button
              onClick={handleLink}
              disabled={busy || !link.trim()}
              aria-label="Import from link"
              className="touch-target inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-amber-50 rounded-lg font-semibold transition-all"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
              Import
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-6 text-center">
          <FileText className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="font-serif text-amber-200 text-lg mb-2">From a File</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Upload an exported character sheet (PDF or screenshot) or a character JSON file.
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
            className="touch-target inline-flex items-center gap-2 px-5 py-3 bg-amber-900/50 hover:bg-amber-800/60 border border-amber-700/50 text-amber-200 rounded-lg font-semibold transition-all"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {busy ? 'Reading...' : 'Choose File'}
          </button>
          <p className="text-xs text-muted-foreground mt-4">Supported: PDF, PNG, JPG, JSON</p>
        </div>
      </div>
      <InfoDialog open={!!error} onClose={() => setError(null)} title="Import Failed" description={error} />
    </div>
  );
}