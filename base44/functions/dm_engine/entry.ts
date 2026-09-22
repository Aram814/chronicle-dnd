import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { buildCharacterContext, buildWorldContext, buildNPCContext, buildQuestContext, buildLocationContext, DM_SYSTEM_BASE } from '../../shared/dmPrompts.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    // dm_engine is invoked both by authenticated players (frontend) and by workflows
    // (service role). It only calls InvokeLLM via the service role and touches no
    // user-scoped data, so no auth gate is required.
    const body = await req.json();
    const { mode } = body;

    if (mode === 'setup') return await handleSetup(base44, body);
    if (mode === 'play') return await handlePlay(base44, body);
    if (mode === 'summarize') return await handleSummarize(base44, body);
    if (mode === 'generate_world') return await handleGenerateWorld(base44, body);
    if (mode === 'generate_character') return await handleGenerateCharacter(base44, body);
    if (mode === 'save_story') return await handleSaveStory(base44, body);
    if (mode === 'npc_consequence') return await handleNpcConsequence(base44, body);
    if (mode === 'generate_portrait') return await handleGeneratePortrait(base44, body);

    return Response.json({ error: 'Unknown mode' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

async function llm(base44, prompt, system, jsonSchema) {
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    model: 'automatic',
    ...(system ? {} : {}),
    ...(jsonSchema ? { response_json_schema: jsonSchema } : {})
  });
  return result;
}

async function handleSetup(base44, body) {
  const { campaign_id, messages, setup_data, campaign } = body;

  const setupStage = campaign.setup_stage || 'world';
  const system = `${DM_SYSTEM_BASE}

You are currently in CAMPAIGN SETUP mode. You are guiding the player through creating their campaign BEFORE the adventure begins. The setup progresses through stages: world -> tone -> character -> ready.

Current setup stage: ${setupStage}
Setup data so far: ${JSON.stringify(setup_data || {})}

The player has ALREADY created their character via the character builder (see the Campaign settings / character context). Do NOT ask them to create a character or gather character details — reference their existing hero when relevant.

Your job right now:
- If stage is "world": help the player choose/create their world. Ask about setting type (original fantasy, dark fantasy, horror, comedic, political intrigue, low/high magic, custom). Once they've decided, suggest a world name and brief overview, then move to tone.
- If stage is "tone": ask about desired tone(s) (serious, epic, dark, horror, comedic, whimsical, mystery, political intrigue, romance, survival, exploration, high adventure — multiple allowed), difficulty (casual/normal/challenging/hardcore), and DM style (story/rules/balanced/cinematic/tactical). Then move to ready.
- If stage is "ready": give a brief opening situation overview or ask if they want to discover through play. Then signal the campaign is ready to begin.

CONTENT RATING:
The campaign's mature_content setting is ${campaign && campaign.mature_content ? 'TRUE' : 'FALSE'}.
- If TRUE: 18+ mature content is allowed — adult themes, graphic violence, dark horror, romance, and morally complex situations are permitted. Keep it tasteful and story-driven.
- If FALSE: Keep content general/family-friendly (PG-13). No explicit sexual content, excessive gore, or deeply disturbing themes. If the player steers toward such content, gently redirect to tasteful alternatives.

Ask ONE question or one logical group of questions at a time. Be warm, welcoming, and concise. Do not overwhelm the player.

When you have gathered enough info for the current stage, include this line on its own:
[[STAGE_COMPLETE: <next stage>]]
where next stage is one of: tone, ready, begin

If you are generating a world and want to store structured world data, include:
[[WORLD_DATA: <JSON object with world_name, overview, continents, kingdoms, cities, factions, religions, conflicts> ]]`;

  const conversation = (messages || []).map(m => `${m.sender === 'player' ? 'PLAYER' : 'DM'}: ${m.content}`).join('\n\n');
  const prompt = `Campaign settings: ${JSON.stringify(campaign)}\n\nConversation so far:\n${conversation}\n\nContinue the setup conversation. Respond as the DM.`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, model: 'automatic' });
  return Response.json({ reply: res });
}

async function handlePlay(base44, body) {
  const { campaign_id, session_id, messages, campaign, character, npcs, quests, locations, diceResult } = body;

  let system = DM_SYSTEM_BASE + '\n\n';
  system += buildWorldContext(campaign);
  system += '\n' + buildCharacterContext(character);
  system += '\n' + buildNPCContext(npcs);
  system += '\n' + buildQuestContext(quests);
  system += '\n' + buildLocationContext(locations);
  system += '\n\nIMPORTANT: The character stats above are AUTHORITATIVE. Do not change them in narration. If the player takes damage, loses items, gains XP, etc., describe it — the application will update the actual stats based on your narration using the state update format below.';

  system += `

STATE UPDATES:
After your narration, if the game state changed, include one or more update commands on their own lines. Use ONLY these formats:
[[HP_CHANGE: <amount> ]]  (negative for damage, positive for healing)
[[XP_GAIN: <amount> ]]
[[ITEM_ADD: <item name> | <optional description> ]]
[[ITEM_REMOVE: <item name> ]]
[[GOLD_CHANGE: <amount> ]]
[[NPC_ADD: <name> | <description> | <personality> | <relationship> | <location> ]]
[[NPC_UPDATE: <name> | <field> | <value> ]]
[[NPC_STATUS: <name> | <status e.g. dead/alive/friendly/hostile> ]]
[[QUEST_ADD: <name> | <type main/side> | <description> ]]
[[QUEST_UPDATE: <name> | <status active/completed/failed> ]]
[[LOCATION_ADD: <name> | <type> | <description> ]]
[[LOCATION_UPDATE: <name> | <discovered true/false> ]]
[[COMBAT_START: <JSON array of combatants with name, hp, max_hp, initiative> ]]
[[COMBAT_END]]
[[LEVEL_UP]]
[[CONDITION_ADD: <condition name> ]]
[[CONDITION_REMOVE: <condition name> ]]
[[CURRENT_LOCATION: <location name> ]]
[[WORLD_EVENT: <event description> ]]

Only include updates that actually happened in this turn. If nothing changed, include no update lines.`;

  let conversation = (messages || []).slice(-20).map(m => {
    let line = `${m.sender === 'player' ? 'PLAYER' : 'DM'}: ${m.content}`;
    if (m.dice_roll) line += `\n[DICE ROLL RESULT: ${m.dice_roll.dice_type} => ${m.dice_roll.result} + ${m.dice_roll.modifier} = ${m.dice_roll.total} (${m.dice_roll.reason || ''})]`;
    return line;
  }).join('\n\n');

  let prompt = `Conversation so far:\n${conversation}\n\n`;
  if (diceResult) {
    prompt += `The player just rolled: ${diceResult.dice_type} => ${diceResult.result} + ${diceResult.modifier} = ${diceResult.total} for ${diceResult.reason}.\nNarrate the outcome of this roll honestly.\n\n`;
  }
  prompt += `Continue as the DM. Narrate the outcome and end with an open prompt or a roll request if needed.`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, model: 'automatic' });
  return Response.json({ reply: res });
}

async function handleSummarize(base44, body) {
  const { campaign_id, messages, campaign, character } = body;
  const system = `You are a campaign summarizer for a D&D AI game. Create a concise but comprehensive summary of the campaign state that will serve as long-term memory.`;
  const conversation = (messages || []).map(m => `${m.sender}: ${m.content}`).join('\n');
  const prompt = `Campaign: ${JSON.stringify(campaign)}\nCharacter: ${buildCharacterContext(character)}\n\nConversation:\n${conversation}\n\nCreate a structured campaign summary. Include: current situation, major events, important NPCs, active quests, player decisions, world state changes, and story hooks. Keep it under 400 words but capture all essential state.`;
  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, model: 'automatic' });
  return Response.json({ reply: res });
}

async function handleGenerateWorld(base44, body) {
  const { preferences } = body;
  const prompt = `Generate a rich D&D fantasy world based on these preferences: ${JSON.stringify(preferences || {})}.
Return ONLY a JSON object with this exact structure:
{
  "world_name": "string",
  "overview": "2-3 sentence world description",
  "continents": ["names"],
  "kingdoms": [{"name": "", "ruler": "", "description": ""}],
  "cities": [{"name": "", "kingdom": "", "description": ""}],
  "villages": ["names"],
  "factions": [{"name": "", "type": "", "goals": ""}],
  "religions": [{"name": "", "deity": "", "domain": ""}],
  "conflicts": ["descriptions"],
  "magic_system": "description",
  "starting_location": "name of where the campaign begins"
}`;
  const schema = {
    type: 'object',
    properties: {
      world_name: { type: 'string' },
      overview: { type: 'string' },
      continents: { type: 'array', items: { type: 'string' } },
      kingdoms: { type: 'array', items: { type: 'object' } },
      cities: { type: 'array', items: { type: 'object' } },
      villages: { type: 'array', items: { type: 'string' } },
      factions: { type: 'array', items: { type: 'object' } },
      religions: { type: 'array', items: { type: 'object' } },
      conflicts: { type: 'array', items: { type: 'string' } },
      magic_system: { type: 'string' },
      starting_location: { type: 'string' }
    }
  };
  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, model: 'automatic', response_json_schema: schema });
  return Response.json({ world: res });
}

async function handleGenerateCharacter(base44, body) {
  const { preferences } = body;
  const prompt = `Generate a complete D&D 5e character based on these preferences: ${JSON.stringify(preferences || {})}.
Return ONLY a JSON object. Make ability scores use standard array or point buy (total around 70-75). Set appropriate HP for level 1 (class hit die + CON mod). Set AC based on armor/DEX. Include 2-3 starting weapons, basic inventory, and 2-3 spells if a spellcasting class.`;
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      species: { type: 'string' },
      class: { type: 'string' },
      subclass: { type: 'string' },
      background: { type: 'string' },
      alignment: { type: 'string' },
      ability_scores: { type: 'object', properties: { str: { type: 'number' }, dex: { type: 'number' }, con: { type: 'number' }, int: { type: 'number' }, wis: { type: 'number' }, cha: { type: 'number' } } },
      hp: { type: 'number' },
      max_hp: { type: 'number' },
      ac: { type: 'number' },
      speed: { type: 'number' },
      gold: { type: 'number' },
      proficiency_bonus: { type: 'number' },
      proficiencies: { type: 'array', items: { type: 'string' } },
      saving_throws: { type: 'array', items: { type: 'string' } },
      weapons: { type: 'array', items: { type: 'object' } },
      inventory: { type: 'array', items: { type: 'object' } },
      spells: { type: 'array', items: { type: 'object' } },
      personality: { type: 'string' },
      ideals: { type: 'string' },
      bonds: { type: 'string' },
      flaws: { type: 'string' },
      backstory: { type: 'string' },
      appearance: { type: 'string' },
      goals: { type: 'string' },
      description: { type: 'string' }
    }
  };
  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, model: 'automatic', response_json_schema: schema });
  return Response.json({ character: res });
}

async function handleSaveStory(base44, body) {
  const { campaign_id, campaign, character, npcs, quests, locations, messages } = body;
  const context = `Campaign: ${JSON.stringify(campaign)}\nCharacter: ${buildCharacterContext(character)}\nNPCs: ${JSON.stringify(npcs)}\nQuests: ${JSON.stringify(quests)}\nLocations: ${JSON.stringify(locations)}\nRecent story:\n${(messages || []).slice(-30).map(m => `${m.sender}: ${m.content}`).join('\n')}`;
  const prompt = `Create a structured saved story summary for this D&D campaign. ${context}\n\nReturn ONLY a JSON object.`;
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      premise: { type: 'string' },
      world_overview: { type: 'string' },
      character_summary: { type: 'string' },
      major_events: { type: 'array', items: { type: 'string' } },
      important_npcs: { type: 'array', items: { type: 'string' } },
      locations: { type: 'array', items: { type: 'string' } },
      factions: { type: 'array', items: { type: 'string' } },
      major_decisions: { type: 'array', items: { type: 'string' } },
      completed_quests: { type: 'array', items: { type: 'string' } },
      unresolved_quests: { type: 'array', items: { type: 'string' } },
      important_items: { type: 'array', items: { type: 'string' } },
      relationships: { type: 'array', items: { type: 'string' } },
      current_situation: { type: 'string' },
      future_hooks: { type: 'array', items: { type: 'string' } }
    }
  };
  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, model: 'automatic', response_json_schema: schema });
  return Response.json({ story: res });
}

// Generate a character portrait via AI image generation.
async function handleGeneratePortrait(base44, body) {
  const { character } = body;
  const c = character || {};
  const traits = [
    c.species ? `${c.species}` : 'Human',
    c.class ? `${c.class}` : 'fighter',
    c.appearance ? `Appearance: ${c.appearance}` : 'weathered heroic adventurer',
    c.name ? `Named ${c.name}` : ''
  ].filter(Boolean).join('. ');
  const prompt = `Fantasy RPG character portrait, head and shoulders, centered composition. ${traits}. Dark fantasy digital painting, dramatic cinematic lighting, highly detailed painterly style, plain dark background, no text.`;
  const res = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
  return Response.json({ url: res.url });
}

// Workflow-triggered mode: narrate a negative consequence for a critical failure
// against an NPC. Fetches its own context via the service role (no user session).
async function handleNpcConsequence(base44, body) {
  const { campaign_id, npc_id, roll_id } = body;
  const roll = await base44.asServiceRole.entities.DiceRoll.get(roll_id);
  const npc = await base44.asServiceRole.entities.NPC.get(npc_id).catch(() => null);
  const campaign = await base44.asServiceRole.entities.Campaign.get(campaign_id).catch(() => null);
  let character = null;
  if (campaign && campaign.character_id) {
    try { character = await base44.asServiceRole.entities.Character.get(campaign.character_id); } catch (e) { /* ignore */ }
  }
  const messages = await base44.asServiceRole.entities.Message.filter({ campaign_id });
  const recent = (messages || []).slice(-15).map(m => `${m.sender}: ${m.content}`).join('\n');

  let system = DM_SYSTEM_BASE + '\n\n';
  if (campaign) system += buildWorldContext(campaign);
  system += '\n' + buildCharacterContext(character);
  if (npc) system += '\n' + buildNPCContext([npc]);

  const prompt = `The player just rolled a CRITICAL FAILURE (natural 1) on a ${roll.dice_type} for "${roll.reason || 'an interaction'}" involving the NPC ${npc ? npc.name : 'an NPC'}.\n\nRecent conversation:\n${recent}\n\nNarrate a meaningful, in-fiction NEGATIVE CONSEQUENCE for the player as a result of this critical failure. Tie it to the NPC's disposition and the current situation. Keep it vivid but concise (2-4 sentences). Do not invent dice results. End with an open prompt for the player.`;
  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, model: 'automatic' });
  return Response.json({ reply: res });
}