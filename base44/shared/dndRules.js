// D&D 5e rules helpers — shared across backend functions
// Authoritative game math lives here, not in the AI.

export function abilityModifier(score) {
  return Math.floor((score - 10) / 2);
}

export const SKILLS = {
  acrobatics: "dex",
  animalHandling: "wis",
  arcana: "int",
  athletics: "str",
  deception: "cha",
  history: "int",
  insight: "wis",
  intimidation: "cha",
  investigation: "int",
  medicine: "wis",
  nature: "int",
  perception: "wis",
  performance: "cha",
  persuasion: "cha",
  religion: "int",
  sleightOfHand: "dex",
  stealth: "dex",
  survival: "wis"
};

export const SKILL_LABELS = {
  acrobatics: "Acrobatics",
  animalHandling: "Animal Handling",
  arcana: "Arcana",
  athletics: "Athletics",
  deception: "Deception",
  history: "History",
  insight: "Insight",
  intimidation: "Intimidation",
  investigation: "Investigation",
  medicine: "Medicine",
  nature: "Nature",
  perception: "Perception",
  performance: "Performance",
  persuasion: "Persuasion",
  religion: "Religion",
  sleightOfHand: "Sleight of Hand",
  stealth: "Stealth",
  survival: "Survival"
};

export const ABILITY_LABELS = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma"
};

export function proficiencyBonusForLevel(level) {
  const l = level || 1;
  if (l >= 17) return 6;
  if (l >= 13) return 5;
  if (l >= 9) return 4;
  if (l >= 5) return 3;
  return 2;
}

// Compute a skill modifier from a character object
export function skillModifier(character, skillKey) {
  const ability = SKILLS[skillKey];
  if (!ability) return 0;
  const scores = character.ability_scores || {};
  const mod = abilityModifier(scores[ability] || 10);
  const prof = character.proficiency_bonus || proficiencyBonusForLevel(character.level);
  const proficiencies = character.proficiencies || [];
  const proficient = proficiencies.includes(skillKey) || proficiencies.includes(SKILL_LABELS[skillKey]);
  return mod + (proficient ? prof : 0);
}

export function savingThrowModifier(character, ability) {
  const scores = character.ability_scores || {};
  const mod = abilityModifier(scores[ability] || 10);
  const prof = character.proficiency_bonus || proficiencyBonusForLevel(character.level);
  const saves = character.saving_throws || [];
  const proficient = saves.includes(ability) || saves.includes(ABILITY_LABELS[ability]);
  return mod + (proficient ? prof : 0);
}

export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollD20(modifier = 0, advantage = false, disadvantage = false) {
  let roll = rollDie(20);
  let rolls = [roll];
  if (advantage || disadvantage) {
    const second = rollDie(20);
    rolls.push(second);
    if (advantage) roll = Math.max(rolls[0], rolls[1]);
    if (disadvantage) roll = Math.min(rolls[0], rolls[1]);
  }
  const isCrit = roll === 20;
  const isFumble = roll === 1;
  return {
    rolls,
    result: roll,
    modifier,
    total: roll + modifier,
    crit: isCrit,
    fumble: isFumble
  };
}

export function xpThresholdForLevel(level) {
  const table = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
  return table[Math.min(level, 20)] || 355000;
}

export function checkLevelUp(character) {
  let leveledUp = false;
  let current = character.level || 1;
  let xp = character.xp || 0;
  while (current < 20 && xp >= xpThresholdForLevel(current + 1)) {
    current += 1;
    leveledUp = true;
  }
  return { leveledUp, newLevel: current };
}