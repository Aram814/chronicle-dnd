// Internal shared secret used to authenticate workflow-to-function calls.
//
// Workflow steps (invoke_backend_function) run as the service role with no
// user session, so user auth (base44.auth.me()) cannot gate them — yet the raw
// HTTP endpoint is reachable by anyone on a public app. To keep these
// internal-only functions from being driven by anonymous external callers,
// the workflow passes this secret in the request body and the function
// verifies it here.
//
// This module and the workflow definitions all live under base44/ (server-side
// only, never shipped to the client bundle), so the value is not exposed to
// external callers.
export const WORKFLOW_SECRET = 'wf_7c9f3a2e8b1d4e6a90f2c4b8d1e3a7f9c5';

export function isWorkflowCall(body) {
  return !!body && body.secret === WORKFLOW_SECRET;
}