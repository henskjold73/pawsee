// The "robot" face style: tin heads built from rounded plates, with LED eyes, a speaker grille for a mouth, an antenna on top, and a body of boxes and pipes.
// Clean straight-ish lines and flat colour. Every part is an SVG fragment on a 100x100 head canvas (head centre about 50,52).
// A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat, skin, hairColor, scale }: `skin` is the metal and `hairColor` the colour of the lights and the antenna.
// The contract a style has to meet is described at the top of ../faces.js.
Faces.register((() => {
  const { kin, rng } = Faces;
  const INK = '#232a36', DARK = '#26303c';
  const L = `stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
  const line = `fill="none" ${L}`;
  const mirror = (f) => f(1) + f(-1);                                                  // draws a part on the right side, then flips it to the left
  const side = (s, body) => `<g transform="translate(${s < 0 ? 100 : 0} 0) scale(${s} 1)">${body}</g>`;

  const SKIN = { steel: ['#c9d3dc', '#97a6b3'], copper: ['#e3a574', '#b9763f'], gold: ['#f2d675', '#c9a233'], mint: ['#a3e4cd', '#6bb89c'], blue: ['#92baf0', '#5f8fd0'], rust: ['#cc8f70', '#9a5c3f'] };
  const ACCENT = { cyan: '#27d3e6', lime: '#8be04a', amber: '#ffb02e', red: '#ff5a5f', magenta: '#e04ad0', white: '#ffffff' };
  const A = 'var(--accent)';

  // ---- heads: the outline, where its left edge is (for the ears) and where its top is (for the antenna, the hat and the body) -------------------------
  const HEADS = {
    box:   { d: 'M28 14H72Q80 14 80 22V80Q80 88 72 88H28Q20 88 20 80V22Q20 14 28 14Z', left: 20, top: 14, bottom: 88 },
    round: { d: 'M50 15C72 15 84 32 84 52C84 74 70 89 50 89C30 89 16 74 16 52C16 32 28 15 50 15Z', left: 16, top: 15, bottom: 89 },
    dome:  { d: 'M18 50C18 28 32 14 50 14C68 14 82 28 82 50V80Q82 88 74 88H26Q18 88 18 80Z', left: 18, top: 14, bottom: 88 },
    tv:    { d: 'M32 20H68Q84 20 84 36V70Q84 86 68 86H32Q16 86 16 70V36Q16 20 32 20Z', left: 16, top: 20, bottom: 86 },
    tall:  { d: 'M34 8H66Q76 8 76 18V82Q76 92 66 92H34Q24 92 24 82V18Q24 8 34 8Z', left: 24, top: 8, bottom: 92 },
  };
  const headOf = (name) => HEADS[name] || HEADS.box;

  const PARTS = {
    head: Object.fromEntries(Object.keys(HEADS).map(k => [k, HEADS[k].d])),
    // side pieces, drawn behind the head for a head whose left edge is at x=20 (they are shifted for the others)
    ears: {
      none: '',
      bolts: `<circle cx="17" cy="50" r="6" fill="var(--skin-dark)" ${L} stroke-width="2.6"/><path d="M14 50H20" ${line} stroke-width="2"/>`,
      cans: `<rect x="7" y="37" width="13" height="26" rx="6" fill="${A}" ${L} stroke-width="2.6"/>`,
      panels: `<rect x="10" y="42" width="10" height="16" rx="2" fill="var(--skin-dark)" ${L} stroke-width="2.6"/><path d="M13 47H17M13 52H17" ${line} stroke-width="1.6"/>`,
      discs: `<circle cx="14" cy="52" r="9" fill="var(--skin-dark)" ${L} stroke-width="2.6"/><circle cx="14" cy="52" r="3.6" fill="${A}" ${L} stroke-width="2"/>`,
    },
    eyes: {
      round: mirror(s => side(s, `<circle cx="37" cy="48" r="7" fill="#fff" ${L} stroke-width="2.6"/><circle cx="38.5" cy="48.5" r="2.6" fill="${INK}"/>`)),
      led: mirror(s => side(s, `<rect x="31" y="43" width="12" height="10" rx="3" fill="${A}" ${L} stroke-width="2.6"/>`)),
      dots: mirror(s => side(s, `<circle cx="37" cy="48" r="4.2" fill="${A}" ${L} stroke-width="2.2"/>`)),
      bar: mirror(s => side(s, `<rect x="29" y="46" width="16" height="5" rx="2.5" fill="${A}" ${L} stroke-width="2.4"/>`)),
      visor: `<rect x="26" y="41" width="48" height="14" rx="7" fill="${A}" ${L} stroke-width="2.8"/><path d="M33 46H48" stroke="#fff" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round"/>`,
      cyclops: `<circle cx="50" cy="48" r="11" fill="#fff" ${L} stroke-width="2.8"/><circle cx="50" cy="48" r="6" fill="${A}" ${L} stroke-width="2"/><circle cx="50" cy="48" r="2.4" fill="${INK}"/>`,
      screen: mirror(s => side(s, `<rect x="30" y="41" width="14" height="14" rx="2" fill="${DARK}" ${L} stroke-width="2.6"/><circle cx="37" cy="48" r="3" fill="${A}"/>`)),
      cross: mirror(s => side(s, `<path d="M37 41V55M30 48H44" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="square"/><path d="M37 41V55M30 48H44" fill="none" stroke="${A}" stroke-width="3" stroke-linecap="square"/>`)),
    },
    brows: {
      none: '',
      flat: mirror(s => side(s, `<path d="M28 35H46" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="square"/>`)),
      angry: mirror(s => side(s, `<path d="M28 33L46 39" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="square"/>`)),
      worried: mirror(s => side(s, `<path d="M28 39L46 33" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="square"/>`)),
      plates: mirror(s => side(s, `<rect x="28" y="30" width="18" height="7" rx="2" fill="var(--skin-dark)" ${L} stroke-width="2.4"/>`)),
    },
    nose: {
      none: '',
      dot: `<circle cx="50" cy="61" r="3.4" fill="${A}" ${L} stroke-width="2.2"/>`,
      vent: `<path d="M44 57H56M44 62H56M44 67H56" ${line} stroke-width="2.2"/>`,
      triangle: `<path d="M50 55L56 66H44Z" fill="var(--skin-dark)" ${L} stroke-width="2.4"/>`,
      sensor: `<circle cx="50" cy="61" r="6.5" fill="${DARK}" ${L} stroke-width="2.4"/><circle cx="50" cy="61" r="2.2" fill="${A}"/>`,
      bolt: `<path d="M53 54L46 62H51L47 70L55 60H50Z" fill="${A}" ${L} stroke-width="2" stroke-linejoin="miter"/>`,
    },
    mouth: {
      line: `<path d="M38 78H62" ${line}/><circle cx="36" cy="78" r="1.6" fill="${INK}"/><circle cx="64" cy="78" r="1.6" fill="${INK}"/>`,
      grille: `<rect x="37" y="72" width="26" height="13" rx="3" fill="${DARK}" ${L} stroke-width="2.6"/><path d="M43 73V84M50 73V84M57 73V84" fill="none" stroke="#9aa7b4" stroke-width="2"/>`,
      smile: `<path d="M38 74Q50 86 62 74" ${line}/>`,
      frown: `<path d="M40 82Q50 72 60 82" ${line}/>`,
      zigzag: `<path d="M35 79L41 74L47 82L53 74L59 82L65 77" ${line} stroke-width="2.8" stroke-linejoin="miter"/>`,
      led: [0, 1, 2, 3, 4].map(i => `<rect x="${31 + i * 8}" y="74" width="6" height="8" rx="1.5" fill="${A}" ${L} stroke-width="2"/>`).join(''),
      open: `<rect x="38" y="72" width="24" height="15" rx="3" fill="${DARK}" ${L} stroke-width="2.6"/><path d="M42 82H58" fill="none" stroke="${A}" stroke-width="2.8" stroke-linecap="round"/>`,
      speaker: `<g fill="${INK}">${[[42, 76], [50, 76], [58, 76], [42, 82], [50, 82], [58, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2"/>`).join('')}</g>`,
    },
    // what grows on top, drawn for a head whose top is at y=14 (shifted for the others)
    hair: {
      none: '',
      antenna: `<path d="M50 16V1" ${line}/><circle cx="50" cy="-2" r="5" fill="${A}" ${L} stroke-width="2.6"/>`,
      dual: `<path d="M38 17L31 3M62 17L69 3" ${line}/><circle cx="30" cy="0" r="4.2" fill="${A}" ${L} stroke-width="2.4"/><circle cx="70" cy="0" r="4.2" fill="${A}" ${L} stroke-width="2.4"/>`,
      dish: `<path d="M50 16V8" ${line}/><path d="M36 3Q50 18 64 3Z" fill="var(--skin-dark)" ${L} stroke-width="2.6"/><path d="M50 11L50 0" ${line} stroke-width="2"/><circle cx="50" cy="-1" r="2.6" fill="${A}" ${L} stroke-width="1.8"/>`,
      spring: `<path d="M50 16L43 12L57 8L43 4L57 0L50 -3" ${line} stroke-width="2.6" stroke-linejoin="miter"/><circle cx="50" cy="-7" r="4.4" fill="${A}" ${L} stroke-width="2.4"/>`,
      siren: `<path d="M37 17V9Q37 -2 50 -2Q63 -2 63 9V17Z" fill="${A}" ${L}/><path d="M43 8Q43 3 48 2" ${line} stroke="#fff" stroke-opacity=".7" stroke-width="2.4"/>`,
      fin: `<path d="M30 18Q36 -2 50 -5Q64 -2 70 18Z" fill="${A}" ${L}/><path d="M50 -4V16" ${line} stroke-width="2"/>`,
    },
    // marks on top of the face; seam and band are clipped to the head
    extra: {
      none: '',
      rivets: [[30, 26], [70, 26], [30, 80], [70, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="var(--skin-dark)" ${L} stroke-width="1.4"/>`).join(''),
      seam: 'seam',
      vents: mirror(s => side(s, `<path d="M26 62H33M26 66H33M26 70H33" ${line} stroke-width="1.8"/>`)),
      scratches: `<g ${line} stroke-width="1.8" opacity=".65"><path d="M60 24L70 34M64 22L68 28"/><path d="M30 70L36 76M28 76L32 80"/></g>`,
      band: 'band',
    },
  };

  // ---- hats: straight-sided and flat, the brim line at y=0 and the crown going up; hatFor() puts one on a head -----------------------------------------
  const HAT = {
    none: '',
    pith: `<path d="M-22 0L-18 -20L-8 -26H8L18 -20L22 0Z" fill="#e8d6a0" ${L}/><path d="M-21 -6H21" ${line} stroke-width="2.4"/><path d="M-34 2H34L28 9H-28Z" fill="#d2bb80" ${L}/>`,
    sailor: `<path d="M-20 0V-14L-12 -21H12L20 -14V0Z" fill="#fff" ${L}/><path d="M-25 -7H25V1H-25Z" fill="#3f63b8" ${L}/><path d="M-6 -14H6" ${line} stroke-width="2"/>`,
    hard: `<path d="M-24 0L-22 -16L-10 -26H10L22 -16L24 0Z" fill="#f3c531" ${L}/><path d="M-5 -26V-8H5V-26" fill="#e0a91a" ${L} stroke-width="2.4"/><path d="M-32 0H32V6H-32Z" fill="#f3c531" ${L}/>`,
    beanie: `<path d="M-22 3V-14L-12 -24H12L22 -14V3Z" fill="#c9473d" ${L}/><path d="M-23 -4H23V4H-23Z" fill="#e0675b" ${L} stroke-width="2.4"/><circle cy="-29" r="5" fill="#f2e2c4" ${L} stroke-width="2.4"/>`,
    bowler: `<path d="M-18 0V-14L-8 -24H8L18 -14V0Z" fill="#3d3b45" ${L}/><path d="M-18 -6H18" ${line} stroke="#e8645a" stroke-width="3"/><path d="M-30 2H30L26 8H-26Z" fill="#3d3b45" ${L}/>`,
    party: `<path d="M-14 2L0 -36L14 2Z" fill="#ec7fa6" ${L}/><path d="M-8 -12L8 -12M-5 -24L5 -24" ${line} stroke="#fff" stroke-width="2.6"/><rect x="-4" y="-43" width="8" height="8" rx="1" fill="#f6c945" ${L} stroke-width="2.4"/>`,
    chef: `<path d="M-16 2V-8H-24V-20L-14 -30H14L24 -20V-8H16V2Z" fill="#fff" ${L}/><path d="M-16 -4H16" ${line} stroke-width="2"/>`,
    wizard: `<path d="M-24 5L2 -43L24 5Z" fill="#5b4bb5" ${L}/><path d="M-34 5H34V11H-34Z" fill="#5b4bb5" ${L}/><path d="M-3 -20L0 -26L3 -20L0 -14Z" fill="#f6c945" ${L} stroke-width="1.8"/>`,
  };
  const hatFor = (name, head = 'box') => HAT[name] ? `<g transform="translate(50 ${headOf(head).top + 9}) scale(.95)">${HAT[name]}</g>` : '';
  PARTS.hat = HAT;

  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra'];
  const names = (k) => Object.keys(PARTS[k]);
  const DEFAULT = { head: 'box', ears: 'bolts', eyes: 'led', brows: 'none', nose: 'dot', mouth: 'grille', hair: 'antenna', extra: 'none', hat: 'none', skin: 'steel', hairColor: 'cyan', scale: 1 };
  let uid = 0;

  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec }, h = headOf(s.head), [skin, skinDark] = SKIN[s.skin] || SKIN.steel;
    const id = `rb${++uid}`, pick = (k) => PARTS[k][s[k]] ?? '';
    const clipped = (inner) => `<clipPath id="${id}"><path d="${h.d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
    const extra = s.extra === 'seam' ? clipped(`<path d="M10 ${h.top + 16}H90" ${line} stroke-width="2"/><rect x="43" y="${h.top + 10}" width="14" height="6" fill="var(--skin-dark)" ${L} stroke-width="1.8"/>`)
      : s.extra === 'band' ? clipped(`<rect x="10" y="${h.top - 4}" width="80" height="${24}" fill="var(--skin-dark)" opacity=".55"/><path d="M10 ${h.top + 20}H90" ${line} stroke-width="2"/>`)
      : pick('extra');
    const ears = pick('ears');
    return {
      style: `--skin:${skin};--skin-dark:${skinDark};--accent:${ACCENT[s.hairColor] || ACCENT.cyan};--hair:${ACCENT[s.hairColor] || ACCENT.cyan}`,
      ears: ears ? mirror(sd => side(sd, `<g transform="translate(${h.left - 20} 0)">${ears}</g>`)) : '',
      head: `<path d="${h.d}" fill="var(--skin)" ${L}/>`,
      extra,
      hair: pick('hair') ? `<g transform="translate(0 ${h.top - 14})">${pick('hair')}</g>` : '',
      eyes: pick('eyes'), brows: pick('brows'), nose: pick('nose'), mouth: pick('mouth'), hat: hatFor(s.hat, s.head), scale: s.scale || 1,
    };
  }

  function compose(spec = {}, { size = 120, title = '' } = {}) {
    const p = pieces(spec), px = Math.round(size * (p.scale || 1));
    return `<svg class="face" viewBox="-14 -34 128 128" width="${px}" height="${px}" role="img" aria-label="${title || 'face'}" style="${p.style}">${p.ears}${p.head}${p.extra}${p.hair}${p.eyes}${p.brows}${p.nose}${p.mouth}${p.hat}</svg>`;
  }

  const headSpan = (head) => [headOf(head).top, headOf(head).bottom];

  // the expressions the card swaps in over the spec's own eyes, brows and mouth: eyes sit at x 37 and 63, y 48; the mouth at y 80
  function mood(ink = INK) {
    const st = `fill="none" stroke="${ink}" stroke-linecap="square" stroke-linejoin="miter"`;
    return `<g class="eye-closed" ${st} stroke-width="3.4"><path d="M30 48H44M56 48H70"/></g>
      <g class="eye-happy" ${st} stroke-width="3.4"><path d="M30 52L37 45L44 52M56 52L63 45L70 52"/></g>
      <g class="eye-sleepy"><rect x="31" y="48" width="12" height="5" rx="2" fill="${A}" stroke="${ink}" stroke-width="2.4"/><rect x="57" y="48" width="12" height="5" rx="2" fill="${A}" stroke="${ink}" stroke-width="2.4"/><path d="M30 48H44M56 48H70" ${st} stroke-width="3"/></g>
      <g class="eye-x" ${st} stroke-width="3.4"><path d="M31 42L43 54M43 42L31 54M57 42L69 54M69 42L57 54"/></g>
      <g class="dizzy-eyes"><rect x="29" y="41" width="16" height="14" rx="2" fill="#fff" stroke="${ink}" stroke-width="2.4"/><rect x="55" y="41" width="16" height="14" rx="2" fill="#fff" stroke="${ink}" stroke-width="2.4"/>
        <path d="M32 44H42V52H34V47H39" ${st} stroke-width="2"/><path d="M58 44H68V52H60V47H65" ${st} stroke-width="2"/></g>
      <g class="worry-eyes"><circle cx="37" cy="48" r="7.5" fill="#fff" stroke="${ink}" stroke-width="2.6"/><circle cx="63" cy="48" r="7.5" fill="#fff" stroke="${ink}" stroke-width="2.6"/>
        <circle class="pupil" cx="38" cy="46" r="2.6" fill="${ink}"/><circle class="pupil" cx="62" cy="46" r="2.6" fill="${ink}"/></g>
      <path class="worry-brows" d="M27 40L45 33M73 40L55 33" ${st} stroke-width="3.4"/>
      <path class="brows" d="M28 35L46 41M72 35L54 41" ${st} stroke-width="3.8"/>
      <rect class="yawn" x="44" y="73" width="12" height="14" rx="3" fill="${ink}"/>
      <path class="worry-mouth" d="M38 82L44 78L50 82L56 78L62 82" ${st} stroke-width="3"/>`;
  }

  // a body of boxes and pipes. The torso is a box with a light on it; a limb is a pipe (a dark tube with a light core) with a ball at each joint.
  // Same joints and class names as any style (see BODY_CLASSES in ../faces.js), so the page's animation moves these too.
  function body(head) {
    const [top, bot] = headSpan(head), B = (bot - top) / 2;
    const neck = bot - 3, hip = bot + B * .4, shoulder = bot + B * .2, foot = bot + B;
    const lx = B * .22, ly = foot - hip, ax = B * .5, ay = B * .28;
    const f = n => +n.toFixed(2);
    const pipe = (x, y) => `<path d="M0 0l${f(x)} ${f(y)}" stroke="${INK}" stroke-width="6.4" stroke-linecap="butt"/><path d="M0 0l${f(x)} ${f(y)}" stroke="var(--skin)" stroke-width="3" stroke-linecap="butt"/>`;
    const ball = `<circle r="3.4" fill="var(--skin-dark)" stroke-width="2.2"/>`;
    const tip = (kind, side) => kind === 'foot' ? `<rect x="${side === 'l' ? -10 : -2}" y="-2.5" width="12" height="6" rx="2" fill="var(--skin-dark)" stroke-width="2.4"/>` : `<circle r="4.2" fill="${A}" stroke-width="2.2"/>`;
    const limb = (b, sub, side, x, y, kind) => `<g class="${b} side-${side}">${pipe(x / 2, y / 2)}${ball}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}">${pipe(x / 2, y / 2)}${ball}<g transform="translate(${f(x / 2)} ${f(y / 2)})">${tip(kind, side)}</g></g></g></g>`;
    const at = (x, y, inner) => `<g transform="translate(${f(x)} ${f(y)})">${inner}</g>`;
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">`
        + `<g class="lower">${at(44, hip, limb('thigh', 'shin', 'l', -lx, ly, 'foot'))}${at(56, hip, limb('thigh', 'shin', 'r', lx, ly, 'foot'))}</g>`
        + `<g class="upper"><rect class="torso" x="38" y="${f(neck)}" width="24" height="${f(hip - neck + 5)}" rx="5" fill="var(--skin)"/><circle cx="50" cy="${f(neck + (hip - neck) / 2 + 2)}" r="3" fill="${A}" stroke-width="2"/>`
        + `${at(38, shoulder, limb('arm', 'fore', 'l', -ax, ay, 'hand'))}${at(62, shoulder, limb('arm', 'fore', 'r', ax, ay, 'hand'))}`,
      close: '</g></g>' };
  }

  // a gold crown with squared points and a gem (which twinkles), tilted a little
  const crown = (head) => `<g class="crown" transform="translate(50 ${headOf(head).top - 8}) rotate(-5)">
      <path d="M-16 12V-4L-8 2L0 -10L8 2L16 -4V12Z" fill="#f6c945" stroke="#c9961a" stroke-width="2" stroke-linejoin="round"/>
      <rect x="-16" y="7" width="32" height="6" rx="1.5" fill="#e8b32c" stroke="#c9961a" stroke-width="1.6"/>
      <rect class="gem" x="-3" y="7.6" width="6" height="5" rx="1" fill="var(--bean)"/>
    </g>`;

  function random(seed = Math.random() * 1e9) {
    const r = rng(seed | 0), pick = (list) => list[Math.floor(r() * list.length)];
    return { ...Object.fromEntries(ORDER.map(k => [k, pick(names(k))])), hat: 'none', skin: pick(Object.keys(SKIN)), hairColor: pick(Object.keys(ACCENT)), scale: 1 };
  }

  // a relative keeps the head and the ears and has a similar metal; the rest is passed down or its own
  function derive(main, seed = 0) {
    return kin({ ...DEFAULT, ...main }, seed, {
      keep: { nose: .65, eyes: .5, mouth: .45, brows: .4, hair: .4, hairColor: .5, extra: .4 },
      pool: (k) => k === 'hairColor' ? Object.keys(ACCENT) : names(k),
      tone: { key: 'skin', list: Object.keys(SKIN) },
    });
  }

  const colors = (table, i) => Object.fromEntries(Object.entries(table).map(([n, v]) => [n, i === null ? v : v[i]]));
  const editor = () => ({
    slots: [...ORDER, 'hat'].map(k => ({ key: k, options: names(k), fixed: false })),
    swatches: [{ key: 'skin', label: 'metal', colors: colors(SKIN, 0) }, { key: 'hairColor', label: 'lights', colors: colors(ACCENT, null) }],
  });

  return { name: 'robot', label: 'Robot', description: 'Tin heads with LED eyes, a speaker grille and an antenna, on a body of boxes and pipes.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT };
})());
