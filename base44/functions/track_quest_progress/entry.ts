import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { isWorkflowCall } from '../../shared/workflowAuth.js';

// Workflow step: Quest Tracker agent logic.
// Triggered on every DiceRoll creation. Reads the roll + recent story context,
// uses the LLM to evaluate quest progress and generate a narrative summary,
// updates quest statuses, and posts the narration as a system message that
// the DM bot can reference for story continuity.
// Internal-only: gated by the workflow shared secret (no user session available).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    if (!isWorkflowCall(body)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { roll_id } = body;
    if (!roll_id) return Response.json({ error: 'roll_id required' }, { status: 400 });

    const roll = await base44.asServiceRole.entities.DiceRoll.get(roll_id);
    const campaign_id = roll.campaign_id;
    if (!campaign_id) return Response.json({ outcome: 'no_campaign' });

    const [messages, quests, campaign] = await Promise.all([
      base44.asServiceRole.entities.Message.filter({ campaign_id }),
      base44.asServiceRole.entities.Quest.filter({ campaign_id }),
      base44.asServiceRole.entities.Campaign.get(campaign_id).catch(() => null)
    ]);

    const activeQuests = (quests || []).filter(q => q.status === 'active');
    if (activeQuests.length === 0) return Response.json({ outcome: 'no_active_quests' });

    const recentMsgs = (messages || []).slice(-15).map(m => `${m.sender}: ${m.content}`).join('\n');

    const prompt = `You are the Quest Tracker for a D&D 5e campaign. Evaluate the following dice roll and recent story context to determine if any active quests should progress, complete, or fail. Also generate a brief narrative summary of how the story is evolving.

Campaign: ${campaign?.name || 'Unknown'} — ${campaign?.setting || ''}
Setting: ${campaign?.description || ''}

Active Quests:
${activeQuests.map(q => `- ${q.name} (${q.type}): ${q.description || 'No description'}`).join('\n')}

Recent Dice Roll:
- Type: ${roll.dice_type}, Result: ${roll.result}, Modifier: ${roll.modifier}, Total: ${roll.total}
- Reason: ${roll.reason || 'Unknown'}
- DC: ${roll.dc || 'None'}

Recent Story:
${recentMsgs}

Based on this, return a JSON object with:
1. "quest_updates": array of { "name": quest name, "status": "active"|"completed"|"failed", "reason": why } — only include quests that should change status.
2. "narration": a 2-4 sentence narrative summary of how the story is evolving based on this roll and recent events.

Only update quests if the roll or recent events clearly warrant it. Be conservative — don't complete quests unless the objective is clearly achieved. Don't fail quests unless the situation clearly warrants it. If no quests need updating, return an empty quest_updates array.`;

    const schema = {
      type: 'object',
      properties: {
        quest_updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              status: { type: 'string', enum: ['active', 'completed', 'failed'] },
              reason: { type: 'string' }
            }
          }
        },
        narration: { type: 'string' }
      }
    };

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'automatic',
      response_json_schema: schema
    });

    // Apply quest updates
    let updatesApplied = 0;
    if (result.quest_updates && result.quest_updates.length) {
      for (const qu of result.quest_updates) {
        const quest = activeQuests.find(q => q.name.toLowerCase() === qu.name.toLowerCase());
        if (quest && qu.status !== quest.status) {
          await base44.asServiceRole.entities.Quest.update(quest.id, { status: qu.status });
          updatesApplied++;
        }
      }
    }

    // Post narration as a system message for the DM bot
    if (result.narration) {
      await base44.asServiceRole.entities.Message.create({
        session_id: campaign_id,
        campaign_id,
        sender: 'system',
        content: result.narration,
        members: campaign?.members || []
      });
    }

    return Response.json({ outcome: 'tracked', updates_applied: updatesApplied, narration: result.narration || '' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}