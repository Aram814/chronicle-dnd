import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import ChatMessage from '@/components/ChatMessage';
import { parseDMReply } from '@/lib/dndClient';

export default function NewCampaign() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storyId = searchParams.get('story');
  const [story, setStory] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [setupData, setSetupData] = useState({});
  const [stage, setStage] = useState('world');
  const [storyContext, setStoryContext] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const init = async () => {
    let ctx = '';
    if (storyId) {
      try {
        const s = await base44.entities.SavedStory.get(storyId);
        setStory(s);
        ctx = `Continuing from a saved story: ${s.name}\nPremise: ${s.premise || ''}\nCurrent situation: ${s.current_situation || ''}\nMajor events: ${(s.major_events || []).join(', ')}\nImportant NPCs: ${(s.important_npcs || []).join(', ')}\nUnresolved quests: ${(s.unresolved_quests || []).join(', ')}`;
        setStoryContext(ctx);
      } catch (e) { /* ignore */ }
    }
    // Create a campaign in setup status
    const newCampaign = await base44.entities.Campaign.create({
      name: storyId ? 'New Campaign' : 'Untitled Campaign',
      status: 'setup',
      setup_stage: 'world',
      setup_data: {}
    });
    setCampaign(newCampaign);
    // Initial DM greeting
    sendInitialMessage(newCampaign, ctx);
  };

  const sendInitialMessage = async (camp, ctx) => {
    setLoading(true);
    try {
      const greetingPrompt = ctx
        ? `The player is continuing from a saved story. ${ctx}\n\nWelcome them back and ask how they'd like to continue this story — same character or new, and any changes to the world.`
        : `Welcome the adventurer. Say something like: "Welcome, adventurer. Before we begin, let's build your world, your story, and your character. I'll guide you through everything." Then ask about what kind of world they want (original fantasy, traditional high-fantasy, dark fantasy, horror, comedic, political intrigue, low/high magic, or custom). Ask ONE question.`;
      const res = await base44.functions.invoke('dm_engine', {
        mode: 'setup',
        campaign_id: camp.id,
        campaign: camp,
        setup_data: {},
        messages: [{ sender: 'player', content: greetingPrompt }]
      });
      const parsed = parseDMReply(res.data.reply);
      const dmMsg = { session_id: camp.id, campaign_id: camp.id, sender: 'dm', content: parsed.narration };
      await base44.entities.Message.create(dmMsg);
      setMessages([dmMsg]);
    } catch (e) {
      const errMsg = { session_id: camp.id, campaign_id: camp.id, sender: 'dm', content: 'The realms seem hazy... please try again.' };
      setMessages([errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    const playerMsg = { session_id: campaign.id, campaign_id: campaign.id, sender: 'player', content: userText };
    setMessages(prev => [...prev, playerMsg]);
    await base44.entities.Message.create(playerMsg);
    setLoading(true);
    try {
      const allMsgs = [...messages, playerMsg];
      const res = await base44.functions.invoke('dm_engine', {
        mode: 'setup',
        campaign_id: campaign.id,
        campaign: { ...campaign, setup_stage: stage },
        setup_data: setupData,
        messages: allMsgs
      });
      const parsed = parseDMReply(res.data.reply);
      const dmMsg = { session_id: campaign.id, campaign_id: campaign.id, sender: 'dm', content: parsed.narration };
      await base44.entities.Message.create(dmMsg);
      setMessages(prev => [...prev, dmMsg]);

      // Handle stage completion
      if (parsed.stageComplete) {
        const nextStage = parsed.stageComplete;
        setStage(nextStage);
        const newSetupData = { ...setupData };
        if (parsed.worldData) newSetupData.world = parsed.worldData;
        if (parsed.characterData) newSetupData.character = parsed.characterData;
        setSetupData(newSetupData);
        await base44.entities.Campaign.update(campaign.id, { setup_stage: nextStage, setup_data: newSetupData });

        if (nextStage === 'begin' || parsed.characterData) {
          // Save character and transition to active
          await transitionToActive(parsed.characterData || newSetupData.character, parsed.worldData || newSetupData.world);
        }
      }
      if (parsed.worldData) {
        const newSetupData = { ...setupData, world: parsed.worldData };
        setSetupData(newSetupData);
        await base44.entities.Campaign.update(campaign.id, { setup_data: newSetupData });
      }
      if (parsed.characterData) {
        const newSetupData = { ...setupData, character: parsed.characterData };
        setSetupData(newSetupData);
        await base44.entities.Campaign.update(campaign.id, { setup_data: newSetupData });
      }
    } catch (e) {
      const errMsg = { session_id: campaign.id, campaign_id: campaign.id, sender: 'dm', content: 'A magical disturbance interrupted the connection. Please try again.' };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const transitionToActive = async (charData, worldData) => {
    let characterId = campaign.character_id;
    if (charData) {
      const char = await base44.entities.Character.create({
        ...charData,
        level: charData.level || 1,
        xp: 0
      });
      characterId = char.id;
    }
    const updates = {
      status: 'active',
      character_id: characterId,
      setup_stage: 'begin'
    };
    if (worldData) {
      updates.setting = worldData.world_name || worldData.overview || '';
      updates.world_state = worldData;
      if (worldData.starting_location) updates.current_location = worldData.starting_location;
    }
    await base44.entities.Campaign.update(campaign.id, updates);
    // Navigate to the game after a short delay so the player sees the final setup message
    setTimeout(() => navigate(`/campaign/${campaign.id}`), 2000);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col">
      <div className="border-b border-stone-800 px-4 py-3 flex items-center gap-3 bg-stone-900/50">
        <Link to="/" aria-label="Back to dashboard" className="text-stone-400 hover:text-amber-300"><ArrowLeft className="w-5 h-5" /></Link>
        <Sparkles className="w-5 h-5 text-amber-500" aria-hidden="true" />
        <h1 className="font-serif text-amber-200">Campaign Setup</h1>
        <span className="text-xs text-stone-500 capitalize">· Stage: {stage}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full">
        {messages.map((m, i) => (
          <ChatMessage key={i} message={m} isLatest={i === messages.length - 1} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-stone-500 text-sm ml-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span>The DM is weaving the tale...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-stone-800 p-4 bg-stone-900/50">
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Respond to the Dungeon Master..."
            rows={1}
            aria-label="Type your response"
            className="flex-1 px-4 py-3 bg-stone-950 border border-amber-900/40 rounded-lg text-stone-200 placeholder-stone-500 resize-none focus:outline-none focus:ring-2 focus:ring-amber-700/50 focus:border-amber-700"
          />
          <button onClick={send} disabled={loading || !input.trim()} aria-label="Send message" className="px-4 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-amber-50 rounded-lg transition-all">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}