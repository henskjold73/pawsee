import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sessionProblem, problemsOf, MIN_LINES, MAX_BAD } from '../health.mjs';
import { start, copilotSession, claudeSession } from './harness.mjs';

test('a session that parses and produces events is fine', () => {
  assert.equal(sessionProblem({}), null);
  assert.equal(sessionProblem({ lines: 1000, events: 3, bad: 0 }), null);
  assert.equal(sessionProblem({ lines: MIN_LINES - 1, events: 0 }), null);   // too short to judge
});

test('a long session where nothing was recognised looks like a changed format', () => {
  assert.equal(sessionProblem({ lines: MIN_LINES, events: 0 }), 'unrecognised');
  assert.equal(sessionProblem({ lines: MIN_LINES, events: 1 }), null);
});

test('lines that will not parse are reported once there are several', () => {
  assert.equal(sessionProblem({ lines: 10, events: 9, bad: MAX_BAD - 1 }), null);
  assert.equal(sessionProblem({ lines: 10, events: 9, bad: MAX_BAD }), 'unreadable');
  assert.equal(sessionProblem({ lines: MIN_LINES, events: 0, bad: MAX_BAD }), 'unreadable'); // the more specific reason wins
});

test('problems are grouped by source and reason, and Copilot is the default source', () => {
  const bad = { lines: MIN_LINES, events: 0 };
  const list = problemsOf([{ ...bad }, { ...bad }, { ...bad, product: 'Claude Code' }, { lines: 5, events: 5, product: 'Claude Code' }, { lines: 20, events: 1, bad: MAX_BAD }]);
  assert.deepEqual(list, [
    { source: 'Copilot CLI', reason: 'unrecognised', sessions: 2 },
    { source: 'Claude Code', reason: 'unrecognised', sessions: 1 },
    { source: 'Copilot CLI', reason: 'unreadable', sessions: 1 },
  ]);
  assert.deepEqual(problemsOf([]), []);
  assert.deepEqual(problemsOf(new Map().values()), []);
});

// ---- end to end ----
const claudeFile = (h, id) => { const dir = join(h.claude, 'drift'); mkdirSync(dir, { recursive: true }); return join(dir, `${id}.jsonl`); };

test('healthy sessions raise no warning', async () => {
  const h = await start();
  try {
    claudeSession(h, '11111111-aaaa').prompt('hello');
    copilotSession(h, 'bbbbbbbb-2222').prompt('hello');
    await h.until(a => a.length >= 2, 'both sessions');
    assert.deepEqual((await h.api()).problems, []);
  } finally { h.stop(); }
});

test('a Claude Code log in a format we do not know raises a warning', async () => {
  const h = await start();
  try {
    const lines = Array.from({ length: MIN_LINES + 5 }, (_, i) => JSON.stringify({ kind: 'turn', n: i, text: 'a new log format' }));
    writeFileSync(claudeFile(h, 'cccccccc-3333'), lines.join('\n') + '\n');
    const snap = await h.until((_, s) => s.problems.length && s, 'a problem');
    assert.deepEqual(snap.problems, [{ source: 'Claude Code', reason: 'unrecognised', sessions: 1 }]);
  } finally { h.stop(); }
});

test('a Claude Code log with lines that will not parse raises a warning', async () => {
  const h = await start();
  try {
    writeFileSync(claudeFile(h, 'dddddddd-4444'), Array.from({ length: MAX_BAD + 2 }, () => 'this is not json').join('\n') + '\n');
    const snap = await h.until((_, s) => s.problems.length && s, 'a problem');
    assert.deepEqual(snap.problems, [{ source: 'Claude Code', reason: 'unreadable', sessions: 1 }]);
  } finally { h.stop(); }
});

test('a Copilot CLI log in a format we do not know raises a warning', async () => {
  const h = await start();
  try {
    const s = copilotSession(h, 'eeeeeeee-5555');
    for (let i = 0; i < MIN_LINES + 5; i++) s.put('something.new', { i });
    const snap = await h.until((_, x) => x.problems.length && x, 'a problem');
    assert.deepEqual(snap.problems, [{ source: 'Copilot CLI', reason: 'unrecognised', sessions: 1 }]);
  } finally { h.stop(); }
});
