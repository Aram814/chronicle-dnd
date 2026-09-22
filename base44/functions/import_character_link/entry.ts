import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Pulls a character from a D&D Beyond shared link. D&D Beyond's character-service
// endpoint returns the full character JSON by numeric ID without authentication.
// We map that JSON into our Character entity shape (stats, race, class, etc.).
const ALIGNMENTS = {
  1: 'Lawful Good', 2: 'Neutral Good', 3: 'Chaotic Good',
  4: 'Lawful Neutral', 5: 'True Neutral', 6: 'Chaotic Neutral',
  7: 'Lawful Evil', 8: 'Neutral Evil', 9: 'Chaotic Evil'
};
const STAT_MAP = { 1: 'str', 2: 'dex', 3: 'con', 4: 'int', 5: 'wis', 6: 'cha' };
const PROF_BY_LEVEL = [2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6];

function profBonus(level) {
  return PROF_BY_LEVEL[Math.max(0, Math.min(level - 1, 19))] || 2;
}

function mapCharacter(d) {
  const ability_scores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  for (const s of (d.stats || [])) {
    const key = STAT_MAP[s.id];
    if (key && s.value != null) ability_scores[key] = s.value;
  }
  for (const s of (d.overrideStats || [])) {
    const key = STAT_MAP[s.id];
    if (key && s.value != null) ability_scores[key] = s.value;
  }

  const classes = d.classes || [];
  const level = classes.reduce((sum, c) => sum + (c.level || 0), 0) || 1;
  const mainClass = classes[0] || {};
  const cls = mainClass.definition?.name || '';
  const subclass = mainClass.subclassDefinition?.name || '';

  const raceName = d.race?.fullName || d.race?.baseName || d.race?.baseRaceName || '';
  const subName = d.race?.subRaceShortName || '';
  const species = subName && subName !== raceName ? `${raceName} (${subName})` : raceName;

  const max_hp = d.overrideHitPoints != null ? d.overrideHitPoints : (d.baseHitPoints || 0) + (d.bonusHitPoints || 0);
  const hp = max_hp - (d.removedHitPoints || 0) + (d.temporaryHitPoints || 0);
  const dexMod = Math.floor(((ability_scores.dex || 10) - 10) / 2);
  const ac = d.armorClass != null ? d.armorClass : 10 + dexMod;
  const speed = d.race?.weightSpeeds?.normal?.walk || 30;
  const gold = d.currencies?.gp || 0;

  const appearance = [
    d.gender, d.age != null ? `${d.age} years` : null, d.height,
    d.weight != null ? `${d.weight} lbs` : null,
    d.hair ? `hair: ${d.hair}` : null, d.eyes ? `eyes: ${d.eyes}` : null, d.skin ? `skin: ${d.skin}` : null
  ].filter(Boolean).join('; ');

  const inventory = (d.inventory || [])
    .map(i => ({ name: i.definition?.name, quantity: i.quantity || 1 }))
    .filter(i => i.name);

  const spells = [];
  if (d.spells && typeof d.spells === 'object' && !Array.isArray(d.spells)) {
    for (const k of Object.keys(d.spells)) {
      const arr = d.spells[k];
      if (Array.isArray(arr)) for (const s of arr) if (s?.definition?.name) spells.push({ name: s.definition.name });
    }
  }

  return {
    name: d.name || 'Imported Character',
    species, class: cls, subclass,
    background: d.background?.definition?.name || '',
    alignment: ALIGNMENTS[d.alignmentId] || '',
    level, xp: d.currentXp || 0, ability_scores,
    hp, max_hp, ac, speed, gold,
    proficiency_bonus: profBonus(level),
    inventory, spells,
    appearance,
    portrait: d.decorations?.avatarUrl || '',
    description: `Imported from D&D Beyond (character ID ${d.id}).`
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { url } = body;
    if (!url) return Response.json({ error: 'url required' }, { status: 400 });

    const match = String(url).match(/characters\/(\d+)/);
    if (!match) return Response.json({ error: 'Could not find a character ID in that link. Use a link like dndbeyond.com/characters/33069160' }, { status: 400 });
    const characterId = match[1];

    const r = await fetch(`https://character-service.dndbeyond.com/character/v5/character/${characterId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    });
    if (!r.ok) return Response.json({ error: `D&D Beyond returned status ${r.status}. Check the link is a valid shared character.` }, { status: 502 });
    const json = await r.json();
    if (!json || !json.success || !json.data) return Response.json({ error: 'No character data returned from D&D Beyond.' }, { status: 502 });

    return Response.json({ character: mapCharacter(json.data) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}