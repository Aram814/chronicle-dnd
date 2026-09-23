import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { buildCharacterContext, buildPartyContext, buildWorldContext, buildNPCContext, buildQuestContext, buildLocationContext, DM_SYSTEM_BASE } from '../../shared/dmPrompts.js';

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

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: system + '\n\n' + prompt, model: 'automatic' });
  return Response.json({ reply: res });
}

async function handlePlay(base44, body) {
  const { campaign_id, session_id, messages, campaign, character, players, active_player, npcs, quests, locations, diceResult, opening } = body;

  // Multiplayer: accept a `players` array; fall back to single `character` for solo campaigns.
  const party = players && players.length ? players : (character ? [character] : []);

  let system = DM_SYSTEM_BASE + '\n\n';
  system += buildWorldContext(campaign);
  if (party.length > 1) {
    system += '\n' + buildPartyContext(party);
  } else {
    system += '\n' + buildCharacterContext(party[0] || character);
  }
  system += '\n' + buildNPCContext(npcs);
  system += '\n' + buildQuestContext(quests);
  system += '\n' + buildLocationContext(locations);
  if (party.length > 1) {
    system += '\n\nMULTIPLAYER: This campaign has multiple players. Each message is tagged with the speaker\'s character name. Address players by their character name. Track each character\'s HP, conditions, and resources separately. When narrating outcomes, be clear about which character is affected. All players share the same world, NPCs, quests, and locations.';
  }
  system += '\n\nIMPORTANT: The character stats above are AUTHORITATIVE. Do not change them in narration. If a player takes damage, loses items, gains XP, etc., describe it — the application will update the actual stats based on your narration using the state update format below.';

  system += `

STATE UPDATES:
After your narration, if the game state changed, include one or more update commands on their own lines. Use ONLY these formats:
[[HP_CHANGE: <amount> ]]  (negative for damage, positive for healing)
[[XP_GAIN: <amount> ]]
[[ITEM_ADD: <item name> | <optional description> ]]
[[ITEM_REMOVE: <item name> ]]
[[GOLD_CHANGE: <amount> ]]
[[NPC_ADD: <name> | <description> | <personality> | <relationship as a word: ally/friendly/neutral/wary/hostile/rival> | <location> ]]
[[NPC_UPDATE: <name> | <field> | <value> ]]
[[NPC_STATUS: <name> | <status e.g. dead/alive/friendly/hostile> ]]
[[NPC_DISPOSITION: <name> | <signed change amount e.g. +5 or -10> | <short reason for the shift> ]]
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

TRACKING THE WORLD — CRITICAL:
- When the player MEETS or INTERACTS WITH a new NPC for the first time, you MUST emit [[NPC_ADD: <name> | <description> | <personality> | <relationship> | <location> ]]. This includes hostile NPCs, enemies, guards, and named monsters — add them all so the player has a record. Even if the NPC is minor, add them. You may omit later fields if unknown, but always include at least the name and a short description.
- When the player's dialogue or actions shift an NPC's attitude toward them, emit [[NPC_DISPOSITION: <name> | <signed change> | <reason> ]]. Track this honestly — a caught lie, insult, or broken promise lowers disposition; help, honesty, and respect raise it.
- When the player ARRIVES AT or DISCOVERS a new location, you MUST emit [[LOCATION_ADD: <name> | <type> | <description> ]]. You may omit type/description if minimal, but always include the name.
- When a new quest or objective is introduced, emit [[QUEST_ADD: <name> | <type main/side> | <description> ]].
- When the player travels to a different place, emit [[CURRENT_LOCATION: <location name> ]].
These records are the player's journal. If you forget to emit them, the player's NPC list and world map will be empty even though they have met people and visited places. ALWAYS emit them when the situation calls for it.

Only include updates that actually happened in this turn. If nothing changed, include no update lines.`;

  let prompt;
  if (opening) {
    const isMultiplayer = party.length > 1;
    prompt = `This is the very first scene of the campaign — no conversation has happened yet. You are SETTING THE STAGE for a brand-new adventure. Build the scene up gradually — do NOT drop the ${isMultiplayer ? 'players' : 'player'} into the middle of an ongoing action sequence, combat, or crisis.

Follow this structure:
1. CAMPAIGN BACKGROUND: Begin by telling the ${isMultiplayer ? 'players' : 'player'} about the world and the campaign's premise — the setting, the broader situation, and what is happening in this place. Draw on the campaign's name, setting, description, and world state to paint the big picture. This is the story backdrop the ${isMultiplayer ? 'party' : 'character'} is stepping into.
2. ${isMultiplayer ? 'PARTY' : 'CHARACTER'} & GOALS: ${isMultiplayer ? 'Introduce each member of the party using their EXACT names, species, class, and background as listed in the PARTY MEMBERS section above — do NOT invent or rename characters. Introduce each one briefly, then explain what brings them together and what they are setting out to accomplish as a group. Establish why they are travelling together. If the campaign has active quests or a clear objective, frame the party\'s shared goals in that context. If no explicit quest exists yet, give the group a common purpose or reason for being in this place.' : 'Introduce the player\'s character using their EXACT name, species, class, and background as listed in the CHARACTER section above — do NOT invent or rename them. Explain what brings them here and what they are setting out to accomplish. If the campaign has active quests or a clear objective, frame the character\'s goals in that context. If no explicit quest exists yet, give the character a personal motivation or reason for being in this place (drawn from their background, bonds, or backstory). Make the player feel their character has purpose and direction.'}
3. PAINT THE WORLD: Describe the starting location with calm, vivid sensory detail — the time of day, the weather, the sounds and smells, the texture of the place. Let the ${isMultiplayer ? 'party' : 'player'} take in their surroundings before anything demands their attention.
4. INTRODUCE A GENTLE HOOK: Only after the scene is established, present a subtle invitation — a person approaching, a rumor overheard, a notice on a board, a sound in the distance, a letter waiting for them. This is the seed of adventure, not an emergency. Give the ${isMultiplayer ? 'players' : 'player'} space to choose how to engage with it.

5. TRACK THE WORLD — REQUIRED: After your narration, emit the state-update tags (formats listed above in STATE UPDATES) so the player's journal starts populated:
   - [[CURRENT_LOCATION: <starting location name> ]]
   - [[LOCATION_ADD: <starting location name> | <type e.g. tavern/village/city/wilderness> | <1-sentence description> ]]
   - [[NPC_ADD: <name> | <description> | <personality> | <relationship word> | <location> ]] for every NPC you introduce in the opening (at minimum, whoever brings the hook).
   Without these, the player's World Map and NPC list will be empty.

Keep it immersive and unhurried (${isMultiplayer ? '5-7' : '4-6'} paragraphs). Do not force urgency or threaten the ${isMultiplayer ? 'party' : 'character'} in the opening. End with an open-ended prompt that invites the ${isMultiplayer ? 'players' : 'player'} to act — "${isMultiplayer ? 'What do you do?' : 'What do you do?'}" — or a gentle question, NOT a roll request. The first roll should come only after a ${isMultiplayer ? 'player' : 'player'} has chosen to engage.`;
  } else {
    let conversation = (messages || []).slice(-20).map(m => {
      const speaker = m.sender === 'player' ? (m.sender_name || 'PLAYER') : 'DM';
      let line = `${speaker}: ${m.content}`;
      if (m.dice_roll) line += `\n[DICE ROLL RESULT: ${m.dice_roll.dice_type} => ${m.dice_roll.result} + ${m.dice_roll.modifier} = ${m.dice_roll.total} (${m.dice_roll.reason || ''})]`;
      return line;
    }).join('\n\n');

    prompt = `Conversation so far:\n${conversation}\n\n`;
    if (diceResult) {
      const roller = active_player || diceResult.character_name || 'The player';
      prompt += `${roller} just rolled: ${diceResult.dice_type} => ${diceResult.result} + ${diceResult.modifier} = ${diceResult.total} for ${diceResult.reason}.\nNarrate the outcome of this roll honestly and impartially. If it is a failure (total below the DC, or a natural 1), the action fails — narrate the real, in-fiction consequence without softening it or rescuing the character. Do not tilt the outcome toward success.\n\n`;
    }
    prompt += `Continue as the DM. Narrate the outcome of the player's declared action. If their action requires a check and they haven't rolled yet, request a roll. Otherwise, present the scene and end with an open-ended "What do you do?" — do NOT request a roll unless the player just declared an action that needs one. If danger appears but the player has not declared a hostile action, describe the threat and stop — do NOT auto-start combat, roll initiative, or emit [[COMBAT_START:...]] until the player chooses to fight (or enemies unambiguously attack first). The player's initiative must always come from a roll the player makes, never invented by you.`;
  }

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: system + '\n\n' + prompt, model: 'automatic' });
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
  const sourceText = preferences && preferences.source_text ? preferences.source_text : null;
  const sourceFileUrl = preferences && preferences.source_file_url ? preferences.source_file_url : null;
  const fileName = preferences && preferences.file_name ? preferences.file_name : 'the uploaded document';
  const hasSource = sourceText || sourceFileUrl;
  const prompt = `Generate a rich D&D fantasy world${hasSource ? ' based on the following source material the player provided' : ' based on these preferences'}: ${JSON.stringify(sourceText ? { source_material: sourceText, ...preferences } : preferences || {})}.
${hasSource ? `Faithfully adapt the people, places, conflicts, and tone described in ${sourceFileUrl ? fileName : 'the source material'} into a playable D&D 5e campaign world. Do not invent major elements that contradict it; fill gaps with fitting detail only.` : 'Create an original, cohesive world.'}
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
  const llmOpts = { prompt, model: 'automatic', response_json_schema: schema };
  if (sourceFileUrl) llmOpts.file_urls = [sourceFileUrl];
  const res = await base44.asServiceRole.integrations.Core.InvokeLLM(llmOpts);
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