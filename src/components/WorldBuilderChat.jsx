import { useState, useEffect, useRef } from 'react';
import { Send, Globe, Play, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';
import ScreenHeader from '@/components/ScreenHeader';
import { toast } from '@/components/ui/use-toast';

export default function WorldBuilderChat({ campaign, character, onBegin, onBack }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const messagesEndRef = useRef(null);
  const initRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: 'world_builder',
          metadata: { name: `World Builder — ${campaign?.name || 'New Campaign'}`, campaign_id: campaign?.id }
        });
        setConversationId(conv.id);
        const hasName = campaign?.name && campaign.name !== 'Untitled Campaign' && campaign.name !== 'New Campaign';
        const initialMsg = `I'm building a D&D campaign${hasName ? ` called "${campaign.name}"` : ''}. My character is ${character?.name || 'a hero'}${character?.species ? `, a ${character.species}` : ''}${character?.class ? ` ${character.class}` : ''}.${campaign?.setting ? ` The setting is: ${campaign.setting}` : ''} The campaign ID is ${campaign?.id}. Help me create detailed locations and NPCs for this world — save them to the database tagged with this campaign ID. Start by asking me what kind of world I envision, then generate rich descriptions.`;
        const updated = await base44.agents.addMessage(conv, { role: 'user', content: initialMsg });
        setMessages(updated.messages || []);
      } catch (e) {
        toast({ title: 'Could not start World Builder', description: e.message, variant: 'destructive' });
      }
    })();
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    const unsub = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [conversationId]);

  const send = async () => {
    if (!input.trim() || loading || !conversationId) return;
    const text = input.trim();
    setInput('');
    setLoading(true);
    try {
      const conv = await base44.agents.getConversation(conversationId);
      const updated = await base44.agents.addMessage(conv, { role: 'user', content: text });
      setMessages(updated.messages || []);
    } catch (e) {
      toast({ title: 'Message failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleBegin = async () => {
    setStarting(true);
    try { await onBegin(); } finally { setStarting(false); }
  };

  const lastMsg = messages[messages.length - 1];
  const isAgentResponding = loading || (lastMsg && lastMsg.role === 'user');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ScreenHeader
        title="World Builder"
        icon={Globe}
        onBack={onBack}
        actions={
          <button
            onClick={handleBegin}
            disabled={starting}
            className="touch-target inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-amber-50 rounded-lg text-sm font-semibold transition-all"
          >
            <Play className="w-4 h-4" /> {starting ? 'Starting…' : 'Begin Adventure'}
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full">
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {isAgentResponding && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm ml-2 mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>The World Builder is crafting…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-border p-4 bg-card/50 input-safe">
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Describe a location or NPC you want…"
            rows={1}
            aria-label="Message the World Builder"
            className="flex-1 px-4 py-3 bg-background border border-amber-900/40 rounded-lg text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-amber-700/50 focus:border-amber-700 max-h-32"
          />
          <button onClick={send} disabled={loading || !input.trim()} aria-label="Send message" className="touch-target px-4 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-amber-50 rounded-lg transition-all">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-xl px-4 py-3 ${isUser ? 'bg-amber-800/40 border border-amber-700/40' : 'bg-card border border-border'}`}>
        {message.content && (
          isUser
            ? <p className="text-sm text-amber-50 whitespace-pre-wrap">{message.content}</p>
            : <ReactMarkdown className="text-sm prose prose-sm max-w-none text-foreground">{message.content}</ReactMarkdown>
        )}
        {message.tool_calls?.map((tc, i) => <ToolCallDisplay key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const status = toolCall.status || 'pending';
  const isDone = ['completed', 'success', 'failed', 'error'].includes(status);
  const isFailed = status === 'failed' || status === 'error';
  let results = toolCall.results;
  try { if (typeof results === 'string') results = JSON.parse(results); } catch (e) { /* keep raw */ }

  return (
    <div className="mt-2 text-xs border-t border-border pt-2">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
        {isDone ? (isFailed ? '✗' : '✓') : <Loader2 className="w-3 h-3 animate-spin" />}
        <span>{toolCall.name || 'Tool'} — {status}</span>
      </button>
      {expanded && (
        <div className="mt-1 space-y-1 text-xs">
          {toolCall.arguments_string && (
            <div><span className="text-muted-foreground">Args:</span> <code className="text-foreground break-all">{toolCall.arguments_string}</code></div>
          )}
          {results != null && (
            <div><span className="text-muted-foreground">Result:</span> <code className="text-foreground break-all">{typeof results === 'string' ? results : JSON.stringify(results)}</code></div>
          )}
        </div>
      )}
    </div>
  );
}