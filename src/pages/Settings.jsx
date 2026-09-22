import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Trash2, AlertTriangle, LogOut, Shield, ChevronRight } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

export default function Settings() {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = '/login';
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      // Remove the user's app data (permitted by RLS: own records)
      await Promise.all([
        base44.entities.Campaign.deleteMany({}),
        base44.entities.Character.deleteMany({}),
        base44.entities.SavedStory.deleteMany({}),
        base44.entities.Message.deleteMany({}),
        base44.entities.NPC.deleteMany({}),
        base44.entities.Quest.deleteMany({}),
        base44.entities.Location.deleteMany({}),
        base44.entities.DiceRoll.deleteMany({}),
        base44.entities.ChatSession.deleteMany({}),
      ]);
      await base44.auth.logout();
      window.location.href = '/login';
    } catch (e) {
      setError(e?.message || 'Failed to delete account data. Please try again or contact support.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-stone-950 text-stone-200 overscroll-none">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* General */}
        <section className="bg-gradient-to-br from-stone-900/80 to-stone-950/80 border border-amber-900/30 rounded-xl p-5">
          <h2 className="font-serif text-amber-200 text-lg mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" /> General
          </h2>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-stone-200 hover:bg-stone-800/60 transition-colors"
          >
            <LogOut className="w-5 h-5 text-stone-400" />
            <span className="flex-1 text-left">Log out</span>
            <ChevronRight className="w-4 h-4 text-stone-600" />
          </button>
        </section>

        {/* Appearance */}
        <section className="bg-gradient-to-br from-stone-900/80 to-stone-950/80 border border-amber-900/30 rounded-xl p-5">
          <h2 className="font-serif text-amber-200 text-lg mb-1">Appearance</h2>
          <p className="text-sm text-stone-400 mb-3">
            Chronicle uses a dark fantasy theme by default and follows your system preference automatically.
          </p>
        </section>

        {/* Danger zone */}
        <section className="bg-gradient-to-br from-red-950/40 to-stone-950/80 border border-red-900/40 rounded-xl p-5">
          <h2 className="font-serif text-red-300 text-lg mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" /> Delete Account
          </h2>
          <p className="text-sm text-stone-400 mb-4">
            Permanently delete your account and all associated data, including every campaign, character,
            and saved story. This action cannot be undone.
          </p>
          <ul className="text-sm text-stone-400 space-y-1.5 mb-4 list-disc list-inside">
            <li>All campaigns and their chat history will be erased.</li>
            <li>All characters and inventory will be removed.</li>
            <li>All saved stories will be deleted.</li>
            <li>You will be signed out immediately.</li>
          </ul>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            className="bg-red-900/60 hover:bg-red-800/70 border border-red-700/50 text-red-100"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete Account
          </Button>
        </section>

        <p className="text-center text-sm text-stone-600 pt-2">Chronicle D&D · AI Dungeon Master</p>
      </div>

      {/* Confirmation drawer */}
      <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DrawerContent className="bg-stone-900 border-red-900/40 text-stone-200 rounded-t-2xl">
          <DrawerHeader className="text-center">
            <DrawerTitle className="font-serif text-red-300 text-xl">Delete account?</DrawerTitle>
            <DrawerDescription className="text-stone-400 text-sm">
              This will permanently erase all your campaigns, characters, and stories. This cannot be undone.
            </DrawerDescription>
          </DrawerHeader>
          {error && (
            <p className="text-sm text-red-400 text-center px-4" role="alert">
              {error}
            </p>
          )}
          <DrawerFooter className="flex-row gap-3 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
              className="flex-1 bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-900/70 hover:bg-red-800 border border-red-700/50 text-red-50"
            >
              {deleting ? 'Deleting…' : 'Delete Forever'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}