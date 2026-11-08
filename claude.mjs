// Claude Code session logs -> the Copilot-style events server.mjs already understands.
// Claude Code writes ~/.claude/projects/<project>/<session>.jsonl, with sub-agents in <session>/subagents/agent-<id>.jsonl.

// Claude Code tool names -> the names (and argument shapes) the card logic knows
const TOOLS = {
  Bash: 'bash', Read: 'view', Grep: 'grep', Glob: 'glob', Edit: 'edit', MultiEdit: 'edit', Write: 'create', NotebookEdit: 'edit',
  WebFetch: 'web_fetch', WebSearch: 'web_search', Skill: 'skill', AskUserQuestion: 'ask_user', ExitPlanMode: 'exit_plan_mode',
};

function toolEvent(b) {
  const i = b.input || {};
  const arguments_ = { description: i.description, command: i.command, path: i.file_path || i.notebook_path || i.path, pattern: i.pattern || i.query,
    url: i.url, skill: i.skill };
  let toolName = TOOLS[b.name] || b.name;
  const mcp = b.name.match(/^mcp__([^_]+(?:_[^_]+)*?)__(.+)$/); // mcp__github__list_prs -> github-list_prs
  if (mcp) toolName = `${mcp[1].replace(/^claude_ai_/, '').toLowerCase()}-${mcp[2]}`;
  if (b.name === 'AskUserQuestion') arguments_.message = i.questions?.[0]?.question || 'has a question';
  return { toolCallId: b.id, toolName, arguments: arguments_ };
}

const textOf = c => typeof c === 'string' ? c
  : Array.isArray(c) ? c.filter(b => b?.type === 'text').map(b => b.text).join('\n') : '';

// system-injected "user" turns (hooks, command echoes, task notifications) are not the person talking
const synthetic = t => /^</.test(t) && !/^<pasted_content/.test(t) // (t is trimmed) any injected <tag> block, but not a paste the person made
  || t.startsWith('This session is being continued from a previous conversation');

/** one parsed log entry -> zero or more Copilot-style events. `agentId` is set for lines read from a sub-agent file; `st` is per-file scratch state. */
export function translate(e, agentId = null, st = {}) {
  const ts = e.timestamp;
  const out = [];
  const ev = (type, data = {}) => out.push({ type, timestamp: ts, ...(agentId ? { agentId } : {}), data });
  if (e.type === 'system' && e.subtype === 'stop_hook_summary' && !agentId) { ev('assistant.turn_end'); return out; } // the log has no stop_reason: the stop hooks mark the end of a turn
  const m = e.message;
  if (e.isMeta && e.type === 'user' && /<local-command-caveat>/.test(textOf(m?.content))) st.localPrompt = e.promptId; // a /command's output follows: not a prompt
  if (!m || e.isMeta || e.isCompactSummary) return out;
  if (e.type === 'user') {
    if (Array.isArray(m.content)) {
      for (const b of m.content) {
        if (b?.type !== 'tool_result') continue;
        ev('tool.execution_complete', { toolCallId: b.tool_use_id, success: !b.is_error,
          error: b.is_error ? { message: textOf(b.content) } : undefined });
      }
    }
    const text = textOf(m.content).trim();
    if (text.startsWith('[Request interrupted by user')) { ev('assistant.turn_end', { interrupted: true }); return out; } // Esc: nothing more is coming, even if a tool was still running
    if (text && !(e.promptId && e.promptId === st.localPrompt) && !synthetic(text) && !(Array.isArray(m.content) && m.content.some(b => b?.type === 'tool_result'))) ev('user.message', { content: text });
  } else if (e.type === 'assistant') {
    const blocks = Array.isArray(m.content) ? m.content : [];
    const u = m.usage;
    if (u && m.id) ev('assistant.usage', { id: m.id, model: m.model, tokens: (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.output_tokens || 0) }); // cache reads are cheap and huge: left out
    if (e.effort) ev('session.usage_record', { usage: { reasoningEffort: e.effort } });
    const text = blocks.filter(b => b.type === 'text').map(b => b.text).join('\n');
    const uses = blocks.filter(b => b.type === 'tool_use');
    for (const b of uses) {
      if (b.name === 'Agent' || b.name === 'Task') continue; // the sub-agent shows up through its own file
      if (agentId && b.name === 'SubagentHandback') { // the final report: say it, then finish
        ev('assistant.message', { content: String(b.input?.message || ''), toolRequests: [] });
        ev('subagent.completed');
        return out;
      }
      ev('tool.execution_start', toolEvent(b));
    }
    if (text.trim() || uses.length) ev('assistant.message', { content: text, toolRequests: uses });
    if (m.stop_reason && m.stop_reason !== 'tool_use') ev('assistant.turn_end'); // end_turn, stop_sequence…: also covers setups where no stop hook writes a summary
  }
  return out;
}
