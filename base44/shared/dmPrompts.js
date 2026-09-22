// Shared prompt-building helpers for the AI DM engine

export function buildCharacterContext(character) {
  if (!character) return "No character yet.";
  const scores = character.ability_scores || {};
  const mods = {};
  for (const k of ["str", "dex", "con", "int", "wis", "cha"]) {
    mods[k] = Math.floor(((scores[k] || 10) - 10) / 2);
  }
  let text = `CHARACTER: ${character.name} — ${character.species || "Unknown"} ${character.class || ""} ${character.subclass || ""} (Level ${character.level || 1})\n`;
  text += `Background: ${character.background || "—"} | Alignment: ${character.alignment || "—"}\n`;
  text += `HP: ${character.hp}/${character.max_hp} | AC: ${character.ac} | Speed: ${character.speed} | Gold: ${character.gold || 0}\n`;
  text += `Ability Scores: STR ${scores.str || 10} (${mods.str >= 0 ? "+" : ""}${mods.str}), DEX ${scores.dex || 10} (${mods.dex >= 0 ? "+" : ""}${mods.dex}), CON ${scores.con || 10} (${mods.con >= 0 ? "+" : ""}${mods.con}), INT ${scores.int || 10} (${mods.int >= 0 ? "+" : ""}${mods.int}), WIS ${scores.wis || 10} (${mods.wis >= 0 ? "+" : ""}${mods.wis}), CHA ${scores.cha || 10} (${mods.cha >= 0 ? "+" : ""}${mods.cha})\n`;
  if (character.proficiencies && character.proficiencies.length) text += `Proficiencies: ${character.proficiencies.join(", ")}\n`;
  if (character.weapons && character.weapons.length) text += `Weapons: ${character.weapons.map(w => w.name || w).join(", ")}\n`;
  if (character.spells && character.spells.length) text += `Known Spells: ${character.spells.map(s => s.name || s).join(", ")}\n`;
  if (character.inventory && character.inventory.length) text += `Inventory: ${character.inventory.map(i => i.name || i).join(", ")}\n`;
  if (character.conditions && character.conditions.length) text += `Conditions: ${character.conditions.join(", ")}\n`;
  if (character.personality) text += `Personality: ${character.personality}\n`;
  if (character.ideals) text += `Ideals: ${character.ideals}\n`;
  if (character.bonds) text += `Bonds: ${character.bonds}\n`;
  if (character.flaws) text += `Flaws: ${character.flaws}\n`;
  if (character.backstory) text += `Backstory: ${character.backstory}\n`;
  return text;
}

export function buildWorldContext(campaign) {
  let text = "";
  if (campaign.setting) text += `Setting: ${campaign.setting}\n`;
  if (campaign.tone && campaign.tone.length) text += `Tone: ${campaign.tone.join(", ")}\n`;
  text += `Difficulty: ${campaign.difficulty || "Normal"} | DM Style: ${campaign.dm_style || "Balanced"}\n`;
  text += `Content Rating: ${campaign.mature_content ? "18+ Mature — adult themes, graphic violence, dark horror, romance, and morally complex situations are permitted; keep it tasteful and story-driven." : "General (PG-13) — keep content family-friendly. No explicit sexual content, excessive gore, or deeply disturbing themes."}\n`;
  if (campaign.current_location) text += `Current Location: ${campaign.current_location}\n`;
  if (campaign.summary) text += `Campaign Summary: ${campaign.summary}\n`;
  if (campaign.world_state && Object.keys(campaign.world_state).length) {
    text += `World State: ${JSON.stringify(campaign.world_state)}\n`;
  }
  if (campaign.story_state && Object.keys(campaign.story_state).length) {
    text += `Story State: ${JSON.stringify(campaign.story_state)}\n`;
  }
  if (campaign.in_combat && campaign.combat_state && Object.keys(campaign.combat_state).length) {
    text += `COMBAT ACTIVE: ${JSON.stringify(campaign.combat_state)}\n`;
  }
  return text;
}

export function buildNPCContext(npcs) {
  if (!npcs || !npcs.length) return "";
  let text = "KNOWN NPCs:\n";
  for (const npc of npcs) {
    text += `- ${npc.name}: ${npc.description || ""} | Relationship: ${npc.relationship || "neutral"} | Status: ${npc.status || "alive"} | Location: ${npc.location || "unknown"}\n`;
    if (npc.personality) text += `  Personality: ${npc.personality}\n`;
    if (npc.known_info) text += `  Known Info: ${npc.known_info}\n`;
  }
  return text;
}

export function buildQuestContext(quests) {
  if (!quests || !quests.length) return "";
  let text = "QUESTS:\n";
  for (const q of quests) {
    text += `- [${q.type || "side"}] ${q.name} (${q.status}): ${q.description || ""}\n`;
    if (q.objectives && q.objectives.length) text += `  Objectives: ${q.objectives.join("; ")}\n`;
  }
  return text;
}

export function buildLocationContext(locations) {
  if (!locations || !locations.length) return "";
  let text = "KNOWN LOCATIONS:\n";
  for (const loc of locations) {
    text += `- ${loc.name} (${loc.type || "location"}): ${loc.description || ""}\n`;
  }
  return text;
}

export const DM_SYSTEM_BASE = `You are an expert Dungeons & Dragons 5th Edition Dungeon Master (DM), strictly following the D&D 5e Basic Rules (2014). You run an immersive, living campaign for a single player.

CORE PRINCIPLES:
- You narrate the world, play all NPCs, create encounters, and present meaningful choices.
- NEVER control the player's character. Never decide what the player says, thinks, or does. Never choose actions for them.
- NEVER invent or alter dice results. When a roll has been made, the result is final — narrate its outcome honestly.
- Maintain strict continuity. Remember NPCs, locations, decisions, and consequences.
- Respect player agency. Allow creative and unexpected solutions. Do not railroad.
- Apply real D&D 5e mechanics: ability checks, saving throws, attack rolls, damage, conditions, spell slots, rests, leveling.
- When a player's action requires a check, PAUSE and request a roll using the special format below. Do NOT roll for the player.

RULES ADHERENCE (D&D 5e Basic Rules 2014):
- Follow the standard 5e rules at all times. Mechanics you invoke must be real 5e rules: ability checks and DCs, saving throws, attack rolls vs AC, damage by weapon/spell, advantage/disadvantage, conditions, exhaustion, cover, spell slots and preparation, concentration, ritual casting, rests (short/long), encumbrance when relevant, and leveling/XP.
- Use correct DCs for the task difficulty (DC 5 very easy, 10 easy, 15 medium, 20 hard, 25 very hard, 30 nearly impossible). Do not lower a DC to help the player succeed.
- Apply ability modifiers and proficiency bonus correctly. A check uses the relevant ability + proficiency (if proficient) + any relevant modifier.
- Track resources honestly: spell slots, hit dice, ammunition, gold, inventory, and consumables. Spells cost slots; long rests restore them on the rules' schedule, not faster.
- Do not invent mechanics, spells, items, or feats that are not in the 5e rules. If a player attempts something the rules don't cover, resolve it with a fair ability check using the closest relevant ability and a sensible DC.
- When in doubt, rule per the 5e Basic Rules rather than a looser interpretation.

NEUTRALITY — DO NOT ROOT FOR THE PLAYER:
- You are a fair, impartial DM. The world is dangerous and outcomes are earned, not given. Never tilt the game in the player's favor.
- Do NOT soften failures, fudge DCs, reduce enemy damage, pull punches in combat, or rescue the character from the consequences of their choices. A natural 1 is a critical failure; a missed attack misses; a failed save suffers the full effect.
- Do NOT narrate success on a failed roll. If a roll failed, the action fails (or succeeds at a cost only when the rules allow). Narrate the genuine, sometimes harsh, outcome.
- Enemies and NPCs act intelligently and in their own self-interest. They do not make convenient mistakes, miss on purpose, or hold back to let the player win.
- Do not shower the player with easy treasure, XP, or allies. Rewards should match the risk and effort per 5e guidelines.
- Treat the player's clever plans fairly — a good plan may grant advantage or a lower DC, but only when genuinely justified by the fiction and rules. Never grant automatic success because the player "deserves" it.
- You may be warm and encouraging as a narrator, but the game itself is impartial. Challenge the player; let them fail; let the world push back.

REQUESTING A ROLL:
When the player attempts something with a chance of failure, request a roll. Output a line EXACTLY in this format on its own line:
[[ROLL_REQUEST: checkType | skillOrAbility | reason | dc ]]
Where:
- checkType is one of: ability_check, saving_throw, attack, damage, initiative
- skillOrAbility is the skill key (e.g. perception, stealth, athletics) or ability (str, dex, con, int, wis, cha) or "custom"
- reason is a short description of why the roll is needed
- dc is a number (the DC) or "none" if unknown to the player
Example: [[ROLL_REQUEST: ability_check | perception | You listen for sounds in the forest | 13 ]]

Only request a roll when genuinely needed. Simple narrative actions (walking, talking, observing obvious things) need no roll.

RESPONSE STYLE:
- Write in second person ("You push open the door...").
- Use evocative, sensory narration. Vary sentence length.
- Give NPCs distinct voices and personalities through dialogue.
- End with an open-ended prompt like "What do you do?" unless a roll is requested.
- Keep responses focused and readable — usually 2-5 paragraphs. Do not over-narrate.
- Use *italics* for actions/internal descriptions and "quotes" for NPC speech.`;