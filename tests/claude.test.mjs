import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../claude.mjs';

const T = '2026-01-01T10:00:00.000Z';
const user = (content, extra = {}) => ({ type: 'user', timestamp: T, message: { role: 'user', content }, ...extra });
const assistant = (content, stop_reason = null, extra = {}) => ({ type: 'assistant', timestamp: T, message: { role: 'assistant', content, stop_reason }, ...extra });
const types = evs => evs.map(e => e.type);

test('a typed prompt becomes a user.message', () => {
  assert.deepEqual(translate(user('fix the build')).map(e => [e.type, e.data.content]), [['user.message', 'fix the build']]);
});

test('hooks, task notifications, ci events and shell echoes are not prompts', () => {
  for (const t of ['<system-reminder>x</system-reminder>', '<task-notification>done</task-notification>', '<ci-monitor-event>x</ci-monitor-event>',
    '<bash-input>ls</bash-input>', 'This session is being continued from a previous conversation that ran out of context.']) {
    assert.deepEqual(translate(user(t)), [], t);
  }
  assert.deepEqual(translate(user('x', { isMeta: true })), []);
  assert.deepEqual(types(translate(user('a real prompt'))), ['user.message']); // control: the filter isn't just dropping everything
});

test('a paste the person made still counts as a prompt', () => {
  assert.deepEqual(types(translate(user('<pasted_content id="1">log</pasted_content>'))), ['user.message']);
});

test('output of a local /command is not a prompt', () => {
  const st = {};
  translate(user('<local-command-caveat>Caveat</local-command-caveat>', { isMeta: true, promptId: 'p1' }), null, st);
  assert.deepEqual(translate(user('Unknown skill: logout', { promptId: 'p1' }), null, st), []);
  assert.deepEqual(types(translate(user('next prompt', { promptId: 'p2' }), null, st)), ['user.message']);
});

test('pressing Esc ends the turn instead of starting one', () => {
  assert.deepEqual(types(translate(user('[Request interrupted by user]'))), ['assistant.turn_end']);
  assert.equal(translate(user('[Request interrupted by user]'))[0].data.interrupted, true);
  assert.deepEqual(types(translate(user('[Request interrupted by user for tool use]'))), ['assistant.turn_end']);
});

test('tool calls are mapped to the names the cards know', () => {
  const [bash] = translate(assistant([{ type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'git status', description: 'Check' } }]));
  assert.equal(bash.type, 'tool.execution_start');
  assert.deepEqual([bash.data.toolName, bash.data.toolCallId, bash.data.arguments.command], ['bash', 't1', 'git status']);
  const names = [['Read', 'view'], ['Edit', 'edit'], ['Write', 'create'], ['Grep', 'grep'], ['WebFetch', 'web_fetch'], ['Skill', 'skill'], ['AskUserQuestion', 'ask_user']];
  for (const [from, to] of names) {
    assert.equal(translate(assistant([{ type: 'tool_use', id: 'x', name: from, input: { questions: [{ question: 'ok?' }] } }]))[0].data.toolName, to, from);
  }
  assert.equal(translate(assistant([{ type: 'tool_use', id: 'x', name: 'mcp__github__list_prs', input: {} }]))[0].data.toolName, 'github-list_prs');
});

test('AskUserQuestion carries the question', () => {
  const [q] = translate(assistant([{ type: 'tool_use', id: 'q', name: 'AskUserQuestion', input: { questions: [{ question: 'Public or private?' }] } }]));
  assert.equal(q.data.arguments.message, 'Public or private?');
});

test('spawning a sub-agent is not a tool call of the parent', () => {
  const evs = translate(assistant([{ type: 'tool_use', id: 'a', name: 'Agent', input: { prompt: 'go' } }]));
  assert.deepEqual(types(evs), ['assistant.message']);
  assert.equal(evs[0].data.toolRequests.length, 1);
});

test('a finished assistant message ends the turn, a tool_use one does not', () => {
  assert.deepEqual(types(translate(assistant([{ type: 'text', text: 'done' }], 'end_turn'))), ['assistant.message', 'assistant.turn_end']);
  assert.deepEqual(types(translate(assistant([{ type: 'text', text: 'done' }], 'stop_sequence'))), ['assistant.message', 'assistant.turn_end']);
  assert.ok(!types(translate(assistant([{ type: 'tool_use', id: 'a', name: 'Bash', input: {} }], 'tool_use'))).includes('assistant.turn_end'));
});

test('the stop hook summary ends the main agent turn only', () => {
  const e = { type: 'system', subtype: 'stop_hook_summary', timestamp: T };
  assert.deepEqual(types(translate(e)), ['assistant.turn_end']);
  assert.deepEqual(translate(e, 'agent1'), []);
});

test('tool results report success or failure', () => {
  const ok = translate(user([{ type: 'tool_result', tool_use_id: 't1', content: 'fine' }]));
  assert.deepEqual([ok[0].type, ok[0].data.success], ['tool.execution_complete', true]);
  assert.equal(ok.length, 1); // a tool result is never a prompt
  const bad = translate(user([{ type: 'tool_result', tool_use_id: 't2', is_error: true, content: [{ type: 'text', text: 'boom' }] }]));
  assert.deepEqual([bad[0].data.success, bad[0].data.error.message], [false, 'boom']);
});

test('the hand-back of a sub-agent says its report, then completes it', () => {
  const evs = translate(assistant([{ type: 'tool_use', id: 'h', name: 'SubagentHandback', input: { message: 'all done' } }]), 'agent1');
  assert.deepEqual(types(evs), ['assistant.message', 'subagent.completed']);
  assert.equal(evs[0].data.content, 'all done');
  assert.ok(evs.every(e => e.agentId === 'agent1'));
});

test('reasoning effort is passed on', () => {
  const evs = translate(assistant([{ type: 'text', text: 'hi' }], null, { effort: 'high' }));
  assert.equal(evs[0].type, 'session.usage_record');
  assert.equal(evs[0].data.usage.reasoningEffort, 'high');
});

// ---- tests added to kill surviving mutants (npm run mutate) ----
const use = (name, input = {}, id = 'x') => ({ type: 'tool_use', id, name, input });
const startOf = (name, input, agentId) => translate(assistant([use(name, input)]), agentId).find(e => e.type === 'tool.execution_start');

test('every Claude Code tool name maps to the name its card logic expects', () => {
  const map = { Bash: 'bash', Read: 'view', Grep: 'grep', Glob: 'glob', Edit: 'edit', MultiEdit: 'edit', Write: 'create', NotebookEdit: 'edit',
    WebFetch: 'web_fetch', WebSearch: 'web_search', Skill: 'skill', AskUserQuestion: 'ask_user', ExitPlanMode: 'exit_plan_mode', TodoWrite: 'TodoWrite' };
  for (const [from, to] of Object.entries(map)) assert.equal(startOf(from).data.toolName, to, from);
});

test('tool arguments are carried over, with the usual fallbacks for the path and pattern', () => {
  assert.equal(startOf('Read', { file_path: '/a.txt' }).data.arguments.path, '/a.txt');
  assert.equal(startOf('NotebookEdit', { notebook_path: '/n.ipynb' }).data.arguments.path, '/n.ipynb');
  assert.equal(startOf('Glob', { path: '/src' }).data.arguments.path, '/src');
  assert.equal(startOf('Edit', { file_path: '/first', notebook_path: '/second', path: '/third' }).data.arguments.path, '/first');
  assert.equal(startOf('Grep', { pattern: 'TODO', query: 'other' }).data.arguments.pattern, 'TODO');
  assert.equal(startOf('WebSearch', { query: 'node test runner' }).data.arguments.pattern, 'node test runner');
  assert.equal(startOf('Read', {}).data.arguments.path, undefined);
  const a = startOf('Skill', { skill: 'nx', description: 'd', command: 'c', url: 'u' }).data.arguments;
  assert.deepEqual([a.skill, a.description, a.command, a.url], ['nx', 'd', 'c', 'u']);
});

test('MCP tools become "<server>-<tool>", with servers that have underscores or a claude_ai_ prefix', () => {
  assert.equal(startOf('mcp__github__list_prs').data.toolName, 'github-list_prs');
  assert.equal(startOf('mcp__my_server__do_it').data.toolName, 'my_server-do_it');
  assert.equal(startOf('mcp__claude_ai_Gmail__search').data.toolName, 'gmail-search');
  assert.equal(startOf('mcp__a_b_c__t').data.toolName, 'a_b_c-t');
  assert.equal(startOf('xmcp__a__b').data.toolName, 'xmcp__a__b'); // only a leading mcp__ counts
  assert.equal(startOf('mcp__a__b\nmore').data.toolName, 'mcp__a__b\nmore');
});

test('AskUserQuestion falls back to a generic question, and other tools get no message', () => {
  assert.equal(startOf('AskUserQuestion', {}).data.arguments.message, 'has a question');
  assert.equal(startOf('AskUserQuestion', { questions: [] }).data.arguments.message, 'has a question');
  assert.equal(startOf('Bash', { command: 'ls' }).data.arguments.message, undefined);
});

test('a prompt is trimmed, and a blank one is ignored', () => {
  assert.equal(translate(user('  hello  \n'))[0].data.content, 'hello');
  assert.deepEqual(translate(user('   \n ')), []);
});

test('prompts can arrive as text blocks, with odd blocks around them', () => {
  const evs = translate(user([null, { type: 'image' }, { type: 'text', text: 'look at this' }, { type: 'text', text: 'and this' }]));
  assert.deepEqual(evs.map(e => [e.type, e.data.content]), [['user.message', 'look at this\nand this']]);
  assert.deepEqual(translate(user([{ type: 'image' }])), []);
  assert.deepEqual(translate(user(undefined)), []);
  assert.deepEqual(translate(user({ not: 'text' })), []);
});

test('a tool result is never a prompt, even next to text', () => {
  const evs = translate(user([{ type: 'text', text: 'extra words' }, { type: 'tool_result', tool_use_id: 't', content: 'ok' }]));
  assert.deepEqual(types(evs), ['tool.execution_complete']);
  assert.deepEqual(translate(user([null, { type: 'tool_result', tool_use_id: 't', content: 'ok' }])).map(e => e.type), ['tool.execution_complete']);
});

test('only text that starts with a tag is injected; tags inside a prompt are fine', () => {
  for (const t of ['  <system-reminder>x', '\n  <task-notification>x', '<div>x']) assert.deepEqual(translate(user(t)), [], t);
  for (const t of ['use a <div> here', 'x <system-reminder>', '  <pasted_content id="1">x', '\n<pasted_content id="1">x']) assert.deepEqual(types(translate(user(t))), ['user.message'], t);
});

test('a local-command caveat only hides the output that follows it', () => {
  const st = {};
  translate(user('just a meta note', { isMeta: true, promptId: 'p1' }), null, st); // meta, but not a caveat
  assert.deepEqual(types(translate(user('real prompt', { promptId: 'p1' }), null, st)), ['user.message']);
  translate(assistant([{ type: 'text', text: '<local-command-caveat>x' }], null, { isMeta: true, promptId: 'p2' }), null, st); // not a user entry
  assert.deepEqual(types(translate(user('real prompt', { promptId: 'p2' }), null, st)), ['user.message']);
  assert.deepEqual(translate({ type: 'user', isMeta: true, timestamp: T }, null, st), []); // no message at all: no crash
  translate(user('<local-command-caveat>x', { isMeta: true, promptId: 'p3' }), null, st);
  assert.deepEqual(translate(user('output', { promptId: 'p3' }), null, st), []);
  assert.deepEqual(types(translate(user('output', { promptId: undefined }), null, { localPrompt: undefined })), ['user.message']);
});

test('only the stop-hook summary is a turn marker, other system entries are not', () => {
  assert.deepEqual(translate({ type: 'system', subtype: 'informational', timestamp: T }), []);
  assert.deepEqual(translate({ type: 'system', subtype: 'compact_boundary', timestamp: T }), []);
  assert.deepEqual(translate({ type: 'attachment', subtype: 'stop_hook_summary', timestamp: T }), []);
});

test('entries that are neither prompts nor assistant messages are ignored', () => {
  assert.deepEqual(translate({ type: 'attachment', timestamp: T, message: { content: [{ type: 'text', text: 'hi' }, use('Bash')] } }), []);
  assert.deepEqual(translate({ type: 'last-prompt', timestamp: T }), []);
});

test('assistant text joins its text blocks only, and an empty message says nothing', () => {
  const evs = translate(assistant([{ type: 'thinking', thinking: 'hmm' }, { type: 'text', text: 'one' }, { type: 'text', text: 'two' }], null));
  assert.equal(evs[0].data.content, 'one\ntwo');
  assert.deepEqual(translate(assistant([{ type: 'thinking', thinking: 'hmm' }])), []);
  assert.deepEqual(translate(assistant([{ type: 'text', text: '  \n ' }])), []);
  assert.deepEqual(translate(assistant('not an array')), []);
});

test('Task calls are skipped like Agent calls, other tools are reported', () => {
  assert.deepEqual(types(translate(assistant([use('Task')]))), ['assistant.message']);
  assert.deepEqual(types(translate(assistant([use('Bash')]))), ['tool.execution_start', 'assistant.message']);
  const both = translate(assistant([use('Agent', {}, 'a'), use('Bash', {}, 'b')]));
  assert.deepEqual(both.map(e => e.data.toolCallId ?? e.data.toolRequests.length), ['b', 2]);
});

test('the hand-back only means "done" inside a sub-agent', () => {
  const handback = assistant([use('SubagentHandback', { message: 'report' })]);
  assert.deepEqual(types(translate(handback, null)), ['tool.execution_start', 'assistant.message']);
  assert.deepEqual(types(translate(assistant([use('Bash')]), 'agent1')), ['tool.execution_start', 'assistant.message']);
  const noMessage = translate(assistant([use('SubagentHandback', {})]), 'agent1');
  assert.deepEqual([noMessage[0].data.content, noMessage[0].data.toolRequests], ['', []]);
  assert.equal(translate(assistant([use('SubagentHandback')]), 'agent1')[0].data.content, '');
});

test('only a leading claude_ai_ is dropped from an MCP server name, and a hand-back without input is safe', () => {
  assert.equal(startOf('mcp__my_claude_ai_thing__t').data.toolName, 'my_claude_ai_thing-t');
  const bare = translate(assistant([{ type: 'tool_use', id: 'h', name: 'SubagentHandback' }]), 'agent1'); // no input at all
  assert.deepEqual(types(bare), ['assistant.message', 'subagent.completed']);
});
