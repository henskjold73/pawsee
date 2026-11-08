import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { recordTool, recordPrompt, timeline, buildHistory, GAP_MS, TRAIL_MAX } from '../history.mjs';
import { start, copilotSession, claudeSession, sleep } from './harness.mjs';

test('timeline: consecutive calls of one kind merge into a segment, and a kind change starts a new one', () => {
  const t = timeline([{ t: 0, kind: 'code' }, { t: 5000, kind: 'code' }, { t: 9000, kind: 'shell' }]);
  assert.deepEqual(t.segments.map(g => [g.kind, g.from, g.to, g.calls]), [['code', 0, 9000, 2], ['shell', 9000, 10000, 1]]);
  assert.equal(t.totals.code, 9000);
  assert.equal(t.calls, 3);
});

test('timeline: a long pause is not counted as work', () => {
  const t = timeline([{ t: 0, kind: 'web' }, { t: 10 * GAP_MS, kind: 'web' }]);
  assert.equal(t.totals.web, GAP_MS + 1000);
  assert.equal(t.segments.length, 2); // the gap splits it
});

test('timeline: events out of order are sorted first; no events means nothing', () => {
  assert.equal(timeline([{ t: 5000, kind: 'b' }, { t: 0, kind: 'a' }]).segments[0].kind, 'a');
  assert.deepEqual(timeline([]), { segments: [], totals: {}, calls: 0 });
});

test('recordTool: keeps only the newest TRAIL_MAX events, and clips the text', () => {
  const s = {};
  for (let i = 0; i < TRAIL_MAX + 5; i++) recordTool(s, null, i, 'think', 'x'.repeat(300));
  assert.equal(s.trail.length, TRAIL_MAX);
  assert.equal(s.trail[0].t, 5);
  assert.equal(s.trail[0].text.length, 140);
});

test('buildHistory: main agent first, newest session first, sessions without a trail left out', () => {
  const mk = (name, t0, alive = false) => {
    const s = { meta: { name, cwd: '/work/demo', branch: 'main' }, agents: new Map([['a1', { name: 'helper', type: 'explore' }]]), alive };
    recordTool(s, 'a1', t0, 'explore', 'looking'); recordTool(s, null, t0 + 1000, 'code', 'editing'); recordPrompt(s, t0, 'do it');
    return s;
  };
  const sessions = new Map([['old-session-1', mk('old', 1000)], ['new-session-2', mk('new', 90000, true)], ['empty-3', { meta: {}, agents: new Map() }]]);
  const h = buildHistory(sessions, { now: 100000 });
  assert.deepEqual(h.sessions.map(s => s.name), ['new', 'old']);
  const s = h.sessions[0];
  assert.equal(s.live, true);
  assert.equal(s.project, 'demo');
  assert.deepEqual(s.actors.map(a => [a.id, a.name]), [['main', 'new'], ['a1', 'helper']]);
  assert.equal(s.calls, 2);
  assert.equal(buildHistory(sessions, { limit: 1 }).sessions.length, 1);
  assert.deepEqual(buildHistory(sessions, { now: 100000 + 5000, maxAgeMs: 10000 }).sessions.map(s => s.name), ['new']); // 'old' ended long ago; 'new' is live anyway
  sessions.get('new-session-2').alive = false;
  assert.deepEqual(buildHistory(sessions, { now: 100000 + 5000, maxAgeMs: 10000 }).sessions.map(s => s.name), []); // not live and 14 s old: out
  assert.deepEqual(buildHistory(sessions, { now: 100000 + 5000, maxAgeMs: 20000 }).sessions.map(s => s.name), ['new']); // a wider window keeps it
});

let h;
before(async () => { h = await start(); });
after(() => h.stop());
const history = async () => (await fetch(`http://127.0.0.1:${h.port}/api/history`)).json();

test('/api/history: Copilot tool calls by the main agent show up as a timeline', async () => {
  const s = copilotSession(h, 'hhhhhhhh-1111');
  s.prompt('Tidy the repo');
  s.tool('bash', { command: 'ls' });
  s.tool('view', { path: '/x/y.js' });
  s.tool('edit', { path: '/x/y.js' });
  await h.until(a => a.some(c => c.session === 'hhhhhhhh'), 'card');
  let mine;
  for (let i = 0; i < 40 && !mine; i++) { mine = (await history()).sessions.find(x => x.session === 'hhhhhhhh'); if (!mine) await sleep(150); }
  assert.ok(mine, 'session in history');
  assert.equal(mine.name, 'Tidy the repo');
  assert.equal(mine.source, 'copilot');
  assert.equal(mine.calls, 3);
  assert.deepEqual(mine.actors[0].segments.map(g => g.kind), ['shell', 'explore', 'code']);
  assert.equal(mine.prompts[0].text, 'Tidy the repo');
});

test('/api/history: Claude Code sessions and their sub-agents are included too', async () => {
  const s = claudeSession(h, 'cccccccc-2222');
  s.prompt('Look around');
  const sub = s.agent('ag1', { type: 'explore' });
  sub.prompt('scan');
  sub.tool('Grep', { pattern: 'todo' });
  s.tool('Bash', { command: 'ls' });
  let mine;
  for (let i = 0; i < 40 && !(mine?.actors.length > 1); i++) { mine = (await history()).sessions.find(x => x.session === 'cccccccc'); if (!(mine?.actors.length > 1)) await sleep(150); }
  assert.equal(mine.source, 'claude');
  assert.equal(mine.actors.length, 2);
  assert.equal(mine.actors[0].id, 'main');
  assert.equal(mine.actors[1].segments[0].kind, 'explore');
});

test('snapshots carry a boot id that stays the same while the server runs (the page reloads when it changes)', async () => {
  const a = await h.api(), b = await h.api();
  assert.ok(typeof a.boot === 'string' && a.boot.length > 8);
  assert.equal(a.boot, b.boot);
});
