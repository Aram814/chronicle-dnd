import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { KeyRound, Users, Crown, ChevronRight, Plus, Swords } from 'lucide-react';
import ScreenHeader from '@/components/ScreenHeader';
import { toast } from '@/components/ui/use-toast';

export default function JoinCampaign() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [campaign, setCampaign] = useState(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [phase, setPhase] = useState('enter'); // enter | preview | character | done
  const [characters, setCharacters] = useState([]);
  const [selectedChar, setSelectedChar] = useState(null);
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setMe(u)).catch(() => {});
    base44.entities.Character.filter({}).then(c => setCharacters(c || [])).catch(() => {});
    if (searchParams.get('code')) doLookup(searchParams.get('code'));
  }, []);

  const doLookup = async (codeVal) => {
    if (!codeVal.trim()) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke('campaign_members', {
        action: 'lookup_code', code: codeVal.trim()
      });
      setCampaign(res.data.campaign);
      setAlreadyMember(res.data.already_member);
      setPhase('preview');
    } catch (e) {
      toast({ title: 'Invalid code', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke('campaign_members', {
        action: 'join', campaign_id: campaign.id, code: code.trim()
      });
      if (res.data.already_member) {
        // Already a member — go straight to character pick or game
      }
      setPhase('character');
    } catch (e) {
      toast({ title: 'Failed to join', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const pickCharacter = async () => {
    setBusy(true);
    try {
      if (selectedChar) {
        await base44.functions.invoke('campaign_members', {
          action: 'set_character',
          campaign_id: campaign.id,
          character_id: selectedChar
        });
      }
      navigate(`/campaign/${campaign.id}`);
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScreenHeader title="Join Campaign" icon={KeyRound} />
      <div className="max-w-2xl mx-auto px-4 py-6">
        {phase === 'enter' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-6 text-center">
              <KeyRound className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-serif text-amber-200 mb-2">Enter a Join Code</h2>
              <p className="text-sm text-muted-foreground mb-4">Ask your host for the 6-character code to join their adventure.</p>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') doLookup(code); }}
                placeholder="ABCDEF"
                maxLength={6}
                className="w-full max-w-xs mx-auto block px-4 py-3 bg-background border-2 border-amber-900/40 rounded-lg text-center text-2xl font-bold tracking-[0.3em] text-amber-200 font-mono focus:outline-none focus:ring-2 focus:ring-amber-700/50"
              />
              <button
                onClick={() => doLookup(code)}
                disabled={busy || !code.trim()}
                className="touch-target mt-4 px-6 py-2.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-amber-50 rounded-lg font-semibold transition-all"
              >
                {busy ? 'Looking up...' : 'Find Campaign'}
              </button>
            </div>
          </div>
        )}

        {phase === 'preview' && campaign && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-6">
              <h2 className="text-xl font-serif text-amber-200 mb-1">{campaign.name}</h2>
              {campaign.setting && <p className="text-sm text-muted-foreground mb-3">{campaign.setting}</p>}
              {campaign.description && <p className="text-sm text-foreground mb-4">{campaign.description}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Difficulty: <span className="text-amber-300">{campaign.difficulty}</span></span>
                <span>DM Style: <span className="text-amber-300">{campaign.dm_style}</span></span>
                <span>Content: <span className={campaign.mature_content ? 'text-red-400' : 'text-amber-300'}>{campaign.mature_content ? '18+' : 'General'}</span></span>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
                <Crown className="w-4 h-4 text-amber-400" /> Host's campaign
              </div>
            </div>
            {alreadyMember ? (
              <button
                onClick={() => setPhase('character')}
                className="touch-target w-full px-4 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg font-semibold"
              >
                You're already a member — Continue
              </button>
            ) : (
              <button
                onClick={join}
                disabled={busy}
                className="touch-target w-full px-4 py-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-amber-50 rounded-lg font-semibold"
              >
                {busy ? 'Joining...' : 'Join Campaign'}
              </button>
            )}
          </div>
        )}

        {phase === 'character' && campaign && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <Users className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h2 className="text-xl font-serif text-amber-200">Choose Your Hero</h2>
              <p className="text-sm text-muted-foreground">Select a character to play in this campaign.</p>
            </div>
            {characters.length > 0 ? (
              <div className="space-y-2">
                {characters.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChar(c.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${selectedChar === c.id ? 'border-amber-600 bg-amber-950/30' : 'border-border bg-card/50 hover:border-amber-800/40'}`}
                  >
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-amber-900/50 to-muted border border-amber-700/40 flex items-center justify-center text-lg font-bold text-amber-400 font-serif">
                      {c.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.species} {c.class} · Lvl {c.level}</p>
                    </div>
                    {selectedChar === c.id && <ChevronRight className="w-5 h-5 text-amber-400" />}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">You don't have any characters yet.</p>
            )}
            <Link to="/character-forge" className="touch-target w-full flex items-center justify-center gap-2 px-4 py-3 bg-muted hover:bg-accent rounded-lg font-semibold text-foreground">
              <Plus className="w-5 h-5" /> Create New Character
            </Link>
            <button
              onClick={pickCharacter}
              disabled={busy || !selectedChar}
              className="touch-target w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-amber-50 rounded-lg font-semibold"
            >
              <Swords className="w-5 h-5" /> {busy ? 'Entering...' : 'Enter Campaign'}
            </button>
            <button
              onClick={() => navigate(`/campaign/${campaign.id}`)}
              className="touch-target w-full text-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}