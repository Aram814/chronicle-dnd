import { createClientFromRequest } from 'npm:@base44/sdk@0.8.50';

// Normalize an NPC/monster name for matching: lowercase, trim, collapse
// internal whitespace. Handles "Elara the Elder" vs "elara the elder" and
// stray spaces that would otherwise defeat exact-match dedup.
function normName(s) {
  return String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { campaign_id } = body;
    if (!campaign_id) return Response.json({ error: 'campaign_id required' }, { status: 400 });

    // Membership check: only campaign members may reconcile its journal.
    const campaign = await base44.asServiceRole.entities.Campaign.get(campaign_id).catch(() => null);
    if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });
    const memberIds = [...new Set([campaign.created_by_id, ...(campaign.members || [])])];
    if (!memberIds.includes(user.id)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await base44.asServiceRole.entities.Message.filter({ campaign_id });
    const conversation = (messages || [])
      .map(m => `${m.sender === 'dm' ? 'DM' : 'PLAYER'}: ${m.content}`)
      .join('\n\n');

    if (!conversation.trim()) {
      return Response.json({ error: 'No conversation to analyze yet' }, { status: 400 });
    }

    // Ask the LLM to extract every distinct person and creature from the full
    // chat history, with enough detail to populate the journal. The model is
    // told to use each entity's full canonical name so "Elara" and "Elara the
    // Elder" reconcile to a single entry.
    const prompt = `You are auditing a D&D campaign journal. Below is the full conversation between the players and the Dungeon Master. Extract EVERY distinct PERSON and CREATURE/MONSTER the party has met, spoken to, fought, or clearly encountered.

For each entity return:
- name: the full canonical name (if a character is called both "Elara" and "Elara the Elder", use "Elara the Elder")
- category: "npc" for a person (humanoid you can talk to: shopkeepers, nobles, quest-givers, companions, innkeepers, villains who speak) OR "monster" for a creature (enemies, beasts, undead, dragons, wild animals, fiends, aberrations — anything you would stat as a monster rather than play as a person)
- description: 1-2 sentences
- personality: a few words (for NPCs)
- relationship: one of ally/friendly/neutral/wary/hostile/rival (for NPCs)
- monster_type: for monsters only (e.g. Undead/Beast/Humanoid/Dragon/Fiend/Aberration)
- location: where they were encountered, if known

Do NOT include the player characters. Only include entities actually present or named in the conversation. Return ONLY the JSON object.

CONVERSATION:
${conversation.slice(-12000)}`;

    const schema = {
      type: 'object',
      properties: {
        entries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string', enum: ['npc', 'monster'] },
              description: { type: 'string' },
              personality: { type: 'string' },
              relationship: { type: 'string' },
              monster_type: { type: 'string' },
              location: { type: 'string' }
            }
          }
        }
      }
    };

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'automatic',
      response_json_schema: schema
    });
    const entries = (res && res.entries) || [];

    // NPCs and Monsters are now separate entities. Dedup within each one
    // independently (same normalized name, 2+ records): keep the richest record,
    // fold the others' interactions into it, then delete the extras.
    const mergeDupes = async (entityName) => {
      const list = await base44.asServiceRole.entities[entityName].filter({ campaign_id });
      const groups = {};
      for (const n of list) {
        const key = normName(n.name);
        if (!key) continue;
        (groups[key] ||= []).push(n);
      }
      let merged = 0;
      for (const key of Object.keys(groups)) {
        const group = groups[key];
        if (group.length < 2) continue;
        const score = (n) =>
          ['description', 'personality', 'portrait', 'location', 'faction'].filter(f => n[f]).length +
          (n.interactions || []).length;
        const sorted = [...group].sort((a, b) => score(b) - score(a));
        const keeper = sorted[0];
        const rest = sorted.slice(1);
        const allInteractions = [...(keeper.interactions || []), ...rest.flatMap(n => n.interactions || [])];
        const patch = {};
        if (allInteractions.length > (keeper.interactions || []).length) patch.interactions = allInteractions;
        if (!keeper.portrait) {
          const withPortrait = rest.find(n => n.portrait);
          if (withPortrait) patch.portrait = withPortrait.portrait;
        }
        if (Object.keys(patch).length) {
          await base44.asServiceRole.entities[entityName].update(keeper.id, patch);
        }
        for (const n of rest) {
          await base44.asServiceRole.entities[entityName].delete(n.id);
          merged++;
        }
      }
      return merged;
    };

    let merged = await mergeDupes('NPC');
    merged += await mergeDupes('Monster');

    // Re-fetch after merges so matching uses the surviving records.
    let npcs = await base44.asServiceRole.entities.NPC.filter({ campaign_id });
    let monsters = await base44.asServiceRole.entities.Monster.filter({ campaign_id });

    let created = 0;
    let updated = 0;
    let recategorized = 0;

    for (const e of entries) {
      const name = String(e.name || '').trim();
      if (!name) continue;
      const key = normName(name);
      const isMonster = e.category === 'monster';

      if (isMonster) {
        // A creature: belongs in the Monster entity.
        const monsterMatch = monsters.find(n => normName(n.name) === key);
        if (monsterMatch) {
          const patch = {};
          if (!monsterMatch.description && e.description) patch.description = e.description;
          if (e.monster_type && !monsterMatch.monster_type) patch.monster_type = e.monster_type;
          if (e.location && !monsterMatch.location) patch.location = e.location;
          if (Object.keys(patch).length) {
            await base44.asServiceRole.entities.Monster.update(monsterMatch.id, patch);
            updated++;
          }
        } else {
          const npcMatch = npcs.find(n => normName(n.name) === key);
          if (npcMatch) {
            // Misfiled as a person before the split — migrate it to Monster.
            await base44.asServiceRole.entities.Monster.create({
              campaign_id,
              name,
              description: e.description || npcMatch.description || '',
              monster_type: e.monster_type || npcMatch.monster_type || '',
              location: e.location || npcMatch.location || '',
              is_hostile: true,
              status: npcMatch.status || 'alive',
              portrait: npcMatch.portrait || '',
              interactions: npcMatch.interactions || [],
              members: memberIds
            });
            await base44.asServiceRole.entities.NPC.delete(npcMatch.id);
            npcs = npcs.filter(n => n.id !== npcMatch.id);
            recategorized++;
          } else {
            await base44.asServiceRole.entities.Monster.create({
              campaign_id,
              name,
              description: e.description || '',
              monster_type: e.monster_type || '',
              location: e.location || '',
              is_hostile: true,
              members: memberIds
            });
            created++;
          }
        }
      } else {
        // A person: belongs in the NPC entity.
        const npcMatch = npcs.find(n => normName(n.name) === key);
        if (npcMatch) {
          const patch = {};
          if (!npcMatch.description && e.description) patch.description = e.description;
          if (!npcMatch.personality && e.personality) patch.personality = e.personality;
          if (e.location && !npcMatch.location) patch.location = e.location;
          if (e.relationship && !npcMatch.relationship) patch.relationship = e.relationship;
          if (Object.keys(patch).length) {
            await base44.asServiceRole.entities.NPC.update(npcMatch.id, patch);
            updated++;
          }
        } else {
          const monsterMatch = monsters.find(n => normName(n.name) === key);
          if (monsterMatch) {
            // Misfiled as a creature — migrate it to NPC.
            await base44.asServiceRole.entities.NPC.create({
              campaign_id,
              name,
              description: e.description || monsterMatch.description || '',
              personality: e.personality || '',
              relationship: e.relationship || '',
              location: e.location || monsterMatch.location || '',
              status: monsterMatch.status || 'alive',
              portrait: monsterMatch.portrait || '',
              interactions: monsterMatch.interactions || [],
              members: memberIds
            });
            await base44.asServiceRole.entities.Monster.delete(monsterMatch.id);
            monsters = monsters.filter(n => n.id !== monsterMatch.id);
            recategorized++;
          } else {
            await base44.asServiceRole.entities.NPC.create({
              campaign_id,
              name,
              description: e.description || '',
              personality: e.personality || '',
              relationship: e.relationship || '',
              location: e.location || '',
              members: memberIds
            });
            created++;
          }
        }
      }
    }

    return Response.json({
      extracted: entries.length,
      merged,
      created,
      updated,
      recategorized
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}