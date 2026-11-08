import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInThisContext } from 'node:vm';
import { noteTokens, burnOf, noteCall, BURN_WINDOW_MS } from '../meter.mjs';
import { translate } from '../claude.mjs';
import { start, claudeSession } from './harness.mjs';

const { fmt, tierOf, zoomiesOf } = runInThisContext(readFileSync(new URL('../public/meter.js', import.meta.url), 'utf8') + ';PawMeter');

test('fmt: short, readable token counts', () => {
  assert.deepEqual([0, 999, 1000, 1234, 12345, 999999, 1234567, 25000000].map(fmt), ['0', '999', '1k', '1.2k', '12k', '1M', '1.23M', '25M']);
  assert.equal(fmt(undefined), '0');
});

test('tierOf: the appetite grows with the kibble', () => {
  assert.deepEqual([0, 19999, 20000, 99999, 100000, 399999, 400000, 5e6].map(n => tierOf(n).name),
    ['nibbling', 'nibbling', 'snacking', 'snacking', 'feasting', 'feasting', 'food coma', 'food coma']);
});

test('noteTokens / burnOf: a rolling one-minute rate, and the total keeps growing', () => {
  const t = {};
  noteTokens(t, 1000, 500); noteTokens(t, 2000, 700); noteTokens(t, 0, 0); noteTokens(t, 3000, -5);
  assert.equal(t.tokens, 1200);
  assert.equal(burnOf(t, 3000), 1200);
  assert.equal(burnOf(t, 1000 + BURN_WINDOW_MS + 1), 700); // the first call fell out of the window
  noteTokens(t, 2000 + 2 * BURN_WINDOW_MS, 10);
  assert.equal(burnOf(t, 2000 + 2 * BURN_WINDOW_MS), 10);
  assert.equal(burnOf({}, 5), 0);
});

test('noteCall: counts identical calls in a row, any change starts over', () => {
  const t = {};
  noteCall(t, 'bash', { command: 'npm test' }); noteCall(t, 'bash', { command: 'npm test' }); noteCall(t, 'bash', { command: 'npm test' });
  assert.equal(t.repeat, 3);
  noteCall(t, 'bash', { command: 'npm run build' });
  assert.equal(t.repeat, 1);
  noteCall(t, 'view'); noteCall(t, 'view');
  assert.equal(t.repeat, 2);
});

test('zoomiesOf: loops, and burning far faster than friends; never for agents that are not running', () => {
  const run = (o = {}) => ({ status: 'running', burn: 0, repeat: 0, ...o });
  assert.equal(zoomiesOf(run({ repeat: 5 })), 'loop');
  assert.equal(zoomiesOf(run({ repeat: 4 })), null);
  assert.equal(zoomiesOf(run({ burn: 80e3 })), 'burn');                              // alone and fast
  assert.equal(zoomiesOf(run({ burn: 49e3 })), null);                                // under the floor
  assert.equal(zoomiesOf(run({ burn: 80e3 }), [run({ burn: 60e3 }), run({ burn: 70e3 })]), null); // everyone is busy
  assert.equal(zoomiesOf(run({ burn: 80e3 }), [run({ burn: 5e3 }), run({ burn: 10e3 })]), 'burn');
  assert.equal(zoomiesOf(run({ burn: 80e3 }), [{ status: 'done', burn: 999e3 }]), 'burn'); // finished agents don't count as friends
  assert.equal(zoomiesOf({ status: 'idle', repeat: 9, burn: 999e3 }), null);
});

test('translate: Claude usage becomes one assistant.usage event with the fresh tokens only', () => {
  const e = { type: 'assistant', timestamp: 't', message: { id: 'msg_1', model: 'm', role: 'assistant', stop_reason: 'tool_use', content: [{ type: 'text', text: 'hi' }],
    usage: { input_tokens: 2, cache_creation_input_tokens: 100, cache_read_input_tokens: 90000, output_tokens: 30 } } };
  const ev = translate(e).find(x => x.type === 'assistant.usage');
  assert.deepEqual(ev.data, { id: 'msg_1', model: 'm', tokens: 132 });
  assert.equal(translate({ ...e, message: { ...e.message, usage: undefined } }).some(x => x.type === 'assistant.usage'), false);
});

let h;
test('server: tokens are counted once per message and show on the card, the sub-agent and the header total', async () => {
  h = await start();
  try {
    const s = claudeSession(h, 'dddddddd-3333');
    s.prompt('Count my kibble');
    const usage = { input_tokens: 10, cache_creation_input_tokens: 90, cache_read_input_tokens: 50000, output_tokens: 100 };
    const line = (id, content) => ({ message: { id, role: 'assistant', stop_reason: 'tool_use', usage, content } });
    // the same message written twice (one line per content block) must count once
    const { appendFileSync, readdirSync } = await import('node:fs');
    const { join } = await import('node:path');
    const file = join(h.claude, 'proj', 'dddddddd-3333.jsonl');
    const put = o => appendFileSync(file, JSON.stringify({ timestamp: new Date().toISOString(), cwd: '/w', type: 'assistant', ...o }) + '\n');
    put(line('msg_a', [{ type: 'text', text: 'one' }]));
    put(line('msg_a', [{ type: 'tool_use', id: 'tu1', name: 'Bash', input: { command: 'ls' }}]));
    put(line('msg_b', [{ type: 'tool_use', id: 'tu2', name: 'Bash', input: { command: 'ls' }}]));
    const snap = await h.until((a, sn) => a.find(c => c.session === 'dddddddd' && c.id === 'main')?.tokens === 400 && sn, 'main tokens');
    const m = snap.agents.find(c => c.session === 'dddddddd' && c.id === 'main');
    assert.equal(m.tokens, 400);        // two distinct messages x 200
    assert.equal(m.repeat, 2);          // the same Bash call twice in a row
    assert.ok(m.burn >= 400);
    assert.equal(snap.tokens, 400);
  } finally { h.stop(); }
});

test('server: Copilot usage records count as kibble too (cached tokens left out), per agent and in the header', async () => {
  const { copilotSession } = await import('./harness.mjs');
  const hh = await start();
  try {
    const s = copilotSession(hh, 'eeeeeeee-4444');
    s.prompt('Feed the copilot');
    s.put('subagent.started', { agentDisplayName: 'helper', agentType: 'explore', toolCallId: 'tc1' }, 'ag1');
    s.put('session.usage_record', { usage: { inputTokens: 30000, cacheReadTokens: 29000, outputTokens: 500, copilotUsage: { totalNanoAiu: 1e9 } } });
    s.put('session.usage_record', { usage: { inputTokens: 2000, cacheReadTokens: 0, outputTokens: 100 } }, 'ag1');
    s.put('subagent.completed', { totalTokens: 999999, totalToolCalls: 1 }, 'ag1');
    const snap = await hh.until((a, sn) => a.find(c => c.session === 'eeeeeeee' && c.id === 'main')?.tokens === 1500 && sn, 'copilot tokens');
    assert.equal(snap.agents.find(c => c.session === 'eeeeeeee' && c.id === 'ag1').tokens, 2100); // not the 999999 the completion reports
    assert.equal(snap.tokens, 3600);
  } finally { hh.stop(); }
});
