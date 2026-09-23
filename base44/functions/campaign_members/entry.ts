import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === 'generate_code') return await generateCode(base44, user, body);
    if (action === 'invite_email') return await inviteEmail(base44, user, body);
    if (action === 'lookup_code') return await lookupByCode(base44, user, body);
    if (action === 'join') return await joinCampaign(base44, user, body);
    if (action === 'list_members') return await listMembers(base44, user, body);
    if (action === 'remove_member') return await removeMember(base44, user, body);
    if (action === 'set_character') return await setCharacter(base44, user, body);

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Full member list = host + joined players. Used for the denormalized `members`
// array stamped on every shared child record so RLS can grant cross-user access.
function fullMemberList(campaign) {
  const set = new Set<string>();
  if (campaign.created_by_id) set.add(campaign.created_by_id);
  for (const id of campaign.members || []) set.add(id);
  return Array.from(set);
}

// Validate a caller-supplied app_url against the app's own origin before
// interpolating it into an email body, to prevent phishing-link injection.
// Only https URLs on a base44.app host are trusted; anything else is rejected
// (the caller falls back to a code-only invitation with no clickable link).
function sanitizeAppUrl(app_url) {
  if (!app_url) return null;
  try {
    const u = new URL(String(app_url));
    if (u.protocol !== 'https:') return null;
    if (!u.hostname.endsWith('.base44.app')) return null;
    return `${u.protocol}//${u.host}`;
  } catch (e) {
    return null;
  }
}

async function generateCode(base44, user, body) {
  const { campaign_id } = body;
  const campaign = await base44.asServiceRole.entities.Campaign.get(campaign_id);
  if (campaign.created_by_id !== user.id) {
    return Response.json({ error: 'Only the host can generate a join code' }, { status: 403 });
  }
  let code = campaign.join_code;
  if (!code) {
    code = makeCode();
    await base44.asServiceRole.entities.Campaign.update(campaign_id, { join_code: code });
  }
  return Response.json({ code });
}

async function inviteEmail(base44, user, body) {
  const { campaign_id, emails, app_url } = body;
  const campaign = await base44.asServiceRole.entities.Campaign.get(campaign_id);
  if (campaign.created_by_id !== user.id) {
    return Response.json({ error: 'Only the host can invite players' }, { status: 403 });
  }

  let code = campaign.join_code;
  if (!code) {
    code = makeCode();
    await base44.asServiceRole.entities.Campaign.update(campaign_id, { join_code: code });
  }

  const emailList = Array.isArray(emails) ? emails : [emails];
  const safeUrl = sanitizeAppUrl(app_url);
  const joinUrl = safeUrl ? `${safeUrl}/join?code=${code}` : `Use code: ${code}`;
  let sent = 0;

  for (const raw of emailList) {
    const email = String(raw).trim().toLowerCase();
    if (!email) continue;

    // Create a pending member record so the host sees the invitation status.
    const existing = await base44.asServiceRole.entities.CampaignMember.filter({
      campaign_id, user_email: email
    });
    if (!existing || !existing.length) {
      await base44.asServiceRole.entities.CampaignMember.create({
        campaign_id,
        user_email: email,
        role: 'player',
        status: 'pending'
      });
    }

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `${user.full_name || user.email} invited you to join "${campaign.name}"`,
        body: `You've been invited to join the D&D campaign "${campaign.name}".\n\nUse this join code: ${code}\n\nOr open this link: ${joinUrl}`
      });
      sent++;
    } catch (e) {
      // Email send may fail for non-registered addresses on free plans; the
      // pending member record still lets the host track invitations.
    }
  }

  return Response.json({ sent, code });
}

async function lookupByCode(base44, user, body) {
  const { code } = body;
  if (!code) return Response.json({ error: 'Join code required' }, { status: 400 });

  const campaigns = await base44.asServiceRole.entities.Campaign.filter({
    join_code: String(code).toUpperCase()
  });
  if (!campaigns || !campaigns.length) {
    return Response.json({ error: 'Invalid join code' }, { status: 404 });
  }
  const campaign = campaigns[0];
  const isMember = campaign.created_by_id === user.id || (campaign.members || []).includes(user.id);
  return Response.json({ campaign, already_member: isMember });
}

async function joinCampaign(base44, user, body) {
  const { campaign_id, code } = body;
  const campaign = await base44.asServiceRole.entities.Campaign.get(campaign_id);
  if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });

  const members = campaign.members || [];
  if (campaign.created_by_id === user.id || members.includes(user.id)) {
    return Response.json({ campaign, already_member: true });
  }

  // Membership is granted solely through a valid join code the host generated.
  // Do not trust the client-supplied campaign_id alone as authorization —
  // campaign ids are exposed in app URLs and shared links.
  if (!code) return Response.json({ error: 'Join code required' }, { status: 400 });
  const expected = String(code).toUpperCase().trim();
  if (!campaign.join_code || String(campaign.join_code).toUpperCase() !== expected) {
    return Response.json({ error: 'Invalid join code' }, { status: 403 });
  }

  // Add the user to the campaign's member list.
  const newMembers = [...members, user.id];
  await base44.asServiceRole.entities.Campaign.update(campaign_id, { members: newMembers });

  // Create or activate the member record.
  const existing = await base44.asServiceRole.entities.CampaignMember.filter({
    campaign_id, user_id: user.id
  });
  if (existing && existing.length) {
    await base44.asServiceRole.entities.CampaignMember.update(existing[0].id, {
      status: 'active',
      user_name: user.full_name || user.email
    });
  } else {
    // Check if there's a pending invite by email.
    const pending = await base44.asServiceRole.entities.CampaignMember.filter({
      campaign_id, user_email: (user.email || '').toLowerCase(), status: 'pending'
    });
    if (pending && pending.length) {
      await base44.asServiceRole.entities.CampaignMember.update(pending[0].id, {
        status: 'active',
        user_id: user.id,
        user_name: user.full_name || user.email
      });
    } else {
      await base44.asServiceRole.entities.CampaignMember.create({
        campaign_id,
        user_id: user.id,
        user_email: (user.email || '').toLowerCase(),
        user_name: user.full_name || user.email,
        role: 'player',
        status: 'active'
      });
    }
  }

  // Backfill: add the new member to the `members` array on all existing shared
  // records so they can read the campaign's message/roll/NPC/quest/location history.
  const uid = user.id;
  await Promise.all([
    base44.asServiceRole.entities.Message.updateMany(
      { campaign_id }, { $addToSet: { members: uid } }
    ),
    base44.asServiceRole.entities.DiceRoll.updateMany(
      { campaign_id }, { $addToSet: { members: uid } }
    ),
    base44.asServiceRole.entities.NPC.updateMany(
      { campaign_id }, { $addToSet: { members: uid } }
    ),
    base44.asServiceRole.entities.Quest.updateMany(
      { campaign_id }, { $addToSet: { members: uid } }
    ),
    base44.asServiceRole.entities.Location.updateMany(
      { campaign_id }, { $addToSet: { members: uid } }
    )
  ]);

  return Response.json({ campaign, already_member: false });
}

async function listMembers(base44, user, body) {
  const { campaign_id } = body;
  const campaign = await base44.asServiceRole.entities.Campaign.get(campaign_id);
  const isMember = campaign.created_by_id === user.id || (campaign.members || []).includes(user.id);
  if (!isMember) return Response.json({ error: 'Not a member' }, { status: 403 });

  const members = await base44.asServiceRole.entities.CampaignMember.filter({ campaign_id });
  return Response.json({ members, campaign });
}

async function removeMember(base44, user, body) {
  const { campaign_id, member_id } = body;
  const campaign = await base44.asServiceRole.entities.Campaign.get(campaign_id);
  if (campaign.created_by_id !== user.id) {
    return Response.json({ error: 'Only the host can remove players' }, { status: 403 });
  }
  const member = await base44.asServiceRole.entities.CampaignMember.get(member_id);
  if (!member || member.campaign_id !== campaign_id) {
    return Response.json({ error: 'Member not found' }, { status: 404 });
  }
  await base44.asServiceRole.entities.CampaignMember.update(member_id, { status: 'removed' });
  if (member.user_id) {
    const newMembers = (campaign.members || []).filter(id => id !== member.user_id);
    await base44.asServiceRole.entities.Campaign.update(campaign_id, { members: newMembers });
  }
  return Response.json({ ok: true });
}

async function setCharacter(base44, user, body) {
  const { campaign_id, character_id } = body;
  const members = await base44.asServiceRole.entities.CampaignMember.filter({
    campaign_id, user_id: user.id, status: 'active'
  });
  if (!members.length) return Response.json({ error: 'Not a member' }, { status: 403 });
  const member = members[0];

  let characterName = '';
  if (character_id) {
    const char = await base44.asServiceRole.entities.Character.get(character_id).catch(() => null);
    if (char) characterName = char.name;
  }
  await base44.asServiceRole.entities.CampaignMember.update(member.id, {
    character_id, character_name: characterName
  });
  return Response.json({ ok: true, character_name: characterName });
}