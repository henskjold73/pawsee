// Gemini CLI session logs -> the Copilot-style events server.mjs already understands.
// Gemini writes ~/.gemini/tmp/<project>/chats/session-<time>-<id8>.jsonl: a meta line, then one record per message
// ({ type: 'user' | 'gemini', content, toolCalls, tokens }), re-appended in full when updated, plus { $set } / { $rewindTo } control lines.
//
// EXPERIMENTAL: written from other tools' notes on CLI 0.58 (a scripted fixture), not from a live log. A log that does not look like this
// is reported by the "pawsee can't make sense of some logs" banner instead of silently showing nothing.

// Gemini tool names -> the names (and argument shapes) the card logic knows
const TOOLS = { read_file: 'view', read_many_files: 'view', list_directory: 'view', write_file: 'create', replace: 'edit', run_shell_command: 'bash',
  glob: 'glob', search_file_content: 'grep', grep_search: 'grep', google_web_search: 'web_search', web_fetch: 'web_fetch', write_todos: 'update_plan', ask_user: 'ask_user' };

const textOf = c => typeof c === 'string' ? c : Array.isArray(c) ? c.map(p => typeof p === 'string' ? p : p?.text || '').join('') : '';

function toolEvent(t) {
  const a = t.args || {};
  const toolName = TOOLS[t.name] || t.name;
  return { toolCallId: t.id, toolName, arguments: { command: a.command, path: a.file_path || a.absolute_path || a.dir_path || a.path, pattern: a.pattern || a.query,
    url: a.url || a.prompt?.match(/https?:\/\/\S+/)?.[0], message: t.name === 'ask_user' ? a.question || a.questions?.[0]?.question : undefined,
    description: t.name === 'write_todos' ? 'updating its to-do list' : undefined } };
}

/** one parsed log entry -> zero or more Copilot-style events. `st` is per-file scratch state */
export function translate(e, st = {}) {
  const out = [];
  if (!e || typeof e !== 'object') return out;
  const ts = e.timestamp;
  const ev = (type, data = {}, at = ts) => out.push({ type, timestamp: at, data });
  if (e.$rewindTo !== undefined || e.$set !== undefined) return out;             // control lines: nothing to show
  if (e.projectHash && e.sessionId) { st.meta = { sessionId: e.sessionId, kind: e.kind }; return out; } // the first line
  if (e.type === 'user') {
    const parts = Array.isArray(e.content) ? e.content : [];
    const results = parts.filter(p => p?.functionResponse);
    for (const p of results) ev('tool.execution_complete', { toolCallId: p.functionResponse.id, success: true });
    const text = textOf(e.content).trim();
    if (!results.length && text) ev('user.message', { content: text });
  } else if (e.type === 'gemini') {
    const seen = (st.seen ??= new Set()), calls = e.toolCalls || [];
    if (e.id && e.tokens && !seen.has('u' + e.id)) { // the same message can be written again: count its tokens once. Fresh tokens: cached ones are left out
      seen.add('u' + e.id);
      const t = e.tokens;
      ev('assistant.usage', { id: e.id, model: e.model, tokens: Math.max(0, (t.input || 0) - (t.cached || 0)) + (t.tool || 0) + (t.output || 0) + (t.thoughts || 0) });
    }
    for (const t of calls) { // calls are written once they are done: show each as it appears, finished
      if (!t?.id || seen.has('c' + t.id)) continue;
      seen.add('c' + t.id);
      ev('tool.execution_start', toolEvent(t), t.timestamp || ts);
      ev('tool.execution_complete', { toolCallId: t.id, success: t.status !== 'error' && t.status !== 'cancelled',
        error: t.status === 'error' ? { message: String(t.resultDisplay || t.result?.error || 'the tool call failed').slice(0, 300) } : undefined }, t.timestamp || ts);
    }
    if (e.id && !seen.has('m' + e.id)) {
      seen.add('m' + e.id);
      ev('assistant.message', { content: textOf(e.content), toolRequests: calls });
      if (!calls.length) ev('assistant.turn_end'); // a reply that asked for no tools ends the turn
    }
  }
  return out;
}

/** short, unlikely-to-clash key from a chat file name: session-2026-09-05T09-00-0a1b2c3d.jsonl -> gm0a1b2c */
export const geminiKey = file => {
  const m = String(file).match(/-([0-9a-f]{8})\.jsonl$/i);
  return m ? 'gm' + m[1].slice(0, 6) : null;
};
