// The "paper" face style: a kids' collage. Every part is a flat shape cut from construction paper, glued on slightly crooked, with a soft drop shadow.
// No outlines: the shadow (one feDropShadow filter, defined inside the head piece and shared by every layer) is what separates the pieces.
// The body is a paper puppet: flat strips for limbs, pinned at the joints with brass split-pins. Googly eyes, because of course.
// A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat, skin, hairColor, scale }. The contract a style has to meet is at the top of ../faces.js.
Faces.register((() => {
  const { kin, rng } = Faces;
  const INK = '#22201e', WHITE = '#fffdf6', PINK = '#f28a9a', BRASS = '#c9a43a', SHIRT = '#4a8ad0', TROUSERS = '#3a3a5a';
  // ids are the same in every card and every copy is identical, so it doesn't matter which one the page resolves
  const DEFS = `<defs><filter id="paper-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="1.2" dy="2" stdDeviation=".7" flood-color="#000" flood-opacity=".32"/></filter></defs>`;
  const SH = 'filter="url(#paper-shadow)"';
  const cut = (deg, body, cx = 50, cy = 52) => `<g transform="rotate(${deg} ${cx} ${cy})" ${SH}>${body}</g>`;
  const mirror = (f) => f(1) + f(-1);
  const side = (s, body) => `<g transform="translate(${s < 0 ? 100 : 0} 0) scale(${s} 1)">${body}</g>`;

  const SKIN = {
    peach: ['#f7c9a4', '#e0a47a'], tan: ['#dca878', '#b8825a'], brown: ['#a06a44', '#7a4e30'],
    pink: ['#f6b4c0', '#dc8c9c'], yellow: ['#f6d86a', '#d8b444'], mint: ['#a8e0c4', '#7cc0a0'],
  };
  const HAIR = { black: '#2a2624', brown: '#6a4228', orange: '#e0702a', yellow: '#f0c030', blue: '#3a6ac0', purple: '#7a4ab0' };

  // pinking-shears edge: a circle with a zigzag rim
  const pinked = (cx, cy, r, n = 28) => 'M' + [...Array(n)].map((_, i) => { const a = (i / n) * Math.PI * 2, rr = i % 2 ? r - 3.4 : r; return `${(cx + rr * Math.sin(a)).toFixed(1)} ${(cy - rr * Math.cos(a)).toFixed(1)}`; }).join('L') + 'Z';

  // ---- heads: the outline, how far it reaches (the hat and the body hang from them) and where its left edge is (for the ears) -----------------------------
  const HEADS = {
    circle:  { d: 'M12 52A38 38 0 1 0 88 52A38 38 0 1 0 12 52Z', top: 14, bottom: 90, left: 12 },
    oval:    { d: 'M18 52A32 40 0 1 0 82 52A32 40 0 1 0 18 52Z', top: 12, bottom: 92, left: 18 },
    square:  { d: 'M22 16H78Q84 16 84 22V84Q84 90 78 90H22Q16 90 16 84V22Q16 16 22 16Z', top: 16, bottom: 90, left: 16 },
    pear:    { d: 'M50 14C64 14 70 28 72 40C82 52 84 70 76 82C68 92 32 92 24 82C16 70 18 52 28 40C30 28 36 14 50 14Z', top: 14, bottom: 90, left: 20 },
    pinked:  { d: pinked(50, 52, 38), top: 14, bottom: 90, left: 12 },
  };
  const headOf = (name) => HEADS[name] || HEADS.circle;

  const PARTS = {
    head: Object.fromEntries(Object.keys(HEADS).map(k => [k, HEADS[k].d])),
    // side pieces, drawn behind the head for a head whose left edge is at x=20 (they are shifted for the others)
    ears: {
      none: '',
      round: `<circle cx="18" cy="54" r="9" fill="var(--skin)"/><circle cx="18" cy="54" r="4.4" fill="var(--skin-dark)"/>`,
      pointy: `<path d="M24 42L4 30L22 62Z" fill="var(--skin)"/>`,
      big: `<ellipse cx="14" cy="52" rx="12" ry="15" fill="var(--skin)"/><ellipse cx="15" cy="52" rx="6" ry="9" fill="${PINK}"/>`,
    },
    eyes: {
      googly: mirror(s => side(s, `<circle cx="36" cy="48" r="8.6" fill="${WHITE}"/><circle cx="37.6" cy="51" r="4.4" fill="${INK}"/>`)),
      crossed: `<circle cx="36" cy="48" r="8.6" fill="${WHITE}"/><circle cx="40" cy="50" r="4.4" fill="${INK}"/><circle cx="64" cy="48" r="8.6" fill="${WHITE}"/><circle cx="60" cy="45" r="4.4" fill="${INK}"/>`,
      dots: mirror(s => side(s, `<circle cx="36" cy="48" r="4.4" fill="${INK}"/>`)),
      ovals: mirror(s => side(s, `<ellipse cx="36" cy="48" rx="4" ry="7" fill="${INK}"/><circle cx="37.4" cy="45" r="1.6" fill="${WHITE}"/>`)),
      button: mirror(s => side(s, `<circle cx="36" cy="48" r="6.6" fill="#d04a4a"/><circle cx="34.4" cy="46.4" r="1.2" fill="${INK}"/><circle cx="37.6" cy="46.4" r="1.2" fill="${INK}"/><circle cx="34.4" cy="49.6" r="1.2" fill="${INK}"/><circle cx="37.6" cy="49.6" r="1.2" fill="${INK}"/>`)),
      half: mirror(s => side(s, `<path d="M28 46A8 8 0 0 0 44 46Z" fill="${INK}"/>`)),
    },
    brows: {
      none: '',
      strips: mirror(s => side(s, `<rect x="28" y="35" width="16" height="4" fill="var(--hair)" transform="rotate(-6 36 37)"/>`)),
      arches: mirror(s => side(s, `<path d="M27 40Q36 30 45 40Q36 34 27 40Z" fill="var(--hair)"/>`)),
      cross: mirror(s => side(s, `<rect x="28" y="36" width="17" height="4.4" fill="var(--hair)" transform="rotate(14 36 38)"/>`)),
    },
    nose: {
      none: '',
      triangle: `<path d="M50 56L44 68H56Z" fill="var(--skin-dark)"/>`,
      circle: `<circle cx="50" cy="63" r="5" fill="#e05a4a"/>`,
      heart: `<path d="M50 68L44 62Q42 57 46 56Q49 56 50 59Q51 56 54 56Q58 57 56 62Z" fill="${PINK}"/>`,
    },
    mouth: {
      smile: `<path d="M36 74Q50 90 64 74Q50 82 36 74Z" fill="#c0303a"/>`,
      oh: `<circle cx="50" cy="80" r="6" fill="#c0303a"/><circle cx="50" cy="80" r="3" fill="${INK}"/>`,
      strip: `<rect x="40" y="77" width="20" height="4.4" fill="#c0303a" transform="rotate(-4 50 79)"/>`,
      teeth: `<path d="M34 74H66Q64 90 50 90Q36 90 34 74Z" fill="${INK}"/><rect x="37" y="74" width="26" height="5" fill="${WHITE}"/>`,
      tongue: `<path d="M38 75Q50 86 62 75Z" fill="#c0303a"/><ellipse cx="54" cy="83" rx="5" ry="6" fill="${PINK}"/>`,
      zigzag: `<path d="M36 78L40 74L44 78L48 74L52 78L56 74L60 78L64 74V79L60 83L56 79L52 83L48 79L44 83L40 79L36 83Z" fill="#c0303a"/>`,
    },
    // hair, drawn for a head whose top is at y=14 (shifted for the others)
    hair: {
      none: '',
      bangs: `<path d="M18 36L18 26Q22 10 50 8Q78 10 82 26L82 36L75 29L68 36L61 29L54 36L47 29L40 36L33 29L26 36Z" fill="var(--hair)"/>`,
      tuft: `<path d="M38 18L40 -2L48 14L54 -6L58 14L66 0L64 20Z" fill="var(--hair)"/>`,
      bob: `<path d="M12 64Q4 12 50 6Q96 12 88 64H76L74 30Q50 20 26 30L24 64Z" fill="var(--hair)"/>`,
      curls: `<g fill="var(--hair)">${[[22, 28], [30, 18], [41, 12], [52, 10], [63, 12], [72, 18], [79, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join('')}</g>`,
      mohawk: `<path d="M42 20L44 -8H56L58 20Z" fill="var(--hair)"/><path d="M44 -2H56M44 6H57M43 14H57" stroke="${WHITE}" stroke-width="1.6" opacity=".35"/>`,
    },
    // stickers and bits glued on the face
    extra: {
      none: '',
      cheeks: mirror(s => side(s, `<circle cx="27" cy="64" r="5.4" fill="${PINK}"/>`)),
      freckles: mirror(s => side(s, `<g fill="var(--skin-dark)"><circle cx="28" cy="60" r="1.6"/><circle cx="34" cy="62" r="1.6"/><circle cx="29" cy="66" r="1.6"/></g>`)),
      glasses: `<g fill="none" stroke="${INK}" stroke-width="3"><circle cx="36" cy="48" r="11"/><circle cx="64" cy="48" r="11"/><path d="M47 47Q50 44 53 47"/></g>`,
      tache: `<path d="M50 70Q42 66 34 72Q38 76 44 74Q48 73 50 72Q52 73 56 74Q62 76 66 72Q58 66 50 70Z" fill="var(--hair)"/>`,
      star: `<path d="M72 66L74 71L79 71L75 74L77 79L72 76L67 79L69 74L65 71L70 71Z" fill="#f0c030"/>`,
    },
  };

  // ---- hats: paper hats; the brim line at y=0 and the crown going up. hatFor() puts one on a head --------------------------------------------------------
  const HAT = {
    none: '',
    pith: `<path d="M-21 0Q-21 -25 0 -27Q21 -25 21 0Z" fill="#d8c08a"/><path d="M-32 0H32V6H-32Z" fill="#b89a60"/>`,
    sailor: `<path d="M-28 0L-16 -24L0 -10L16 -24L28 0Z" fill="${WHITE}"/><path d="M-28 0H28L24 6H-24Z" fill="#d8d0c0"/>`,
    hard: `<path d="M-23 0Q-23 -25 0 -25Q23 -25 23 0Z" fill="#f2b62a"/><rect x="-4" y="-25" width="8" height="17" fill="#d0961a"/><path d="M-30 0H30V5H-30Z" fill="#e0a420"/>`,
    beanie: `<path d="M-22 3Q-24 -22 0 -24Q24 -22 22 3Z" fill="#d04a4a"/><rect x="-23" y="-4" width="46" height="8" fill="#a83030"/><circle cy="-27" r="5" fill="${WHITE}"/>`,
    bowler: `<rect x="-15" y="-30" width="30" height="30" rx="5" fill="${INK}"/><rect x="-15" y="-9" width="30" height="5" fill="#d04a4a"/><path d="M-26 0H26V5H-26Z" fill="${INK}"/>`,
    party: `<path d="M-14 2L0 -38L14 2Z" fill="#3a9ad0"/><circle cx="-3" cy="-10" r="2.4" fill="#f0c030"/><circle cx="4" cy="-20" r="2.4" fill="${PINK}"/><circle cy="-40" r="4.6" fill="#f0c030"/>`,
    chef: `<path d="M-16 2V-8Q-28 -10 -23 -22Q-18 -34 0 -30Q18 -34 23 -22Q28 -10 16 -8V2Z" fill="${WHITE}"/>`,
    wizard: `<path d="M-24 5L4 -44L24 5Z" fill="#5a3ab0"/><path d="M-33 3H33V9H-33Z" fill="#4a2a90"/><path d="M2 -24L4 -19L9 -19L5 -16L7 -11L2 -14L-3 -11L-1 -16L-5 -19L0 -19Z" fill="#f0c030"/>`,
  };
  const hatFor = (name, head = 'circle') => HAT[name] ? `<g transform="translate(50 ${headOf(head).top + 8}) rotate(-7) scale(.95)" ${SH}>${HAT[name]}</g>` : '';
  PARTS.hat = HAT;

  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra'];
  const names = (k) => Object.keys(PARTS[k]);
  const DEFAULT = { head: 'circle', ears: 'round', eyes: 'googly', brows: 'strips', nose: 'triangle', mouth: 'smile', hair: 'bangs', extra: 'cheeks', hat: 'none', skin: 'peach', hairColor: 'brown', scale: 1 };

  // each layer is glued on at its own small angle, so the collage never lines up quite straight
  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec }, h = headOf(s.head), [skin, skinDark] = SKIN[s.skin] || SKIN.peach;
    const pick = (k) => PARTS[k][s[k]] ?? '', layer = (k, deg) => pick(k) ? cut(deg, pick(k)) : '', ears = pick('ears'), hair = pick('hair');
    return {
      style: `--skin:${skin};--skin-dark:${skinDark};--hair:${HAIR[s.hairColor] || HAIR.brown};--accent:${HAIR[s.hairColor] || HAIR.brown}`,
      ears: ears ? cut(0, mirror(sd => side(sd, `<g transform="translate(${h.left - 20} 0)">${ears}</g>`))) : '',
      head: `${DEFS}${cut(-3, `<path d="${h.d}" fill="var(--skin)"/>`)}`,
      extra: layer('extra', 2),
      hair: hair ? `<g transform="translate(0 ${h.top - 14})">${cut(4, hair, 50, 20)}</g>` : '',
      eyes: layer('eyes', -2), brows: layer('brows', 3), nose: layer('nose', 5), mouth: layer('mouth', -3), hat: hatFor(s.hat, s.head), scale: s.scale || 1,
    };
  }

  function compose(spec = {}, { size = 120, title = '' } = {}) {
    const p = pieces(spec), px = Math.round(size * (p.scale || 1));
    return `<svg class="face" viewBox="-14 -32 128 128" width="${px}" height="${px}" role="img" aria-label="${title || 'face'}" style="${p.style}">${p.ears}${p.head}${p.extra}${p.hair}${p.eyes}${p.brows}${p.nose}${p.mouth}${p.hat}</svg>`;
  }

  const headSpan = (head) => [headOf(head).top, headOf(head).bottom];

  // the expressions the card swaps in over the spec's own eyes, brows and mouth: eyes at x 36 and 64, y 48; the mouth at y 74 to 90. Flat shapes, like the rest
  function mood(ink = INK) {
    return `<g class="eye-closed" fill="${ink}"><path d="M28 48A8 6 0 0 0 44 48Q36 52 28 48ZM56 48A8 6 0 0 0 72 48Q64 52 56 48Z"/></g>
      <g class="eye-happy" fill="${ink}"><path d="M28 52A8 8 0 0 1 44 52Q36 47 28 52ZM56 52A8 8 0 0 1 72 52Q64 47 56 52Z"/></g>
      <g class="eye-sleepy" fill="${ink}"><rect x="28" y="46" width="16" height="4"/><rect x="56" y="46" width="16" height="4"/></g>
      <g class="eye-x" fill="${ink}"><path d="M29 43L31 41L43 53L41 55ZM43 43L41 41L29 53L31 55ZM57 43L59 41L71 53L69 55ZM71 43L69 41L57 53L59 55Z"/></g>
      <g class="dizzy-eyes"><circle cx="36" cy="48" r="8.6" fill="${WHITE}"/><circle cx="64" cy="48" r="8.6" fill="${WHITE}"/>
        <g fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"><path d="M41 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(-5 -18)"/><path d="M59 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(5 -18)"/></g></g>
      <g class="worry-eyes"><circle cx="36" cy="48" r="8.6" fill="${WHITE}"/><circle cx="64" cy="48" r="8.6" fill="${WHITE}"/>
        <circle class="pupil" cx="37" cy="45" r="4" fill="${ink}"/><circle class="pupil" cx="63" cy="45" r="4" fill="${ink}"/></g>
      <path class="worry-brows" d="M27 38L45 34L45 38L27 42ZM73 38L55 34L55 38L73 42Z" fill="${ink}"/>
      <path class="brows" d="M27 33L46 39L45 43L26 37ZM73 33L54 39L55 43L74 37Z" fill="${ink}"/>
      <g class="yawn"><ellipse cx="50" cy="81" rx="7" ry="9" fill="${ink}"/><ellipse cx="50" cy="86" rx="4" ry="2.6" fill="${PINK}"/></g>
      <path class="worry-mouth" d="M38 82L44 76L50 82L56 76L62 82L62 86L56 80L50 86L44 80L38 86Z" fill="${ink}"/>`;
  }

  // a paper puppet: a flat shirt and trousers, limbs as flat strips, each joint pinned with a brass split-pin.
  // Same joints and class names as any style (see BODY_CLASSES in ../faces.js), so the page's animation moves these too.
  function body(head) {
    const [top, bot] = headSpan(head), B = (bot - top) / 2;
    const neck = bot - 3, hip = bot + B * .42, shoulder = bot + B * .2, foot = bot + B;
    const lx = B * .2, ly = foot - hip, ax = B * .5, ay = B * .3;
    const f = n => +n.toFixed(2);
    const pin = `<circle r="1.8" fill="${BRASS}"/>`;
    const strip = (x, y, w, c) => `<path d="M0 0l${f(x)} ${f(y)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
    const tip = (kind, side) => kind === 'foot' ? `<rect x="${side === 'l' ? -10 : -2}" y="-2" width="12" height="6" rx="2" fill="${INK}"/>` : `<circle r="4.4" fill="var(--skin)"/>`;
    const limb = (b, sub, side, x, y, kind, w, c) => `<g class="${b} side-${side}" ${SH}>${strip(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}">${strip(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})">${tip(kind, side)}</g>${pin}</g></g>${pin}</g>`;
    const at = (x, y, inner) => `<g transform="translate(${f(x)} ${f(y)})">${inner}</g>`;
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" fill="none">`
        + `<g class="lower">${at(44, hip, limb('thigh', 'shin', 'l', -lx, ly, 'foot', 7, TROUSERS))}${at(56, hip, limb('thigh', 'shin', 'r', lx, ly, 'foot', 7, TROUSERS))}`
        + `<path d="M37 ${f(hip - 2)}H63L64 ${f(hip + 7)}H36Z" fill="${TROUSERS}" ${SH}/></g>`
        + `<g class="upper"><path class="torso" d="M37 ${f(neck)}H63L65 ${f(hip + 2)}H35Z" fill="${SHIRT}" transform="rotate(2 50 ${f(hip)})" ${SH}/>`
        + `<rect x="47" y="${f(neck + 6)}" width="6" height="6" fill="${WHITE}" transform="rotate(12 50 ${f(neck + 9)})"/>`
        + `${at(37, shoulder, limb('arm', 'fore', 'l', -ax, ay, 'hand', 6, SHIRT))}${at(63, shoulder, limb('arm', 'fore', 'r', ax, ay, 'hand', 6, SHIRT))}`,
      close: '</g></g>' };
  }

  // a zigzag paper crown, a little crooked, with one round gem (which twinkles)
  const crown = (head) => `<g class="crown" transform="translate(50 ${headOf(head).top - 6}) rotate(-6)" ${SH}>
      <path d="M-17 10V-8L-9 0L0 -12L9 0L17 -8V10Z" fill="#f0c030"/>
      <circle class="gem" cx="0" cy="3.6" r="3" fill="var(--bean)"/>
    </g>`;

  function random(seed = Math.random() * 1e9) {
    const r = rng(seed | 0), pick = (list) => list[Math.floor(r() * list.length)];
    return { ...Object.fromEntries(ORDER.map(k => [k, pick(names(k))])), hat: 'none', skin: pick(Object.keys(SKIN)), hairColor: pick(Object.keys(HAIR)), scale: 1 };
  }

  // a relative keeps the head shape and ears and has a nearby paper colour; the eyes, the mouth and the hair are passed down or its own
  function derive(main, seed = 0) {
    return kin({ ...DEFAULT, ...main }, seed, {
      keep: { eyes: .55, mouth: .45, nose: .6, brows: .4, hair: .4, hairColor: .5, extra: .4 },
      pool: (k) => k === 'hairColor' ? Object.keys(HAIR) : names(k),
      tone: { key: 'skin', list: Object.keys(SKIN) },
    });
  }

  const colors = (table, i) => Object.fromEntries(Object.entries(table).map(([n, v]) => [n, i === null ? v : v[i]]));
  const editor = () => ({
    slots: [...ORDER, 'hat'].map(k => ({ key: k, options: names(k), fixed: false })),
    swatches: [{ key: 'skin', label: 'paper', colors: colors(SKIN, 0) }, { key: 'hairColor', label: 'hair', colors: colors(HAIR, null) }],
  });

  // the map: a collage on a sheet of craft paper. Every domain is a torn patch of coloured paper with a lollipop tree, the base is
  // a pop-up paper house, the ways are dashed "cut here" lines, and the web is a paper aeroplane carrying messages (see map.js)
  const map = (() => {
    const SH = 'filter="url(#paper-map-shadow)"'; // the map's own copy of the shadow, so it never depends on a paw being drawn
    const CRAFT = '#d8c4a0', PAPERS = ['#f28a9a', '#8ac0f0', '#f2d26a', '#9ad88a', '#c8a0e8', '#f2a86a'], TRUNK = '#8a6a4a';
    const f = n => +n.toFixed(1);
    const cut = (w = 1.6) => `stroke="${INK}" stroke-opacity=".35" stroke-width="${w}" stroke-linejoin="round"`;
    const tree = (x, y, k, c) => `<g transform="translate(${f(x)} ${f(y)}) scale(${k})" ${SH}><rect x="-3" y="-22" width="6" height="22" fill="${TRUNK}"/><circle cy="-30" r="15" fill="${c}" ${cut()}/></g>`;
    return {
      backdrop: (w, h) => `<defs><filter id="paper-map-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="2" dy="3.5" stdDeviation="1.2" flood-color="#000" flood-opacity=".3"/></filter><pattern id="paper-fibres" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M10 20l18 4M70 60l14-6M30 96l20 2M96 14l10 10M50 40l8 12" stroke="#a88a60" stroke-opacity=".35" stroke-width="1.2" stroke-linecap="round"/></pattern></defs>
        <rect width="${w}" height="${h}" fill="${CRAFT}"/><rect width="${w}" height="${h}" fill="url(#paper-fibres)"/>`,
      // a pop-up paper house: walls, a roof, a door and windows, each a separate cut-out
      base: (seed) => `<path d="${Faces.blob(108, seed, { squash: .6, bumps: 22, wob: .08 })}" fill="${WHITE}" ${cut(1.8)} ${SH}/>`
        + tree(-80, 10, 1.1, PAPERS[3]) + tree(82, 4, .9, PAPERS[3])
        + `<g transform="translate(0 -6)" ${SH}><rect x="-50" y="-60" width="100" height="66" fill="${PAPERS[5]}" ${cut()}/><path d="M-62 -58l62-44 62 44z" fill="${PAPERS[0]}" ${cut()}/>`
        + `<rect x="-12" y="-26" width="24" height="32" fill="${PAPERS[4]}" ${cut()}/><circle cx="6" cy="-10" r="2" fill="${BRASS}"/><rect x="-40" y="-46" width="18" height="16" fill="${PAPERS[1]}" ${cut()}/><rect x="22" y="-46" width="18" height="16" fill="${PAPERS[1]}" ${cut()}/></g>`,
      // a torn patch of coloured paper with a tree or two
      place: (name, seed, n) => { const r = 60 + Math.min(n, 4) * 3, rnd = rng(seed | 0), c = PAPERS[Math.floor(rnd() * PAPERS.length)];
        return `<path d="${Faces.blob(r, seed, { squash: .6, bumps: 24, wob: .12 })}" fill="${c}" ${cut(1.8)} ${SH}/>`
          + tree(-r * .55, -r * .08, .85, PAPERS[3]) + (rnd() < .6 ? tree(r * .6, r * .04, .7, PAPERS[(Math.floor(rnd() * 2) * 2 + 1) % PAPERS.length]) : ''); },
      // a folded paper house
      building: (name, seed) => `<g ${SH}><rect x="-11" y="-6" width="22" height="16" fill="${WHITE}" ${cut()}/><path d="M-14 -5l14-12 14 12z" fill="${PAPERS[(seed >>> 0) % PAPERS.length]}" ${cut()}/><rect x="-3" y="2" width="6" height="8" fill="${INK}" opacity=".6"/></g>`,
      // a dashed "cut here" line
      route: (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${INK}" stroke-opacity=".45" stroke-width="2.4" stroke-dasharray="10 7"/>`,
      // a paper aeroplane in flight, with a dotted loop behind it
      sea: () => `<path d="M-40 10q-10-30 20-30t10 20" fill="none" stroke="${INK}" stroke-opacity=".4" stroke-width="2" stroke-dasharray="3 5"/>`
        + `<g transform="translate(6 -26) rotate(-14)" ${SH}><path d="M-26 0l52-14-30 22z" fill="${WHITE}" ${cut()}/><path d="M-4 8l30-22-22 26z" fill="#e8e4da" ${cut()}/></g>`,
    };
  })();

  return { name: 'paper', label: 'Paper cutouts', emoji: '✂️', description: 'Construction-paper collage heads with googly eyes on pinned paper-puppet bodies.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT, map };
})());
