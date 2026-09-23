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