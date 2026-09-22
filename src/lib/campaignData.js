// Curated campaign templates + options for the campaign builder.

export const TONE_OPTIONS = [
  'Serious', 'Epic', 'Dark', 'Horror', 'Comedic', 'Whimsical',
  'Mystery', 'Political Intrigue', 'Romance', 'Survival', 'Exploration', 'High Adventure'
];

export const DIFFICULTY_OPTIONS = ['Casual', 'Normal', 'Challenging', 'Hardcore'];

export const DM_STYLE_OPTIONS = [
  'Story-focused', 'Rules-focused', 'Balanced', 'Cinematic', 'Tactical'
];

// Each prebuilt campaign ships a compact world_state so the DM has concrete
// context to open with, plus a starting location.
export const PREBUILT_CAMPAIGNS = [
  {
    name: 'The Curse of Ravenmoor',
    tagline: 'Gothic horror mystery',
    highlights: 'A fog-shrouded village hides a centuries-old curse.',
    setting: 'Dark fantasy — the haunted village of Ravenmoor',
    description: 'Travelers vanish on the moors surrounding Ravenmoor. The villagers whisper of a curse laid by a betrayed witch centuries ago — and of something stirring beneath the old chapel. Can your party uncover the truth before the fog claims another soul?',
    tone: ['Dark', 'Horror', 'Mystery'],
    difficulty: 'Challenging',
    dm_style: 'Cinematic',
    current_location: 'Ravenmoor Village',
    world_state: {
      world_name: 'Ravenmoor',
      overview: 'A remote, fog-draped village in a gothic corner of the world, ringed by desolate moors and ancient, half-forgotten graves.',
      starting_location: 'Ravenmoor Village',
      conflicts: ['The witch\'s curse tightens its grip each foggy night', 'Villagers distrust outsiders and hide old sins']
    }
  },
  {
    name: 'Shadows over Aetheria',
    tagline: 'Political intrigue in a floating city',
    highlights: 'Noble houses scheme for control of a skybound realm.',
    setting: 'High fantasy — the sky-city of Aetheria',
    description: 'Aetheria floats above the clouds, held aloft by ancient magic and ruled by squabbling noble houses. When the Archon is found murdered, every house is a suspect — and every alliance a knife waiting to fall. Navigate the courts, uncover the conspiracy, and decide who sits the Skylord\'s throne.',
    tone: ['Political Intrigue', 'Mystery', 'Serious'],
    difficulty: 'Hardcore',
    dm_style: 'Story-focused',
    current_location: 'The Spire Court',
    world_state: {
      world_name: 'Aetheria',
      overview: 'A soaring sky-city of marble spires and wind-bridges, where magic sustains the realm and intrigue sustains the rulers.',
      starting_location: 'The Spire Court',
      conflicts: ['Rival houses vie for the vacant Skylord throne', 'The magic keeping Aetheria aloft is quietly failing']
    }
  },
  {
    name: 'The Ember Frontier',
    tagline: 'Wilderness survival & exploration',
    highlights: 'Tame a lawless frontier teeming with beasts and ruin.',
    setting: 'Low fantasy — the untamed Ember Frontier',
    description: 'Beyond the last outposts of civilization lies the Ember Frontier: a land of monster-haunted woods, collapsed kingdoms, and glittering opportunity. Stake a claim, brave the wilds, and build a legend — or feed the soil like the rest.',
    tone: ['Exploration', 'Survival', 'High Adventure'],
    difficulty: 'Normal',
    dm_style: 'Balanced',
    current_location: 'Fort Ember',
    world_state: {
      world_name: 'The Ember Frontier',
      overview: 'A rugged, newly-opened frontier region of ruined kingdoms and dense wilderness, dotted with frontier forts and abandoned ruins.',
      starting_location: 'Fort Ember',
      conflicts: ['Monsters press in from the deep wilds', 'Rival settlers and bandons claim the richest land']
    }
  },
  {
    name: 'The Sunken Throne of Vael',
    tagline: 'Epic high-fantasy quest',
    highlights: 'Reclaim a drowned kingdom\'s lost crown.',
    setting: 'High fantasy — the drowned lands of Vael',
    description: 'A thousand years ago the kingdom of Vael sank beneath the waves, its throne sealed by a forgotten god. Now the tides have receded, exposing ruins crawling with ancient guardians. The race is on to claim the Sunken Throne — and the power it promises.',
    tone: ['Epic', 'High Adventure', 'Serious'],
    difficulty: 'Challenging',
    dm_style: 'Tactical',
    current_location: 'The Shores of Vael',
    world_state: {
      world_name: 'Vael',
      overview: 'A once-great kingdom recently exposed by receding seas, its drowned ruins now reachable but guarded by ancient constructs and worse.',
      starting_location: 'The Shores of Vael',
      conflicts: ['Adventurers and powers race for the Sunken Throne', 'Ancient guardians awaken to repel intruders']
    }
  },
  {
    name: 'Tales of the Wandering Wagon',
    tagline: 'Lighthearted comedic adventure',
    highlights: 'A bumbling troupe bumbles into (and out of) trouble.',
    setting: 'Whimsical fantasy — the roads of the Green Marches',
    description: 'You and your mismatched companions run a traveling wagon, peddling wonders (and the occasional swindle) from town to town. Things rarely go as planned — but the gold\'s good and the stories are better. A lighter, friendlier adventure for heroes who don\'t take themselves too seriously.',
    tone: ['Comedic', 'Whimsical', 'High Adventure'],
    difficulty: 'Casual',
    dm_style: 'Cinematic',
    current_location: 'The Crossroads Inn',
    world_state: {
      world_name: 'The Green Marches',
      overview: 'A patchwork of friendly farming towns and rolling green roads, full of eccentric locals and low-stakes trouble.',
      starting_location: 'The Crossroads Inn',
      conflicts: ['Rival merchants muscle in on your trade routes', 'Every town has a new, ridiculous problem to solve']
    }
  }
];

// Build the Campaign-entity update payload from a prebuilt template.
export function buildCampaignPayloadFromTemplate(t) {
  return {
    name: t.name,
    setting: t.setting,
    description: t.description,
    tone: t.tone,
    difficulty: t.difficulty,
    dm_style: t.dm_style,
    current_location: t.current_location || '',
    world_state: t.world_state || {}
  };
}

// Build a payload from the custom build form. If no AI world was generated,
// derive a minimal world_state from the user's setting + premise so the DM
// still has concrete context to open with.
export function buildCampaignPayloadFromForm(form) {
  const world_state = form.world_state || {
    world_name: form.setting || form.name,
    overview: form.description || '',
    starting_location: ''
  };
  return {
    name: form.name,
    setting: form.setting,
    description: form.description || '',
    tone: form.tone || [],
    difficulty: form.difficulty || 'Normal',
    dm_style: form.dm_style || 'Balanced',
    current_location: world_state.starting_location || '',
    world_state
  };
}

// Map a parsed JSON import object onto a campaign payload.
export function buildCampaignPayloadFromImport(data) {
  const world_state = data.world_state || {
    world_name: data.setting || data.name,
    overview: data.description || data.premise || '',
    starting_location: data.current_location || ''
  };
  return {
    name: data.name || 'Imported Campaign',
    setting: data.setting || data.world_name || '',
    description: data.description || data.premise || '',
    tone: Array.isArray(data.tone) ? data.tone : [],
    difficulty: data.difficulty || 'Normal',
    dm_style: data.dm_style || 'Balanced',
    current_location: data.current_location || world_state.starting_location || '',
    world_state
  };
}