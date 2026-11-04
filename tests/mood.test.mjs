import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInThisContext } from 'node:vm';

// mood.js is a classic browser script, so run it as one
const { moodOf, reactionOf, faviconFor, titleFor, SLEEPY_MS, DEEP_MS } = runInThisContext(readFileSync(new URL('../public/mood.js', import.meta.url), 'utf8') + ';PawMood');
const NOW = 1_000_000;

test('an agent that keeps failing turns dizzy, but only while it is still struggling', () => {
  const base = { status: 'running', worry: 2, fails: 5, worryAt: NOW - 1000 };
  assert.equal(moodOf(base, NOW), 'dizzy');
  assert.equal(moodOf({ ...base, worry: 1 }, NOW), null);                 // calmed down to a single recent failure
  assert.equal(moodOf({ ...base, fails: 4 }, NOW), null);                 // not enough failures in total
  assert.equal(moodOf({ ...base, worryAt: NOW - 15_000 }, NOW), null);    // the last failure was a while ago
  assert.equal(moodOf({ ...base, worryAt: NOW - 14_999 }, NOW), 'dizzy');
  assert.equal(moodOf({ ...base, status: 'done' }, NOW), null);
  assert.equal(moodOf({ status: 'running', worry: 2, fails: 5 }, NOW), null); // no failure time recorded
});

test('a napping agent is sleepy first, then asleep, then deeply asleep', () => {
  const idle = since => ({ status: 'idle', endedAt: NOW - since });
  assert.equal(moodOf(idle(0), NOW), 'sleepy');
  assert.equal(moodOf(idle(SLEEPY_MS - 1), NOW), 'sleepy');
  assert.equal(moodOf(idle(SLEEPY_MS), NOW), null);
  assert.equal(moodOf(idle(DEEP_MS - 1), NOW), null);
  assert.equal(moodOf(idle(DEEP_MS), NOW), 'deep');
  assert.equal(moodOf({ status: 'idle', activityAt: NOW - DEEP_MS }, NOW), 'deep'); // falls back to the last activity
  assert.equal(moodOf({ status: 'idle' }, NOW), 'sleepy');                          // no times at all: just started napping
});

test('an agent waiting on its sub-agents is not asleep', () => {
  assert.equal(moodOf({ status: 'idle', label: 'waiting on agents', endedAt: NOW - DEEP_MS }, NOW), null);
  assert.equal(moodOf({ status: 'idle', label: 'your turn', endedAt: NOW - DEEP_MS }, NOW), 'deep');
  assert.equal(moodOf({ status: 'running', endedAt: NOW - DEEP_MS }, NOW), null);
});

test('finishing cheers, failing flops, and only after we saw the agent running', () => {
  assert.equal(reactionOf('running', { status: 'done' }), 'cheer');
  assert.equal(reactionOf('running', { status: 'idle' }), 'cheer');
  assert.equal(reactionOf('running', { status: 'idle', label: 'your turn' }), 'cheer');
  assert.equal(reactionOf('running', { status: 'failed' }), 'flop');
  assert.equal(reactionOf('running', { status: 'idle', label: 'waiting on agents' }), null);
  assert.equal(reactionOf('running', { status: 'running' }), null);
  assert.equal(reactionOf('running', { status: 'waiting' }), null);
  assert.equal(reactionOf('running', { status: 'lost' }), null);
  for (const prev of ['idle', 'done', 'failed', 'waiting', undefined, null]) assert.equal(reactionOf(prev, { status: 'done' }), null, String(prev));
});

test('the tab icon shows the waiting count, or a tick when work finished', () => {
  const svg = url => decodeURIComponent(url.replace('data:image/svg+xml,', ''));
  assert.ok(faviconFor(0, false).startsWith('data:image/svg+xml,'));
  assert.ok(svg(faviconFor(0, false)).includes('🐾'));
  assert.equal(svg(faviconFor(0, false)), "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐾</text></svg>"); // no badge at all
  assert.match(svg(faviconFor(3, false)), />3<\/text>/);
  assert.match(svg(faviconFor(3, true)), />3<\/text>/);   // waiting wins over the tick
  assert.match(svg(faviconFor(12, false)), />9\+<\/text>/);
  assert.match(svg(faviconFor(9, false)), />9<\/text>/);
  const tick = svg(faviconFor(0, true));
  assert.ok(tick.includes('<path') && tick.includes('#3fb37f'));
});

test('the tab title says what is going on, and flashes while hidden', () => {
  assert.equal(titleFor(0, false), 'pawsee');
  assert.equal(titleFor(0, true), '✓ done · pawsee');
  assert.equal(titleFor(2, false), '(2) needs you · pawsee');
  assert.equal(titleFor(2, true), '(2) needs you · pawsee');   // waiting wins over done
  assert.equal(titleFor(2, false, true), '🐾 2 needs you!');
  assert.equal(titleFor(0, false, true), 'pawsee');            // nothing to flash about
});
