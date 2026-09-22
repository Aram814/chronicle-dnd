// Client-side D&D 5e rules helpers (mirrors base44/shared/dndRules.js)

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
  return {
    rolls,
    result: roll,
    modifier,
    total: roll + modifier,
    crit: roll === 20,
    fumble: roll === 1
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

export function formatModifier(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}