import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Trash2, AlertTriangle, LogOut, Shield, ChevronRight, User as UserIcon,
  KeyRound, Bell, Mail, Save, Check,
} from 'lucide-react';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const DEFAULT_PREFS = { email_notifications: true, campaign_reminders: true };

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [displayName, setDisplayName] = useState('');
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      setDisplayName(u.display_name || u.full_name || '');
      setPrefs({ ...DEFAULT_PREFS, ...(u.preferences || {}) });
    } catch (e) {
      /* ignore */
    } finally {
      setLoadingUser(false);
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = '/login';
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      await base44.auth.updateMe({ display_name: displayName, preferences: prefs });
      setUser((u) => ({ ...u, display_name: displayName, preferences: prefs }));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (e) {
      setError(e?.message || 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const openPassword = () => {
    setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwError('');
    setPwOpen(true);
  };

  const submitPassword = async () => {
    setPwError('');
    if (!currentPw || !newPw) { setPwError('Please fill in all fields.'); return; }
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('New passwords do not match.'); return; }
    setChangingPw(true);
    try {
      await base44.auth.changePassword({
        userId: user.id,
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setPwOpen(false);
    } catch (e) {
      setPwError(e?.message || 'Failed to change password. Check your current password.');
    } finally {
      setChangingPw(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
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
    <div className="h-full overflow-y-auto bg-background text-foreground overscroll-none">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Account */}
        <section className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-5">
          <h2 className="font-serif text-amber-200 text-lg mb-4 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-amber-500" /> Account
          </h2>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Email</Label>
              <div className="mt-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-muted-foreground text-sm">
                {loadingUser ? 'Loading…' : user?.email || '—'}
              </div>
            </div>
            <div>
              <Label htmlFor="display-name" className="text-xs text-muted-foreground uppercase">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your hero's name"
                className="mt-1 bg-background border-border"
              />
            </div>
            <button
              type="button"
              onClick={openPassword}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/60 transition-colors"
            >
              <KeyRound className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left">Change password</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={saveProfile}
                disabled={savingProfile}
                className="touch-target bg-amber-700 hover:bg-amber-600 text-amber-50"
              >
                {savingProfile ? 'Saving…' : profileSaved ? (
                  <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Saved</span>
                ) : (
                  <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Profile</span>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-5">
          <h2 className="font-serif text-amber-200 text-lg mb-1 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" /> Notifications
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Choose what you want to hear about.</p>
          <div className="space-y-1">
            <ToggleRow
              icon={<Mail className="w-4 h-4 text-muted-foreground" />}
              label="Email notifications"
              description="Account and security emails"
              checked={!!prefs.email_notifications}
              onChange={(v) => setPrefs({ ...prefs, email_notifications: v })}
            />
            <ToggleRow
              icon={<Bell className="w-4 h-4 text-muted-foreground" />}
              label="Campaign recap reminders"
              description="Periodic story recaps for active campaigns"
              checked={!!prefs.campaign_reminders}
              onChange={(v) => setPrefs({ ...prefs, campaign_reminders: v })}
            />
          </div>
        </section>

        {/* General */}
        <section className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-5">
          <h2 className="font-serif text-amber-200 text-lg mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" /> General
          </h2>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted/60 transition-colors"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left">Log out</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </section>

        {/* Appearance */}
        <section className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-5">
          <h2 className="font-serif text-amber-200 text-lg mb-1">Appearance</h2>
          <p className="text-sm text-muted-foreground">
            Chronicle uses a dark fantasy theme by default and follows your system preference automatically.
          </p>
        </section>

        {/* Danger zone */}
        <section className="bg-gradient-to-br from-red-950/40 to-background/80 border border-red-900/40 rounded-xl p-5">
          <h2 className="font-serif text-red-300 text-lg mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" /> Delete Account
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data, including every campaign, character,
            and saved story. This action cannot be undone.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1.5 mb-4 list-disc list-inside">
            <li>All campaigns and their chat history will be erased.</li>
            <li>All characters and inventory will be removed.</li>
            <li>All saved stories will be deleted.</li>
            <li>You will be signed out immediately.</li>
          </ul>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            className="touch-target bg-red-900/60 hover:bg-red-800/70 border border-red-700/50 text-red-100"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete Account
          </Button>
        </section>

        <p className="text-center text-sm text-muted-foreground pt-2">Chronicle D&D · AI Dungeon Master</p>
      </div>

      {/* Change password drawer */}
      <Drawer open={pwOpen} onOpenChange={setPwOpen}>
        <DrawerContent className="bg-card border-amber-900/40 text-foreground rounded-t-2xl">
          <DrawerHeader className="text-center">
            <DrawerTitle className="font-serif text-amber-200 text-xl">Change Password</DrawerTitle>
            <DrawerDescription className="text-muted-foreground text-sm">
              Enter your current password and choose a new one.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 space-y-3 pb-2">
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Current Password</Label>
              <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="mt-1 bg-background border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase">New Password</Label>
              <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="mt-1 bg-background border-border" placeholder="At least 8 characters" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Confirm New Password</Label>
              <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="mt-1 bg-background border-border" />
            </div>
            {pwError && <p className="text-sm text-red-400" role="alert">{pwError}</p>}
          </div>
          <DrawerFooter className="flex-row gap-3 pb-8">
            <Button type="button" variant="outline" onClick={() => setPwOpen(false)} disabled={changingPw} className="flex-1 bg-muted border-border text-foreground hover:bg-accent">
              Cancel
            </Button>
            <Button type="button" onClick={submitPassword} disabled={changingPw} className="touch-target flex-1 bg-amber-700 hover:bg-amber-600 text-amber-50">
              {changingPw ? 'Updating…' : 'Update Password'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete confirmation drawer */}
      <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DrawerContent className="bg-card border-red-900/40 text-foreground rounded-t-2xl">
          <DrawerHeader className="text-center">
            <DrawerTitle className="font-serif text-red-300 text-xl">Delete account?</DrawerTitle>
            <DrawerDescription className="text-muted-foreground text-sm">
              This will permanently erase all your campaigns, characters, and stories. This cannot be undone.
            </DrawerDescription>
          </DrawerHeader>
          {error && <p className="text-sm text-red-400 text-center px-4" role="alert">{error}</p>}
          <DrawerFooter className="flex-row gap-3 pb-8">
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={deleting} className="flex-1 bg-muted border-border text-foreground hover:bg-accent">
              Cancel
            </Button>
            <Button type="button" onClick={handleDelete} disabled={deleting} className="touch-target flex-1 bg-red-900/70 hover:bg-red-800 border border-red-700/50 text-red-50">
              {deleting ? 'Deleting…' : 'Delete Forever'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function ToggleRow({ icon, label, description, checked, onChange }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}