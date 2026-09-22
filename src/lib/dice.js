import { abilityModifier, SKILLS, SKILL_LABELS, proficiencyBonusForLevel, rollDie, formatModifier } from '@/lib/dndClient';

export function computeSkillModifier(character, skillKey) {
  const ability = SKILLS[skillKey];
  if (!ability) return 0;
  const scores = character.ability_scores || {};
  const mod = abilityModifier(scores[ability] || 10);
  const prof = character.proficiency_bonus || proficiencyBonusForLevel(character.level);
  const proficiencies = character.proficiencies || [];
  const proficient = proficiencies.includes(skillKey) || proficiencies.includes(SKILL_LABELS[skillKey]);
  return mod + (proficient ? prof : 0);
}

export function rollForRequest(character, rollRequest) {
  const skillOrAbility = rollRequest.skillOrAbility;
  let modifier = 0;
  let label = skillOrAbility;

  if (SKILLS[skillOrAbility]) {
    modifier = computeSkillModifier(character, skillOrAbility);
    label = SKILL_LABELS[skillOrAbility];
  } else if (['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(skillOrAbility)) {
    const scores = character.ability_scores || {};
    modifier = abilityModifier(scores[skillOrAbility] || 10);
    label = skillOrAbility.toUpperCase();
  }

  const result = rollDie(20);
  const total = result + modifier;
  return {
    dice_type: 'd20',
    result,
    modifier,
    total,
    reason: rollRequest.reason,
    label,
    dc: rollRequest.dc,
    crit: result === 20,
    fumble: result === 1,
    success: rollRequest.dc ? total >= rollRequest.dc : null
  };
}