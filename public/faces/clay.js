// The "clay" face style: plasticine stop-motion puppets. Lumpy heads with a thumbprint pressed in, wonky googly eyes, big toothy grins and fat sausage limbs.
// Two shared defs live inside the head piece: a low-frequency displacement filter that makes every edge a little lumpy, and a radial shade laid over each
// lump of clay so it looks rounded (lit from the top left). Every copy is identical, so it doesn't matter which one the page resolves.
// There are no ink lines: each piece is edged in a darker shade of its own colour. A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat,
// skin, hairColor, scale }. The contract a style has to meet is described at the top of ../faces.js.
Faces.register((() => {
  const { kin, rng } = Faces;
  const WHITE = '#fbf8f2', PUPIL = '#1a1416', MOUTH = '#4a1a1e', TONGUE = '#e86a7a', EDGE = 'rgba(40,20,20,.45)', SHIRT = '#e0503a', PANTS = '#3a5aa0';
  const DEFS = `<defs><filter id="clay-lumps" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="1" seed="9"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>`
    + `<radialGradient id="clay-shade" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient></defs>`;
  const LUMPY = 'filter="url(#clay-lumps)"';
  // a lump of clay: its colour, the shade over it, and an edge a little darker than itself
  const lump = (d, fill, w = 2) => `<path d="${d}" fill="${fill}" stroke="${EDGE}" stroke-width="${w}" stroke-linejoin="round"/><path d="${d}" fill="url(#clay-shade)"/>`;
  const ball = (cx, cy, r, fill, w = 1.6) => lump(`M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`, fill, w);
  // a sausage of clay rolled along a path
  const worm = (d, w, fill) => `<path d="${d}" fill="none" stroke="${EDGE}" stroke-width="${w + 2}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="${w / 3}" stroke-linecap="round" transform="translate(-${w / 5} -${w / 5})"/>`;
  const groove = (d, w = 2.4) => `<path d="${d}" fill="none" stroke="rgba(40,20,20,.55)" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const mirror = (f) => f(1) + f(-1);
  const side = (s, body) => `<g transform="translate(${s < 0 ? 100 : 0} 0) scale(${s} 1)">${body}</g>`;

  const SKIN = {
    peach: ['#f0b890', '#d09068'], pink: ['#f49aa0', '#d47078'], green: ['#8cc870', '#68a44c'],
    blue: ['#78a8e0', '#5484c0'], yellow: ['#f4d060', '#d0ac3c'], purple: ['#b088d0', '#8c64ac'],
  };
  const HAIR = { brown: '#7a4a2a', black: '#2a2224', orange: '#e0702a', yellow: '#f0c030', green: '#4aa040', blue: '#3a6ac0' };

  // ---- heads: the outline (already a bit lumpy before the filter adds more), how far it reaches (the hat and the body hang from them) and its left edge --
  const HEADS = {
    blob:   { d: 'M50 12C74 10 88 30 86 52C86 76 72 92 50 90C28 92 12 76 14 52C12 30 26 14 50 12Z', top: 12, bottom: 91, left: 14 },
    potato: { d: 'M44 14C66 8 86 24 84 46C88 64 80 88 56 90C34 94 14 82 16 60C12 38 24 18 44 14Z', top: 12, bottom: 91, left: 15 },
    pear:   { d: 'M50 12C62 12 68 24 70 36C82 46 86 66 78 80C70 92 30 92 22 80C14 66 18 46 30 36C32 24 38 12 50 12Z', top: 12, bottom: 90, left: 18 },
    block:  { d: 'M24 16Q50 10 76 16Q86 18 84 30Q88 56 84 80Q82 90 72 90Q50 94 28 90Q16 90 16 78Q12 54 16 30Q16 18 24 16Z', top: 14, bottom: 91, left: 15 },
    wide:   { d: 'M10 56C8 32 30 22 50 22C70 22 92 32 90 56C90 80 70 90 50 90C30 90 10 80 10 56Z', top: 22, bottom: 90, left: 10 },
  };
  const headOf = (name) => HEADS[name] || HEADS.blob;

  const PARTS = {
    head: Object.fromEntries(Object.keys(HEADS).map(k => [k, HEADS[k].d])),
    // side pieces, drawn behind the head for a head whose left edge is at x=20 (they are shifted for the others)
    ears: {
      none: '',
      round: `${ball(16, 54, 9, 'var(--skin)')}${groove('M14 50Q11 54 14 58', 1.8)}`,
      jug: worm('M24 46Q4 40 6 56Q8 68 24 64', 7, 'var(--skin)'),
      pointy: lump('M24 42Q12 32 4 26Q8 44 22 60Z', 'var(--skin)'),
    },
    eyes: {
      googly: `${ball(36, 47, 10, WHITE)}<circle cx="38" cy="50" r="4.4" fill="${PUPIL}"/>${ball(64, 48, 8, WHITE)}<circle cx="62" cy="50" r="3.8" fill="${PUPIL}"/>`,
      balls: mirror(s => side(s, `${ball(39, 48, 8.6, WHITE)}<circle cx="42" cy="49" r="3.6" fill="${PUPIL}"/>`)),
      beady: mirror(s => side(s, `${ball(36, 48, 4.4, PUPIL, 1)}<circle cx="34.6" cy="46.4" r="1.3" fill="#fff"/>`)),
      lidded: mirror(s => side(s, `${ball(36, 48, 8.6, WHITE)}<circle cx="36" cy="51" r="3.6" fill="${PUPIL}"/>${lump('M27 48Q27 38 36 38Q45 38 45 48Q36 44 27 48Z', 'var(--skin)', 1.6)}`)),
      wide: mirror(s => side(s, `${ball(36, 48, 9.6, WHITE)}<circle cx="33" cy="48" r="2.6" fill="${PUPIL}"/>`)),
      sleepy: mirror(s => side(s, `${ball(36, 49, 7.6, WHITE)}<circle cx="36" cy="52" r="3" fill="${PUPIL}"/>${lump('M28 49Q28 40 36 40Q44 40 44 49Q36 47 28 49Z', 'var(--skin-dark)', 1.6)}`)),
    },
    brows: {
      none: '',
      sausage: mirror(s => side(s, worm('M27 37Q36 31 45 36', 4.4, 'var(--hair)'))),
      angry: mirror(s => side(s, worm('M27 33L45 39', 4.4, 'var(--hair)'))),
      uni: worm('M26 37Q38 30 50 35Q62 30 74 37', 5, 'var(--hair)'),
    },
    nose: {
      none: '',
      ball: ball(50, 62, 7, 'var(--skin)', 1.8),
      long: lump('M47 52Q44 66 50 70Q60 70 56 64Q53 60 53 52Z', 'var(--skin)'),
      pinch: `${groove('M46 66Q50 69 54 66', 2)}${groove('M50 56V64', 1.6)}`,
    },
    mouth: {
      grin: `${lump('M30 70Q50 76 70 70Q68 92 50 92Q32 92 30 70Z', MOUTH, 1.8)}<path d="M33 71.4Q50 76 67 71.4V77Q50 81 33 77Z" fill="${WHITE}"/>${groove('M41 73.6V79.6M50 74.6V80.6M59 73.6V79.6', 1.2)}<ellipse cx="50" cy="87" rx="7" ry="3.2" fill="${TONGUE}"/>`,
      smile: groove('M38 76Q50 86 62 76', 3),
      oh: `${lump('M43 80A7 8 0 1 0 57 80A7 8 0 1 0 43 80Z', MOUTH, 1.6)}<ellipse cx="50" cy="84" rx="3.6" ry="2.2" fill="${TONGUE}"/>`,
      flat: worm('M40 80H60', 3, MOUTH),
      teeth: `${lump('M36 74H64Q62 86 50 86Q38 86 36 74Z', MOUTH, 1.6)}<rect x="44" y="74" width="5" height="6" rx="1.4" fill="${WHITE}"/><rect x="51" y="74" width="5" height="6" rx="1.4" fill="${WHITE}"/>`,
      tongue: `${groove('M38 76Q50 84 62 76', 3)}${lump('M46 80Q45 90 51 90Q57 90 56 80Z', TONGUE, 1.4)}`,
    },
    // hair, drawn for a head whose top is at y=12 (shifted for the others), all rolled or squashed clay
    hair: {
      none: '',
      swirl: worm('M50 14Q50 0 60 2Q68 6 62 12Q56 14 56 8', 5, 'var(--hair)'),
      quiff: lump('M20 40Q14 12 40 6Q56 -6 72 4Q86 14 80 40Q74 24 56 26Q50 14 36 22Q26 26 20 40Z', 'var(--hair)'),
      spikes: [[30, 18, -24], [42, 12, -10], [56, 12, 8], [68, 18, 22]].map(([x, y, a]) => `<g transform="rotate(${a} ${x} ${y + 8})">${lump(`M${x - 6} ${y + 10}L${x} ${y - 12}L${x + 6} ${y + 10}Z`, 'var(--hair)', 1.6)}</g>`).join(''),
      mop: lump('M12 50Q4 30 18 18Q30 2 50 6Q72 2 84 18Q96 32 88 50Q82 40 76 46Q70 30 60 36Q50 26 40 36Q30 30 24 46Q18 40 12 50Z', 'var(--hair)'),
      worms: [[26, 26, 'M22 32Q24 18 32 16'], [40, 16, 'M36 24Q40 8 48 10'], [56, 14, 'M54 22Q58 6 66 10'], [72, 22, 'M70 30Q76 16 82 20']].map(([, , d]) => worm(d, 5, 'var(--hair)')).join(''),
    },
    // marks pressed into the clay, or stuck onto it
    extra: {
      none: '',
      cheeks: mirror(s => side(s, `<ellipse cx="26" cy="64" rx="6" ry="4" fill="#e86a7a" opacity=".45"/>`)),
      freckles: mirror(s => side(s, `<g fill="var(--skin-dark)"><circle cx="27" cy="60" r="1.5"/><circle cx="32" cy="63" r="1.5"/><circle cx="27" cy="66" r="1.5"/></g>`)),
      print: `<g fill="none" stroke="rgba(40,20,20,.16)" stroke-width="1.1">${[4, 7, 10, 13].map(r => `<path d="M${68 - r} 30A${r} ${r * .8} 0 0 1 ${68 + r} 30"/>`).join('')}</g>`,
      stubble: `<g fill="var(--skin-dark)">${[[36, 84], [42, 88], [50, 89], [58, 88], [64, 84], [39, 90], [46, 92], [54, 92], [61, 90]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1"/>`).join('')}</g>`,
      plaster: `<g transform="rotate(-25 70 66)"><rect x="62" y="62" width="16" height="7" rx="2" fill="#f0d0a0" stroke="${EDGE}" stroke-width="1.2"/><circle cx="68" cy="65.5" r=".7" fill="${EDGE}"/><circle cx="72" cy="65.5" r=".7" fill="${EDGE}"/></g>`,
    },
  };

  // ---- hats: clay too; the brim line at y=0 and the crown going up. hatFor() puts one on a head ---------------------------------------------------------
  const HAT = {
    none: '',
    pith: `${lump('M-22 0Q-22 -26 0 -28Q22 -26 22 0Z', '#d8c08a')}${worm('M-30 2H30', 6, '#b89a60')}`,
    sailor: `${lump('M-21 0Q-23 -18 0 -20Q23 -18 21 0Z', WHITE)}${worm('M-23 -1Q0 5 23 -1', 5, '#3a5aa0')}`,
    hard: `${lump('M-23 0Q-23 -25 0 -25Q23 -25 23 0Z', '#f2b62a')}${worm('M0 -22V-6', 5, '#d0961a')}${worm('M-29 2H29', 5, '#e0a420')}`,
    beanie: `${lump('M-22 3Q-25 -22 0 -24Q25 -22 22 3Z', '#4aa040')}${worm('M-22 0H22', 6, '#2a7a2a')}${ball(0, -27, 5, '#f0c030')}`,
    bowler: `${lump('M-15 0V-29Q-15 -33 -11 -33H11Q15 -33 15 -29V0Z', '#2a2224')}${worm('M-14 -7H14', 3.6, SHIRT)}${worm('M-25 2H25', 5, '#2a2224')}`,
    party: `${lump('M-14 2L0 -38L14 2Z', '#b088d0')}<circle cx="-3" cy="-10" r="2.2" fill="#f0c030"/><circle cx="4" cy="-20" r="2.2" fill="#78a8e0"/>${ball(0, -40, 4.6, '#f0c030')}`,
    chef: lump('M-16 2V-8Q-28 -9 -23 -22Q-18 -34 0 -30Q18 -34 23 -22Q28 -9 16 -8V2Z', WHITE),
    wizard: `${lump('M-24 4L4 -42L24 4Z', '#3a5aa0')}${worm('M-31 4H31', 6, '#2a4080')}${ball(4, -18, 3, '#f0c030', 1)}${ball(-6, -6, 2, '#f0c030', 1)}`,
  };
  const hatFor = (name, head = 'blob') => HAT[name] ? `<g transform="translate(50 ${headOf(head).top + 9}) rotate(-6) scale(.95)" ${LUMPY}>${HAT[name]}</g>` : '';
  PARTS.hat = HAT;

  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra'];
  const names = (k) => Object.keys(PARTS[k]);
  const DEFAULT = { head: 'blob', ears: 'round', eyes: 'googly', brows: 'sausage', nose: 'ball', mouth: 'grin', hair: 'swirl', extra: 'print', hat: 'none', skin: 'peach', hairColor: 'brown', scale: 1 };

  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec }, h = headOf(s.head), [skin, skinDark] = SKIN[s.skin] || SKIN.peach;
    const pick = (k) => PARTS[k][s[k]] ?? '', ears = pick('ears'), hair = pick('hair');
    return {
      style: `--skin:${skin};--skin-dark:${skinDark};--hair:${HAIR[s.hairColor] || HAIR.brown};--accent:${HAIR[s.hairColor] || HAIR.brown}`,
      ears: ears ? `<g ${LUMPY}>${mirror(sd => side(sd, `<g transform="translate(${h.left - 20} 0)">${ears}</g>`))}</g>` : '',
      head: `${DEFS}<g ${LUMPY}>${lump(h.d, 'var(--skin)', 2.4)}</g>`,
      extra: pick('extra'),
      hair: hair ? `<g transform="translate(0 ${h.top - 12})" ${LUMPY}>${hair}</g>` : '',
      eyes: pick('eyes'), brows: pick('brows'), nose: pick('nose'), mouth: pick('mouth'), hat: hatFor(s.hat, s.head), scale: s.scale || 1,
    };
  }

  function compose(spec = {}, { size = 120, title = '' } = {}) {
    const p = pieces(spec), px = Math.round(size * (p.scale || 1));
    return `<svg class="face" viewBox="-14 -32 128 128" width="${px}" height="${px}" role="img" aria-label="${title || 'face'}" style="${p.style}">${p.ears}${p.head}${p.extra}${p.hair}${p.eyes}${p.brows}${p.nose}${p.mouth}${p.hat}</svg>`;
  }

  const headSpan = (head) => [headOf(head).top, headOf(head).bottom];

  // the expressions the card swaps in over the spec's own eyes, brows and mouth: eyes at x 36 and 64, y 48; the mouth at y 74 to 90.
  // Pressed in as grooves, or rolled as little worms of clay, like the rest
  function mood(ink = PUPIL) {
    const st = `fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round"`;
    return `<g class="eye-closed" ${st} stroke-width="3.6"><path d="M28 49Q36 55 44 49M56 49Q64 55 72 49"/></g>
      <g class="eye-happy" ${st} stroke-width="3.6"><path d="M28 53Q36 43 44 53M56 53Q64 43 72 53"/></g>
      <g class="eye-sleepy" ${st} stroke-width="3.6"><path d="M28 49H44M56 49H72"/></g>
      <g class="eye-x" ${st} stroke-width="3.6"><path d="M30 42L42 54M42 42L30 54M58 42L70 54M70 42L58 54"/></g>
      <g class="dizzy-eyes"><circle cx="36" cy="48" r="9.4" fill="${WHITE}" stroke="${EDGE}" stroke-width="1.6"/><circle cx="64" cy="48" r="9.4" fill="${WHITE}" stroke="${EDGE}" stroke-width="1.6"/>
        <g ${st} stroke-width="2.2"><path d="M41 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(-5 -18)"/><path d="M59 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(5 -18)"/></g></g>
      <g class="worry-eyes"><circle cx="36" cy="48" r="9.4" fill="${WHITE}" stroke="${EDGE}" stroke-width="1.6"/><circle cx="64" cy="48" r="9.4" fill="${WHITE}" stroke="${EDGE}" stroke-width="1.6"/>
        <circle class="pupil" cx="37" cy="46" r="4" fill="${ink}"/><circle class="pupil" cx="63" cy="46" r="4" fill="${ink}"/></g>
      <path class="worry-brows" d="M26 40Q35 32 46 37M74 40Q65 32 54 37" ${st} stroke-width="4.4"/>
      <path class="brows" d="M27 34L46 41M73 34L54 41" ${st} stroke-width="5"/>
      <g class="yawn"><ellipse cx="50" cy="81" rx="8" ry="9.6" fill="${MOUTH}" stroke="${EDGE}" stroke-width="1.6"/><ellipse cx="50" cy="86" rx="4.6" ry="2.8" fill="${TONGUE}"/></g>
      <path class="worry-mouth" d="M38 84Q44 76 50 82T62 80" ${st} stroke-width="3.4"/>`;
  }

  // a squashed lump of a torso, fat sausage limbs with ball hands and lumpy shoes.
  // Same joints and class names as any style (see BODY_CLASSES in ../faces.js), so the page's animation moves these too.
  function body(head) {
    const [top, bot] = headSpan(head), B = (bot - top) / 2;
    const neck = bot - 3, hip = bot + B * .42, shoulder = bot + B * .2, foot = bot + B;
    const lx = B * .2, ly = foot - hip, ax = B * .48, ay = B * .3;
    const f = n => +n.toFixed(2);
    const tube = (x, y, w, c) => `<path d="M0 0l${f(x)} ${f(y)}" stroke="${EDGE}" stroke-width="${w + 2}"/><path d="M0 0l${f(x)} ${f(y)}" stroke="${c}" stroke-width="${w}"/><path d="M${-w / 5} ${-w / 5}l${f(x)} ${f(y)}" stroke="#fff" stroke-opacity=".28" stroke-width="${w / 3}"/>`;
    const tip = (kind, side) => kind === 'foot'
      ? `<path d="M${side === 'l' ? -11 : -4} 4Q${side === 'l' ? -11 : -4} -4 0 -3Q${side === 'l' ? 4 : 11} -4 ${side === 'l' ? 4 : 11} 4Z" fill="#5a3a2a" stroke="${EDGE}" stroke-width="1.6"/>`
      : `<circle r="5.4" fill="var(--skin)" stroke="${EDGE}" stroke-width="1.6"/><circle r="5.4" fill="url(#clay-shade)"/>`;
    const limb = (b, sub, side, x, y, kind, w, c) => `<g class="${b} side-${side}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})">${tip(kind, side)}</g></g></g></g>`;
    const at = (x, y, inner) => `<g transform="translate(${f(x)} ${f(y)})">${inner}</g>`;
    const torso = `M38 ${f(neck)}Q50 ${f(neck - 3)} 62 ${f(neck)}Q70 ${f(hip - 4)} 64 ${f(hip + 6)}Q50 ${f(hip + 10)} 36 ${f(hip + 6)}Q30 ${f(hip - 4)} 38 ${f(neck)}Z`;
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" stroke-linecap="round" stroke-linejoin="round" fill="none">`
        + `<g class="lower" ${LUMPY}>${at(44, hip, limb('thigh', 'shin', 'l', -lx, ly, 'foot', 8, PANTS))}${at(56, hip, limb('thigh', 'shin', 'r', lx, ly, 'foot', 8, PANTS))}</g>`
        + `<g class="upper"><g class="torso" ${LUMPY}>${lump(torso, SHIRT, 2)}<circle cx="50" cy="${f(neck + 8)}" r="1.8" fill="${EDGE}"/><circle cx="50" cy="${f(neck + 15)}" r="1.8" fill="${EDGE}"/></g>`
        + `${at(38, shoulder, limb('arm', 'fore', 'l', -ax, ay, 'hand', 7, SHIRT))}${at(62, shoulder, limb('arm', 'fore', 'r', ax, ay, 'hand', 7, SHIRT))}`,
      close: '</g></g>' };
  }

  // a lumpy yellow clay crown with a ball of clay for the gem (which twinkles)
  const crown = (head) => `<g class="crown" transform="translate(50 ${headOf(head).top - 6}) rotate(-6)" ${LUMPY}>
      ${lump('M-16 10L-17 -8L-8 -1L0 -13L8 -1L17 -8L16 10Z', '#f0c030', 1.8)}
      <circle class="gem" cx="0" cy="3.6" r="3.4" fill="var(--bean)" stroke="${EDGE}" stroke-width="1.2"/>
    </g>`;

  function random(seed = Math.random() * 1e9) {
    const r = rng(seed | 0), pick = (list) => list[Math.floor(r() * list.length)];
    return { ...Object.fromEntries(ORDER.map(k => [k, pick(names(k))])), hat: 'none', skin: pick(Object.keys(SKIN)), hairColor: pick(Object.keys(HAIR)), scale: 1 };
  }

  // a relative keeps the head and ears and is made from a nearby colour of clay; the eyes, the mouth and the hair are passed down or its own
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
    swatches: [{ key: 'skin', label: 'clay', colors: colors(SKIN, 0) }, { key: 'hairColor', label: 'hair', colors: colors(HAIR, null) }],
  });

  return { name: 'clay', label: 'Claymation', emoji: '🫠', description: 'Lumpy plasticine puppets with googly eyes, toothy grins and sausage limbs.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT };
})());
