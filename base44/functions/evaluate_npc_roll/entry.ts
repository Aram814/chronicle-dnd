import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { isWorkflowCall, authorizeWorkflowRoll } from '../../shared/workflowAuth.js';

// Workflow step: evaluate a DiceRoll made against an NPC.
// - success -> improve NPC disposition + post a congratulatory message
// - critical failure (natural 1) -> return context so the workflow can invoke dm_engine
// - otherwise -> neutral (no action)
// Internal-only: gated by the native x-workflow-run header check.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    if (!isWorkflowCall(req)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { roll_id, user_id } = body;
    const auth = await authorizeWorkflowRoll(base44, roll_id, user_id);
    if (auth.error) return Response.json(auth.error.body, { status: auth.error.status });
    const { roll } = auth;
    const npc_id = roll.npc_id;
    if (!npc_id) return Response.json({ outcome: 'neutral' });

    const npc = await base44.asServiceRole.entities.NPC.get(npc_id).catch(() => null);
    if (!npc) return Response.json({ outcome: 'neutral' });

    const result = roll.result;
    const total = roll.total;
    const dc = roll.dc;
    const isCritFail = result === 1;
    const isSuccess = !isCritFail && ((dc != null && total >= dc) || result === 20);

    if (isSuccess) {
      const updates = {};
      if (npc.is_hostile) updates.is_hostile = false;
      const betterRel = upgradeRelationship(npc.relationship || '');
      if (betterRel) updates.relationship = betterRel;
      const note = `Successful ${roll.reason || 'check'} (rolled ${total}${dc != null ? ' vs DC ' + dc : ''}).`;
      updates.known_info = [npc.known_info, note].filter(Boolean).join('\n');
      await base44.asServiceRole.entities.NPC.update(npc_id, updates);

      const content = `⚔ **Success!** Your roll of **${total}**${dc != null ? ` against DC ${dc}` : ''} with ${npc.name} was a triumph. ${npc.name}'s disposition warms toward you.`;
      await base44.asServiceRole.entities.Message.create({
        session_id: roll.session_id || roll.campaign_id,
        campaign_id: roll.campaign_id,
        sender: 'dm',
        content
      });
      return Response.json({ outcome: 'success', npc_id });
    }

    if (isCritFail) {
      return Response.json({
        outcome: 'critical_failure',
        campaign_id: roll.campaign_id,
        session_id: roll.session_id || roll.campaign_id,
        npc_id,
        roll_id
      });
    }

    return Response.json({ outcome: 'neutral' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function upgradeRelationship(rel) {
  const tiers = ['hostile', 'unfriendly', 'neutral', 'friendly', 'allied'];
  const r = String(rel || '').toLowerCase();
  let idx = tiers.findIndex(t => r.includes(t));
  if (idx === -1) return 'Friendly';
  if (idx >= tiers.length - 1) return 'Allied';
  const next = tiers[idx + 1];
  return next.charAt(0).toUpperCase() + next.slice(1);
}