import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { start, claudeSession } from './harness.mjs';

// the hidden parade: a prompt that says "show me everything" bumps a counter in the snapshot (the page starts a parade when it goes up).
// Only the count leaves the server, and only for the person's own recent prompts.
let h;
before(async () => { h = await start(); });
after(() => h.stop());

const parade = async () => (await h.api()).parade;
const main = (agents, session) => agents.find(a => a.session === session.slice(0, 8) && a.id === 'main');

test('the snapshot starts with a count of zero, and an ordinary prompt does not change it', async () => {
  assert.equal(await parade(), 0);
  const s = claudeSession(h, 'aaaaaaaa-0001');
  s.prompt('Can we add a settings page?');
  await h.until(a => main(a, 'aaaaaaaa-0001'), 'the card');
  assert.equal(await parade(), 0);
});

test('"show me everything" in a prompt counts, in any case and with any spacing', async () => {
  const s = claudeSession(h, 'bbbbbbbb-0002');
  s.prompt('Please show me everything you changed in the settings page');
  await h.until((a, snap) => snap.parade === 1, 'the first count');
  s.prompt('SHOW   ME\nEVERYTHING');
  await h.until((a, snap) => snap.parade === 2, 'the second count');
  s.prompt('show me everything');
  await h.until((a, snap) => snap.parade === 3, 'the third count');
});

test('near misses do not count', async () => {
  const s = claudeSession(h, 'cccccccc-0003');
  for (const text of ['show me anything', 'show everything', 'showmeeverything', 'tell me everything']) s.prompt(text);
  await h.until(a => main(a, 'cccccccc-0003'), 'the card');
  await new Promise(r => setTimeout(r, 1200)); // a rescan, to be sure they were all read
  assert.equal(await parade(), 3);
});

test('a sub-agent\'s instructions do not count, only the person\'s own prompt does', async () => {
  const s = claudeSession(h, 'dddddddd-0004');
  s.prompt('Look into the build');
  const sub = s.agent('sub-1', { type: 'explore', description: 'look around' });
  sub.prompt('show me everything in the src folder');
  await h.until(a => main(a, 'dddddddd-0004'), 'the card');
  await new Promise(r => setTimeout(r, 1200));
  assert.equal(await parade(), 3);
});

test('an old prompt (read from log history) does not count', async () => {
  const dir = join(h.claude, 'proj'); mkdirSync(dir, { recursive: true });
  const old = new Date(Date.now() - 3600e3).toISOString();
  writeFileSync(join(dir, 'eeeeeeee-0005.jsonl'), JSON.stringify({ timestamp: old, cwd: '/work/demo', sessionId: 'eeeeeeee-0005', type: 'user', message: { role: 'user', content: 'show me everything' } }) + '\n');
  await h.until(a => main(a, 'eeeeeeee-0005'), 'the card');
  await new Promise(r => setTimeout(r, 1200));
  assert.equal(await parade(), 3);
});
