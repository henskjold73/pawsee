// The "pixel" face style: 8-bit heads on a 20x20 grid, five units a cell. Every part is a few rows of characters (one character is one cell),
// painted as rects, and the ink outline is worked out from the shape, so a new part only needs its fill.
// A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat, skin, hairColor, scale }.
// The contract a style has to meet is described at the top of ../faces.js.
Faces.register((() => {
  const { kin, rng } = Faces;
  const CELL = 5, N = 20, INK = '#2b1b12';
  const SKIN = { peach: ['#ffcd9b', '#e69b6a'], pink: ['#f9b5a8', '#e0867a'], tan: ['#e3a76f', '#c47f48'], brown: ['#b27249', '#8d5230'], olive: ['#dcc07a', '#b99a4e'], pale: ['#fbe2cc', '#e8bd9c'] };
  const HAIR = { ink: '#2a2230', ginger: '#e0702f', grey: '#a09a94', blond: '#ecc24f', brown: '#6e4228', blue: '#4a72d8', pink: '#ea7bb0' };
  // one character, one colour, in every sprite
  const COLOR = { s: 'var(--skin)', d: 'var(--skin-dark)', h: 'var(--hair)', k: INK, w: '#fff', r: '#e0707c', p: '#ec7fa6', y: '#f6c945', o: '#e0a91a', t: '#dcc48e', u: '#cdb078', b: '#3f63b8', g: '#3d3b45', e: '#c9473d', f: '#e0675b', c: '#f2e2c4', v: '#5b4bb5' };

  // ---- the grid ---------------------------------------------------------------------------------------------------------------------------------
  const key = (x, y) => `${x},${y}`;
  const cellsOf = (rows, x0, y0) => rows.flatMap((row, j) => [...row].flatMap((ch, i) => ch === '.' || ch === ' ' ? [] : [[x0 + i, y0 + j, ch]]));
  const flip = (cs) => [...cs, ...cs.map(([x, y, c]) => [N - 1 - x, y, c])];          // a part drawn for the left side, copied to the right
  const centred = (rows, y0) => { const W = Math.max(...rows.map(r => r.length)); return cellsOf(rows, (N - W) / 2, y0); };
  // `under` are cells that are already painted (the head): the outline only goes round the part where it sticks out of them
  function paint(cs, { outline = false, under = null } = {}) {
    if (!cs.length) return '';
    const at = new Map(cs.map(([x, y, c]) => [key(x, y), c]));
    const out = new Map();
    if (outline) for (const [x, y] of cs) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = key(x + dx, y + dy);
      if (!at.has(k) && !(under && under.has(k))) out.set(k, 'k');
    }
    const runs = (m) => {                                                                // neighbouring cells of one colour in a row become one rect
      const items = [...m].map(([k, c]) => [...k.split(',').map(Number), c]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
      let svg = '', i = 0;
      while (i < items.length) {
        const [x, y, c] = items[i]; let n = 1;
        while (i + n < items.length && items[i + n][1] === y && items[i + n][0] === x + n && items[i + n][2] === c) n++;
        svg += `<rect x="${x * CELL}" y="${y * CELL}" width="${n * CELL}" height="${CELL}" fill="${COLOR[c] || INK}"/>`;
        i += n;
      }
      return svg;
    };
    return `<g shape-rendering="crispEdges" stroke="none">${runs(out)}${runs(at)}</g>`; // stroke off: a card's stick body passes its ink line down to everything inside it
  };

  // ---- heads: a rounded block, `ct` and `cb` being how round the top and bottom corners are. The chin always sits on row 17 ------------------------
  const HEADS = { square: [14, 14, 2, 2], round: [14, 15, 6, 6], tall: [12, 15, 5, 5], wide: [16, 13, 3, 4], chin: [14, 15, 3, 5] };
  const inset = (r, i) => i >= r ? 0 : Math.round(r - Math.sqrt(r * r - (r - i - .5) ** 2));
  const headOf = (name) => {
    const [w, h, ct, cb] = HEADS[name] || HEADS.square, top = 18 - h, x0 = (N - w) / 2;
    const rows = Array.from({ length: h }, (_, i) => { const a = Math.max(inset(ct, i), inset(cb, h - 1 - i)); return '.'.repeat(a) + 's'.repeat(w - 2 * a) + '.'.repeat(a); });
    const cs = cellsOf(rows, x0, top);
    return { w, h, top, x0, cs, mask: new Set(cs.map(([x, y]) => key(x, y))) };
  };

  // ---- the parts --------------------------------------------------------------------------------------------------------------------------------
  const EARS = { none: null, small: [1, 2, 10], round: [1, 3, 9], big: [2, 4, 8] };                // width, height, first row
  const EYES = {                                                                                  // left eye (x, y, rows), copied to the right; `ol` gives it an ink ring
    dots: [7, 9, ['k', 'k'], false], square: [6, 9, ['kk', 'kk'], false], beady: [8, 10, ['k'], false], wide: [4, 9, ['k', 'k'], false], sleepy: [5, 10, ['kkk'], false],
    pupils: [5, 9, ['www', 'wkw'], true], deadpan: [5, 9, ['kkk', 'wkw'], true], bulgy: [5, 9, ['www', 'wkw', 'www'], true],
  };
  const BROWS = {                                                                                 // left brow (x, y, rows); unibrow is one piece in the middle
    none: null, flat: [5, 6, ['kkk']], angry: [5, 6, ['kk.', '.kk']], worried: [5, 6, ['.kk', 'kk.']], bushy: [5, 6, ['kkkk', 'kkkk']], unibrow: ['mid', 6, ['kkkkkkkk']],
  };
  const NOSES = { none: null, dot: [['dd'], 12], button: [['dd', 'dd'], 11], long: [['dd', 'dd', 'dd'], 10], pig: [['dddd', 'kddk'], 11], wide: [['dddddd', 'dddddd'], 11], beak: [['.dd.', 'dddd'], 11] };
  const MOUTHS = {
    flat: [['kkkk'], 14], smile: [['k....k', '.kkkk.'], 14], frown: [['.kkkk.', 'k....k'], 14], open: [['kkkk', 'krrk'], 14],
    grin: [['kkkkkk', 'kwwwwk', '.kkkk.'], 14], smirk: [['....kk', '.kkkk.'], 14], small: [['kk', 'kk'], 14], overbite: [['kkkkkk', '.kwwk.'], 14],
  };

  // hair is as wide as the head plus a cell either side, so each style is a function of that width W; rows start `dy` above the head's top row
  const span = (W, a, b) => '.'.repeat(a) + 'h'.repeat(b - a) + '.'.repeat(W - b);
  const cen = (W, n) => span(W, (W - n) / 2, (W + n) / 2);
  const or = (a, b) => [...a].map((c, i) => c === 'h' || b[i] === 'h' ? 'h' : '.').join('');
  const edges = (W, n) => or(span(W, 0, n), span(W, W - n, W));
  const HAIRS = {
    bald: null,
    tuft: (W) => [-2, [cen(W, 2), cen(W, 2)]],
    mop: (W) => [-1, [cen(W, W - 6), cen(W, W - 2), cen(W, W), or(span(W, 0, 4), span(W, W - 4, W)), edges(W, 2), edges(W, 2)]],
    swoop: (W) => [-1, [cen(W, W - 6), cen(W, W - 2), span(W, 0, W), or(span(W, 0, W - 4), span(W, W - 2, W)), span(W, 0, W - 8)]],
    spikes: (W) => { const c = W / 2, tips = [0, 1, 2].flatMap(i => [c - 1 - 3 * i, c + 3 * i]).filter(x => x >= 1 && x < W - 1); return [-3, [[...Array(W)].map((_, x) => tips.includes(x) ? 'h' : '.').join(''), cen(W, W - 4), cen(W, W - 2), span(W, 0, W), edges(W, 2)]]; },
    sides: (W) => [3, Array(5).fill(edges(W, 2))],
    long: (W) => [-1, [cen(W, W - 6), cen(W, W - 2), cen(W, W), or(span(W, 0, 4), span(W, W - 4, W)), ...Array(9).fill(edges(W, 2))]],
  };

  const EXTRAS = {
    none: () => [],
    freckles: () => flip(cellsOf(['d.d', '.d.'], 4, 12)),
    bags: () => flip(cellsOf(['ddd'], 5, 12)),
    blush: () => flip(cellsOf(['pp'], 4, 13)),
    wrinkles: (h) => cellsOf(['dddddd', '......', '.dddd.'], 7, h.top + 1),
    stubble: (h) => [...h.cs].filter(([x, y]) => y >= 14 && x >= 5 && x <= 14 && (x + y) % 2 === 0).map(([x, y]) => [x, y, 'd']),
  };

  // hats stand on the head's top row. Rows are runs of [width, colour], centred in W cells
  const R = (W, ...runs) => { const n = runs.reduce((a, [k]) => a + k, 0), pad = '.'.repeat((W - n) / 2); return pad + runs.map(([k, c]) => c.repeat(k)).join('') + pad; };
  const HATS = {
    none: null,
    pith: [18, [[6, 't'], [10, 't'], [14, 't'], [14, 'u'], [18, 'u']]],
    sailor: [16, [[10, 'w'], [14, 'w'], [16, 'b']]],
    hard: [18, [[8, 'y'], [12, 'y'], [14, 'y'], [18, 'y']], 1, [[5, 'y'], [2, 'o'], [5, 'y']]],
    beanie: [16, [[2, 'c'], [2, 'c'], [8, 'e'], [12, 'e'], [14, 'e'], [16, 'f']]],
    bowler: [18, [[8, 'g'], [12, 'g'], [14, 'g'], [14, 'e'], [18, 'g']]],
    party: [14, [[2, 'y'], [2, 'p'], [4, 'p'], [4, 'p'], [6, 'p'], [8, 'p']], 3, [[1, 'p'], [2, 'w'], [1, 'p']]],
    chef: [16, [[6, 'w'], [12, 'w'], [14, 'w'], [14, 'w'], [12, 'w']]],
    wizard: [20, [[2, 'v'], [4, 'v'], [6, 'v'], [8, 'v'], [10, 'v'], [12, 'v'], [20, 'v']], 3, [[3, 'v'], [2, 'y'], [3, 'v']]],
  };
  const hatCells = (name, head) => {
    const def = HATS[name]; if (!def) return [];
    const [W, runs, special, row] = def, rows = runs.map(r => R(W, r));
    if (special !== undefined) rows[special] = R(W, ...row);
    return cellsOf(rows, (N - W) / 2, headOf(head).top - rows.length + 1);
  };
  const hatFor = (name, head = 'square') => paint(hatCells(name, head), { outline: true });

  // ---- putting a head together --------------------------------------------------------------------------------------------------------------------
  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra'];
  const PARTS = { head: HEADS, ears: EARS, eyes: EYES, brows: BROWS, nose: NOSES, mouth: MOUTHS, hair: HAIRS, extra: EXTRAS, hat: HATS };
  const names = (k) => Object.keys(PARTS[k]);
  const DEFAULT = { head: 'round', ears: 'round', eyes: 'deadpan', brows: 'none', nose: 'button', mouth: 'flat', hair: 'tuft', extra: 'none', hat: 'none', skin: 'peach', hairColor: 'ink', scale: 1 };

  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec }, h = headOf(s.head), [skin, skinDark] = SKIN[s.skin] || SKIN.peach;
    const ear = EARS[s.ears] || null, hairDef = HAIRS[s.hair] && HAIRS[s.hair](h.w + 2), eye = EYES[s.eyes] || EYES.dots, brow = BROWS[s.brows];
    const nose = NOSES[s.nose], mouth = MOUTHS[s.mouth] || MOUTHS.flat;
    return {
      style: `--skin:${skin};--skin-dark:${skinDark};--hair:${HAIR[s.hairColor] || INK}`,
      ears: ear ? paint(flip(cellsOf(Array(ear[1]).fill('s'.repeat(ear[0])), h.x0 - ear[0], ear[2])), { outline: true, under: h.mask }) : '',
      head: paint(h.cs, { outline: true }),
      extra: paint((EXTRAS[s.extra] || EXTRAS.none)(h)),
      hair: hairDef ? paint(cellsOf(hairDef[1], h.x0 - 1, h.top + hairDef[0]), { outline: true, under: h.mask }) : '',
      eyes: paint(flip(cellsOf(eye[2], eye[0], eye[1])), { outline: eye[3] }),
      brows: !brow ? '' : paint(brow[0] === 'mid' ? centred(brow[2], brow[1]) : flip(cellsOf(brow[2], brow[0], brow[1]))),
      nose: nose ? paint(centred(nose[0], nose[1])) : '',
      mouth: paint(centred(mouth[0], mouth[1])),
      hat: hatFor(s.hat, s.head), scale: s.scale || 1,
    };
  }

  function compose(spec = {}, { size = 120, title = '' } = {}) {
    const p = pieces(spec), px = Math.round(size * (p.scale || 1));
    return `<svg class="face" viewBox="-10 -24 120 120" width="${px}" height="${px}" role="img" aria-label="${title || 'face'}" style="${p.style}">${p.ears}${p.head}${p.extra}${p.hair}${p.eyes}${p.brows}${p.nose}${p.mouth}${p.hat}</svg>`;
  }

  // the head's outline, top to bottom, in canvas y; the stick body hangs from the chin
  const headSpan = (head) => [(headOf(head).top - 1) * CELL, 18 * CELL];

  // the body is a blocky stick figure: every bone is a one-cell-wide rect drawn from its joint, rotated to the pose it rests in; hands are skin, feet are a block.
  // Same joints and class names as any style (see BODY_CLASSES in ../faces.js), so the page's animation moves these too.
  function body(head) {
    const [top, bot] = headSpan(head), B = (bot - top) / 2;
    const neck = bot - 3, hip = bot + B * .4, shoulder = bot + B * .2, foot = bot + B;
    const lx = B * .22, ly = foot - hip, ax = B * .5, ay = B * .28;
    const f = n => +n.toFixed(2);
    const bone = (x, y) => `<g transform="rotate(${f(Math.atan2(-x, y) * 180 / Math.PI)})"><rect x="-2.5" y="-2.5" width="5" height="${f(Math.hypot(x, y) + 5)}" fill="${INK}"/></g>`;
    const end = (kind, side) => kind === 'foot' ? `<rect x="${side === 'l' ? -7.5 : -2.5}" y="-2.5" width="10" height="5" fill="${INK}"/>` : `<rect x="-3" y="-3" width="6" height="6" fill="var(--skin)"/>`;
    const limb = (b, sub, side, x, y, tip) => `<g class="${b} side-${side}">${bone(x / 2, y / 2)}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}">${bone(x / 2, y / 2)}<g transform="translate(${f(x / 2)} ${f(y / 2)})">${end(tip, side)}</g></g></g></g>`;
    const at = (x, y, inner) => `<g transform="translate(${x} ${f(y)})">${inner}</g>`;
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" shape-rendering="crispEdges" stroke="none">`
        + `<g class="lower">${at(50, hip, limb('thigh', 'shin', 'l', -lx, ly, 'foot') + limb('thigh', 'shin', 'r', lx, ly, 'foot'))}</g>`
        + `<g class="upper"><rect class="torso" x="47.5" y="${f(neck)}" width="5" height="${f(hip - neck)}" fill="${INK}"/>${at(50, shoulder, limb('arm', 'fore', 'l', -ax, ay, 'hand') + limb('arm', 'fore', 'r', ax, ay, 'hand'))}`,
      close: '</g></g>' };
  }

  // a pixel crown: three points over a band with a gem (which twinkles), tilted a little
  function crown(head) {
    const top = headOf(head).top * CELL, gem = `<rect class="gem" x="47.5" y="10" width="5" height="5" fill="var(--bean)"/>`;
    return `<g class="crown" transform="translate(50 ${top - 8}) rotate(-5)"><g transform="translate(-50 0)">${paint(cellsOf(['y.yy.y', 'yyyyyy', 'oooooo'], 7, 0), { outline: true })}${gem}</g></g>`;
  }

  // the expressions the card swaps in: the eyes sit on rows 9 to 10, the mouth on 14 to 15
  function mood(ink = INK) {
    const k = (cs) => paint(cs.map(([x, y]) => [x, y, 'k'])).replaceAll(INK, ink);
    const L = (rows, x, y) => flip(cellsOf(rows, x, y));
    const wrap = (cls, inner) => `<g class="${cls}">${inner}</g>`;
    const spiral = ['kkkkk', 'k...k', 'k.k.k', 'k.kkk', 'k....'].map(r => r.replaceAll('.', 'w'));
    const ring = paint(flip(cellsOf(['www', 'www', 'www'], 5, 9)), { outline: true });
    const pupil = (x) => `<rect class="pupil" x="${x * CELL}" y="${10 * CELL}" width="${CELL}" height="${CELL}" fill="${ink}"/>`;
    return [
      wrap('eye-closed', k(L(['k.k', '.k.'], 5, 9))),
      wrap('eye-happy', k(L(['.k.', 'k.k'], 5, 9))),
      wrap('eye-sleepy', k(L(['kkk', '.k.'], 5, 9))),
      wrap('eye-x', k(L(['k.k', '.k.', 'k.k'], 5, 9))),
      wrap('dizzy-eyes', paint(L(spiral, 4, 8))),
      wrap('worry-eyes', ring + pupil(6) + pupil(13)),
      wrap('worry-brows', k(L(['..kk', 'kk..'], 5, 6))),
      wrap('brows', k(L(['kk..', '..kk'], 5, 6))),
      wrap('yawn', k(cellsOf(['kk', 'kk', 'kk'], 9, 14))),
      wrap('worry-mouth', k(cellsOf(['.k.k', 'k.k.'], 8, 14))),
    ].join('');
  }

  function random(seed = Math.random() * 1e9) {
    const r = rng(seed | 0), pick = (list) => list[Math.floor(r() * list.length)];
    return { ...Object.fromEntries(ORDER.map(k => [k, pick(names(k))])), hat: 'none', skin: pick(Object.keys(SKIN)), hairColor: pick(Object.keys(HAIR)), scale: 1 };
  }

  // a relative keeps the head and ears and has a similar skin tone; the rest is passed down or its own
  function derive(main, seed = 0) {
    const m = { ...DEFAULT, ...main };
    return kin(m, seed, {
      keep: { nose: .65, eyes: .5, mouth: .45, brows: .4, hair: .4, hairColor: .5, extra: .4 },
      pool: (k) => k === 'hairColor' ? Object.keys(HAIR) : names(k),
      tone: { key: 'skin', list: Object.keys(SKIN) },
    });
  }

  const colors = (table, i) => Object.fromEntries(Object.entries(table).map(([n, v]) => [n, i === null ? v : v[i]]));
  const editor = () => ({
    slots: [...ORDER, 'hat'].map(k => ({ key: k, options: names(k), fixed: false })),
    swatches: [{ key: 'skin', label: 'skin', colors: colors(SKIN, 0) }, { key: 'hairColor', label: 'hair colour', colors: colors(HAIR, null) }],
  });

  return { name: 'pixel', label: 'Pixel', description: 'Eight-bit heads on a grid, every part a few rows of pixels.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT };
})());
