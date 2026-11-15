import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInThisContext } from 'node:vm';

// eggs.js is a classic browser script, so run it as one (outside a browser it only defines the logic, and does not touch a page)
const src = (f) => readFileSync(new URL(`../public/${f}`, import.meta.url), 'utf8');
const { KONAMI, isFriday13, konami, hasSeenAll, today } = runInThisContext(src('eggs.js') + ';PawEggs');

test('Friday the 13th is only a Friday that is the 13th', () => {
  assert.equal(isFriday13(new Date(2026, 10, 13)), true);     // 13 November 2026
  assert.equal(isFriday13(new Date(2027, 7, 13)), true);      // 13 August 2027
  assert.equal(isFriday13(new Date(2026, 10, 12)), false);    // a Thursday
  assert.equal(isFriday13(new Date(2026, 10, 20)), false);    // a Friday, not the 13th
  assert.equal(isFriday13(new Date(2026, 11, 13)), false);    // the 13th, a Sunday
});

test('?today= pretends it is another day, and only a proper date counts', () => {
  const now = new Date(2030, 0, 1);
  assert.equal(today('?today=2026-11-13', now).getDate(), 13);
  assert.equal(isFriday13(today('?faces=cel&today=2026-11-13', now)), true);
  assert.equal(today('', now), now);
  assert.equal(today('?today=tomorrow', now), now);
  assert.equal(today('?today=2026-11-1', now), now);
});

test('the code is up up down down left right left right b a, and only the whole code counts', () => {
  const feed = konami();
  const run = (keys) => keys.map(feed).includes(true);
  assert.equal(run(KONAMI), true);
  assert.equal(run(KONAMI), true, 'and it can be done again');
  assert.equal(run(KONAMI.slice(0, -1)), false, 'one key short');
  assert.equal(run(['x', ...KONAMI]), true, 'a stray key before it does not matter');
  assert.equal(run(['ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']), true, 'a third up still leads into the code');
  assert.equal(run(['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']), false, 'a wrong key in the middle starts over');
});

test('the code takes B and A in either case, and other keys never match', () => {
  const feed = konami();
  assert.equal(KONAMI.slice(0, -2).map(feed).includes(true), false);
  assert.equal(feed('B'), false);
  assert.equal(feed('A'), true);
  assert.equal(konami(['x'])('y'), false);
});

test('a style is unlocked once every other style has been seen', () => {
  const all = ['cel', 'pixel', 'robot'];
  assert.equal(hasSeenAll(['cel', 'pixel'], all), false);
  assert.equal(hasSeenAll(['robot', 'cel', 'pixel'], all), true);
  assert.equal(hasSeenAll(['cel', 'pixel', 'robot', 'ghosts'], all), true, 'extras do not matter');
  assert.equal(hasSeenAll([], []), false, 'with nothing to see, nothing unlocks');
});

test('the page wiring does nothing without a page', () => {
  // already shown by loading the file above: no document, so no error and nothing registered
  assert.equal(typeof konami, 'function');
});
