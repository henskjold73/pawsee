import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { translate, codexKey } from '../codex.mjs';
import { start, codexSession } from './harness.mjs';

const T = '2026-06-24T08:20:47.187Z';
const item = payload => ({ timestamp: T, type: 'response_item', payload });
const msg = payload => ({ timestamp: T, type: 'event_msg', payload });
const types = evs => evs.map(e => e.type);

test('a typed prompt becomes a user.message; empty ones do not', () => {
  assert.deepEqual(translate(msg({ type: 'user_message', message: '  fix the build ' })).map(e => e.data.content), ['fix the build']);
  assert.deepEqual(translate(msg({ type: 'user_message', message: '   ' })), []);
});

test('exec_command becomes a bash call with the command, its output finishes it', () => {
  const [start] = translate(item({ type: 'function_call', name: 'exec_command', arguments: '{"cmd":"npm test","workdir":"/x"}', call_id: 'c1' }));
  assert.equal(start.type, 'tool.execution_start');
  assert.deepEqual([start.data.toolCallId, start.data.toolName, start.data.arguments.command], ['c1', 'bash', 'npm test']);
  const [ok] = translate(item({ type: 'function_call_output', call_id: 'c1', output: 'Chunk ID: 1\nProcess exited with code 0\nOutput:\nfine' }));
  assert.deepEqual([ok.type, ok.data.success], ['tool.execution_complete', true]);
  const [bad] = translate(item({ type: 'function_call_output', call_id: 'c1', output: 'Process exited with code 2\nOutput:\nboom' }));
  assert.equal(bad.data.success, false);
  assert.match(bad.data.error.message, /boom/);
  assert.equal(translate(item({ type: 'function_call_output', call_id: 'c1', output: 'Process running with session ID 7' }))[0].data.success, true); // not finished is not failed
});

test('apply_patch carries the file it edits; its result decides success', () => {
  const [s] = translate(item({ type: 'custom_tool_call', name: 'apply_patch', call_id: 'p1', input: '*** Begin Patch\n*** Update File: /w/tsconfig.json\n@@\n-a\n+b\n*** End Patch\n' }));
  assert.deepEqual([s.data.toolName, s.data.arguments.path], ['apply_patch', '/w/tsconfig.json']);
  assert.equal(translate(item({ type: 'custom_tool_call_output', call_id: 'p1', output: 'Exit code: 1\nWall time: 0.1 seconds' }))[0].data.success, false);
});

test('a question for the person is an ask_user call with the first question', () => {
  const [s] = translate(item({ type: 'function_call', name: 'request_user_input', call_id: 'q1', arguments: JSON.stringify({ questions: [{ id: 'a', question: 'Which branch?' }] }) }));
  assert.deepEqual([s.data.toolName, s.data.arguments.message], ['ask_user', 'Which branch?']);
});

test('a web search is one record: it starts and finishes together', () => {
  const evs = translate(item({ type: 'web_search_call', status: 'completed', action: { type: 'search', query: 'node sea assets' } }), {});
  assert.deepEqual(types(evs), ['tool.execution_start', 'tool.execution_complete']);
  assert.deepEqual([evs[0].data.toolName, evs[0].data.arguments.pattern], ['web_search', 'node sea assets']);
  assert.equal(evs[0].data.toolCallId, evs[1].data.toolCallId);
});

test('task_complete says the last message and ends the turn; Esc ends it as interrupted', () => {
  const done = translate(msg({ type: 'task_complete', last_agent_message: 'All done.' }));
  assert.deepEqual(types(done), ['assistant.message', 'assistant.turn_end']);
  assert.equal(done[0].data.content, 'All done.');
  assert.equal(translate(msg({ type: 'task_complete' })).length, 1);
  const esc = translate(msg({ type: 'turn_aborted', reason: 'interrupted' }));
  assert.deepEqual([esc[0].type, esc[0].data.interrupted], ['assistant.turn_end', true]);
});

test('token_count: fresh tokens of the last call (cached input left out), identified by the running total', () => {
  const [u] = translate(msg({ type: 'token_count', info: { last_token_usage: { input_tokens: 18888, cached_input_tokens: 4992, output_tokens: 177 }, total_token_usage: { total_tokens: 19065 } } }));
  assert.deepEqual([u.type, u.data.id, u.data.tokens], ['assistant.usage', 'tc19065', 14073]);
  assert.deepEqual(translate(msg({ type: 'token_count', info: null })), []); // rate-limit-only records carry no usage
});

test('session_meta gives the folder and branch; noise records say nothing', () => {
  const st = {};
  assert.deepEqual(translate({ type: 'session_meta', payload: { cwd: '/w/app', git: { branch: 'dev' } } }, st), []);
  assert.deepEqual(st.meta, { cwd: '/w/app', branch: 'dev' });
  for (const p of [{ type: 'reasoning' }, { type: 'message', role: 'developer' }, { type: 'mcp_tool_call_end' }]) assert.deepEqual(translate(item(p)), []);
  assert.deepEqual(translate({ type: 'turn_context', payload: {} }), []);
  assert.deepEqual(translate({}), []);
});

test('codexKey: the last digits of the session id, not the timestamp-like start', () => {
  assert.equal(codexKey('rollout-2026-06-24T10-19-56-019ef8b6-e3ef-7362-96c7-4c00b08bf192.jsonl'), 'cx8bf192');
  assert.equal(codexKey('notes.jsonl'), null);
});

let h;
before(async () => { h = await start(); });
after(() => h.stop());

test('Codex: a session shows up as a card with its tool, name, folder and branch; finishing makes it idle', async () => {
  const s = codexSession(h, 'aaaaaaaaaaaa');
  s.meta('/work/shop', 'feature-x');
  s.prompt('Add a dark mode toggle');
  const c = s.exec('git status');
  let m = await h.until(a => { const x = a.find(c => c.session === s.key && c.id === 'main'); return x?.kind === 'shell' && x; }, 'codex main card');
  assert.equal(m.source, 'codex');
  assert.equal(m.name, 'Add a dark mode toggle');
  assert.equal(m.project, 'shop');
  assert.equal(m.branch, 'feature-x');
  assert.equal(m.brand, 'git');
  assert.equal(m.canFocus, false);
  s.out(c);
  s.tokens(1000, 400, 100, 1100);
  s.done('Toggle added.');
  m = await h.until(a => { const x = a.find(c => c.session === s.key && c.id === 'main'); return x?.status === 'idle' && x; }, 'idle after task_complete');
  assert.equal(m.said, 'Toggle added.');
  assert.equal(m.tokens, 700);
});

test('Codex: a failing command counts as a failure, a question waits for the person', async () => {
  const s = codexSession(h, 'bbbbbbbbbbbb');
  s.prompt('Run the tests');
  s.out(s.exec('npm test'), 'Process exited with code 1\nOutput:\nnope');
  const m = await h.until(a => { const x = a.find(c => c.session === s.key && c.id === 'main'); return x?.fails === 1 && x; }, 'a failure');
  assert.equal(m.worry, 1);
  s.put('response_item', { type: 'function_call', name: 'request_user_input', call_id: 'q', arguments: JSON.stringify({ questions: [{ question: 'Retry with --force?' }] }) });
  const w = await h.until(a => { const x = a.find(c => c.session === s.key && c.id === 'main'); return x?.status === 'waiting' && x; }, 'waiting');
  assert.match(w.activity, /Retry with --force\?/);
});
