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

    const existing = await base44.asServiceRole.entities.NPC.filter({ campaign_id });

    // --- Merge existing duplicates (same normalized name, 2+ records) ---
    // Keeps the richest record, folds the others' interactions into it, then
    // deletes the extras. This fixes "two Elara the Elder" entries.
    const groups = {};
    for (const n of existing) {
      const key = normName(n.name);
      if (!key) continue;
      (groups[key] ||= []).push(n);
    }
    let merged = 0;
    for (const key of Object.keys(groups)) {
      const group = groups[key];
      if (group.length < 2) continue;
      // Pick the record with the most filled fields as the keeper.
      const score = (n) =>
        ['description', 'personality', 'portrait', 'location', 'faction'].filter(f => n[f]).length +
        (n.interactions || []).length;
      const sorted = [...group].sort((a, b) => score(b) - score(a));
      const keeper = sorted[0];
      const rest = sorted.slice(1);
      const allInteractions = [...(keeper.interactions || []), ...rest.flatMap(n => n.interactions || [])];
      const patch = {};
      if (allInteractions.length > (keeper.interactions || []).length) patch.interactions = allInteractions;
      // Carry over a portrait from a duplicate if the keeper lacks one.
      if (!keeper.portrait) {
        const withPortrait = rest.find(n => n.portrait);
        if (withPortrait) patch.portrait = withPortrait.portrait;
      }
      if (Object.keys(patch).length) {
        await base44.asServiceRole.entities.NPC.update(keeper.id, patch);
      }
      for (const n of rest) {
        await base44.asServiceRole.entities.NPC.delete(n.id);
        merged++;
      }
    }

    // Re-fetch after merges so matching uses the surviving records.
    const current = await base44.asServiceRole.entities.NPC.filter({ campaign_id });

    let created = 0;
    let updated = 0;
    let recategorized = 0;

    for (const e of entries) {
      const name = String(e.name || '').trim();
      if (!name) continue;
      const key = normName(name);
      const match = current.find(n => normName(n.name) === key);

      if (match) {
        const patch = {};
        // Recategorize a person that is actually a creature (e.g. Shroud-Stalker
        // filed as an NPC before the monster/creature split existed).
        if (e.category === 'monster' && (match.category || 'npc') !== 'monster') {
          patch.category = 'monster';
          patch.is_hostile = true;
          recategorized++;
        }
        // Fill any missing fields from the extracted data (never overwrite
        // existing richer values).
        if (!match.description && e.description) patch.description = e.description;
        if (!match.personality && e.personality) patch.personality = e.personality;
        if (e.monster_type && !match.monster_type) patch.monster_type = e.monster_type;
        if (e.location && !match.location) patch.location = e.location;
        if (e.relationship && !match.relationship) patch.relationship = e.relationship;
        if (Object.keys(patch).length) {
          await base44.asServiceRole.entities.NPC.update(match.id, patch);
          updated++;
        }
      } else {
        await base44.asServiceRole.entities.NPC.create({
          campaign_id,
          name,
          description: e.description || '',
          personality: e.personality || '',
          relationship: e.relationship || '',
          monster_type: e.monster_type || '',
          location: e.location || '',
          category: e.category || 'npc',
          is_hostile: e.category === 'monster',
          members: memberIds
        });
        created++;
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