// Native workflow-call authentication.
//
// The Base44 platform injects an `x-workflow-run` header on every backend
// function call that originates from a workflow run. Direct calls (frontend
// SDK, the test tool, or raw external HTTP) do not carry it. Checking for
// that header lets internal-only functions verify the call came from a
// workflow — without a shared secret hardcoded into the workflow definition
// (which the security scanner flags as a hardcoded credential).
//
// This module lives under base44/ (server-side only, never shipped to the
// client bundle), and the header is platform-controlled (not client-settable),
// so an external caller cannot forge it.
export function isWorkflowCall(req) {
  if (!req || !req.headers || typeof req.headers.forEach !== 'function') return false;
  let present = false;
  req.headers.forEach((_value, key) => {
    if (key.toLowerCase() === 'x-workflow-run') present = true;
  });
  return present;
}

// Authorize a workflow-triggered operation anchored to a DiceRoll.
//
// Workflow calls carry no user session, so base44.auth.me() is unavailable.
// The trustworthy identity is the roll's created_by_id — the user who made
// the roll. The workflow engine passes it from the trigger entity
// (.trigger.data.created_by_id); an external caller cannot discover it (it
// is not exposed in app URLs). We require the claimed user to match the
// roll's creator AND to be a member of the roll's campaign, so:
//   - an external caller without the creator id is rejected (403)
//   - a roll fraudulently pointed at a campaign the roller isn't in is rejected
// Returns { roll, campaign } on success or { error: { status, body } }.
export async function authorizeWorkflowRoll(base44, roll_id, claimedUserId) {
  if (!roll_id) return { error: { status: 400, body: { error: 'roll_id required' } } };
  const roll = await base44.asServiceRole.entities.DiceRoll.get(roll_id).catch(() => null);
  if (!roll) return { error: { status: 404, body: { error: 'Roll not found' } } };
  if (!claimedUserId || claimedUserId !== roll.created_by_id) {
    return { error: { status: 403, body: { error: 'Forbidden' } } };
  }
  const campaign = await base44.asServiceRole.entities.Campaign.get(roll.campaign_id).catch(() => null);
  if (!campaign) return { error: { status: 404, body: { error: 'Campaign not found' } } };
  const isMember = campaign.created_by_id === claimedUserId ||
    (Array.isArray(campaign.members) && campaign.members.includes(claimedUserId));
  if (!isMember) return { error: { status: 403, body: { error: 'Forbidden' } } };
  return { roll, campaign };
}