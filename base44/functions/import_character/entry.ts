import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Extracts D&D 5e character data from an uploaded sheet (PDF/screenshot/JSON)
// stored in private storage. Creates a signed URL so the LLM can read it, then
// returns the structured character fields for the editor to review.
const SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    species: { type: 'string' },
    class: { type: 'string' },
    subclass: { type: 'string' },
    background: { type: 'string' },
    alignment: { type: 'string' },
    level: { type: 'number' },
    xp: { type: 'number' },
    ability_scores: {
      type: 'object',
      properties: {
        str: { type: 'number' }, dex: { type: 'number' }, con: { type: 'number' },
        int: { type: 'number' }, wis: { type: 'number' }, cha: { type: 'number' }
      }
    },
    hp: { type: 'number' }, max_hp: { type: 'number' }, ac: { type: 'number' },
    speed: { type: 'number' }, gold: { type: 'number' }, proficiency_bonus: { type: 'number' },
    proficiencies: { type: 'array', items: { type: 'string' } },
    saving_throws: { type: 'array', items: { type: 'string' } },
    weapons: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, damage: { type: 'string' } } } },
    inventory: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
    spells: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
    personality: { type: 'string' }, ideals: { type: 'string' }, bonds: { type: 'string' },
    flaws: { type: 'string' }, backstory: { type: 'string' }, appearance: { type: 'string' },
    goals: { type: 'string' }, description: { type: 'string' }
  }
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { file_uri } = body;
    if (!file_uri) return Response.json({ error: 'file_uri required' }, { status: 400 });

    // The file is in private storage — mint a short-lived signed URL the LLM can fetch.
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri });

    const prompt = `You are an expert at reading D&D 5th Edition character sheets. The attached file is an exported character sheet (PDF or screenshot) or a character JSON file (e.g. from D&D Beyond, Roll20, or a VTT). Extract every field you can read into the structured schema. Ability scores must be the raw numbers (usually 3-20). For weapons, include name and damage dice if visible. Only include data that is actually present — do not invent or guess missing values. If a field is absent, omit it rather than filling a placeholder.`;
    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [signed_url],
      response_json_schema: SCHEMA,
      model: 'automatic'
    });
    return Response.json({ character: res });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}