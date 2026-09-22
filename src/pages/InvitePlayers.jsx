import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { UserPlus, Copy, RefreshCw, Mail, Trash2, Crown, Users, Check, X } from 'lucide-react';
import ScreenHeader from '@/components/ScreenHeader';
import ConfirmDialog from '@/components/ConfirmDialog';
import { toast } from '@/components/ui/use-toast';

export default function InvitePlayers() {
  const { id } = useParams();
  const [members, setMembers] = useState([]);
  const [campaign, setCampaign] = useState(null);
  const [code, setCode] = useState('');
  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [me, setMe] = useState(null);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const user = await base44.auth.me();
      setMe(user);
      const res = await base44.functions.invoke('campaign_members', {
        action: 'list_members', campaign_id: id
      });
      setMembers(res.data.members || []);
      setCampaign(res.data.campaign);
      setCode(res.data.campaign?.join_code || '');
    } catch (e) {
      toast({ title: 'Failed to load', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    try {
      const res = await base44.functions.invoke('campaign_members', {
        action: 'generate_code', campaign_id: id
      });
      setCode(res.data.code);
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendInvites = async () => {
    const list = emails.split(/[\s,;]+/).map(e => e.trim()).filter(Boolean);
    if (!list.length) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke('campaign_members', {
        action: 'invite_email',
        campaign_id: id,
        emails: list,
        app_url: window.location.origin
      });
      toast({ title: `Sent ${res.data.sent} invitation(s)`, description: `Join code: ${res.data.code}` });
      setEmails('');
      load();
    } catch (e) {
      toast({ title: 'Failed to send', description: e.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    try {
      await base44.functions.invoke('campaign_members', {
        action: 'remove_member', campaign_id: id, member_id: removeTarget.id
      });
      setRemoveTarget(null);
      load();
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const isHost = me && campaign && campaign.created_by_id === me.id;

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScreenHeader title="Invite Players" backTo={`/campaign/${id}/details`} icon={UserPlus} />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Join Code */}
        <div className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-5">
          <h3 className="font-serif text-amber-200 flex items-center gap-2 mb-3"><Users className="w-5 h-5" /> Join Code</h3>
          {code ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 px-4 py-3 bg-background border-2 border-dashed border-amber-700/40 rounded-lg text-center text-2xl font-bold tracking-[0.3em] text-amber-200 font-mono">
                {code}
              </div>
              <button onClick={copyCode} aria-label="Copy code" className="touch-target p-3 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
              {isHost && (
                <button onClick={generateCode} aria-label="Regenerate code" className="touch-target p-3 bg-muted hover:bg-accent rounded-lg">
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            <button onClick={generateCode} className="touch-target w-full px-4 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg font-semibold">
              Generate Join Code
            </button>
          )}
          <p className="text-xs text-muted-foreground mt-2">Share this code with friends so they can join your campaign.</p>
        </div>

        {/* Email Invite */}
        {isHost && (
          <div className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-5">
            <h3 className="font-serif text-amber-200 flex items-center gap-2 mb-3"><Mail className="w-5 h-5" /> Invite by Email</h3>
            <textarea
              value={emails}
              onChange={e => setEmails(e.target.value)}
              placeholder="Enter email addresses, separated by commas..."
              rows={2}
              className="w-full px-3 py-2 bg-background border border-amber-900/40 rounded-lg text-foreground text-sm resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-amber-700/50"
            />
            <button
              onClick={sendInvites}
              disabled={sending || !emails.trim()}
              className="touch-target w-full px-4 py-2.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-amber-50 rounded-lg font-semibold transition-all"
            >
              {sending ? 'Sending...' : 'Send Invitations'}
            </button>
          </div>
        )}

        {/* Member List */}
        <div className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-5">
          <h3 className="font-serif text-amber-200 flex items-center gap-2 mb-3"><Users className="w-5 h-5" /> Members</h3>
          <div className="space-y-2">
            {/* Host */}
            {campaign && (
              <div className="flex items-center gap-3 p-3 bg-background/50 border border-border rounded-lg">
                <div className="w-9 h-9 rounded-full bg-amber-900/40 border border-amber-700/40 flex items-center justify-center text-amber-300 font-bold">
                  {(campaign.name || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" /> Host
                  </p>
                  <p className="text-xs text-muted-foreground">{campaign.character_id ? 'Has character' : 'No character'}</p>
                </div>
              </div>
            )}
            {members.filter(m => m.status !== 'removed').map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-background/50 border border-border rounded-lg">
                <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground font-bold">
                  {(m.character_name || m.user_name || m.user_email || '?')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {m.character_name || m.user_name || m.user_email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.role === 'host' ? 'Host' : 'Player'} ·
                    <span className={m.status === 'pending' ? 'text-amber-500' : m.status === 'active' ? 'text-emerald-400' : 'text-red-400'}>
                      {' '}{m.status}
                    </span>
                    {m.character_name && m.status === 'active' && ` · ${m.character_name}`}
                  </p>
                </div>
                {isHost && m.role !== 'host' && m.status !== 'removed' && (
                  <button
                    onClick={() => setRemoveTarget(m)}
                    aria-label="Remove player"
                    className="p-2 text-red-400 hover:bg-red-950/40 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {members.filter(m => m.status !== 'removed').length === 0 && !campaign && (
              <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
            )}
          </div>
        </div>

        <Link to={`/campaign/${id}`} className="touch-target flex items-center justify-center gap-2 w-full px-4 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg font-semibold">
          Back to Game
        </Link>
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
        title="Remove Player?"
        description={removeTarget ? `Remove ${removeTarget.character_name || removeTarget.user_name || removeTarget.user_email} from this campaign?` : ''}
        confirmLabel="Remove"
        destructive
      />
    </div>
  );
}