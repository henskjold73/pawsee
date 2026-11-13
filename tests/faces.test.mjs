import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { runInThisContext } from 'node:vm';

// Every file in public/faces/ is a face style. Each one is loaded the way the page loads it (a plain script after faces.js) and must meet the contract
// described at the top of public/faces.js, so a new style only has to be dropped in that folder to be checked here.
const dir = new URL('../public/faces/', import.meta.url);
const files = readdirSync(dir).filter(f => f.endsWith('.js'));
const load = (file) => runInThisContext(`(() => { ${readFileSync(new URL('../public/faces.js', import.meta.url), 'utf8').replace(/^const Faces/, 'var Faces')}\n${readFileSync(new URL(file, dir), 'utf8')}\nreturn Faces; })()`);

test('there is at least the cel style, and it is the default', () => {
  assert.ok(files.includes('cel.js'));
  const F = load('cel.js');
  assert.equal(F.style.name, 'cel');
  assert.equal(F.DEFAULT_STYLE, 'cel');
  assert.deepEqual(F.styles().map(s => s.name), ['cel']);
});

for (const file of files) {
  test(`${file} is a complete face style`, () => {
    const F = load(file), s = F.style, name = file.replace(/\.js$/, '');
    assert.equal(s.name, name, 'the style is named after its file');
    assert.deepEqual(F.problems(s), []);

    const svg = F.compose(F.DEFAULT, { size: 80 });
    assert.match(svg, /^<svg[\s>]/);
    assert.match(svg, /<\/svg>\s*$/);

    const spec = F.random(7, { human: true });
    assert.deepEqual(F.random(7, { human: true }), spec, 'the same seed always gives the same face');
    assert.notDeepEqual(F.random(8, { human: true }), spec);
    assert.ok(F.compose(spec).startsWith('<svg'));

    const kid = F.derive(spec, 3);
    assert.deepEqual(F.derive(spec, 3), kid, 'a relative is always the same relative');
    assert.notDeepEqual({ ...kid, scale: 0 }, { ...spec, scale: 0 }, 'a relative is never a copy');
    assert.ok(kid.scale < 1, 'relatives are drawn smaller');
    assert.ok(F.compose(kid).startsWith('<svg'));

    const p = F.pieces(spec);
    for (const k of F.PIECES) assert.ok(k in p, `pieces() has ${k}`);
    assert.equal(typeof p.style, 'string');
    assert.equal(typeof p.scale, 'number');
  });

  test(`${file} draws every expression the cards switch between`, () => {
    const mood = load(file).mood('#000');
    for (const c of load(file).MOOD_CLASSES) assert.match(mood, new RegExp(`class="${c}[\\s"]`), `mood() draws .${c}`);
  });

  test(`${file} has the hats sub-agents wear, and a head the stick body can hang from`, () => {
    const F = load(file), head = F.random(1, { human: true }).head;
    for (const hat of F.HAT_NAMES) assert.ok(F.hatFor(hat, head).length > 0, `hat ${hat}`);
    assert.equal(F.hatFor('no-such-hat', head), '');
    const [top, bottom] = F.headSpan(head);
    assert.ok(top >= 0 && bottom > top + 20 && bottom <= 100, 'the head fits on the canvas');
  });

  test(`${file} has a body the page can animate, and a crown`, () => {
    const F = load(file), head = F.random(2, { human: true }).head, { open, close } = F.body(head);
    assert.equal(typeof open, 'string'); assert.equal(typeof close, 'string');
    for (const c of F.BODY_CLASSES) assert.match(open, new RegExp(`class="([^"]* )?${c}( [^"]*)?"`), `body() has .${c}`);
    assert.match(open, /--d:[\d.]+px/); assert.match(open, /--j:[\d.]+px/);
    // the card writes the head between open and close, so together they must be balanced SVG with the upper half still open at the end of `open`
    const count = (str, re) => (str.match(re) || []).length;
    assert.equal(count(open + close, /<g[\s>]/g), count(open + close, /<\/g>/g), 'groups are balanced');
    assert.ok(count(open, /<g[\s>]/g) > count(open, /<\/g>/g), 'open leaves groups open for the head');
    const crown = F.crown(head);
    assert.match(crown, /^<g class="crown"/); assert.match(crown, /class="gem"/);
  });

  test(`${file} editor offers every part it can draw`, () => {
    const F = load(file), ed = F.editor(F.DEFAULT);
    assert.ok(ed.slots.length > 0);
    for (const { key, options } of ed.slots) {
      assert.ok(options.length > 0, `${key} has options`);
      for (const o of options) assert.ok(F.compose({ ...F.DEFAULT, [key]: o }).startsWith('<svg'), `${key}=${o} draws`);
    }
    for (const sw of ed.swatches) assert.ok(Object.keys(sw.colors).length > 0, `${sw.key} has colours`);
  });
}

test('a style that leaves out part of the contract is refused', () => {
  const F = load('cel.js');
  assert.throws(() => F.register({ name: 'half', label: 'Half', compose() {} }), /must be a function/);
  assert.throws(() => F.register({ name: 'Bad Name', label: 'x' }), /file name/);
  assert.ok(F.problems(null).length);
});

// a secret style is left out of the menu until it is unlocked (and stays in while it is the one in use)
const loadMany = (...files) => runInThisContext(`(() => { ${readFileSync(new URL('../public/faces.js', import.meta.url), 'utf8').replace(/^const Faces/, 'var Faces')}\n${files.map(f => readFileSync(new URL(f, dir), 'utf8')).join('\n')}\nreturn Faces; })()`);

test('a secret style stays out of styles() until it is unlocked', () => {
  const F = loadMany('cel.js', 'ghosts.js');
  assert.deepEqual(F.styles().map(s => s.name), ['cel']);
  assert.deepEqual(F.styles({ all: true }).map(s => [s.name, s.locked]), [['cel', false], ['ghosts', true]]);
  assert.equal(F.unlock('ghosts'), true);
  assert.equal(F.unlock('ghosts'), false, 'a second unlock changes nothing');
  assert.equal(F.unlock('no-such-style'), false);
  assert.deepEqual(F.styles().map(s => s.name), ['cel', 'ghosts']);
});

test('a secret style is listed while it is in use, and use() can switch without saving', () => {
  const F = loadMany('cel.js', 'ghosts.js');
  const seen = [];
  F.onUse(s => seen.push(s.name));
  F.use('ghosts', { save: false });
  assert.deepEqual(F.styles().map(s => s.name), ['cel', 'ghosts'], 'in use, so it is listed');
  F.use('cel');
  assert.deepEqual(F.styles().map(s => s.name), ['cel']);
  assert.deepEqual(seen, ['ghosts', 'cel'], 'listeners hear about each switch');
});
