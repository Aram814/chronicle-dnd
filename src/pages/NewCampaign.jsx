import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Send, Sparkles } from 'lucide-react';
import ChatMessage from '@/components/ChatMessage';
import { parseDMReply } from '@/lib/dndClient';
import ScreenHeader from '@/components/ScreenHeader';
import MatureToggle from '@/components/MatureToggle';
import CharacterSetup from '@/components/CharacterSetup';
import CampaignSetup from '@/components/CampaignSetup';

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
  const [mature, setMature] = useState(false);
  const [step, setStep] = useState('character');
  const [creating, setCreating] = useState(false);
  const [character, setCharacter] = useState(null);
  const messagesEndRef = useRef(null);
  // Guards against duplicate campaign creation (StrictMode/HMR re-mounts) and
  // tracks the in-flight campaign so abandoned setups can be cleaned up.
  const initRef = useRef(false);
  const campaignRef = useRef(null);
  const completedRef = useRef(false);
  const cancelledRef = useRef(false);
  // True once the greeting or any player message has been persisted — meaning the
  // user actually engaged with setup, so their campaign should survive unmount.
  const engagedRef = useRef(false);
  // True when we're resuming an existing setup campaign (not creating a new one).
  const resumedRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    if (!initRef.current) {
      initRef.current = true;
      init();
    }
    return () => {
      // Mark this mount cancelled so a create that resolves after unmount
      // cleans up its orphan instead of leaving an "Untitled Campaign".
      cancelledRef.current = true;
      // Keep the campaign when the user engaged with setup, is resuming an existing
      // setup, or finished setup — so progress survives navigating back to home.
      // Only a never-touched orphan ("Untitled Campaign" with no messages) is removed.
      if (completedRef.current || engagedRef.current || resumedRef.current) return;
      const camp = campaignRef.current;
      if (!camp) return; // create still in flight; init() will delete the orphan
      campaignRef.current = null;
      initRef.current = false;
      base44.entities.Campaign.delete(camp.id).catch(() => {});
      base44.entities.Message.deleteMany({ campaign_id: camp.id }).catch(() => {});
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const init = async () => {
    // Resume an existing in-progress setup campaign instead of creating a new one
    const resumeId = searchParams.get('resume');
    if (resumeId) {
      try {
        const existing = await base44.entities.Campaign.get(resumeId);
        if (cancelledRef.current) return;
        resumedRef.current = true;
        campaignRef.current = existing;
        setCampaign(existing);
        setMature(!!existing.mature_content);
        setStep(existing.character_id ? 'chat' : 'character');
        setSetupData(existing.setup_data || {});
        setStage(existing.setup_stage || 'world');
        const msgs = await base44.entities.Message.filter({ campaign_id: resumeId });
        if (cancelledRef.current) return;
        setMessages(msgs || []);
        return;
      } catch (e) {
        // Resume target missing — fall through to create a fresh campaign
      }
    }
    let ctx = '';
    if (storyId) {
      try {
        const s = await base44.entities.SavedStory.get(storyId);
        setStory(s);
        ctx = `Continuing from a saved story: ${s.name}\nPremise: ${s.premise || ''}\nCurrent situation: ${s.current_situation || ''}\nMajor events: ${(s.major_events || []).join(', ')}\nImportant NPCs: ${(s.important_npcs || []).join(', ')}\nUnresolved quests: ${(s.unresolved_quests || []).join(', ')}`;
        setStoryContext(ctx);
      } catch (e) { /* ignore */ }
    }
    // Race guard: a concurrent init (StrictMode/HMR) may have already created one.
    if (campaignRef.current) return;
    const newCampaign = await base44.entities.Campaign.create({
      name: storyId ? 'New Campaign' : 'Untitled Campaign',
      status: 'setup',
      setup_stage: 'world',
      setup_data: {}
    });
    // If the component unmounted while we were creating, clean up the orphan
    // so it doesn't linger on the dashboard as an "Untitled Campaign".
    if (cancelledRef.current) {
      base44.entities.Campaign.delete(newCampaign.id).catch(() => {});
      return;
    }
    if (campaignRef.current) {
      // Duplicate from a concurrent init — discard it.
      base44.entities.Campaign.delete(newCampaign.id).catch(() => {});
      return;
    }
    campaignRef.current = newCampaign;
    setCampaign(newCampaign);
    setMature(!!newCampaign.mature_content);
    if (storyId) {
      // Continuing a saved story: go straight to world-setup chat.
      setStep('chat');
      sendInitialMessage(newCampaign, null, ctx);
    } else {
      // Fresh campaign: build the character first, then start world setup.
      setStep('character');
    }
  };

  const sendInitialMessage = async (camp, character, ctx) => {
    setLoading(true);
    try {
      const charLine = character
        ? `The player has just created their character: ${character.name}, a ${character.species} ${character.class} (Level 1). Background: ${character.background || '—'}. Briefly welcome their hero, then begin WORLD SETUP. Ask what kind of world they want (original fantasy, traditional high-fantasy, dark fantasy, horror, comedic, political intrigue, low/high magic, or custom). Ask ONE question.`
        : `Welcome the adventurer. Before we begin, let's build the world and tone for the campaign. Ask about what kind of world they want (original fantasy, traditional high-fantasy, dark fantasy, horror, comedic, political intrigue, low/high magic, or custom). Ask ONE question.`;
      const greetingPrompt = ctx
        ? `The player is continuing from a saved story. ${ctx}\n\nWelcome them back and ask how they'd like to continue this story — same character or new, and any changes to the world.`
        : charLine;
      const res = await base44.functions.invoke('dm_engine', {
        mode: 'setup',
        campaign_id: camp.id,
        campaign: camp,
        setup_data: {},
        messages: [{ sender: 'player', content: greetingPrompt }]
      });
      const parsed = parseDMReply(res.data.reply);
      if (cancelledRef.current) return;
      const dmMsg = { session_id: camp.id, campaign_id: camp.id, sender: 'dm', content: parsed.narration };
      await base44.entities.Message.create(dmMsg);
      engagedRef.current = true;
      setMessages([dmMsg]);
    } catch (e) {
      const errMsg = { session_id: camp.id, campaign_id: camp.id, sender: 'dm', content: 'The realms seem hazy... please try again.' };
      engagedRef.current = true;
      setMessages([errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    engagedRef.current = true;
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
        setSetupData(newSetupData);
        await base44.entities.Campaign.update(campaign.id, { setup_stage: nextStage, setup_data: newSetupData });
        if (nextStage === 'begin') {
          await transitionToActive(parsed.worldData || newSetupData.world);
        }
      }
      if (parsed.worldData) {
        const newSetupData = { ...setupData, world: parsed.worldData };
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

  const transitionToActive = async (payload) => {
    completedRef.current = true; // mark setup finished so cleanup keeps the record
    const updates = { status: 'active', setup_stage: 'begin' };
    if (payload) {
      if (payload.name) updates.name = payload.name;
      if (payload.setting) updates.setting = payload.setting;
      if (payload.description) updates.description = payload.description;
      if (payload.tone) updates.tone = payload.tone;
      if (payload.difficulty) updates.difficulty = payload.difficulty;
      if (payload.dm_style) updates.dm_style = payload.dm_style;
      if (payload.world_state) updates.world_state = payload.world_state;
      if (payload.current_location) updates.current_location = payload.current_location;
    }
    await base44.entities.Campaign.update(campaign.id, updates);
    // Navigate to the game after a short delay so the player sees the final setup message
    setTimeout(() => navigate(`/campaign/${campaign.id}`), 2000);
  };

  const handleCharacterCreated = async (charData) => {
    setCreating(true);
    try {
      // An existing character (already has an id) is linked, not re-created.
      const char = charData.id
        ? charData
        : await base44.entities.Character.create({ ...charData, level: 1, xp: 0 });
      const isDefaultName = campaign.name === 'Untitled Campaign' || campaign.name === 'New Campaign';
      const name = isDefaultName ? `${char.name}'s Tale` : campaign.name;
      const updated = { ...campaign, character_id: char.id, name, setup_stage: 'world' };
      await base44.entities.Campaign.update(campaign.id, { character_id: char.id, name, setup_stage: 'world' });
      setCampaign(updated);
      setCharacter(char);
      setStage('world');
      setStep('campaign');
    } finally {
      setCreating(false);
    }
  };

  const handleCampaignChosen = async (payload) => {
    if (payload && payload.mode === 'guide') {
      setStep('chat');
      await sendInitialMessage(campaign, character, storyContext);
      return;
    }
    setCreating(true);
    try {
      await transitionToActive(payload);
    } finally {
      setCreating(false);
    }
  };

  const toggleMature = async (val) => {
    setMature(val);
    if (!campaign) return;
    setCampaign({ ...campaign, mature_content: val });
    await base44.entities.Campaign.update(campaign.id, { mature_content: val }).catch(() => {});
  };

  if (step === 'character') {
    return <CharacterSetup onComplete={handleCharacterCreated} saving={creating} />;
  }

  if (step === 'campaign') {
    return <CampaignSetup onComplete={handleCampaignChosen} saving={creating} characterName={character?.name} mature={mature} onToggleMature={toggleMature} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ScreenHeader
        title="Campaign Setup"
        icon={Sparkles}
        actions={
          <>
            <MatureToggle enabled={mature} onChange={toggleMature} />
            <span className="text-xs text-muted-foreground capitalize hidden sm:inline">· {stage}</span>
          </>
        }
      />
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full">
        {messages.map((m, i) => (
          <ChatMessage key={i} message={m} isLatest={i === messages.length - 1} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm ml-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span>The DM is weaving the tale...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-border p-4 bg-card/50">
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Respond to the Dungeon Master..."
            rows={1}
            aria-label="Type your response"
            className="flex-1 px-4 py-3 bg-background border border-amber-900/40 rounded-lg text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-amber-700/50 focus:border-amber-700"
          />
          <button onClick={send} disabled={loading || !input.trim()} aria-label="Send message" className="touch-target px-4 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-amber-50 rounded-lg transition-all">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}