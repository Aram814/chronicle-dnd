import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { isWorkflowCall } from '../../shared/workflowAuth.js';

// Workflow step: persist the DM engine's negative-consequence narration as a message.
// Internal-only: gated by the native x-workflow-run header check.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    if (!isWorkflowCall(req)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { campaign_id, session_id, content } = body;
    if (!campaign_id || !content) return Response.json({ error: 'campaign_id and content required' }, { status: 400 });
    await base44.asServiceRole.entities.Message.create({
      session_id: session_id || campaign_id,
      campaign_id,
      sender: 'dm',
      content
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}