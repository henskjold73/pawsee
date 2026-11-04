import test from 'node:test';
import assert from 'node:assert/strict';
import { titleFromPrompt } from '../title.mjs';

test('keeps a short question as it is', () => {
  assert.equal(titleFromPrompt('Can we make it work the same way for claude code?'), 'Can we make it work the same way for claude code?');
});

test('drops filler openers and code ticks, capitalizes', () => {
  assert.equal(titleFromPrompt('fix the login bug in `auth.ts` please'), 'Fix the login bug in auth.ts please');
  assert.equal(titleFromPrompt('Please check https://example.com/foo and tell me what it does. Then more stuff.'), 'Check link and tell me what it does');
});

test('no title for replies like "yes" or pasted code, so the previous title stays', () => {
  assert.equal(titleFromPrompt('yes'), null);
  assert.equal(titleFromPrompt('now?'), null);
  assert.equal(titleFromPrompt('```js\nconst a = 1\n```'), null);
  assert.equal(titleFromPrompt('Add dark mode'), 'Add dark mode'); // control: real prompts still get a title
});

test('long prompts are cut with an ellipsis', () => {
  const t = titleFromPrompt('a'.repeat(120) + ' tail');
  assert.ok(t.length <= 53 && t.endsWith('…'), t);
});

// ---- tests added to kill surviving mutants (npm run mutate) ----
const table = (name, rows, max) => test(name, () => {
  for (const [input, want] of rows) assert.equal(titleFromPrompt(input, max), want, JSON.stringify(input));
});

table('empty input has no title', [[null, null], [undefined, null], ['', null], ['  \n ', null]]);

table('the first non-empty line is the title, code fences are dropped', [
  ['\n\n  Fix bug\nsecond line', 'Fix bug'],
  ['Look at ```\ncode here\n``` the build', 'Look at the build'],
]);

table('injected markup is not a prompt, but "<3" and comparisons are', [
  ['<task-notification>x', null], ['<ci-monitor-event> y', null], ['</foo> bar', null], ['<div class="a"> x', null], ['<div>', null],
  ['<3 you all', '<3 you all'], ['a < b and c > d', 'A < b and c > d'],
]);

table('code is recognised by its start and its punctuation', [
  ['const a = 1;', 'Pasted code'], ['if (x) {', 'Pasted code'], ['// comment = x', 'Pasted code'], ['@Component({ a', 'Pasted code'],
  ['function f() {}', 'Pasted code'], ['type => x', 'Pasted code'],
  ['import x from y', 'Import x from y'], ['return the book', 'Return the book'], ['let it go', 'Let it go'], // code words alone are just words
]);

table('images, links, markdown and paths are tidied', [
  ['Fix this [image: Image #1] bug', 'Fix this bug'],
  ['see http://a.b/c?d=1 now', 'See link now'], ['visit https://x.io please', 'Visit link please'],
  ['**Fix** the `bug`', 'Fix the bug'], ['__init__ file', 'Init file'], ['> # Heading text', 'Heading text'], ['Fix #123 now', 'Fix #123 now'],
  ['update src/app/main.ts', 'Update main.ts'], ['check src/app/', 'Check app'], ['edit @scope/pkg/file now', 'Edit file now'],
  ['see /usr/bin/env tool', 'See env tool'], ['look at x/file.json!', 'Look at file.json!'], ['a.b/c.d thing', 'C.d thing'],
  ['fix designe/legacy', 'Fix designe/legacy'], ['use and/or here', 'Use and/or here'], // one slash and no extension: not a path
]);

table('a leading label is dropped', [
  ['Task: fix login', 'Fix login'], ['Goal : ship it now', 'Ship it now'], ['context:   more text', 'More text'],
  ['Tasks: fix this', 'Tasks: fix this'], // not a label
]);

table('filler openers are dropped (up to three), but not inside words', [
  ['ok so can you fix the build', 'Fix the build'], ['ok so well now fix the thing', 'Now fix the thing'], ['hey, hi, hello there friend', 'There friend'],
  ['Lets fix the build', 'Fix the build'], ["let's go home", 'Go home'], ['i want you to add X', 'Add X'], ['Please add dark mode', 'Add dark mode'],
  ['Just do the thing', 'Do the thing'], ['Basically nothing works', 'Nothing works'], ['Actually fix it later', 'Fix it later'],
  ['Sorting the list', 'Sorting the list'], ['Nowhere to go', 'Nowhere to go'], ['okapi build', 'Okapi build'],
]);

table('only the first sentence or clause is used', [
  ['Fix the bug. Then deploy.', 'Fix the bug'], ['Add tests - and docs', 'Add tests'], ['Add tests \u2013 and docs', 'Add tests'], ['Add tests \u2014 and docs', 'Add tests'],
  ['Is this ok? yes', 'Is this ok?'], ['Fix the bug! now what', 'Fix the bug!'], ['Upgrade to v1.2.3 today', 'Upgrade to v1.2.3 today'],
  ['Add a-b tests', 'Add a-b tests'], ['Fix the bug:', 'Fix the bug'], ['Fix, the; bug.', 'Fix, the; bug'],
]);

table('replies without a topic have no title', [
  ['yes', null], ['Yep!', null], ['ok', null], ['Thanks', null], ['thank you', null], ['do it', null], ['lgtm', null], ['what now?', null], ['continue.', null],
  ['nope', null], ['No', null], ['sure', null], ['and now', null], ['really', null], ['great', null],
  ['yes please', 'Yes please'], // there is something after it
]);

table('too-short and pronoun-only prompts have no title', [
  ['ab', null], ['abc', 'Abc'], ['It', null],
  ['fix it', null], ['do that', null], ['fix this', null], ['fix them!', null],
  ['fix it properly', 'Fix it properly'], ['fix the it', 'Fix the it'], ['This one', 'This one'],
]);

table('the first letter is capitalised', [['add dark mode', 'Add dark mode'], ['Add dark mode', 'Add dark mode'], ['#123 broken', '123 broken']]);

test('titles up to the limit are kept, longer ones are cut with an ellipsis', () => {
  assert.equal(titleFromPrompt('x'.repeat(52)), 'X' + 'x'.repeat(51));
  assert.equal(titleFromPrompt('y'.repeat(53)), 'Y' + 'y'.repeat(50) + '\u2026');
  assert.equal(titleFromPrompt('word '.repeat(10) + 'tail'), 'Word word word word word word word word word word\u2026');
});

test('a cut finishes a word that straddles the limit, if it is not far off', () => {
  assert.equal(titleFromPrompt('The quick brown fox jumps over the lazy dog and keeps on running far away'), 'The quick brown fox jumps over the lazy dog and keeps\u2026');
  assert.equal(titleFromPrompt('one two three four five six seven eight nine ten eleven twelve thirteen'), 'One two three four five six seven eight nine ten eleven\u2026');
});

test('a very long word is cut where it is, and later words are dropped', () => {
  assert.equal(titleFromPrompt('a'.repeat(52) + ' ' + 'b'.repeat(16)), 'A' + 'a'.repeat(51) + '\u2026');
  assert.equal(titleFromPrompt('a'.repeat(70) + ' bbb'), 'A' + 'a'.repeat(50) + '\u2026');
});

test('the limit can be changed', () => {
  assert.equal(titleFromPrompt('The quick brown fox jumps over the lazy dog', 20), 'The quick brown fox\u2026');
  assert.equal(titleFromPrompt('The quick brown fox jumps over the lazy dog', 10), 'The quick\u2026');
  assert.equal(titleFromPrompt('abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz', 30), 'Abcdefghijklmnopqrstuvwxyz\u2026');
  assert.equal(titleFromPrompt('Short enough to fit, trailing comma, and some more words in this sentence yes.'), 'Short enough to fit, trailing comma, and some more words\u2026');
});

table('edge cases around tags, labels, fences, paths and trailing punctuation', [
  ['see <div> here', 'See <div> here'], ['<foo', '<foo'],                    // only a tag at the very start marks injected markup
  ['Task:fix login', 'Fix login'],                                         // no space after the label colon
  ['Fix```x```bug', 'Fix bug'],                                            // a removed fence leaves a gap, not a join
  ['see a.b/c now', 'See a.b/c now'],                                      // a dot in the middle is not a file extension
  ['check src/app//', 'Check app'],                                        // every trailing slash goes
  ['Fix the bug...', 'Fix the bug'], ['thank', null], ['Thanks!', null],
]);

test('the straddling-word rule stops exactly 14 characters past the limit', () => {
  assert.equal(titleFromPrompt('a'.repeat(34) + ' tail', 20), 'A' + 'a'.repeat(33) + '\u2026');   // ends 14 past: finish the word
  assert.equal(titleFromPrompt('a'.repeat(35) + ' tail', 20), 'A' + 'a'.repeat(18) + '\u2026');   // 15 past: cut at the limit
});

test('a cut at a space needs the space to be at least 20 characters in', () => {
  assert.equal(titleFromPrompt('a'.repeat(20) + ' ' + 'b'.repeat(40)), 'A' + 'a'.repeat(19) + '\u2026');   // space at 20: cut there
  assert.equal(titleFromPrompt('a'.repeat(19) + ' ' + 'b'.repeat(40)), 'A' + 'a'.repeat(18) + ' ' + 'b'.repeat(31) + '\u2026'); // space at 19: plain cut
});

test('all trailing punctuation is removed before the ellipsis', () => {
  assert.equal(titleFromPrompt('abcde, ' + 'f'.repeat(30) + ' z', 8), 'Abcde\u2026');
});
