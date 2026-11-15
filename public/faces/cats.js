// The "cats" face style: round-headed cats with pointed ears, slit or round eyes, a little pink nose, a "w" mouth and whiskers; tabby, siamese, tuxedo and calico fur.
// Bold dark outline, flat colour. Every part is an SVG fragment on a 100x100 head canvas (eyes at y 54, the nose at 62 to 67, the mouth at 67 to 78), so any part fits any head.
// A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat, skin, hairColor, scale }: `skin` is the fur and `hairColor` the accent: eye colour, bows and flowers.
// The body has a tail (class tail), which the page's CSS swishes. The contract a style has to meet is described at the top of ../faces.js.
Faces.register((() => {
  const { kin, rng } = Faces;
  const INK = '#2b1b24', PINK = '#ff8fa8';
  const L = `stroke="${INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"`;
  const line = (w = 3, c = INK) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const A = 'var(--accent)';
  const mirror = (f) => f(1) + f(-1);
  const side = (s, body) => `<g transform="translate(${s < 0 ? 100 : 0} 0) scale(${s} 1)">${body}</g>`;

  const SKIN = {
    orange: ['#f4a24e', '#d98128'], grey: ['#a9b2bd', '#7d8795'], charcoal: ['#7a7585', '#585363'],
    white: ['#fbf6ee', '#ddd2c4'], cream: ['#f3dcae', '#d9b87c'], brown: ['#b07a50', '#8c5a36'],
  };
  const ACCENT = { green: '#6fd06a', amber: '#f2b632', blue: '#5aa9f0', copper: '#e08a4e', violet: '#a47af0', pink: '#ff7ab0' };

  // ---- heads: the outline, how far it reaches (the hat and body hang from them) and where the left ear attaches (it is mirrored) ----------------------
  const HEADS = {
    round:  { d: 'M50 22C76 22 90 38 90 58C90 78 72 90 50 90C28 90 10 78 10 58C10 38 24 22 50 22Z', top: 22, bottom: 90, ear: [26, 34] },
    fluffy: { d: 'M50 22C66 22 80 30 86 42L96 50L88 56L94 68L82 72C76 84 64 90 50 90C36 90 24 84 18 72L6 68L12 56L4 50L14 42C20 30 34 22 50 22Z', top: 22, bottom: 90, ear: [26, 34] },
    long:   { d: 'M50 14C70 14 82 30 82 52C82 76 68 90 50 90C32 90 18 76 18 52C18 30 30 14 50 14Z', top: 14, bottom: 90, ear: [28, 26] },
    flat:   { d: 'M50 28C78 28 92 42 92 60C92 78 74 88 50 88C26 88 8 78 8 60C8 42 22 28 50 28Z', top: 28, bottom: 88, ear: [22, 40] },
    chunky: { d: 'M24 24H76Q88 24 88 36V74Q88 90 72 90H28Q12 90 12 74V36Q12 24 24 24Z', top: 24, bottom: 90, ear: [24, 34] },
  };
  const headOf = (name) => HEADS[name] || HEADS.round;

  const PARTS = {
    head: Object.fromEntries(Object.keys(HEADS).map(k => [k, HEADS[k].d])),
    // ears, drawn behind the head for an ear that attaches at (26,34) and shifted for the others
    ears: {
      none: '',
      pointy: `<path d="M16 44L18 10L52 32Z" fill="var(--skin)" ${L}/><path d="M22 36L23 19L40 31Z" fill="${PINK}" opacity=".8"/>`,
      tall: `<path d="M16 44L12 0L54 30Z" fill="var(--skin)" ${L}/><path d="M22 36L19 13L42 30Z" fill="${PINK}" opacity=".8"/>`,
      fold: `<path d="M14 44Q12 14 28 11Q38 14 52 30Z" fill="var(--skin)" ${L}/><path d="M20 38Q20 22 28 20Q34 22 42 31Z" fill="${PINK}" opacity=".8"/>`,
      round: `<path d="M14 44Q10 16 32 12Q46 16 52 32Z" fill="var(--skin)" ${L}/><path d="M21 38Q20 24 31 22Q38 25 44 32Z" fill="${PINK}" opacity=".8"/>`,
      tufted: `<path d="M16 44L18 12L52 32Z" fill="var(--skin)" ${L}/><path d="M18 12L16 2M18 12L23 3" ${line(2.6)}/><path d="M22 36L23 19L40 31Z" fill="${PINK}" opacity=".8"/>`,
    },
    eyes: {
      slit: mirror(s => side(s, `<ellipse cx="34" cy="54" rx="7.6" ry="9" fill="${A}" ${L} stroke-width="2.6"/><ellipse cx="34" cy="54" rx="1.8" ry="7" fill="${INK}"/><circle cx="36.6" cy="50" r="1.5" fill="#fff"/>`)),
      round: mirror(s => side(s, `<circle cx="34" cy="54" r="8.6" fill="${A}" ${L} stroke-width="2.6"/><circle cx="34" cy="54" r="5" fill="${INK}"/><circle cx="36.4" cy="51.4" r="2" fill="#fff"/>`)),
      dots: mirror(s => side(s, `<ellipse cx="35" cy="54" rx="3.6" ry="4.8" fill="${INK}"/><circle cx="36.2" cy="52.2" r="1.2" fill="#fff"/>`)),
      almond: mirror(s => side(s, `<path d="M25 56Q34 44 43 54Q34 63 25 56Z" fill="${A}" ${L} stroke-width="2.6"/><ellipse cx="34.4" cy="54" rx="1.8" ry="4.4" fill="${INK}"/>`)),
      sleepy: mirror(s => side(s, `<path d="M26 54Q34 60 42 54" ${line(3.2)}/>`)),
      sparkle: mirror(s => side(s, `<ellipse cx="34" cy="54" rx="7.4" ry="8.6" fill="${INK}"/><circle cx="36.6" cy="50.6" r="2.8" fill="#fff"/><circle cx="31.6" cy="57.6" r="1.4" fill="#fff"/>`)),
    },
    brows: {
      none: '',
      dots: mirror(s => side(s, `<circle cx="30" cy="41" r="1.8" fill="${INK}"/><circle cx="36" cy="39" r="1.8" fill="${INK}"/>`)),
      arc: mirror(s => side(s, `<path d="M26 43Q34 37 43 43" ${line(2.8)}/>`)),
      angry: mirror(s => side(s, `<path d="M26 40L43 47" ${line(4)}/>`)),
      worried: mirror(s => side(s, `<path d="M26 47L43 40" ${line(4)}/>`)),
    },
    nose: {
      none: '',
      triangle: `<path d="M45.6 62H54.4L50 67.4Z" fill="${PINK}" ${L} stroke-width="2.2"/>`,
      heart: `<path d="M50 68C42 62 44.6 58 47.6 58.6C49 59 50 60 50 61C50 60 51 59 52.4 58.6C55.4 58 58 62 50 68Z" fill="${PINK}" ${L} stroke-width="2"/>`,
      dot: `<ellipse cx="50" cy="63" rx="3.6" ry="2.6" fill="${INK}"/>`,
      button: `<circle cx="50" cy="63" r="4.6" fill="${PINK}" ${L} stroke-width="2.2"/>`,
    },
    mouth: {
      w: `<path d="M50 67V70M50 70Q45 76 40 71M50 70Q55 76 60 71" ${line(2.8)}/>`,
      smile: `<path d="M50 67V70M50 70Q44 79 37 72M50 70Q56 79 63 72" ${line(2.8)}/>`,
      open: `<path d="M41 70Q50 68 59 70Q58 84 50 84Q42 84 41 70Z" fill="#4a1d2c" ${L} stroke-width="2.6"/><ellipse cx="50" cy="80" rx="5" ry="3" fill="${PINK}"/>`,
      blep: `<path d="M50 67V70M50 70Q45 75 40 71M50 70Q55 75 60 71" ${line(2.8)}/><path d="M47 73.6Q47 82 51 82Q55 82 54.6 73.6Z" fill="${PINK}" ${L} stroke-width="2"/>`,
      flat: `<path d="M50 67V70M44 72H56" ${line(2.8)}/>`,
      oh: `<path d="M50 67V69" ${line(2.8)}/><ellipse cx="50" cy="75" rx="3.4" ry="4.6" fill="#4a1d2c" ${L} stroke-width="2.2"/>`,
      fang: `<path d="M50 67V70M50 70Q45 76 40 71M50 70Q55 76 60 71" ${line(2.8)}/><path d="M52.6 73.6L54 79L56.6 72.8Z" fill="#fff" ${L} stroke-width="1.8"/>`,
    },
    // what sits on top, drawn for a head whose top is at y=22 (shifted for the others)
    hair: {
      none: '',
      tuft: `<path d="M40 26Q36 10 48 4Q48 16 56 26Z" fill="var(--skin)" ${L} stroke-width="2.6"/><path d="M52 27Q56 14 66 12Q64 22 62 29Z" fill="var(--skin)" ${L} stroke-width="2.6"/>`,
      bow: `<g transform="translate(18 4)"><path d="M50 13L32 3V23Z" fill="${A}" ${L} stroke-width="2.6"/><path d="M50 13L68 3V23Z" fill="${A}" ${L} stroke-width="2.6"/><circle cx="50" cy="13" r="4.6" fill="${A}" ${L} stroke-width="2.6"/></g>`,
      flower: `<g transform="translate(26 8)"><g fill="${A}" ${L} stroke-width="2.2">${[0, 72, 144, 216, 288].map(a => `<circle cx="${(50 + 7 * Math.sin(a * Math.PI / 180)).toFixed(1)}" cy="${(8 - 7 * Math.cos(a * Math.PI / 180)).toFixed(1)}" r="4.8"/>`).join('')}</g><circle cx="50" cy="8" r="3.8" fill="#ffd23f" ${L} stroke-width="2"/></g>`,
      fluff: `<path d="M38 28Q35 14 46 17Q50 6 58 15Q69 13 64 28Z" fill="var(--skin)" ${L} stroke-width="2.6"/>`,
      star: `<path d="M64 14l3.2 6.6 7.2 1-5.2 5 1.2 7.2L64 30.4 57.6 34l1.2-7.2-5.2-5 7.2-1Z" fill="#ffd23f" ${L} stroke-width="2.4"/>`,
    },
    // fur patterns and marks, clipped to the head
    extra: {
      none: '',
      stripes: 'stripes', mask: 'mask', patch: 'patch', spots: 'spots',
      blush: mirror(s => side(s, `<ellipse cx="24" cy="66" rx="7" ry="4.4" fill="#ff7ab0" opacity=".45"/>`)),
    },
  };

  // ---- hats: small and cheerful, the brim line at y=0 and the crown going up; they sit between the ears -------------------------------------------------
  const HAT = {
    none: '',
    pith: `<path d="M-22 0Q-22 -26 0 -28Q22 -26 22 0Z" fill="#e5cf94" ${L}/><path d="M-22 -5H22" ${line(2.4)}/><path d="M-33 3Q0 -5 33 3Q28 9 0 9Q-28 9 -33 3Z" fill="#cdb078" ${L}/>`,
    sailor: `<path d="M-21 0Q-23 -19 0 -21Q23 -19 21 0Z" fill="#fff" ${L}/><path d="M-26 1Q0 8 26 1L22 -6Q0 0 -22 -6Z" fill="#3f63b8" ${L}/>`,
    hard: `<path d="M-24 0Q-24 -26 0 -26Q24 -26 24 0Z" fill="#ffd23f" ${L}/><path d="M-5 -26V-9H5V-26" fill="#e0a91a" ${L} stroke-width="2.4"/><path d="M-32 0H32V6H-32Z" fill="#ffd23f" ${L}/>`,
    beanie: `<path d="M-23 3Q-26 -23 0 -25Q26 -23 23 3Z" fill="#e8453c" ${L}/><path d="M-24 -4H24V4H-24Z" fill="#ff7a70" ${L} stroke-width="2.4"/><circle cy="-29" r="5" fill="#fff0d2" ${L} stroke-width="2.4"/>`,
    bowler: `<path d="M-19 0Q-21 -22 0 -24Q21 -22 19 0Z" fill="#46405a" ${L}/><path d="M-19.5 -6H19.5" ${line(3, '#ff5a5a')}/><path d="M-30 1Q0 9 30 1Q27 8 0 9Q-27 8 -30 1Z" fill="#46405a" ${L}/>`,
    party: `<path d="M-14 2L0 -36L14 2Z" fill="#ff7ab8" ${L}/><path d="M-8 -12H8M-5 -24H5" ${line(2.6, '#fff')}/><circle cy="-38" r="4.2" fill="#ffe14d" ${L} stroke-width="2.4"/>`,
    chef: `<path d="M-16 2V-8Q-28 -9 -24 -21Q-19 -33 0 -30Q19 -33 24 -21Q28 -9 16 -8V2Z" fill="#fff" ${L}/><path d="M-16 -4H16" ${line(2)}/>`,
    wizard: `<path d="M-25 5L3 -42L25 5Z" fill="#5b4bb5" ${L}/><ellipse cy="5" rx="34" ry="7" fill="#5b4bb5" ${L}/><path d="M-4 -18l1.6 3.6 3.8.4-2.9 2.6.8 3.8-3.3-2-3.3 2 .8-3.8-2.9-2.6 3.8-.4Z" fill="#ffe14d" stroke="none"/>`,
  };
  const hatFor = (name, head = 'round') => HAT[name] ? `<g transform="translate(50 ${headOf(head).top + 9}) rotate(4) scale(.85)">${HAT[name]}</g>` : '';
  PARTS.hat = HAT;

  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra'];
  const names = (k) => Object.keys(PARTS[k]);
  const DEFAULT = { head: 'round', ears: 'pointy', eyes: 'slit', brows: 'none', nose: 'triangle', mouth: 'w', hair: 'none', extra: 'none', hat: 'none', skin: 'orange', hairColor: 'green', scale: 1 };
  // three whiskers a side, always there (drawn with the nose, so a cat without a nose still has them)
  const WHISKERS = mirror(s => side(s, `<g ${line(1.8)}><path d="M28 64L6 58M28 68L4 68M28 72L8 78"/></g>`));
  let uid = 0;

  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec }, h = headOf(s.head), [skin, skinDark] = SKIN[s.skin] || SKIN.orange;
    const id = `ca${++uid}`, pick = (k) => PARTS[k][s[k]] ?? '';
    const clipped = (inner) => `<clipPath id="${id}"><path d="${h.d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
    const extra = s.extra === 'stripes' ? clipped(`<g ${line(4.4, 'var(--skin-dark)')} opacity=".9"><path d="M50 14V34M39 16L42 34M61 16L58 34"/><path d="M4 50L22 54M4 60L22 62M96 50L78 54M96 60L78 62"/></g>`)
      : s.extra === 'mask' ? clipped(`<ellipse cx="50" cy="66" rx="27" ry="23" fill="var(--skin-dark)" opacity=".6"/>`)
      : s.extra === 'patch' ? clipped(`<path d="M32 68Q50 58 68 68Q68 94 50 94Q32 94 32 68Z" fill="#fff"/>`)
      : s.extra === 'spots' ? clipped(`<circle cx="26" cy="36" r="13" fill="var(--skin-dark)"/><circle cx="76" cy="34" r="10" fill="#4a3b3b" opacity=".85"/><circle cx="72" cy="76" r="7" fill="var(--skin-dark)"/>`)
      : pick('extra');
    const ears = pick('ears'), hair = pick('hair');
    return {
      style: `--skin:${skin};--skin-dark:${skinDark};--accent:${ACCENT[s.hairColor] || ACCENT.green};--hair:${ACCENT[s.hairColor] || ACCENT.green}`,
      ears: ears ? mirror(sd => side(sd, `<g transform="translate(${h.ear[0] - 26} ${h.ear[1] - 34})">${ears}</g>`)) : '',
      head: `<path d="${h.d}" fill="var(--skin)" ${L} stroke-width="3.4"/>`,
      extra,
      hair: hair ? `<g transform="translate(0 ${h.top - 22})">${hair}</g>` : '',
      eyes: pick('eyes'), brows: pick('brows'), nose: WHISKERS + pick('nose'), mouth: pick('mouth'), hat: hatFor(s.hat, s.head), scale: s.scale || 1,
    };
  }

  function compose(spec = {}, { size = 120, title = '' } = {}) {
    const p = pieces(spec), px = Math.round(size * (p.scale || 1));
    return `<svg class="face" viewBox="-12 -26 124 124" width="${px}" height="${px}" role="img" aria-label="${title || 'face'}" style="${p.style}">${p.ears}${p.head}${p.extra}${p.hair}${p.eyes}${p.brows}${p.nose}${p.mouth}${p.hat}</svg>`;
  }

  const headSpan = (head) => [headOf(head).top, headOf(head).bottom];

  // the expressions the card swaps in over the spec's own eyes, brows and mouth: eyes at x 34 and 66, y 54; the mouth at y 67 to 78
  function mood(ink = INK) {
    const st = `fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round"`;
    return `<g class="eye-closed" ${st} stroke-width="3.4"><path d="M26 53Q34 60 42 53M58 53Q66 60 74 53"/></g>
      <g class="eye-happy" ${st} stroke-width="3.4"><path d="M26 58Q34 46 42 58M58 58Q66 46 74 58"/></g>
      <g class="eye-sleepy" ${st} stroke-width="3.4"><path d="M26 54H42M58 54H74"/><path d="M28 54Q34 60 40 54M60 54Q66 60 72 54" stroke-width="1.8"/></g>
      <g class="eye-x" ${st} stroke-width="3.4"><path d="M28 47L40 59M40 47L28 59M60 47L72 59M72 47L60 59"/></g>
      <g class="dizzy-eyes" ${st} stroke-width="2.2"><circle cx="34" cy="54" r="9.4" fill="#fff"/><circle cx="66" cy="54" r="9.4" fill="#fff"/>
        <path d="M41 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(-7 -12)"/><path d="M59 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(7 -12)"/></g>
      <g class="worry-eyes"><circle cx="34" cy="54" r="9.4" fill="#fff" stroke="${ink}" stroke-width="2.6"/><circle cx="66" cy="54" r="9.4" fill="#fff" stroke="${ink}" stroke-width="2.6"/>
        <circle class="pupil" cx="35" cy="52" r="3.4" fill="${ink}"/><circle class="pupil" cx="65" cy="52" r="3.4" fill="${ink}"/></g>
      <path class="worry-brows" d="M24 44Q32 36 43 41M76 44Q68 36 57 41" ${st} stroke-width="3.4"/>
      <path class="brows" d="M25 40L43 47M75 40L57 47" ${st} stroke-width="4"/>
      <ellipse class="yawn" cx="50" cy="74" rx="6" ry="8" fill="${ink}"/>
      <path class="worry-mouth" d="M41 76Q45.5 70 50 76T59 76" ${st} stroke-width="3"/>`;
  }

  // a plump cat body: a round belly, stubby legs and arms (tubes with round paws) and a tail that curls up behind (class tail: the page's CSS swishes it).
  // Same joints and class names as any style (see BODY_CLASSES in ../faces.js), so the page's animation moves these too.
  function body(head) {
    const [top, bot] = headSpan(head), B = (bot - top) / 2;
    const neck = bot - 3, hip = bot + B * .4, shoulder = bot + B * .2, foot = bot + B;
    const lx = B * .22, ly = foot - hip, ax = B * .5, ay = B * .28;
    const f = n => +n.toFixed(2);
    const tube = (x, y, w) => `<path d="M0 0l${f(x)} ${f(y)}" stroke="${INK}" stroke-width="${w + 4.6}"/><path d="M0 0l${f(x)} ${f(y)}" stroke="var(--skin)" stroke-width="${w}"/>`;
    const tip = (kind, side) => kind === 'foot' ? `<ellipse cx="${side === 'l' ? -2 : 2}" cy="1.5" rx="7.6" ry="4.2" fill="var(--skin)" stroke-width="2.8"/>` : `<circle r="4.8" fill="var(--skin)" stroke-width="2.8"/>`;
    const limb = (b, sub, side, x, y, kind, w) => `<g class="${b} side-${side}">${tube(x / 2, y / 2, w)}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}">${tube(x / 2, y / 2, w)}<g transform="translate(${f(x / 2)} ${f(y / 2)})">${tip(kind, side)}</g></g></g></g>`;
    const at = (x, y, inner) => `<g transform="translate(${f(x)} ${f(y)})">${inner}</g>`;
    const cy = (neck + hip) / 2 + 2;
    const tail = `<g class="tail"><path d="M0 0Q24 6 24 -14Q24 -30 12 -36" stroke="${INK}" stroke-width="10.4"/><path d="M0 0Q24 6 24 -14Q24 -30 12 -36" stroke="var(--skin)" stroke-width="5.8"/><path d="M24 -14Q24 -30 12 -36" stroke="var(--skin-dark)" stroke-width="5.8"/></g>`;
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">`
        + `<g class="lower">${at(56, hip - 2, tail)}${at(43, hip, limb('thigh', 'shin', 'l', -lx, ly, 'foot', 6.8))}${at(57, hip, limb('thigh', 'shin', 'r', lx, ly, 'foot', 6.8))}</g>`
        + `<g class="upper"><ellipse class="torso" cx="50" cy="${f(cy)}" rx="16.4" ry="${f((hip - neck) / 2 + 8)}" fill="var(--skin)" stroke-width="3.2"/><ellipse cx="50" cy="${f(cy + 2)}" rx="8.4" ry="${f((hip - neck) / 2 + 2)}" fill="#fff" opacity=".4" stroke="none"/>`
        + `${at(37, shoulder, limb('arm', 'fore', 'l', -ax, ay, 'hand', 5.6))}${at(63, shoulder, limb('arm', 'fore', 'r', ax, ay, 'hand', 5.6))}`,
      close: '</g></g>' };
  }

  // a small gold crown with a gem (which twinkles), tilted between the ears
  const crown = (head) => `<g class="crown" transform="translate(50 ${headOf(head).top - 4}) rotate(-5) scale(.9)">
      <path d="M-15 10L-16 -6L-8 0L0 -11L8 0L16 -6L15 10Z" fill="#ffd23f" ${L} stroke-width="2.8"/>
      <circle class="gem" cx="0" cy="3.6" r="2.8" fill="var(--bean)"/>
    </g>`;

  function random(seed = Math.random() * 1e9) {
    const r = rng(seed | 0), pick = (list) => list[Math.floor(r() * list.length)];
    return { ...Object.fromEntries(ORDER.map(k => [k, pick(names(k))])), hat: 'none', skin: pick(Object.keys(SKIN)), hairColor: pick(Object.keys(ACCENT)), scale: 1 };
  }

  // a relative keeps the head and ears and the same fur or the next one over; the eyes, the mouth and the markings are passed down or its own
  function derive(main, seed = 0) {
    return kin({ ...DEFAULT, ...main }, seed, {
      keep: { eyes: .5, mouth: .45, nose: .6, brows: .4, hair: .35, hairColor: .5, extra: .4 },
      pool: (k) => k === 'hairColor' ? Object.keys(ACCENT) : names(k),
      tone: { key: 'skin', list: Object.keys(SKIN) },
    });
  }

  const colors = (table, i) => Object.fromEntries(Object.entries(table).map(([n, v]) => [n, i === null ? v : v[i]]));
  const editor = () => ({
    slots: [...ORDER, 'hat'].map(k => ({ key: k, options: names(k), fixed: false })),
    swatches: [{ key: 'skin', label: 'fur', colors: colors(SKIN, 0) }, { key: 'hairColor', label: 'eyes and accents', colors: colors(ACCENT, null) }],
  });

  return { name: 'cats', label: 'Cats', emoji: '🐱', description: 'Round-headed cats with pointed ears, whiskers and a tail that swishes.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT };
})());
