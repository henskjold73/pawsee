// Codex CLI session logs -> the Copilot-style events server.mjs already understands.
// Codex writes ~/.codex/sessions/YYYY/MM/DD/rollout-<time>-<uuid>.jsonl: one { timestamp, type, payload } per line.

const parseArgs = s => { try { return JSON.parse(s) || {}; } catch { return {}; } };

// Codex tool names -> the names (and argument shapes) the card logic knows
function toolOf(name, args) {
  switch (name) {
    case 'exec_command': return { toolName: 'bash', arguments: { command: args.cmd || args.command, description: undefined } };
    case 'write_stdin': return { toolName: 'write_bash', arguments: { description: args.chars?.trim() ? `typing into a running command: ${args.chars.trim()}` : 'waiting on a running command' } };
    case 'view_image': return { toolName: 'view', arguments: { path: args.path } };
    case 'request_user_input': return { toolName: 'ask_user', arguments: { message: args.questions?.[0]?.question || 'has a question' } };
    case 'update_plan': return { toolName: 'update_plan', arguments: { description: 'updating its plan' } };
    default: return { toolName: name, arguments: { path: args.path, pattern: args.pattern || args.query, url: args.url } };
  }
}

// "Process exited with code 1" (exec) / "Exit code: 1" (apply_patch): a non-zero code is a failed call; anything else counts as fine
function resultOf(output) {
  const text = typeof output === 'string' ? output : JSON.stringify(output ?? '');
  const m = text.match(/(?:exited with code|Exit code:)\s*(-?\d+)/);
  const ok = !m || Number(m[1]) === 0;
  return { success: ok, error: ok ? undefined : { message: text.slice(-300) } };
}

/** one parsed log entry -> zero or more Copilot-style events. `st` is per-file scratch state (also receives st.meta: { cwd, branch }) */
export function translate(e, st = {}) {
  const ts = e.timestamp;
  const p = e.payload || {};
  const out = [];
  const ev = (type, data = {}) => out.push({ type, timestamp: ts, data });
  if (e.type === 'session_meta') { st.meta = { cwd: p.cwd, branch: p.git?.branch }; return out; }
  if (e.type === 'response_item') {
    if (p.type === 'function_call') ev('tool.execution_start', { toolCallId: p.call_id, ...toolOf(p.name, parseArgs(p.arguments)) });
    else if (p.type === 'custom_tool_call') { // apply_patch: the "arguments" are the patch text itself
      const path = String(p.input || '').match(/^\*\*\* (?:Update|Add|Delete) File: (.+)$/m)?.[1];
      ev('tool.execution_start', { toolCallId: p.call_id, toolName: p.name, arguments: { path } });
    } else if (p.type === 'function_call_output' || p.type === 'custom_tool_call_output') ev('tool.execution_complete', { toolCallId: p.call_id, ...resultOf(p.output) });
    else if (p.type === 'web_search_call') { // one record for the whole search: start and finish together
      const id = `ws${st.ws = (st.ws || 0) + 1}`, a = p.action || {};
      ev('tool.execution_start', { toolCallId: id, toolName: 'web_search', arguments: { url: a.url, pattern: a.query || a.queries?.[0] } });
      ev('tool.execution_complete', { toolCallId: id, success: true });
    }
    return out;
  }
  if (e.type !== 'event_msg') return out;
  switch (p.type) {
    case 'user_message': if (String(p.message || '').trim()) ev('user.message', { content: String(p.message).trim() }); break;
    case 'agent_message': ev('assistant.message', { content: p.message || '', toolRequests: [] }); break;
    case 'task_complete': // the turn is over: say the last message, then finish
      if (p.last_agent_message) ev('assistant.message', { content: p.last_agent_message, toolRequests: [] });
      ev('assistant.turn_end');
      break;
    case 'turn_aborted': ev('assistant.turn_end', { interrupted: true }); break; // Esc
    case 'token_count': { // cumulative totals repeat; the last call's usage is what is new. Fresh tokens only: cached input is left out
      const u = p.info?.last_token_usage, total = p.info?.total_token_usage?.total_tokens;
      if (u && total != null) ev('assistant.usage', { id: `tc${total}`, tokens: Math.max(0, (u.input_tokens || 0) - (u.cached_input_tokens || 0)) + (u.output_tokens || 0) });
      break;
    }
  }
  return out;
}

/** session id from a rollout file name; its last 6 hex digits make a short, unlikely-to-clash key (the first digits are a timestamp) */
export const codexKey = file => {
  const m = String(file).match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl$/i);
  return m ? 'cx' + m[1].slice(-6) : null;
};
