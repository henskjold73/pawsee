// The "ghosts" face style: friendly bedsheet ghosts with dark eye holes and a round "boo" mouth. The head runs straight into a bell-shaped sheet with a wavy hem;
// there are no legs to speak of, only little sleeves. A SECRET style: it stays out of the style menu until it is unlocked (see `secret` below and Faces.unlock in ../faces.js).
// Every part is an SVG fragment on a 100x100 head canvas (eyes at y 48, the mouth at 64 to 82), so any part fits any head.
// A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat, skin, hairColor, scale }: `skin` is the colour of the sheet and `hairColor` the glow: halos, bows, glowing eyes.
// The contract a style has to meet is described at the top of ../faces.js.
Faces.register((() => {
  const { kin, rng } = Faces;
  const INK = '#2b2540', GOLD = '#d9a400';
  const L = `stroke="${INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"`;
  const line = (w = 3, c = INK) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const A = 'var(--accent)';
  const mirror = (f) => f(1) + f(-1);
  const side = (s, body) => `<g transform="translate(${s < 0 ? 100 : 0} 0) scale(${s} 1)">${body}</g>`;

  const SKIN = {
    white: ['#fbfbff', '#d4d8ea'], mint: ['#e6fff3', '#b4e6cd'], pink: ['#ffe9f4', '#ecbad3'],
    blue: ['#e4efff', '#b2c7ee'], lilac: ['#efe6ff', '#c6b4ee'], lemon: ['#fff9dc', '#e8dca0'],
  };
  const ACCENT = { cyan: '#6fe3ff', pink: '#ff8ad0', lime: '#a6f06a', amber: '#ffc24d', violet: '#b08cff', red: '#ff6a6a' };

  // ---- heads: a sheet with straight sides. d: the outline to fill; o: the outline to stroke (open at the bottom, where the sheet carries on); left: the side x at y=86 ----
  const HEADS = {
    dome:   { d: 'M16 56C16 30 30 12 50 12C70 12 84 30 84 56V86H16Z', o: 'M16 86V56C16 30 30 12 50 12C70 12 84 30 84 56V86', top: 12, left: 16, ear: [28, 22] },
    tall:   { d: 'M22 52C22 24 34 8 50 8C66 8 78 24 78 52V86H22Z', o: 'M22 86V52C22 24 34 8 50 8C66 8 78 24 78 52V86', top: 8, left: 22, ear: [32, 16] },
    peaked: { d: 'M16 60C16 36 30 24 44 20L50 4L56 20C70 24 84 36 84 60V86H16Z', o: 'M16 86V60C16 36 30 24 44 20L50 4L56 20C70 24 84 36 84 60V86', top: 4, left: 16, ear: [24, 34] },
    wide:   { d: 'M10 60C10 32 28 14 50 14C72 14 90 32 90 60V86H10Z', o: 'M10 86V60C10 32 28 14 50 14C72 14 90 32 90 60V86', top: 14, left: 10, ear: [20, 26] },
    small:  { d: 'M26 56C26 32 36 18 50 18C64 18 74 32 74 56V86H26Z', o: 'M26 86V56C26 32 36 18 50 18C64 18 74 32 74 56V86', top: 18, left: 26, ear: [34, 28] },
  };
  const headOf = (name) => HEADS[name] || HEADS.dome;
  const BOTTOM = 92;

  const PARTS = {
    head: Object.fromEntries(Object.keys(HEADS).map(k => [k, HEADS[k].d])),
    // ears, drawn behind the head for an ear that attaches at (28,22) and shifted for the others
    ears: {
      none: '',
      cat: `<path d="M20 34L14 4L46 22Z" fill="var(--skin)" ${L}/><path d="M24 27L21 12L37 22Z" fill="#ffb0c8" opacity=".75"/>`,
      horns: `<path d="M26 28Q14 16 22 2Q28 14 40 20Z" fill="${A}" ${L} stroke-width="2.8"/>`,
      bunny: `<g transform="rotate(-12 30 24)"><ellipse cx="30" cy="2" rx="8.5" ry="21" fill="var(--skin)" ${L}/><ellipse cx="30" cy="4" rx="3.6" ry="13" fill="#ffb0c8" opacity=".7"/></g>`,
      bear: `<circle cx="22" cy="20" r="11" fill="var(--skin)" ${L}/><circle cx="22" cy="20" r="5.4" fill="var(--skin-dark)" opacity=".6"/>`,
    },
    eyes: {
      holes: mirror(s => side(s, `<ellipse cx="36" cy="48" rx="5.4" ry="7.6" fill="${INK}"/><circle cx="37.6" cy="45" r="1.8" fill="#fff"/>`)),
      dots: mirror(s => side(s, `<circle cx="36" cy="48" r="3.4" fill="${INK}"/>`)),
      wide: mirror(s => side(s, `<ellipse cx="35" cy="48" rx="7" ry="8.8" fill="${INK}"/><circle cx="37.4" cy="44.6" r="2.4" fill="#fff"/><circle cx="33" cy="52" r="1.2" fill="#fff"/>`)),
      tall: mirror(s => side(s, `<ellipse cx="36" cy="48" rx="3.8" ry="10" fill="${INK}"/>`)),
      glow: mirror(s => side(s, `<circle cx="36" cy="48" r="10" fill="${A}" opacity=".3"/><ellipse cx="36" cy="48" rx="5.6" ry="7.4" fill="${A}" ${L} stroke-width="2.4"/><circle cx="36" cy="48" r="2" fill="#fff"/>`)),
      sleepy: mirror(s => side(s, `<path d="M29 48Q36 55 43 48" ${line(3.2)}/>`)),
      cyclops: `<circle cx="50" cy="46" r="12" fill="#fff" ${L} stroke-width="2.8"/><circle cx="51.4" cy="47" r="7.4" fill="${A}" ${L} stroke-width="2"/><circle cx="51.8" cy="47.4" r="3.6" fill="${INK}"/><circle cx="54" cy="44.6" r="1.7" fill="#fff"/>`,
    },
    brows: {
      none: '',
      angry: mirror(s => side(s, `<path d="M27 36L45 42" ${line(4)}/>`)),
      worried: mirror(s => side(s, `<path d="M27 42L45 35" ${line(4)}/>`)),
      arch: mirror(s => side(s, `<path d="M28 38Q36 31 44 38" ${line(2.8)}/>`)),
    },
    nose: {
      none: '',
      dot: `<circle cx="50" cy="58" r="2" fill="var(--skin-dark)"/>`,
      tri: `<path d="M46.6 56H53.4L50 61.4Z" fill="var(--skin-dark)" ${L} stroke-width="2"/>`,
    },
    mouth: {
      oh: `<ellipse cx="50" cy="72" rx="6.4" ry="8.6" fill="${INK}"/><ellipse cx="50" cy="77" rx="3.4" ry="2.4" fill="#ff8aa4"/>`,
      wavy: `<path d="M38 72Q44 66 50 72T62 72" ${line(3.2)}/>`,
      smile: `<path d="M40 68Q50 78 60 68" ${line(3.2)}/>`,
      fang: `<path d="M40 68Q50 78 60 68" ${line(3.2)}/><path d="M53.4 73.4L55 79L58 71.4Z" fill="#fff" ${L} stroke-width="1.8"/>`,
      tongue: `<path d="M41 68Q50 76 59 68" ${line(3.2)}/><path d="M46.4 72.6V79Q50 84 53.6 79V72.6Z" fill="#ff8aa4" ${L} stroke-width="2.2"/>`,
      flat: `<path d="M42 72H58" ${line(3.2)}/>`,
      cat: `<path d="M41 68Q45.5 75 50 69Q54.5 75 59 68" ${line(2.8)}/>`,
      grin: `<path d="M38 66Q50 84 62 66Z" fill="${INK}" ${L} stroke-width="2.6"/><path d="M43 74Q50 79 57 74Q50 84 43 74Z" fill="#ff8aa4"/>`,
    },
    // what floats or sits on top, drawn for a head whose top is at y=12 (shifted for the others)
    hair: {
      none: '',
      wisp: `<path d="M50 14Q44 3 52 0Q60 -3 59 6Q57 11 52 8" ${line(3.6, 'var(--skin-dark)')}/>`,
      halo: `<ellipse cx="50" cy="-1" rx="19" ry="5.4" fill="none" stroke="${A}" stroke-width="4.6" opacity=".35"/><ellipse cx="50" cy="-1" rx="19" ry="5.4" fill="none" stroke="${A}" stroke-width="2.6"/>`,
      bow: `<g transform="translate(16 3)"><path d="M50 13L32 3V23Z" fill="${A}" ${L} stroke-width="2.6"/><path d="M50 13L68 3V23Z" fill="${A}" ${L} stroke-width="2.6"/><circle cx="50" cy="13" r="4.6" fill="${A}" ${L} stroke-width="2.6"/></g>`,
      flower: `<g transform="translate(-14 6)"><g fill="${A}" ${L} stroke-width="2.2">${[0, 72, 144, 216, 288].map(a => `<circle cx="${(50 + 7 * Math.sin(a * Math.PI / 180)).toFixed(1)}" cy="${(8 - 7 * Math.cos(a * Math.PI / 180)).toFixed(1)}" r="4.8"/>`).join('')}</g><circle cx="50" cy="8" r="3.8" fill="#ffd23f" ${L} stroke-width="2"/></g>`,
      antenna: `<path d="M50 14V1" ${line(3, 'var(--skin-dark)')}/><circle cx="50" cy="-3" r="5.4" fill="${A}" ${L} stroke-width="2.6"/>`,
    },
    // marks on the sheet; the folds and the patch are clipped to the head
    extra: {
      none: '',
      blush: mirror(s => side(s, `<ellipse cx="25" cy="62" rx="7" ry="4.4" fill="#ff8ab4" opacity=".5"/>`)),
      folds: 'folds',
      patch: 'patch',
      tear: mirror(s => side(s, `<path d="M30 58Q28 66 31 72" fill="none" stroke="#7ac8ff" stroke-width="3" stroke-linecap="round"/>`)),
      sparkle: `<g fill="${A}" stroke="none"><path d="M26 30l1.4 3.4 3.4 1.4-3.4 1.4L26 39.6l-1.4-3.4-3.4-1.4 3.4-1.4Z"/><path d="M76 24l1.1 2.6 2.6 1.1-2.6 1.1L76 31.4l-1.1-2.6-2.6-1.1 2.6-1.1Z"/></g>`,
    },
  };

  // ---- hats: pale and cheerful, the brim line at y=0 and the crown going up. hatFor() puts one on a head ---------------------------------------------------
  const HAT = {
    none: '',
    pith: `<path d="M-23 0Q-23 -27 0 -29Q23 -27 23 0Z" fill="#efe2bd" ${L}/><path d="M-23 -5H23" ${line(2.4)}/><path d="M-35 3Q0 -6 35 3Q30 10 0 10Q-30 10 -35 3Z" fill="#dccf9e" ${L}/>`,
    sailor: `<path d="M-22 0Q-24 -19 0 -21Q24 -19 22 0Z" fill="#fff" ${L}/><path d="M-27 1Q0 9 27 1L23 -6Q0 0 -23 -6Z" fill="#6f8fe0" ${L}/>`,
    hard: `<path d="M-25 0Q-25 -27 0 -27Q25 -27 25 0Z" fill="#ffe27a" ${L}/><path d="M-5 -27V-9H5V-27" fill="#f2c94a" ${L} stroke-width="2.4"/><path d="M-33 0H33V6H-33Z" fill="#ffe27a" ${L}/>`,
    beanie: `<path d="M-24 3Q-27 -24 0 -26Q27 -24 24 3Z" fill="#ff9ab0" ${L}/><path d="M-25 -4H25V4H-25Z" fill="#ffc0cf" ${L} stroke-width="2.4"/><circle cy="-30" r="5" fill="#fff" ${L} stroke-width="2.4"/>`,
    bowler: `<path d="M-16 0V-31Q-16 -35 -12 -35H12Q16 -35 16 -31V0Z" fill="#4a4560" ${L}/><path d="M-16 -7H16" ${line(4, A)}/><path d="M-27 2Q0 9 27 2Q27 -3 16 -4H-16Q-27 -3 -27 2Z" fill="#4a4560" ${L}/>`,
    party: `<path d="M-15 2L0 -38L15 2Z" fill="#8fe0ff" ${L}/><path d="M-9 -12L9 -12M-5 -24L5 -24" ${line(2.6, '#fff')}/><circle cy="-40" r="4.2" fill="#ffd23f" ${L} stroke-width="2.4"/>`,
    chef: `<path d="M-17 2V-8Q-30 -9 -25 -22Q-20 -35 0 -31Q20 -35 25 -22Q30 -9 17 -8V2Z" fill="#fff" ${L}/><path d="M-17 -4H17" ${line(2)}/>`,
    wizard: `<path d="M-26 5L3 -44L26 5Z" fill="#9a86e8" ${L}/><ellipse cy="5" rx="35" ry="7" fill="#9a86e8" ${L}/><path d="M-4 -18l1.6 3.6 3.8.4-2.9 2.6.8 3.8-3.3-2-3.3 2 .8-3.8-2.9-2.6 3.8-.4Z" fill="#ffe27a" stroke="none"/>`,
  };
  const hatFor = (name, head = 'dome') => HAT[name] ? `<g transform="translate(50 ${headOf(head).top + 9}) rotate(-4) scale(.95)">${HAT[name]}</g>` : '';
  PARTS.hat = HAT;

  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra'];
  const names = (k) => Object.keys(PARTS[k]);
  const DEFAULT = { head: 'dome', ears: 'none', eyes: 'holes', brows: 'none', nose: 'none', mouth: 'oh', hair: 'none', extra: 'blush', hat: 'none', skin: 'white', hairColor: 'cyan', scale: 1 };
  let uid = 0;

  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec }, h = headOf(s.head), [skin, skinDark] = SKIN[s.skin] || SKIN.white;
    const id = `gh${++uid}`, pick = (k) => PARTS[k][s[k]] ?? '';
    const clipped = (inner) => `<clipPath id="${id}"><path d="${h.d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
    const extra = s.extra === 'folds' ? clipped(`<g ${line(2.6, 'var(--skin-dark)')} opacity=".8"><path d="M30 20Q34 40 28 60"/><path d="M70 22Q66 44 72 64"/><path d="M44 72Q50 80 58 74"/></g>`)
      : s.extra === 'patch' ? clipped(`<rect x="56" y="22" width="18" height="16" rx="2" fill="var(--skin-dark)" ${L} stroke-width="2" stroke-dasharray="3 3"/>`)
      : pick('extra');
    const ears = pick('ears'), hair = pick('hair');
    return {
      style: `--skin:${skin};--skin-dark:${skinDark};--accent:${ACCENT[s.hairColor] || ACCENT.cyan};--hair:${ACCENT[s.hairColor] || ACCENT.cyan}`,
      ears: ears ? mirror(sd => side(sd, `<g transform="translate(${h.ear[0] - 28} ${h.ear[1] - 22})">${ears}</g>`)) : '',
      head: `<path d="${h.d}" fill="var(--skin)" stroke="none"/><path d="${h.o}" fill="none" ${L} stroke-width="3.4"/>`,
      extra,
      hair: hair ? `<g transform="translate(0 ${h.top - 12})">${hair}</g>` : '',
      eyes: pick('eyes'), brows: pick('brows'), nose: pick('nose'), mouth: pick('mouth'), hat: hatFor(s.hat, s.head), scale: s.scale || 1,
    };
  }

  function compose(spec = {}, { size = 120, title = '' } = {}) {
    const p = pieces(spec), px = Math.round(size * (p.scale || 1));
    return `<svg class="face" viewBox="-12 -30 124 124" width="${px}" height="${px}" role="img" aria-label="${title || 'face'}" style="${p.style}">${p.ears}${p.head}${p.extra}${p.hair}${p.eyes}${p.brows}${p.nose}${p.mouth}${p.hat}</svg>`;
  }

  const headSpan = (head) => [headOf(head).top, BOTTOM];

  // the expressions the card swaps in over the spec's own eyes, brows and mouth: eyes at x 36 and 64, y 48; the mouth at y 64 to 82
  function mood(ink = INK) {
    const st = `fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round"`;
    return `<g class="eye-closed" ${st} stroke-width="3.4"><path d="M28 49Q36 56 44 49M56 49Q64 56 72 49"/></g>
      <g class="eye-happy" ${st} stroke-width="3.4"><path d="M28 54Q36 43 44 54M56 54Q64 43 72 54"/></g>
      <g class="eye-sleepy" ${st} stroke-width="3.4"><path d="M28 49H44M56 49H72"/><path d="M30 49Q36 55 42 49M58 49Q64 55 70 49" stroke-width="1.8"/></g>
      <g class="eye-x" ${st} stroke-width="3.4"><path d="M30 42L42 54M42 42L30 54M58 42L70 54M70 42L58 54"/></g>
      <g class="dizzy-eyes" ${st} stroke-width="2.2"><circle cx="36" cy="48" r="8.6" fill="#fff"/><circle cx="64" cy="48" r="8.6" fill="#fff"/>
        <path d="M41 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(-5 -18)"/><path d="M59 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(5 -18)"/></g>
      <g class="worry-eyes"><circle cx="36" cy="48" r="8.6" fill="#fff" stroke="${ink}" stroke-width="2.6"/><circle cx="64" cy="48" r="8.6" fill="#fff" stroke="${ink}" stroke-width="2.6"/>
        <circle class="pupil" cx="37" cy="46" r="3.2" fill="${ink}"/><circle class="pupil" cx="63" cy="46" r="3.2" fill="${ink}"/></g>
      <path class="worry-brows" d="M26 40Q35 32 46 37M74 40Q65 32 54 37" ${st} stroke-width="3.4"/>
      <path class="brows" d="M27 36L46 43M73 36L54 43" ${st} stroke-width="4"/>
      <ellipse class="yawn" cx="50" cy="73" rx="7.4" ry="9.4" fill="${ink}"/>
      <path class="worry-mouth" d="M39 74Q44.5 68 50 74T61 74" ${st} stroke-width="3.2"/>`;
  }

  // the body is a bedsheet: a bell that carries on from the head's sides, flares, and ends in a wavy hem. The sleeves are short sheet-coloured tubes with round hands;
  // the legs exist (the page's animation moves them) but are not drawn: ghosts float.
  // Same joints and class names as any style (see BODY_CLASSES in ../faces.js).
  function body(head) {
    const h = headOf(head), [top, bot] = headSpan(head), B = (bot - top) / 2;
    const hip = bot + B * .4, shoulder = bot + B * .2, foot = bot + B;
    const lx = B * .22, ly = foot - hip, ax = B * .5, ay = B * .28;
    const f = n => +n.toFixed(2);
    const Lx = h.left, R = 100 - h.left, hem = foot - 2, JOIN = 86, y0 = JOIN - 8, ex = 9;   // the head's outline ends at JOIN; the sheet's starts higher up, under the head, so the two meet in one unbroken line
    const n = 5, x0 = Lx - ex, x1 = R + ex, step = (x1 - x0) / n;
    const scallops = Array.from({ length: n }, (_, i) => `Q${f(x0 + step * (i + .5))} ${f(hem + 10)} ${f(x0 + step * (i + 1))} ${f(hem)}`).join('');
    const sheet = `<path class="torso" d="M${Lx} ${y0}V${JOIN}C${Lx} ${f(JOIN + B * .45)} ${f(x0)} ${f(hem - 16)} ${f(x0)} ${f(hem)}${scallops}`
      + `C${f(x1)} ${f(hem - 16)} ${R} ${f(JOIN + B * .45)} ${R} ${JOIN}V${y0}Z" fill="var(--skin)" ${L}/>`;
    const tube = (x, y, w) => `<path d="M0 0l${f(x)} ${f(y)}" stroke="${INK}" stroke-width="${w + 4.6}"/><path d="M0 0l${f(x)} ${f(y)}" stroke="var(--skin)" stroke-width="${w}"/>`;
    const limb = (b, sub, side, x, y, w, visible) => visible
      ? `<g class="${b} side-${side}">${tube(x / 2, y / 2, w)}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}">${tube(x / 2, y / 2, w)}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><circle r="4.8" fill="var(--skin)" stroke-width="2.8"/></g></g></g></g>`
      : `<g class="${b} side-${side}"><path d="M0 0l${f(x / 2)} ${f(y / 2)}" stroke="none"/><g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}"><path d="M0 0l${f(x / 2)} ${f(y / 2)}" stroke="none"/></g></g></g>`;
    const at = (x, y, inner) => `<g transform="translate(${f(x)} ${f(y)})">${inner}</g>`;
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">`
        + `<g class="lower">${at(44, hip, limb('thigh', 'shin', 'l', -lx, ly, 6, false))}${at(56, hip, limb('thigh', 'shin', 'r', lx, ly, 6, false))}</g>`
        + `<g class="upper">${sheet}`
        + `${at(Lx + 4, shoulder, limb('arm', 'fore', 'l', -ax * .8, ay, 5.2, true))}${at(R - 4, shoulder, limb('arm', 'fore', 'r', ax * .8, ay, 5.2, true))}`,
      close: '</g></g>' };
  }

  // a pale gold crown that floats just above the head, with a gem (which twinkles)
  const crown = (head) => `<g class="crown" transform="translate(50 ${headOf(head).top - 8}) rotate(-5)">
      <path d="M-15 10L-16 -7L-8 -1L0 -12L8 -1L16 -7L15 10Z" fill="#ffe27a" stroke="${GOLD}" stroke-width="2.8" stroke-linejoin="round"/>
      <circle class="gem" cx="0" cy="3.6" r="2.8" fill="var(--bean)"/>
    </g>`;

  function random(seed = Math.random() * 1e9) {
    const r = rng(seed | 0), pick = (list) => list[Math.floor(r() * list.length)];
    return { ...Object.fromEntries(ORDER.map(k => [k, pick(names(k))])), hat: 'none', skin: pick(Object.keys(SKIN)), hairColor: pick(Object.keys(ACCENT)), scale: 1 };
  }

  // a relative keeps the head and ears and has a similar tint; the eyes, the mouth and the extras are passed down or its own
  function derive(main, seed = 0) {
    return kin({ ...DEFAULT, ...main }, seed, {
      keep: { eyes: .5, mouth: .45, nose: .6, brows: .4, hair: .35, hairColor: .5, extra: .35 },
      pool: (k) => k === 'hairColor' ? Object.keys(ACCENT) : names(k),
      tone: { key: 'skin', list: Object.keys(SKIN) },
    });
  }

  const colors = (table, i) => Object.fromEntries(Object.entries(table).map(([n, v]) => [n, i === null ? v : v[i]]));
  const editor = () => ({
    slots: [...ORDER, 'hat'].map(k => ({ key: k, options: names(k), fixed: false })),
    swatches: [{ key: 'skin', label: 'sheet', colors: colors(SKIN, 0) }, { key: 'hairColor', label: 'glow', colors: colors(ACCENT, null) }],
  });

  return { name: 'ghosts', label: 'Ghosts', emoji: '👻', secret: true, description: 'Friendly bedsheet ghosts with a wavy hem.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT };
})());
