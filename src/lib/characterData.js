// Standard D&D 5e races, classes, and helpers for the character builder.
import { abilityModifier } from './dndRules';

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export const ABILITIES = [
  ['str', 'STR'],
  ['dex', 'DEX'],
  ['con', 'CON'],
  ['int', 'INT'],
  ['wis', 'WIS'],
  ['cha', 'CHA']
];

export const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
];

export const BACKGROUNDS = [
  'Acolyte', 'Criminal', 'Folk Hero', 'Noble', 'Sage', 'Soldier',
  'Charlatan', 'Entertainer', 'Guild Artisan', 'Hermit', 'Outlander',
  'Sailor', 'Urchin'
];

export const RACES = [
  { name: 'Dwarf', subraces: [
    { name: 'Hill Dwarf', bonuses: { con: 2, wis: 1 }, speed: 25 },
    { name: 'Mountain Dwarf', bonuses: { con: 2, str: 2 }, speed: 25 },
    { name: 'Duergar (Gray Dwarf)', bonuses: { con: 2, str: 1 }, speed: 25 }
  ]},
  { name: 'Elf', subraces: [
    { name: 'High Elf', bonuses: { dex: 2, int: 1 }, speed: 30 },
    { name: 'Wood Elf', bonuses: { dex: 2, wis: 1 }, speed: 35 },
    { name: 'Drow (Dark Elf)', bonuses: { dex: 2, cha: 1 }, speed: 30 },
    { name: 'Eladrin', bonuses: { dex: 2, cha: 1 }, speed: 30 },
    { name: 'Sea Elf', bonuses: { dex: 2, con: 1 }, speed: 30 },
    { name: 'Shadar-Kai', bonuses: { dex: 2, con: 1 }, speed: 30 },
    { name: 'Astral Elf', bonuses: { dex: 2, int: 1 }, speed: 30 }
  ]},
  { name: 'Halfling', subraces: [
    { name: 'Lightfoot Halfling', bonuses: { dex: 2, cha: 1 }, speed: 25 },
    { name: 'Stout Halfling', bonuses: { dex: 2, con: 1 }, speed: 25 }
  ]},
  { name: 'Human', subraces: [
    { name: 'Standard Human', bonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }, speed: 30 },
    { name: 'Variant Human', bonuses: { str: 1, dex: 1 }, speed: 30 }
  ]},
  { name: 'Dragonborn', subraces: [
    { name: 'Chromatic Dragonborn', bonuses: { str: 2, cha: 1 }, speed: 30 },
    { name: 'Metallic Dragonborn', bonuses: { str: 2, cha: 1 }, speed: 30 },
    { name: 'Gem Dragonborn', bonuses: { str: 2, int: 1 }, speed: 30 }
  ]},
  { name: 'Gnome', subraces: [
    { name: 'Forest Gnome', bonuses: { dex: 2, int: 1 }, speed: 25 },
    { name: 'Rock Gnome', bonuses: { int: 2, con: 1 }, speed: 25 },
    { name: 'Deep Gnome (Svirfneblin)', bonuses: { int: 2, dex: 1 }, speed: 25 }
  ]},
  { name: 'Half-Elf', subraces: [
    { name: 'Half-Elf (Standard)', bonuses: { cha: 2, dex: 1, con: 1 }, speed: 30 }
  ]},
  { name: 'Half-Orc', subraces: [
    { name: 'Half-Orc', bonuses: { str: 2, con: 1 }, speed: 30 }
  ]},
  { name: 'Tiefling', subraces: [
    { name: 'Tiefling (Standard)', bonuses: { cha: 2, int: 1 }, speed: 30 }
  ]}
];

export const CLASSES = [
  { name: 'Artificer', description: 'Magic item inventor and crafter.', hitDie: 8, primary: 'int', saves: ['con', 'int'], acFormula: 'light', armor: 'Light armor', weapons: ['Light Crossbow', 'Dagger'], gold: 15, caster: 'int', slots: { 1: 2 }, cantrips: ['Magic Stone', 'Fire Bolt'], spells: ['Detect Magic', 'Cure Wounds'], proficiencies: ['Light armor', 'Medium armor', 'Shields', 'Simple weapons'], abilityPriority: ['int', 'con', 'dex', 'wis', 'cha', 'str'] },
  { name: 'Barbarian', description: 'Furious primal warrior.', hitDie: 12, primary: 'str', saves: ['str', 'con'], acFormula: 'unarmoredCon', armor: 'Light armor', weapons: ['Greataxe', 'Javelin', 'Javelin'], gold: 25, caster: null, slots: {}, cantrips: [], spells: [], proficiencies: ['Light armor', 'Medium armor', 'Shields', 'Simple weapons', 'Martial weapons'], abilityPriority: ['str', 'con', 'dex', 'wis', 'cha', 'int'] },
  { name: 'Bard', description: 'Inspiring magical performer.', hitDie: 8, primary: 'cha', saves: ['dex', 'cha'], acFormula: 'light', armor: 'Light armor', weapons: ['Rapier', 'Dagger'], gold: 15, caster: 'cha', slots: { 1: 2 }, cantrips: ['Vicious Mockery', 'Light'], spells: ['Healing Word', 'Charm Person', 'Detect Magic'], proficiencies: ['Light armor', 'Simple weapons', 'Rapiers', 'Shortswords', 'Crossbows'], abilityPriority: ['cha', 'dex', 'con', 'int', 'wis', 'str'] },
  { name: 'Cleric', description: 'Divine miracle worker and priest.', hitDie: 8, primary: 'wis', saves: ['wis', 'cha'], acFormula: 'heavy', armor: 'Chain mail', weapons: ['Mace', 'Shield'], gold: 15, caster: 'wis', slots: { 1: 2 }, cantrips: ['Guidance', 'Sacred Flame', 'Light'], spells: ['Healing Word', 'Bless', 'Cure Wounds'], proficiencies: ['Light armor', 'Medium armor', 'Shields', 'Simple weapons'], abilityPriority: ['wis', 'con', 'str', 'cha', 'dex', 'int'] },
  { name: 'Druid', description: 'Nature and shapechanging spellcaster.', hitDie: 8, primary: 'wis', saves: ['int', 'wis'], acFormula: 'light', armor: 'Leather (nonmetal)', weapons: ['Wooden Shield', 'Scimitar'], gold: 15, caster: 'wis', slots: { 1: 2 }, cantrips: ['Druidcraft', 'Produce Flame'], spells: ['Entangle', 'Cure Wounds', 'Healing Word'], proficiencies: ['Light armor (nonmetal)', 'Medium armor (nonmetal)', 'Shields (nonmetal)', 'Clubs', 'Daggers', 'Scimitars', 'Quarterstaffs', 'Slings'], abilityPriority: ['wis', 'con', 'dex', 'int', 'cha', 'str'] },
  { name: 'Fighter', description: 'Master of martial weapons and combat tactics.', hitDie: 10, primary: 'str', saves: ['str', 'con'], acFormula: 'heavy', armor: 'Chain mail', weapons: ['Longsword', 'Shield', 'Javelin', 'Javelin'], gold: 25, caster: null, slots: {}, cantrips: [], spells: [], proficiencies: ['All armor', 'Shields', 'Simple weapons', 'Martial weapons'], abilityPriority: ['str', 'con', 'dex', 'wis', 'cha', 'int'] },
  { name: 'Monk', description: 'Martial arts and spiritual energy master.', hitDie: 8, primary: 'dex', saves: ['str', 'dex'], acFormula: 'unarmoredWis', armor: 'None', weapons: ['Quarterstaff', 'Darts'], gold: 15, caster: null, slots: {}, cantrips: [], spells: [], proficiencies: ['Simple weapons', 'Shortswords', 'Unarmed strikes'], abilityPriority: ['dex', 'wis', 'con', 'str', 'int', 'cha'] },
  { name: 'Paladin', description: 'Holy oath-bound knight.', hitDie: 10, primary: 'str', saves: ['wis', 'cha'], acFormula: 'heavy', armor: 'Chain mail', weapons: ['Longsword', 'Shield', 'Javelin', 'Javelin'], gold: 25, caster: 'cha', slots: {}, cantrips: [], spells: [], proficiencies: ['All armor', 'Shields', 'Simple weapons', 'Martial weapons'], abilityPriority: ['str', 'cha', 'con', 'dex', 'wis', 'int'] },
  { name: 'Ranger', description: 'Wilderness tracker and marksman.', hitDie: 10, primary: 'dex', saves: ['str', 'dex'], acFormula: 'light', armor: 'Leather', weapons: ['Longbow', 'Shortsword', 'Shortsword'], gold: 25, caster: 'wis', slots: {}, cantrips: [], spells: [], proficiencies: ['Light armor', 'Medium armor', 'Shields', 'Simple weapons', 'Martial weapons'], abilityPriority: ['dex', 'con', 'wis', 'str', 'int', 'cha'] },
  { name: 'Rogue', description: 'Stealth and sneak-attack expert.', hitDie: 8, primary: 'dex', saves: ['dex', 'int'], acFormula: 'light', armor: 'Leather', weapons: ['Rapier', 'Shortbow', 'Dagger'], gold: 15, caster: null, slots: {}, cantrips: [], spells: [], proficiencies: ['Light armor', 'Simple weapons', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords', "Thieves' tools"], abilityPriority: ['dex', 'con', 'int', 'cha', 'wis', 'str'] },
  { name: 'Sorcerer', description: 'Innate magical bloodline caster.', hitDie: 6, primary: 'cha', saves: ['con', 'cha'], acFormula: 'none', armor: 'None', weapons: ['Quarterstaff', 'Dagger'], gold: 15, caster: 'cha', slots: { 1: 2 }, cantrips: ['Fire Bolt', 'Prestidigitation', 'Light', 'Mage Hand'], spells: ['Burning Hands', 'Charm Person', 'Magic Missile'], proficiencies: ['Simple weapons', 'Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows'], abilityPriority: ['cha', 'con', 'dex', 'int', 'wis', 'str'] },
  { name: 'Warlock', description: 'Pact-bound occult spellcaster.', hitDie: 8, primary: 'cha', saves: ['wis', 'cha'], acFormula: 'light', armor: 'Light armor', weapons: ['Light Crossbow', 'Dagger'], gold: 15, caster: 'cha', slots: { 1: 1 }, cantrips: ['Eldritch Blast', 'Prestidigitation'], spells: ['Charm Person', 'Hex'], proficiencies: ['Light armor', 'Simple weapons'], abilityPriority: ['cha', 'con', 'dex', 'int', 'wis', 'str'] },
  { name: 'Wizard', description: 'Scholarly arcane master.', hitDie: 6, primary: 'int', saves: ['int', 'wis'], acFormula: 'none', armor: 'None', weapons: ['Quarterstaff', 'Dagger'], gold: 10, caster: 'int', slots: { 1: 2 }, cantrips: ['Fire Bolt', 'Mage Hand', 'Light'], spells: ['Mage Armor', 'Magic Missile', 'Shield'], proficiencies: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows'], abilityPriority: ['int', 'con', 'dex', 'wis', 'cha', 'str'] }
];

export function validateForm(form) {
  if (!form) return false;
  if (!form.name || !form.name.trim()) return false;
  if (!form.race || !form.subrace || !form.class || !form.background || !form.alignment) return false;
  const a = form.ability_scores || {};
  for (const k of ['str', 'dex', 'con', 'int', 'wis', 'cha']) if (a[k] == null) return false;
  return true;
}

export function autoAssign(priority) {
  const sorted = [...STANDARD_ARRAY].sort((a, b) => b - a);
  const out = {};
  (priority || ['str', 'dex', 'con', 'int', 'wis', 'cha']).forEach((ab, i) => { out[ab] = sorted[i]; });
  return out;
}

export function previewStats(form) {
  const race = RACES.find(r => r.name === form.race);
  const cls = CLASSES.find(c => c.name === form.class);
  if (!race || !cls) return null;
  const subrace = race.subraces.find(s => s.name === form.subrace) || race.subraces[0];
  const bonuses = subrace?.bonuses || {};
  const base = form.ability_scores || {};
  const scores = {};
  let ready = true;
  for (const k of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
    if (base[k] == null) { ready = false; scores[k] = 10; }
    else scores[k] = base[k] + (bonuses[k] || 0);
  }
  const conMod = abilityModifier(scores.con);
  const dexMod = abilityModifier(scores.dex);
  const wisMod = abilityModifier(scores.wis);
  const hp = (cls.hitDie || 8) + conMod;
  let ac;
  switch (cls.acFormula) {
    case 'heavy': ac = 16; break;
    case 'unarmoredCon': ac = 10 + dexMod + conMod; break;
    case 'unarmoredWis': ac = 10 + dexMod + wisMod; break;
    case 'light': ac = 11 + dexMod; break;
    default: ac = 10 + dexMod;
  }
  return { hp, ac, speed: subrace?.speed || 30, initiative: dexMod, ready };
}

export function buildCharacterFromForm(form) {
  const race = RACES.find(r => r.name === form.race);
  const subrace = race?.subraces.find(s => s.name === form.subrace) || race?.subraces[0];
  const cls = CLASSES.find(c => c.name === form.class);
  const bonuses = subrace?.bonuses || {};
  const base = form.ability_scores || {};
  const ability_scores = {};
  for (const k of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
    ability_scores[k] = (base[k] == null ? 10 : base[k]) + (bonuses[k] || 0);
  }
  const conMod = abilityModifier(ability_scores.con);
  const dexMod = abilityModifier(ability_scores.dex);
  const wisMod = abilityModifier(ability_scores.wis);
  const hp = (cls?.hitDie || 8) + conMod;
  let ac;
  switch (cls?.acFormula) {
    case 'heavy': ac = 16; break;
    case 'unarmoredCon': ac = 10 + dexMod + conMod; break;
    case 'unarmoredWis': ac = 10 + dexMod + wisMod; break;
    case 'light': ac = 11 + dexMod; break;
    default: ac = 10 + dexMod;
  }
  const spells = [
    ...(cls?.cantrips || []).map(s => ({ name: s, level: 0 })),
    ...(cls?.spells || []).map(s => ({ name: s, level: 1 }))
  ];
  return {
    name: form.name,
    species: form.race,
    subclass: form.subrace,
    class: form.class,
    background: form.background || '',
    alignment: form.alignment || '',
    level: 1,
    xp: 0,
    ability_scores,
    proficiency_bonus: 2,
    hp, max_hp: hp, temp_hp: 0,
    ac, speed: subrace?.speed || 30, initiative: dexMod,
    gold: cls?.gold || 15,
    inventory: [],
    weapons: (cls?.weapons || []).map(w => ({ name: w, type: 'weapon' })),
    armor: cls?.armor || '',
    spells,
    spell_slots: cls?.slots || {},
    proficiencies: [...(cls?.proficiencies || []), `${race?.name || ''} traits`].filter(Boolean),
    saving_throws: cls?.saves || [],
    conditions: [],
    personality: form.personality || '',
    ideals: form.ideals || '',
    bonds: form.bonds || '',
    flaws: form.flaws || '',
    backstory: form.backstory || '',
    appearance: '', goals: '', relationships: '', description: '', portrait: ''
  };
}

export const PREBUILT_TEMPLATES = [
  {
    tagline: 'Mountain Dwarf Fighter',
    highlights: 'Sturdy soldier with a trusty blade and shield.',
    form: {
      name: 'Bran Ironfist', race: 'Dwarf', subrace: 'Mountain Dwarf', class: 'Fighter',
      background: 'Soldier', alignment: 'Lawful Good',
      ability_scores: { str: 15, dex: 12, con: 14, int: 10, wis: 13, cha: 8 },
      personality: 'Stoic and loyal, Bran values duty and camaraderie above all.',
      ideals: 'Greater good. The well-being of the many outweighs the few.',
      bonds: 'I would die for my comrades-in-arms.',
      flaws: 'I have a deep fear of failing my friends.',
      backstory: 'A veteran of many battles, Bran now seeks a new purpose beyond the army.'
    }
  },
  {
    tagline: 'High Elf Wizard',
    highlights: 'Bookish arcane scholar slinging fire and force.',
    form: {
      name: 'Lyra Starwhisper', race: 'Elf', subrace: 'High Elf', class: 'Wizard',
      background: 'Sage', alignment: 'Chaotic Good',
      ability_scores: { int: 15, dex: 14, con: 13, wis: 12, cha: 10, str: 8 },
      personality: 'Curious and precise, Lyra treats every problem as a puzzle to solve.',
      ideals: 'Knowledge. The path to power is through understanding.',
      bonds: 'I owe my life to the mentor who taught me magic.',
      flaws: 'I am oblivious to practical matters when lost in study.',
      backstory: 'Raised in a great library, Lyra left to find lost lore in the wider world.'
    }
  },
  {
    tagline: 'Lightfoot Halfling Rogue',
    highlights: 'Quick-fingered scoundrel with a knack for trouble.',
    form: {
      name: 'Pip Underleaf', race: 'Halfling', subrace: 'Lightfoot Halfling', class: 'Rogue',
      background: 'Criminal', alignment: 'Chaotic Neutral',
      ability_scores: { dex: 15, con: 14, cha: 13, int: 12, wis: 10, str: 8 },
      personality: 'Cheerful and opportunistic, Pip trusts luck over planning.',
      ideals: 'Freedom. Chains are meant to be slipped, not worn.',
      bonds: 'I am loyal to my old crew, wherever they are.',
      flaws: 'I cannot resist a locked door or a shiny trinket.',
      backstory: 'A street thief who graduated to bigger scores — and bigger risks.'
    }
  },
  {
    tagline: 'Human Cleric',
    highlights: 'Devout healer channeling divine light.',
    form: {
      name: 'Therana Dawnbringer', race: 'Human', subrace: 'Standard Human', class: 'Cleric',
      background: 'Acolyte', alignment: 'Neutral Good',
      ability_scores: { wis: 15, str: 14, con: 13, cha: 12, int: 10, dex: 8 },
      personality: 'Compassionate and resolute, Therana sees the good in others.',
      ideals: 'Faith. I trust that my deity guides my steps.',
      bonds: 'I would lay down my life for the people of my temple.',
      flaws: 'I can be too trusting of those who speak of faith.',
      backstory: 'A temple acolyte called to adventure by visions of a gathering darkness.'
    }
  },
  {
    tagline: 'Half-Orc Barbarian',
    highlights: 'Feral powerhouse who wades into the thick of fight.',
    form: {
      name: 'Gorrak Bloodfang', race: 'Half-Orc', subrace: 'Half-Orc', class: 'Barbarian',
      background: 'Outlander', alignment: 'Chaotic Neutral',
      ability_scores: { str: 15, con: 14, dex: 13, wis: 12, int: 10, cha: 8 },
      personality: 'Blunt and fierce, Gorrak respects strength and honesty.',
      ideals: 'Might. The strong protect the weak — or rule them.',
      bonds: 'My clan is my family; I will avenge their fall.',
      flaws: 'My rage can get the better of me when friends are threatened.',
      backstory: 'Exiled from his clan, Gorrak wanders seeking a new warband.'
    }
  },
  {
    tagline: 'Wood Elf Ranger',
    highlights: 'Silent tracker who strikes from a distance.',
    form: {
      name: 'Elowen Moonshadow', race: 'Elf', subrace: 'Wood Elf', class: 'Ranger',
      background: 'Hermit', alignment: 'Neutral Good',
      ability_scores: { dex: 15, wis: 14, con: 13, int: 12, str: 10, cha: 8 },
      personality: 'Quiet and watchful, Elowen speaks more with her bow than her voice.',
      ideals: 'Nature. The wilds must be guarded from those who would spoil them.',
      bonds: 'I protect a sacred grove that few know of.',
      flaws: 'I am slow to trust those who live behind city walls.',
      backstory: 'A guardian of the deep woods drawn out by a growing corruption.'
    }
  }
];