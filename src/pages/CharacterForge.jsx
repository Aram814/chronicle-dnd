import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Send, Sparkles, Wand2 } from 'lucide-react';
import ScreenHeader from '@/components/ScreenHeader';
import BottomSheetPicker from '@/components/BottomSheetPicker';
import AgentMessage from '@/components/AgentMessage';

export default function CharacterForge() {
  const [searchParams] = useSearchParams();
  const presetCampaignId = searchParams.get('campaign');
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState(presetCampaignId || '');
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [starting, setStarting] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    base44.entities.Campaign.filter({}).then(c => setCampaigns(c || [])).catch(() => {});
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!conversation) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      const msgs = data.messages || [];
      setMessages(msgs);
      const last = msgs[msgs.length - 1];
      setBusy(!!last && (last.role === 'user' || (last.role === 'assistant' && !last.content)));
    });
    return () => unsub();
  }, [conversation]);

  const start = async () => {
    setStarting(true);
    try {
      const camp = campaigns.find(c => c.id === campaignId);
      const conv = await base44.agents.createConversation({
        agent_name: 'character_forge',
        metadata: { name: camp ? `Forge: ${camp.name}` : 'Character Forge' }
      });
      setConversation(conv);
      setMessages(conv.messages || []);
      const seed = camp
        ? `Guide me through building a character for my campaign "${camp.name}" (campaign_id: ${camp.id}). Read the campaign to understand its setting, tone, and maturity, then guide me step by step.`
        : `Guide me through building a unique D&D 5e character step by step. I don't have a specific campaign yet, so build something generally adaptable.`;
      setBusy(true);
      await base44.agents.addMessage(conv, { role: 'user', content: seed });
    } finally {
      setStarting(false);
    }
  };

  const send = async () => {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput('');
    setBusy(true);
    await base44.agents.addMessage(conversation, { role: 'user', content: text });
  };

  if (!conversation) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <ScreenHeader title="Character Forge" icon={Wand2} />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-amber-900/40 border border-amber-700/40 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-serif text-amber-200">Forge a Unique Hero</h2>
                <p className="text-sm text-muted-foreground">An AI guide for stats & lore tuned to your campaign.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              The Forge walks you through concept, race, class, abilities, and backstory — keeping everything aligned to your campaign's setting, tone, and content rating. When you're happy, it saves the character to your roster.
            </p>
          </div>

          <div className="bg-card/60 border border-border rounded-xl p-4 mb-4">
            <BottomSheetPicker
              label="Campaign (optional)"
              value={campaignId}
              options={['', ...campaigns.map(c => c.id)]}
              onChange={setCampaignId}
            />
            {campaignId && (
              <p className="text-xs text-muted-foreground mt-2">
                Setting: {campaigns.find(c => c.id === campaignId)?.setting || '—'} · {campaigns.find(c => c.id === campaignId)?.mature_content ? '18+' : 'General'}
              </p>
            )}
            {!campaignId && <p className="text-xs text-muted-foreground mt-2">No campaign yet — the Forge will build a generally adaptable hero.</p>}
          </div>

          <button
            onClick={start}
            disabled={starting}
            className="touch-target w-full px-4 py-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-amber-50 rounded-lg font-semibold transition-all"
          >
            {starting ? 'Lighting the forge…' : 'Begin Forging'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ScreenHeader title="Character Forge" icon={Wand2} />
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full overscroll-none">
        {messages.map((m, i) => <AgentMessage key={i} message={m} />)}
        {busy && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm ml-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span>The Forge is crafting…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="border-t border-border p-4 bg-card/50 safe-bottom">
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Reply to the Character Forge…"
            rows={1}
            aria-label="Type your response"
            className="flex-1 px-4 py-3 bg-background border border-amber-900/40 rounded-lg text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-amber-700/50 focus:border-amber-700"
          />
          <button onClick={send} disabled={busy || !input.trim()} aria-label="Send message" className="touch-target px-4 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-amber-50 rounded-lg transition-all">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}