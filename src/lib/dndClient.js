// Client-side D&D rules + DM response parser
import { abilityModifier, SKILLS, SKILL_LABELS, ABILITY_LABELS, proficiencyBonusForLevel, rollD20, rollDie, xpThresholdForLevel, checkLevelUp } from './dndRules';

export { abilityModifier, SKILLS, SKILL_LABELS, ABILITY_LABELS, proficiencyBonusForLevel, rollD20, rollDie, xpThresholdForLevel, checkLevelUp };

// Parse a DM reply into { narration, rollRequest, stateUpdates, stageComplete, worldData, characterData }
export function parseDMReply(raw) {
  const result = {
    narration: raw || '',
    rollRequest: null,
    stateUpdates: [],
    stageComplete: null,
    worldData: null,
    characterData: null
  };
  if (!raw) return result;
  let text = raw;

  // Roll request: [[ROLL_REQUEST: type | skill | reason | dc ]]
  const rollMatch = text.match(/\[\[ROLL_REQUEST:\s*([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]\]/);
  if (rollMatch) {
    result.rollRequest = {
      checkType: rollMatch[1].trim(),
      skillOrAbility: rollMatch[2].trim(),
      reason: rollMatch[3].trim(),
      dc: rollMatch[4].trim() === 'none' ? null : parseInt(rollMatch[4].trim(), 10)
    };
    text = text.replace(rollMatch[0], '');
  }

  // Stage complete
  const stageMatch = text.match(/\[\[STAGE_COMPLETE:\s*(\w+)\]\]/);
  if (stageMatch) {
    result.stageComplete = stageMatch[1].trim();
    text = text.replace(stageMatch[0], '');
  }

  // World data
  const worldMatch = text.match(/\[\[WORLD_DATA:\s*(\{[\s\S]*?\})\]\]/);
  if (worldMatch) {
    try { result.worldData = JSON.parse(worldMatch[1]); } catch (e) { /* ignore */ }
    text = text.replace(worldMatch[0], '');
  }

  // Character data
  const charMatch = text.match(/\[\[CHARACTER_DATA:\s*(\{[\s\S]*?\})\]\]/);
  if (charMatch) {
    try { result.characterData = JSON.parse(charMatch[1]); } catch (e) { /* ignore */ }
    text = text.replace(charMatch[0], '');
  }

  // State updates - all the [[XXX: ...]] patterns
  const patterns = [
    { regex: /\[\[HP_CHANGE:\s*(-?\d+)\]\]/g, type: 'hp_change' },
    { regex: /\[\[XP_GAIN:\s*(-?\d+)\]\]/g, type: 'xp_gain' },
    { regex: /\[\[ITEM_ADD:\s*([^|]+)(?:\|\s*([^|]+?))?\]\]/g, type: 'item_add' },
    { regex: /\[\[ITEM_REMOVE:\s*([^|]+?)\]\]/g, type: 'item_remove' },
    { regex: /\[\[GOLD_CHANGE:\s*(-?\d+)\]\]/g, type: 'gold_change' },
    { regex: /\[\[NPC_ADD:\s*([^|]+?)(?:\s*\|\s*([^|]*))?(?:\s*\|\s*([^|]*))?(?:\s*\|\s*([^|]*))?(?:\s*\|\s*([^|]*?))?\s*\]\]/g, type: 'npc_add' },
    { regex: /\[\[NPC_UPDATE:\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+?)\]\]/g, type: 'npc_update' },
    { regex: /\[\[NPC_STATUS:\s*([^|]+)\|\s*([^|]+?)\]\]/g, type: 'npc_status' },
    { regex: /\[\[NPC_DISPOSITION:\s*([^|]+)\|\s*(-?\d+)\|\s*([^|]+?)\]\]/g, type: 'npc_disposition' },
    { regex: /\[\[QUEST_ADD:\s*([^|]+?)(?:\s*\|\s*([^|]*))?(?:\s*\|\s*([^|]*?))?\s*\]\]/g, type: 'quest_add' },
    { regex: /\[\[QUEST_UPDATE:\s*([^|]+)\|\s*([^|]+?)\]\]/g, type: 'quest_update' },
    { regex: /\[\[LOCATION_ADD:\s*([^|]+?)(?:\s*\|\s*([^|]*))?(?:\s*\|\s*([^|]*?))?\s*\]\]/g, type: 'location_add' },
    { regex: /\[\[LOCATION_UPDATE:\s*([^|]+)\|\s*(true|false)\]\]/g, type: 'location_update' },
    { regex: /\[\[COMBAT_START:\s*(\[[\s\S]*?\])\]\]/g, type: 'combat_start' },
    { regex: /\[\[COMBAT_END\]\]/g, type: 'combat_end' },
    { regex: /\[\[LEVEL_UP\]\]/g, type: 'level_up' },
    { regex: /\[\[CONDITION_ADD:\s*([^|]+?)\]\]/g, type: 'condition_add' },
    { regex: /\[\[CONDITION_REMOVE:\s*([^|]+?)\]\]/g, type: 'condition_remove' },
    { regex: /\[\[CURRENT_LOCATION:\s*([^|]+?)\]\]/g, type: 'current_location' },
    { regex: /\[\[WORLD_EVENT:\s*([^|]+?)\]\]/g, type: 'world_event' }
  ];

  for (const p of patterns) {
    let m;
    while ((m = p.regex.exec(text)) !== null) {
      const update = { type: p.type, raw: m[0] };
      for (let i = 1; i < m.length; i++) update[`arg${i}`] = m[i] ? m[i].trim() : '';
      result.stateUpdates.push(update);
      text = text.replace(m[0], '');
    }
  }

  result.narration = text.trim();
  return result;
}

export function formatModifier(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}