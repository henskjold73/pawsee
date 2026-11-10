import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { translate, geminiKey } from '../gemini.mjs';
import { start, geminiSession } from './harness.mjs';

const T = '2026-09-05T09:00:09.000Z';
const types = evs => evs.map(e => e.type);

test('the first line is the session meta and says nothing; control lines are ignored', () => {
  const st = {};
  assert.deepEqual(translate({ sessionId: 's1', projectHash: 'h', startTime: T, kind: 'main' }, st), []);
  assert.deepEqual(st.meta, { sessionId: 's1', kind: 'main' });
  assert.deepEqual(translate({ $set: { lastUpdated: T } }), []);
  assert.deepEqual(translate({ $rewindTo: 'u1' }), []);
  assert.deepEqual(translate(null), []);
  assert.deepEqual(translate({ type: 'info', content: 'hi' }), []);
});

test('a user prompt (text parts or a string) is a prompt; a tool result is not', () => {
  assert.equal(translate({ id: 'u1', timestamp: T, type: 'user', content: [{ text: 'fix ' }, { text: 'it' }] })[0].data.content, 'fix it');
  assert.equal(translate({ id: 'u1', timestamp: T, type: 'user', content: 'plain' })[0].data.content, 'plain');
  const r = translate({ id: 'u2', timestamp: T, type: 'user', content: [{ functionResponse: { id: 'c1' } }] });
  assert.deepEqual(types(r), ['tool.execution_complete']);
  assert.equal(r[0].data.toolCallId, 'c1');
});

test('tool calls show up finished, once each, with names the cards know', () => {
  const st = {};
  const m = { id: 'g1', timestamp: T, type: 'gemini', content: '', toolCalls: [
    { id: 'c1', name: 'run_shell_command', status: 'success', args: { command: 'ls -la' }, timestamp: T },
    { id: 'c2', name: 'read_file', status: 'error', args: { file_path: '/w/a.txt' }, timestamp: T, resultDisplay: 'no such file' }] };
  const evs = translate(m, st);
  assert.deepEqual(types(evs).filter(t => t.startsWith('tool')), ['tool.execution_start', 'tool.execution_complete', 'tool.execution_start', 'tool.execution_complete']);
  assert.deepEqual([evs[0].data.toolName, evs[0].data.arguments.command], ['bash', 'ls -la']);
  assert.deepEqual([evs[2].data.toolName, evs[2].data.arguments.path], ['view', '/w/a.txt']);
  assert.equal(evs[3].data.success, false);
  assert.match(evs[3].data.error.message, /no such file/);
  assert.equal(evs.at(-1).type, 'assistant.message');
  assert.equal(evs.at(-1).data.toolRequests.length, 2); // it asked for tools, so the turn is not over
  assert.deepEqual(translate(m, st), []); // written again: nothing new
});

test('a reply without tool calls ends the turn; the same reply written again does not end it twice', () => {
  const st = {};
  const m = { id: 'g2', timestamp: T, type: 'gemini', content: 'Done!' };
  assert.deepEqual(types(translate(m, st)), ['assistant.message', 'assistant.turn_end']);
  assert.deepEqual(translate(m, st), []);
});

test('tokens: fresh ones only (cached input left out), counted once per message', () => {
  const st = {};
  const m = { id: 'g3', timestamp: T, type: 'gemini', content: 'x', model: 'gemini-2.5-pro', tokens: { input: 12000, cached: 9000, output: 40, thoughts: 300, tool: 10, total: 12350 } };
  const u = translate(m, st).find(e => e.type === 'assistant.usage');
  assert.deepEqual([u.data.id, u.data.tokens, u.data.model], ['g3', 3350, 'gemini-2.5-pro']);
  assert.equal(translate(m, st).some(e => e.type === 'assistant.usage'), false);
});

test('geminiKey: from the id at the end of the chat file name', () => {
  assert.equal(geminiKey('session-2026-09-05T09-00-0a1b2c3d.jsonl'), 'gm0a1b2c');
  assert.equal(geminiKey('session-old.json'), null);
});

let h;
before(async () => { h = await start(); });
after(() => h.stop());

test('Gemini: a session shows up as a card named by its prompt, in the folder noted by .project_root', async () => {
  const s = geminiSession(h, '0a1b2c3d');
  s.prompt('Explain this repo');
  s.reply('g1', '', { toolCalls: [{ id: 'c1', name: 'run_shell_command', status: 'success', args: { command: 'git log' }, timestamp: new Date().toISOString() }], tokens: { input: 1000, cached: 0, output: 50, thoughts: 0, tool: 0, total: 1050 } });
  const m = await h.until(a => { const x = a.find(c => c.session === s.key && c.id === 'main'); return x?.tokens === 1050 && x; }, 'gemini card');
  assert.equal(m.source, 'gemini');
  assert.equal(m.name, 'Explain this repo');
  assert.equal(m.project, 'demo');
  assert.equal(m.kind, 'shell');
  s.reply('g2', 'It is a small app.');
  const idle = await h.until(a => { const x = a.find(c => c.session === s.key && c.id === 'main'); return x?.status === 'idle' && x; }, 'idle');
  assert.equal(idle.said, 'It is a small app.');
});

test('Gemini: a log that is not in the format we expect raises the drift warning instead of showing nothing', async () => {
  const s = geminiSession(h, 'ffffffff', 'weird');
  for (let i = 0; i < 70; i++) s.put({ id: 'x' + i, type: 'something-new', payload: i });
  const snap = await h.until((a, sn) => sn.problems?.some(p => p.source === 'Gemini CLI') && sn, 'problem reported', 8000);
  assert.ok(snap.problems.some(p => p.source === 'Gemini CLI'));
});
