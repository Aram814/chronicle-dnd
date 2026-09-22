import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus } from 'lucide-react';
import CharacterCard from '@/components/CharacterCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import PullToRefresh from '@/components/PullToRefresh';
import { toast } from '@/components/ui/use-toast';

export default function Characters() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const chars = await base44.entities.Character.filter({});
      setCharacters(chars || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (character) => {
    const { id, created_date, updated_date, created_by_id, ...rest } = character;
    await base44.entities.Character.create({ ...rest, name: `${character.name} (Copy)` });
    load();
  };

  const handleDelete = (character) => setPendingDelete(character);

  const confirmDelete = async () => {
    const target = pendingDelete;
    setPendingDelete(null);
    if (!target) return;
    const prev = characters;
    setCharacters(characters.filter(c => c.id !== target.id));
    try {
      await base44.entities.Character.delete(target.id);
    } catch (e) {
      setCharacters(prev);
      toast({ title: 'Failed to delete character', description: 'Please try again.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={load} className="h-full bg-background text-foreground overscroll-none">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-serif text-amber-200">Your Characters</h2>
          <Link
            to="/character/new/edit"
            className="touch-target inline-flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4" /> New
          </Link>
        </div>
        {characters.length === 0 ? (
          <div className="text-center py-12 text-stone-500 border border-dashed border-stone-800 rounded-xl">
            No characters yet. Create a hero for your adventures!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {characters.map((c) => (
              <CharacterCard key={c.id} character={c} onDuplicate={handleDuplicate} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Character?"
        description={pendingDelete ? `Delete ${pendingDelete.name}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        destructive
      />
    </PullToRefresh>
  );
}