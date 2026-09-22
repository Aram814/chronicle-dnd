import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, Send, Heart, Shield, Swords, MapPin, Scroll, Users, BookOpen,
  Dices, Bookmark, X, Menu, Star, Crosshair
} from 'lucide-react';
import ChatMessage from '@/components/ChatMessage';
import DiceRoller from '@/components/DiceRoller';
import { parseDMReply, abilityModifier, SKILL_LABELS, ABILITY_LABELS, proficiencyBonusForLevel, checkLevelUp } from '@/lib/dndClient';
import { rollForRequest } from '@/lib/dice';

export default function CampaignGame() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [character, setCharacter] = useState(null);
  const [messages, setMessages] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [quests, setQuests] = useState([]);
  const [locations, setLocations] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [leftPanel, setLeftPanel] = useState(null); // null | 'sheet' | 'inventory' | 'spells' | 'quests' | 'journal' | 'map' | 'npcs'
  const [rightOpen, setRightOpen] = useState(false);
  const [diceOpen, setDiceOpen] = useState(false);
  const [pendingRoll, setPendingRoll] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (id) loadAll();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadAll = async () => {
    try {
      const camp = await base44.entities.Campaign.get(id);
      setCampaign(camp);
      if (camp.character_id) {
        const char = await base44.entities.Character.get(camp.character_id);
        setCharacter(char);
      }
      const [msgs, npcList, questList, locList] = await Promise.all([
        base44.entities.Message.filter({ campaign_id: id }),
        base44.entities.NPC.filter({ campaign_id: id }),
        base44.entities.Quest.filter({ campaign_id: id }),
        base44.entities.Location.filter({ campaign_id: id })
      ]);
      setMessages(msgs || []);
      setNpcs(npcList || []);
      setQuests(questList || []);
      setLocations(locList || []);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshCharacter = async () => {
    if (campaign?.character_id) {
      const char = await base44.entities.Character.get(campaign.character_id);
      setCharacter(char);
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    const playerMsg = { session_id: id, campaign_id: id, sender: 'player', content: userText };
    setMessages(prev => [...prev, playerMsg]);
    await base44.entities.Message.create(playerMsg);
    await getDMResponse([...messages, playerMsg]);
  };

  const getDMResponse = async (allMsgs, diceResult = null) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('dm_engine', {
        mode: 'play',
        campaign_id: id,
        campaign,
        character,
        npcs,
        quests,
        locations,
        messages: allMsgs,
        diceResult
      });
      const parsed = parseDMReply(res.data.reply);
      const dmMsg = { session_id: id, campaign_id: id, sender: 'dm', content: parsed.narration, roll_request: parsed.rollRequest };
      await base44.entities.Message.create(dmMsg);
      setMessages(prev => [...prev, dmMsg]);
      setPendingRoll(parsed.rollRequest);

      // Apply state updates
      if (parsed.stateUpdates.length > 0) {
        await applyStateUpdates(parsed.stateUpdates);
      }
    } catch (e) {
      const errMsg = { session_id: id, campaign_id: id, sender: 'dm', content: '⚠ A magical disturbance interrupted the connection. Your progress is safe — try again.' };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const applyStateUpdates = async (updates) => {
    let charUpdates = {};
    let campaignUpdates = {};
    let needCharSave = false;
    let needCampaignSave = false;
    const npcAdds = [];
    const npcStatuses = [];
    const questAdds = [];
    const questUpdates = [];
    const locAdds = [];

    for (const u of updates) {
      switch (u.type) {
        case 'hp_change': {
          const amt = parseInt(u.arg1, 10);
          const newHp = Math.max(0, Math.min((character.max_hp || 1), (character.hp || 0) + amt));
          charUpdates.hp = newHp;
          needCharSave = true;
          break;
        }
        case 'xp_gain': {
          const xp = parseInt(u.arg1, 10);
          const newXp = (character.xp || 0) + xp;
          charUpdates.xp = newXp;
          const { leveledUp, newLevel } = checkLevelUp({ ...character, xp: newXp });
          if (leveledUp) {
            charUpdates.level = newLevel;
            charUpdates.proficiency_bonus = proficiencyBonusForLevel(newLevel);
          }
          needCharSave = true;
          break;
        }
        case 'gold_change': {
          charUpdates.gold = (character.gold || 0) + parseInt(u.arg1, 10);
          needCharSave = true;
          break;
        }
        case 'item_add': {
          const inv = [...(character.inventory || []), { name: u.arg1, description: u.arg2 || '' }];
          charUpdates.inventory = inv;
          needCharSave = true;
          break;
        }
        case 'item_remove': {
          charUpdates.inventory = (character.inventory || []).filter(i => (i.name || i) !== u.arg1);
          needCharSave = true;
          break;
        }
        case 'condition_add': {
          charUpdates.conditions = [...(character.conditions || []), u.arg1];
          needCharSave = true;
          break;
        }
        case 'condition_remove': {
          charUpdates.conditions = (character.conditions || []).filter(c => c !== u.arg1);
          needCharSave = true;
          break;
        }
        case 'npc_add':
          npcAdds.push({ campaign_id: id, name: u.arg1, description: u.arg2, personality: u.arg3, relationship: u.arg4, location: u.arg5 });
          break;
        case 'npc_status':
          npcStatuses.push({ name: u.arg1, status: u.arg2 });
          break;
        case 'quest_add':
          questAdds.push({ campaign_id: id, name: u.arg1, type: u.arg2 || 'side', description: u.arg3, status: 'active' });
          break;
        case 'quest_update':
          questUpdates.push({ name: u.arg1, status: u.arg2 });
          break;
        case 'location_add':
          locAdds.push({ campaign_id: id, name: u.arg1, type: u.arg2, description: u.arg3, discovered: true });
          break;
        case 'current_location':
          campaignUpdates.current_location = u.arg1;
          needCampaignSave = true;
          break;
        case 'combat_start':
          campaignUpdates.in_combat = true;
          try { campaignUpdates.combat_state = JSON.parse(u.arg1); } catch (e) { /* ignore */ }
          needCampaignSave = true;
          break;
        case 'combat_end':
          campaignUpdates.in_combat = false;
          campaignUpdates.combat_state = {};
          needCampaignSave = true;
          break;
        default: break;
      }
    }

    if (needCharSave) {
      const updated = await base44.entities.Character.update(character.id, charUpdates);
      setCharacter(updated);
    }
    if (needCampaignSave) {
      const updatedCamp = await base44.entities.Campaign.update(id, campaignUpdates);
      setCampaign(updatedCamp);
    }
    if (npcAdds.length) {
      await base44.entities.NPC.bulkCreate(npcAdds);
    }
    if (npcStatuses.length) {
      for (const ns of npcStatuses) {
        const npc = npcs.find(n => n.name.toLowerCase() === ns.name.toLowerCase());
        if (npc) await base44.entities.NPC.update(npc.id, { status: ns.status });
      }
    }
    if (questAdds.length) await base44.entities.Quest.bulkCreate(questAdds);
    if (questUpdates.length) {
      for (const qu of questUpdates) {
        const q = quests.find(q => q.name.toLowerCase() === qu.name.toLowerCase());
        if (q) await base44.entities.Quest.update(q.id, { status: qu.status });
      }
    }
    if (locAdds.length) await base44.entities.Location.bulkCreate(locAdds);

    // Reload related data
    if (npcAdds.length || npcStatuses.length || questAdds.length || questUpdates.length || locAdds.length) {
      const [npcList, questList, locList] = await Promise.all([
        base44.entities.NPC.filter({ campaign_id: id }),
        base44.entities.Quest.filter({ campaign_id: id }),
        base44.entities.Location.filter({ campaign_id: id })
      ]);
      setNpcs(npcList || []);
      setQuests(questList || []);
      setLocations(locList || []);
    }
  };

  const handleRollRequest = useCallback((rollRequest) => {
    setPendingRoll(rollRequest);
  }, []);

  const executeRoll = async (rollRequest) => {
    if (!character) return;
    const rollData = rollForRequest(character, rollRequest);
    // Save dice roll record
    await base44.entities.DiceRoll.create({
      campaign_id: id,
      character_id: character.id,
      dice_type: rollData.dice_type,
      modifier: rollData.modifier,
      result: rollData.result,
      total: rollData.total,
      reason: rollData.reason
    });
    // Add dice roll as a player message in chat
    const rollMsg = {
      session_id: id,
      campaign_id: id,
      sender: 'player',
      content: `I roll for ${rollData.label || rollData.reason}.`,
      dice_roll: rollData
    };
    await base44.entities.Message.create(rollMsg);
    setMessages(prev => [...prev, rollMsg]);
    setPendingRoll(null);
    // Send to DM with the result
    await getDMResponse([...messages, rollMsg], rollData);
  };

  const handleManualRoll = async (rollData) => {
    await base44.entities.DiceRoll.create({
      campaign_id: id,
      character_id: character?.id,
      dice_type: rollData.dice_type,
      modifier: rollData.modifier,
      result: rollData.result,
      total: rollData.total,
      reason: rollData.reason
    });
    const rollMsg = {
      session_id: id,
      campaign_id: id,
      sender: 'player',
      content: `Manual roll: ${rollData.dice_type}`,
      dice_roll: { ...rollData, label: rollData.reason }
    };
    await base44.entities.Message.create(rollMsg);
    setMessages(prev => [...prev, rollMsg]);
  };

  const saveStory = async () => {
    if (!confirm('Save this campaign as a story? The AI will summarize your adventure.')) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('dm_engine', {
        mode: 'save_story',
        campaign_id: id,
        campaign, character, npcs, quests, locations,
        messages
      });
      const story = res.data.story;
      if (story && story.name) {
        await base44.entities.SavedStory.create({ ...story, campaign_id: id });
        alert('Story saved! You can find it in Saved Stories on your dashboard.');
      }
    } catch (e) {
      alert('Failed to save story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!campaign) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-stone-950 text-stone-200 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="border-b border-stone-800 px-4 py-2.5 flex items-center gap-3 bg-stone-900/70 flex-shrink-0">
        <Link to="/" aria-label="Back to dashboard" className="text-stone-400 hover:text-amber-300"><ArrowLeft className="w-5 h-5" /></Link>
        <Swords className="w-5 h-5 text-amber-500" aria-hidden="true" />
        <h1 className="font-serif text-amber-200 flex-1 truncate">{campaign.name}</h1>
        {campaign.in_combat && <span className="text-xs px-2 py-1 bg-red-900/50 text-red-300 border border-red-700/40 rounded-full">⚔ Combat</span>}
        <button onClick={() => setDiceOpen(true)} aria-label="Open dice roller" className="p-2 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded-lg transition-all" title="Dice Roller">
          <Dices className="w-5 h-5" />
        </button>
        <button onClick={saveStory} aria-label="Save story" className="p-2 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded-lg transition-all" title="Save Story">
          <Bookmark className="w-5 h-5" />
        </button>
        <button onClick={() => setRightOpen(!rightOpen)} aria-label="Open campaign info" className="p-2 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded-lg transition-all md:hidden" title="Info">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile panel nav */}
      <div className="md:hidden border-b border-stone-800 px-2 py-1.5 flex gap-1 overflow-x-auto bg-stone-900/70 flex-shrink-0" role="navigation" aria-label="Game panels">
        <MobileNavButton active={leftPanel === 'sheet'} onClick={() => setLeftPanel(leftPanel === 'sheet' ? null : 'sheet')} icon={<Users className="w-4 h-4" />} label="Sheet" />
        <MobileNavButton active={leftPanel === 'inventory'} onClick={() => setLeftPanel(leftPanel === 'inventory' ? null : 'inventory')} icon={<BookOpen className="w-4 h-4" />} label="Bag" />
        <MobileNavButton active={leftPanel === 'spells'} onClick={() => setLeftPanel(leftPanel === 'spells' ? null : 'spells')} icon={<Star className="w-4 h-4" />} label="Spells" />
        <MobileNavButton active={leftPanel === 'quests'} onClick={() => setLeftPanel(leftPanel === 'quests' ? null : 'quests')} icon={<Scroll className="w-4 h-4" />} label="Quests" />
        <MobileNavButton active={leftPanel === 'npcs'} onClick={() => setLeftPanel(leftPanel === 'npcs' ? null : 'npcs')} icon={<Users className="w-4 h-4" />} label="NPCs" />
        <MobileNavButton active={leftPanel === 'map'} onClick={() => setLeftPanel(leftPanel === 'map' ? null : 'map')} icon={<MapPin className="w-4 h-4" />} label="Map" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - desktop */}
        <div className="hidden md:flex w-64 border-r border-stone-800 bg-stone-900/40 flex-col">
          <LeftSidebar character={character} campaign={campaign} panel={leftPanel} setPanel={setLeftPanel} npcs={npcs} quests={quests} locations={locations} />
        </div>

        {/* Center chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="max-w-3xl mx-auto">
              {messages.map((m, i) => (
                <ChatMessage key={i} message={m} isLatest={i === messages.length - 1 && m.sender === 'dm'} onRollRequest={handleRollRequest} />
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-stone-500 text-sm ml-2 mb-4">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span>The DM is weaving the tale...</span>
                </div>
              )}
              {pendingRoll && !loading && (
                <div className="my-3 p-4 bg-amber-950/40 border border-amber-800/50 rounded-xl">
                  <p className="text-sm text-amber-200 mb-3">⚔ The DM requests a roll: <strong>{pendingRoll.reason}</strong></p>
                  <button onClick={() => executeRoll(pendingRoll)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg font-semibold transition-all">
                    <Dices className="w-5 h-5" /> Roll {pendingRoll.skillOrAbility}
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="border-t border-stone-800 p-3 bg-stone-900/50 flex-shrink-0">
            <div className="max-w-3xl mx-auto flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="What do you do?"
                rows={1}
                aria-label="Type your action"
                className="flex-1 px-4 py-3 bg-stone-950 border border-amber-900/40 rounded-lg text-stone-200 placeholder-stone-500 resize-none focus:outline-none focus:ring-2 focus:ring-amber-700/50 focus:border-amber-700 max-h-32"
              />
              <button onClick={send} disabled={loading || !input.trim()} aria-label="Send message" className="px-4 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-amber-50 rounded-lg transition-all">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar - desktop */}
        <div className="hidden md:flex w-64 border-l border-stone-800 bg-stone-900/40 flex-col overflow-y-auto">
          <RightSidebar campaign={campaign} character={character} quests={quests} npcs={npcs} />
        </div>
      </div>

      {/* Mobile right drawer */}
      {rightOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setRightOpen(false)} />
          <div className="relative w-72 bg-stone-900 border-l border-stone-800 overflow-y-auto ml-auto">
            <button onClick={() => setRightOpen(false)} aria-label="Close panel" className="absolute top-2 right-2 p-1 text-stone-400"><X className="w-5 h-5" /></button>
            <div className="p-4 pt-12">
              <RightSidebar campaign={campaign} character={character} quests={quests} npcs={npcs} />
            </div>
          </div>
        </div>
      )}

      {/* Left panel drawer (mobile handled via overlay) */}
      {leftPanel && (
        <div className="fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setLeftPanel(null)} />
          <div className="relative w-80 bg-stone-900 border-r border-stone-800 overflow-y-auto max-h-full">
            <button onClick={() => setLeftPanel(null)} aria-label="Close panel" className="absolute top-2 right-2 p-1 text-stone-400 z-10"><X className="w-5 h-5" /></button>
            <LeftSidebarContent character={character} campaign={campaign} panel={leftPanel} npcs={npcs} quests={quests} locations={locations} />
          </div>
        </div>
      )}

      {/* Dice drawer */}
      {diceOpen && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDiceOpen(false)} />
          <div className="relative bg-stone-900 border border-amber-900/40 rounded-t-2xl md:rounded-2xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-amber-200 flex items-center gap-2"><Dices className="w-5 h-5" /> Dice Roller</h3>
              <button onClick={() => setDiceOpen(false)} aria-label="Close dice roller" className="text-stone-400"><X className="w-5 h-5" /></button>
            </div>
            <DiceRoller onRoll={handleManualRoll} />
          </div>
        </div>
      )}
    </div>
  );
}

function LeftSidebar({ character, campaign, panel, setPanel, npcs, quests, locations }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-stone-800">
        {character ? (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-lg bg-gradient-to-br from-amber-900/50 to-stone-800 border border-amber-700/40 flex items-center justify-center text-2xl font-bold text-amber-400 font-serif mb-2">
              {character.name?.[0]?.toUpperCase()}
            </div>
            <h3 className="font-serif text-amber-200">{character.name}</h3>
            <p className="text-xs text-stone-400">{character.species} {character.class}</p>
            <div className="flex justify-center gap-3 mt-2 text-xs">
              <span className="flex items-center gap-1 text-rose-300"><Heart className="w-3 h-3" />{character.hp}/{character.max_hp}</span>
              <span className="flex items-center gap-1 text-sky-300"><Shield className="w-3 h-3" />{character.ac}</span>
              <span className="text-amber-300">Lvl {character.level}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-stone-500 text-center">No character</p>
        )}
        {campaign.current_location && (
          <p className="text-xs text-amber-700/80 text-center mt-2 flex items-center justify-center gap-1"><MapPin className="w-3 h-3" />{campaign.current_location}</p>
        )}
      </div>
      <div className="p-2 flex-1 overflow-y-auto">
        <NavButton active={panel === 'sheet'} onClick={() => setPanel(panel === 'sheet' ? null : 'sheet')} icon={<Users className="w-4 h-4" />} label="Character Sheet" />
        <NavButton active={panel === 'inventory'} onClick={() => setPanel(panel === 'inventory' ? null : 'inventory')} icon={<BookOpen className="w-4 h-4" />} label="Inventory" />
        <NavButton active={panel === 'spells'} onClick={() => setPanel(panel === 'spells' ? null : 'spells')} icon={<Star className="w-4 h-4" />} label="Spells" />
        <NavButton active={panel === 'quests'} onClick={() => setPanel(panel === 'quests' ? null : 'quests')} icon={<Scroll className="w-4 h-4" />} label="Quest Journal" />
        <NavButton active={panel === 'npcs'} onClick={() => setPanel(panel === 'npcs' ? null : 'npcs')} icon={<Users className="w-4 h-4" />} label="NPCs" />
        <NavButton active={panel === 'map'} onClick={() => setPanel(panel === 'map' ? null : 'map')} icon={<MapPin className="w-4 h-4" />} label="World Map" />
      </div>
      {panel && (
        <div className="border-t border-stone-800 p-3 max-h-[50vh] overflow-y-auto hidden md:block">
          <LeftSidebarContent character={character} campaign={campaign} panel={panel} npcs={npcs} quests={quests} locations={locations} />
        </div>
      )}
    </div>
  );
}

function LeftSidebarContent({ character, campaign, panel, npcs, quests, locations }) {
  if (panel === 'sheet' && character) {
    const scores = character.ability_scores || {};
    return (
      <div className="space-y-3">
        <h4 className="font-serif text-amber-200 text-sm">Ability Scores</h4>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(ABILITY_LABELS).map(([key, label]) => {
            const score = scores[key] || 10;
            const mod = abilityModifier(score);
            return (
              <div key={key} className="bg-stone-950/60 border border-stone-800 rounded p-2 text-center">
                <div className="text-xs text-stone-500">{label.slice(0, 3)}</div>
                <div className="text-lg font-bold text-amber-200">{score}</div>
                <div className="text-xs text-stone-400">{mod >= 0 ? `+${mod}` : mod}</div>
              </div>
            );
          })}
        </div>
        <div className="text-xs text-stone-400 space-y-1">
          <div>Speed: {character.speed}</div>
          <div>Initiative: +{abilityModifier(scores.dex || 10)}</div>
          <div>Proficiency: +{character.proficiency_bonus || 2}</div>
          {character.conditions?.length > 0 && <div className="text-amber-400">Conditions: {character.conditions.join(', ')}</div>}
        </div>
      </div>
    );
  }
  if (panel === 'inventory' && character) {
    return (
      <div className="space-y-2">
        <h4 className="font-serif text-amber-200 text-sm">Inventory</h4>
        <div className="text-sm text-amber-300">Gold: {character.gold || 0}</div>
        {(character.inventory || []).length === 0 ? (
          <p className="text-xs text-stone-500">Empty</p>
        ) : (
          <ul className="space-y-1">
            {character.inventory.map((item, i) => (
              <li key={i} className="text-sm text-stone-300 bg-stone-950/50 border border-stone-800 rounded px-2 py-1">
                {item.name || item}
                {item.description && <p className="text-xs text-stone-500">{item.description}</p>}
              </li>
            ))}
          </ul>
        )}
        {character.weapons?.length > 0 && (
          <>
            <h4 className="font-serif text-amber-200 text-sm pt-2">Weapons</h4>
            {character.weapons.map((w, i) => <div key={i} className="text-sm text-stone-300">{w.name || w}</div>)}
          </>
        )}
      </div>
    );
  }
  if (panel === 'spells' && character) {
    return (
      <div className="space-y-2">
        <h4 className="font-serif text-amber-200 text-sm">Spells</h4>
        {(character.spells || []).length === 0 ? (
          <p className="text-xs text-stone-500">No spells known</p>
        ) : (
          <ul className="space-y-1">
            {character.spells.map((s, i) => (
              <li key={i} className="text-sm text-stone-300 bg-stone-950/50 border border-stone-800 rounded px-2 py-1">
                {s.name || s}
                {s.level && <span className="text-xs text-stone-500"> · Lvl {s.level}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  if (panel === 'quests') {
    return (
      <div className="space-y-2">
        <h4 className="font-serif text-amber-200 text-sm">Quest Journal</h4>
        {quests.length === 0 ? <p className="text-xs text-stone-500">No quests yet</p> : (
          quests.map(q => (
            <div key={q.id} className="bg-stone-950/50 border border-stone-800 rounded p-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-200">{q.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${q.status === 'completed' ? 'bg-emerald-900/40 text-emerald-300' : q.status === 'failed' ? 'bg-red-900/40 text-red-300' : 'bg-amber-900/40 text-amber-300'}`}>{q.status}</span>
              </div>
              {q.type === 'main' && <span className="text-xs text-amber-500">Main Quest</span>}
              {q.description && <p className="text-xs text-stone-500 mt-1">{q.description}</p>}
            </div>
          ))
        )}
      </div>
    );
  }
  if (panel === 'npcs') {
    return (
      <div className="space-y-2">
        <h4 className="font-serif text-amber-200 text-sm">Known NPCs</h4>
        {npcs.length === 0 ? <p className="text-xs text-stone-500">No NPCs discovered</p> : (
          npcs.map(n => (
            <div key={n.id} className="bg-stone-950/50 border border-stone-800 rounded p-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-200">{n.name}</span>
                <span className={`text-xs ${n.status === 'dead' ? 'text-red-400' : 'text-stone-500'}`}>{n.status}</span>
              </div>
              {n.relationship && <p className="text-xs text-amber-600">Relationship: {n.relationship}</p>}
              {n.description && <p className="text-xs text-stone-500 mt-1">{n.description}</p>}
            </div>
          ))
        )}
      </div>
    );
  }
  if (panel === 'map') {
    return (
      <div className="space-y-2">
        <h4 className="font-serif text-amber-200 text-sm">World Map</h4>
        {locations.length === 0 ? <p className="text-xs text-stone-500">No locations discovered yet</p> : (
          <ul className="space-y-1">
            {locations.map(l => (
              <li key={l.id} className="text-sm text-stone-300 bg-stone-950/50 border border-stone-800 rounded px-2 py-1">
                <span className="text-amber-300">{l.name}</span>
                <span className="text-xs text-stone-500"> · {l.type}</span>
                {l.description && <p className="text-xs text-stone-500">{l.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  return null;
}

function RightSidebar({ campaign, character, quests, npcs }) {
  const activeQuests = quests.filter(q => q.status === 'active');
  const mainQuest = quests.find(q => q.type === 'main' && q.status === 'active');
  return (
    <div className="p-4 space-y-4">
      {mainQuest && (
        <div>
          <h4 className="text-xs uppercase text-amber-600 font-semibold mb-1">Current Objective</h4>
          <p className="text-sm text-amber-200">{mainQuest.name}</p>
          {mainQuest.description && <p className="text-xs text-stone-400 mt-1">{mainQuest.description}</p>}
        </div>
      )}
      {campaign.in_combat && campaign.combat_state && (
        <div>
          <h4 className="text-xs uppercase text-red-500 font-semibold mb-1 flex items-center gap-1"><Crosshair className="w-3 h-3" /> Combat</h4>
          <p className="text-xs text-stone-400">Combat is active. Roll initiative and take your actions.</p>
        </div>
      )}
      <div>
        <h4 className="text-xs uppercase text-amber-600 font-semibold mb-1">Active Quests</h4>
        {activeQuests.length === 0 ? <p className="text-xs text-stone-500">No active quests</p> : (
          <ul className="space-y-1">
            {activeQuests.map(q => <li key={q.id} className="text-xs text-stone-300">{q.name}</li>)}
          </ul>
        )}
      </div>
      {character && (
        <div>
          <h4 className="text-xs uppercase text-amber-600 font-semibold mb-1">Status</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between"><span class="text-stone-500">HP</span><span class="text-rose-300">{character.hp}/{character.max_hp}</span></div>
            <div className="flex justify-between"><span class="text-stone-500">AC</span><span class="text-sky-300">{character.ac}</span></div>
            <div className="flex justify-between"><span class="text-stone-500">XP</span><span class="text-amber-300">{character.xp || 0}</span></div>
            {character.conditions?.length > 0 && <div className="text-amber-400">Conditions: {character.conditions.join(', ')}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${active ? 'bg-amber-900/30 text-amber-200 border border-amber-800/40' : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'}`}>
      {icon} {label}
    </button>
  );
}

function MobileNavButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={active} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${active ? 'bg-amber-900/40 text-amber-200 border border-amber-800/50' : 'text-stone-400 hover:bg-stone-800/50'}`}>
      {icon} {label}
    </button>
  );
}