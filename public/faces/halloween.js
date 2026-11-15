// The "halloween" face style: jack-o'-lanterns. A ribbed pumpkin head with a carved, glowing face (the glow is the colour of the candle inside), a stalk on top,
// on a scarecrow body in a patched jacket, with straw for hands. Bold dark outline, flat colour. Every part is an SVG fragment on a 100x100 head canvas
// (eyes at y 48, the nose at 54 to 64, the mouth at 70 to 92), so any part fits any head.
// A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat, skin, hairColor, scale }: `skin` is the pumpkin and `hairColor` the glow of the candle.
// The contract a style has to meet is described at the top of ../faces.js.
Faces.register((() => {
  const { kin, rng } = Faces;
  const INK = '#2a1608', JACKET = '#3a2a52', TROUSERS = '#2a2234', STRAW = '#f2c94c', LEAF = '#6faa3a', STALK = '#7d8f3a';
  const L = `stroke="${INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"`;
  const line = (w = 3, c = INK) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const G = 'var(--accent)';                                                // the glow of the candle: whatever is carved out is lit
  const mirror = (f) => f(1) + f(-1);
  const side = (s, body) => `<g transform="translate(${s < 0 ? 100 : 0} 0) scale(${s} 1)">${body}</g>`;

  const SKIN = {
    orange: ['#ff9a2e', '#d96f0e'], deep: ['#f26a1b', '#c04a08'], white: ['#f4efe4', '#d4cbb8'],
    green: ['#9ccc65', '#6f9e3c'], slate: ['#9db4c8', '#6f8aa4'], purple: ['#a47ad0', '#7b52a8'],
  };
  const GLOW = { candle: '#ffe45c', toxic: '#9dff6a', ember: '#ff5a3c', spooky: '#c58bff', moon: '#fff6d8', ice: '#6fd8ff' };

  // ---- heads: the outline, how far it reaches (the hat and body hang from them) and its left edge (for the side pieces) --------------------------------
  const HEADS = {
    classic: { d: 'M50 14C60 12 66 16 70 20C80 18 90 30 90 54C90 80 74 92 56 92Q50 94 44 92C26 92 10 80 10 54C10 30 20 18 30 20C34 16 40 12 50 14Z', top: 12, bottom: 93, left: 10 },
    round:   { d: 'M50 14C74 14 90 30 90 54C90 80 72 92 50 92C28 92 10 80 10 54C10 30 26 14 50 14Z', top: 14, bottom: 92, left: 10 },
    tall:    { d: 'M50 8C70 8 80 24 80 50C80 78 68 94 50 94C32 94 20 78 20 50C20 24 30 8 50 8Z', top: 8, bottom: 94, left: 20 },
    squat:   { d: 'M50 26C76 22 94 36 94 58C94 80 74 90 50 90C26 90 6 80 6 58C6 36 24 22 50 26Z', top: 23, bottom: 90, left: 6 },
    lumpy:   { d: 'M30 22C20 24 10 36 10 56C10 78 26 92 50 92C74 92 90 78 90 56C90 36 80 24 70 22C64 14 56 12 50 16C44 12 36 14 30 22Z', top: 13, bottom: 92, left: 10 },
  };
  const headOf = (name) => HEADS[name] || HEADS.classic;

  // the glowing, carved parts: a hole with the candle showing through, ringed in dark
  const hole = (d, w = 2.6) => `<path d="${d}" fill="${G}" ${L} stroke-width="${w}"/>`;
  const tooth = (d) => `<path d="${d}" fill="var(--skin)" ${L} stroke-width="2"/>`;

  const PARTS = {
    head: Object.fromEntries(Object.keys(HEADS).map(k => [k, HEADS[k].d])),
    // side pieces, drawn behind the head for a head whose left edge is at x=10 (they are shifted for the others)
    ears: {
      none: '',
      leaves: `<path d="M16 54Q-2 50 0 34Q18 34 22 50Z" fill="${LEAF}" ${L}/><path d="M16 52Q8 46 4 38" ${line(1.8)}/>`,
      tendrils: `<path d="M14 50Q-2 50 2 38Q6 30 12 36Q14 42 8 42" ${line(3.4, '#4e7a24')}/>`,
      horns: `<path d="M20 34Q6 28 8 10Q22 16 30 28Z" fill="#3a2a52" ${L}/>`,
      cat: `<path d="M14 38L10 8L36 26Z" fill="var(--skin)" ${L}/><path d="M17 31L15 16L28 26Z" fill="${G}" opacity=".8"/>`,
    },
    eyes: {
      triangle: mirror(s => side(s, hole('M28 56L36 38L44 56Z'))),
      slanted: mirror(s => side(s, hole('M26 41L47 50L28 57Z'))),
      round: mirror(s => side(s, `<circle cx="36" cy="48" r="7.6" fill="${G}" ${L}/>`)),
      crescent: mirror(s => side(s, hole('M44 40A10 10 0 1 0 44 58A7.4 7.4 0 1 1 44 40Z'))),
      square: mirror(s => side(s, `<rect x="30" y="42" width="12" height="12" rx="1.6" fill="${G}" ${L}/>`)),
      star: mirror(s => side(s, hole('M36 38l3.2 7 7.6 .8-5.7 5.2 1.7 7.6L36 54.6 29.2 58.6l1.7-7.6-5.7-5.2 7.6-.8Z', 2.2))),
      sleepy: mirror(s => side(s, `<path d="M28 49Q36 56 44 49" ${line(3.6)}/>`)),
    },
    brows: {
      none: '',
      angry: mirror(s => side(s, `<path d="M25 35L46 42" ${line(4.4)}/>`)),
      worried: mirror(s => side(s, `<path d="M25 43L46 35" ${line(4.4)}/>`)),
      arch: mirror(s => side(s, `<path d="M27 40Q36 31 45 40" ${line(3.6)}/>`)),
    },
    nose: {
      none: '',
      triangle: hole('M44.6 63L50 53L55.4 63Z', 2.4),
      nostrils: `<ellipse cx="46" cy="60" rx="1.8" ry="3" fill="${INK}"/><ellipse cx="54" cy="60" rx="1.8" ry="3" fill="${INK}"/>`,
      dot: `<circle cx="50" cy="60" r="3.4" fill="${G}" ${L} stroke-width="2.2"/>`,
    },
    mouth: {
      grin: `${hole('M29 70Q50 79 71 70Q73 82 63 88Q50 93 37 88Q27 82 29 70Z')}${tooth('M37 73.4L40.4 81L44.4 75Z')}${tooth('M56 75L59.6 81L63 73.4Z')}${tooth('M45.4 91.4L50 83.6L54.6 91.4Z')}`,
      toothy: `${hole('M26 72Q50 82 74 72Q76 84 64 90Q50 94 36 90Q24 84 26 72Z')}${[34, 42, 50, 58, 66].map(x => tooth(`M${x - 3.4} ${x === 50 ? 76.6 : 75.8}V${x === 50 ? 82 : 81}H${x + 3.4}V${x === 50 ? 76.6 : 75.8}Z`)).join('')}${[38, 46, 54, 62].map(x => tooth(`M${x - 3.4} 90V85H${x + 3.4}V90Z`)).join('')}`,
      smile: `${hole('M31 72Q50 96 69 72Q50 83 31 72Z')}${tooth('M46.6 79.6L50 87L53.4 79.6Z')}`,
      gap: `${hole('M28 70Q50 80 72 70Q74 84 62 90Q50 94 38 90Q26 84 28 70Z')}${tooth('M33.6 73L37 82L41.4 75.4Z')}${tooth('M58.6 75.4L63 82L66.4 73Z')}`,
      fangs: `${hole('M30 71Q50 80 70 71Q70 84 60 89Q50 92 40 89Q30 84 30 71Z')}${tooth('M36 74L39.6 88L44 77Z')}${tooth('M56 77L60.4 88L64 74Z')}`,
      oh: `<ellipse cx="50" cy="80" rx="7.4" ry="9.4" fill="${G}" ${L}/>`,
      wavy: `<path d="M33 80Q41.5 70 50 80T67 80" fill="none" stroke="${INK}" stroke-width="8.4" stroke-linecap="round"/><path d="M33 80Q41.5 70 50 80T67 80" fill="none" stroke="${G}" stroke-width="4" stroke-linecap="round"/>`,
      stitched: `<path d="M32 80H68" ${line(3.2)}/><path d="M36 75V85M42 75V85M48 75V85M54 75V85M60 75V85M66 75V85" ${line(2.4)}/>`,
    },
    // what is on top, drawn for a head whose top is at y=14 (shifted for the others); short, so that any hat covers it
    hair: {
      none: '',
      stem: `<path d="M43 18Q41 6 47 -1L57 -1Q59 8 57 18Z" fill="${STALK}" ${L}/><path d="M50 -1L51 7" ${line(1.6)}/>`,
      vine: `<path d="M43 18Q41 6 47 -1L57 -1Q59 8 57 18Z" fill="${STALK}" ${L}/><path d="M58 4Q72 -4 68 -12Q63 -17 60 -11Q60 -7 64 -8" ${line(2.8, '#4e7a24')}/><path d="M42 8Q30 6 28 -2Q40 -4 44 6Z" fill="${LEAF}" ${L} stroke-width="2.2"/>`,
      leaf: `<path d="M44 18Q44 6 50 0L56 18Z" fill="${STALK}" ${L} stroke-width="2.6"/><path d="M52 8Q68 -2 76 8Q66 18 52 8Z" fill="${LEAF}" ${L} stroke-width="2.6"/>`,
      candle: `<rect x="44" y="-6" width="12" height="22" rx="2" fill="#fbf3dc" ${L} stroke-width="2.6"/><path d="M50 -8Q44 -14 50 -22Q56 -14 50 -8Z" fill="${G}" ${L} stroke-width="2.2"/><path d="M44 2Q42 8 45 10" ${line(2, '#e8dcc0')}/>`,
      bats: `<path d="M26 -2Q30 -8 34 -2Q38 -8 42 -2Q38 0 34 4Q30 0 26 -2Z" fill="${INK}" stroke="none"/><path d="M60 -10Q63 -15 66 -10Q69 -15 72 -10Q69 -8 66 -4Q63 -8 60 -10Z" fill="${INK}" stroke="none"/><path d="M43 18Q41 8 46 3L55 3Q58 10 57 18Z" fill="${STALK}" ${L} stroke-width="2.6"/>`,
    },
    // marks on the pumpkin; the web, the stitches and the warts are clipped to the head
    extra: {
      none: '',
      cobweb: 'cobweb', stitches: 'stitches', warts: 'warts',
      scratches: `<g ${line(2.2)} opacity=".7"><path d="M64 30L72 44M69 28L76 40M60 32L66 46"/></g>`,
      blush: mirror(s => side(s, `<ellipse cx="22" cy="62" rx="7.4" ry="4.4" fill="#e8452a" opacity=".4"/>`)),
    },
  };

  // ---- hats: spooky versions of the usual eight; the brim line at y=0 and the crown going up. hatFor() puts one on a head --------------------------------
  const HAT = {
    none: '',
    pith: `<path d="M-23 0Q-23 -22 0 -24Q23 -22 23 0Z" fill="#e8c86a" ${L}/><path d="M-23 -5H23" ${line(2.6, '#7a4a1a')}/><path d="M-36 4Q0 -8 36 4Q30 11 0 11Q-30 11 -36 4Z" fill="#d6b150" ${L}/><path d="M-30 8L-34 15M-20 10L-22 17M20 10L22 17M30 8L34 15" ${line(2, STRAW)}/>`,
    sailor: `<path d="M-30 4Q-26 -22 0 -24Q26 -22 30 4Q0 -4 -30 4Z" fill="#1d1830" ${L}/><circle cy="-10" r="4" fill="#f4efe4" ${L} stroke-width="1.8"/><path d="M-1.6 -10h3.2M0 -11.6v3.2" ${line(1.2)}/>`,
    hard: `<path d="M-25 0Q-25 -27 0 -27Q25 -27 25 0Z" fill="#ff8a1f" ${L}/><path d="M-5 -27V-9H5V-27" fill="#c9650a" ${L} stroke-width="2.4"/><path d="M-33 0H33V6H-33Z" fill="#ff8a1f" ${L}/><path d="M-12 -14l4 -3 4 3 4 -3 4 3" ${line(2, INK)}/>`,
    beanie: `<path d="M-24 3Q-27 -24 0 -26Q27 -24 24 3Z" fill="#7b52a8" ${L}/><path d="M-24 -4H24V4H-24Z" fill="#ff9a2e" ${L} stroke-width="2.4"/><path d="M-20 -14Q0 -22 20 -14" ${line(3, '#ff9a2e')}/><circle cy="-30" r="5" fill="#fff6d8" ${L} stroke-width="2.4"/>`,
    bowler: `<path d="M-16 0V-31Q-16 -35 -12 -35H12Q16 -35 16 -31V0Z" fill="#1d1830" ${L}/><path d="M-16 -7H16" ${line(4.4, '#ff8a1f')}/><path d="M-27 2Q0 9 27 2Q27 -3 16 -4H-16Q-27 -3 -27 2Z" fill="#1d1830" ${L}/>`,
    party: `<path d="M-15 2L0 -38L15 2Z" fill="#fff6d8" ${L}/><path d="M-9 -12L9 -12L12 -2L-12 -2Z" fill="#ff9a2e" stroke="none"/><path d="M-5 -26L5 -26L9 -12L-9 -12Z" fill="#f2c94c" stroke="none"/><path d="M-15 2L0 -38L15 2Z" fill="none" ${L}/><circle cy="-40" r="3.8" fill="#ff9a2e" ${L} stroke-width="2.4"/>`,
    chef: `<path d="M-17 2V-8Q-30 -9 -25 -22Q-20 -35 0 -31Q20 -35 25 -22Q30 -9 17 -8V2Z" fill="#fff" ${L}/><ellipse cx="-7" cy="-18" rx="2.4" ry="3.6" fill="${INK}"/><ellipse cx="7" cy="-18" rx="2.4" ry="3.6" fill="${INK}"/><path d="M-17 -4H17" ${line(2)}/>`,
    wizard: `<path d="M-26 5L-4 -28Q0 -40 12 -38Q4 -34 6 -26L26 5Z" fill="#4a2a7a" ${L}/><path d="M-36 5Q0 -3 36 5Q30 13 0 13Q-30 13 -36 5Z" fill="#4a2a7a" ${L}/><path d="M-18 4H18L16 -3H-16Z" fill="#2a1840" stroke="none"/><rect x="-5" y="-4" width="10" height="9" rx="1.4" fill="${STRAW}" ${L} stroke-width="1.8"/>`,
  };
  const hatFor = (name, head = 'classic') => HAT[name] ? `<g transform="translate(50 ${headOf(head).top + 9}) rotate(-4) scale(.95)">${HAT[name]}</g>` : '';
  PARTS.hat = HAT;

  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra'];
  const names = (k) => Object.keys(PARTS[k]);
  const DEFAULT = { head: 'classic', ears: 'none', eyes: 'triangle', brows: 'none', nose: 'triangle', mouth: 'grin', hair: 'stem', extra: 'none', hat: 'none', skin: 'orange', hairColor: 'candle', scale: 1 };
  let uid = 0;

  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec }, h = headOf(s.head), [skin, skinDark] = SKIN[s.skin] || SKIN.orange;
    const id = `ha${++uid}`, pick = (k) => PARTS[k][s[k]] ?? '';
    const clipped = (inner) => `<clipPath id="${id}"><path d="${h.d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
    const ribs = clipped(`<g ${line(2.6, 'var(--skin-dark)')} opacity=".75"><path d="M34 ${h.top}C20 34 20 72 34 ${h.bottom}"/><path d="M66 ${h.top}C80 34 80 72 66 ${h.bottom}"/><path d="M50 ${h.top}V${h.bottom}" opacity=".6"/></g>`);
    const extra = s.extra === 'cobweb' ? clipped(`<g ${line(1.4)} opacity=".6"><path d="M96 10L62 44M96 10L74 52M96 10L84 58M96 10L90 62"/><path d="M84 22Q74 28 70 38M88 32Q80 38 78 46M76 14Q68 22 62 30"/></g>`)
      : s.extra === 'stitches' ? clipped(`<g ${line(2.4)}><path d="M26 ${h.top + 14}l4.4 6 4.4-6 4.4 6 4.4-6 4.4 6 4.4-6 4.4 6 4.4-6"/></g>`)
      : s.extra === 'warts' ? clipped(`<g fill="var(--skin-dark)" stroke="${INK}" stroke-width="1.8">${[[24, 40, 3.4], [72, 28, 2.8], [78, 66, 3.2], [20, 70, 2.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`)
      : pick('extra');
    const ears = pick('ears'), hair = pick('hair');
    return {
      style: `--skin:${skin};--skin-dark:${skinDark};--accent:${GLOW[s.hairColor] || GLOW.candle};--hair:${GLOW[s.hairColor] || GLOW.candle}`,
      ears: ears ? mirror(sd => side(sd, `<g transform="translate(${h.left - 10} 0)">${ears}</g>`)) : '',
      head: `<path d="${h.d}" fill="var(--skin)" ${L} stroke-width="3.4"/>${ribs}`,
      extra,
      hair: hair ? `<g transform="translate(0 ${h.top - 14})">${hair}</g>` : '',
      eyes: pick('eyes'), brows: pick('brows'), nose: pick('nose'), mouth: pick('mouth'), hat: hatFor(s.hat, s.head), scale: s.scale || 1,
    };
  }

  function compose(spec = {}, { size = 120, title = '' } = {}) {
    const p = pieces(spec), px = Math.round(size * (p.scale || 1));
    return `<svg class="face" viewBox="-12 -32 124 124" width="${px}" height="${px}" role="img" aria-label="${title || 'face'}" style="${p.style}">${p.ears}${p.head}${p.extra}${p.hair}${p.eyes}${p.brows}${p.nose}${p.mouth}${p.hat}</svg>`;
  }

  const headSpan = (head) => [headOf(head).top, headOf(head).bottom];

  // the expressions the card swaps in over the carved eyes, brows and mouth: eyes at x 36 and 64, y 48; the mouth at y 70 to 92
  function mood(ink = INK) {
    const st = `fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round"`;
    return `<g class="eye-closed" ${st} stroke-width="3.6"><path d="M28 49Q36 56 44 49M56 49Q64 56 72 49"/></g>
      <g class="eye-happy" ${st} stroke-width="3.6"><path d="M28 54Q36 43 44 54M56 54Q64 43 72 54"/></g>
      <g class="eye-sleepy" ${st} stroke-width="3.6"><path d="M28 49H44M56 49H72"/><path d="M30 49Q36 55 42 49M58 49Q64 55 70 49" stroke-width="2"/></g>
      <g class="eye-x" ${st} stroke-width="3.6"><path d="M30 42L42 54M42 42L30 54M58 42L70 54M70 42L58 54"/></g>
      <g class="dizzy-eyes" ${st} stroke-width="2.2"><circle cx="36" cy="48" r="9" fill="#fff"/><circle cx="64" cy="48" r="9" fill="#fff"/>
        <path d="M41 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(-5 -18)"/><path d="M59 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(5 -18)"/></g>
      <g class="worry-eyes"><circle cx="36" cy="48" r="9" fill="#fff" stroke="${ink}" stroke-width="2.8"/><circle cx="64" cy="48" r="9" fill="#fff" stroke="${ink}" stroke-width="2.8"/>
        <circle class="pupil" cx="37" cy="46" r="3.4" fill="${ink}"/><circle class="pupil" cx="63" cy="46" r="3.4" fill="${ink}"/></g>
      <path class="worry-brows" d="M25 40Q34 32 46 37M75 40Q66 32 54 37" ${st} stroke-width="3.8"/>
      <path class="brows" d="M26 35L46 43M74 35L54 43" ${st} stroke-width="4.4"/>
      <ellipse class="yawn" cx="50" cy="81" rx="8" ry="10" fill="${ink}"/>
      <path class="worry-mouth" d="M36 84Q43 76 50 84T64 84" ${st} stroke-width="3.6"/>`;
  }

  // a scarecrow: a patched jacket on a stick-thin frame, trousers and boots, with tufts of straw at the neck, the cuffs and the ankles. The jacket has an orange patch, stitched on.
  // Same joints and class names as any style (see BODY_CLASSES in ../faces.js), so the page's animation moves these too.
  function body(head) {
    const [top, bot] = headSpan(head), B = (bot - top) / 2;
    const neck = bot - 3, hip = bot + B * .4, shoulder = bot + B * .2, foot = bot + B;
    const lx = B * .22, ly = foot - hip, ax = B * .5, ay = B * .28;
    const f = n => +n.toFixed(2);
    const tube = (x, y, w, c) => `<path d="M0 0l${f(x)} ${f(y)}" stroke="${INK}" stroke-width="${w + 4.6}"/><path d="M0 0l${f(x)} ${f(y)}" stroke="${c}" stroke-width="${w}"/>`;
    const straw = `<path d="M-4 0L-8 -4M-1 -1L-3 -7M2 -1L4 -7M4 1L8 -3M4 3L9 4" stroke="${STRAW}" stroke-width="2.2" stroke-linecap="round"/>`;
    const tip = (kind, side) => kind === 'foot'
      ? `<ellipse cx="${side === 'l' ? -3 : 3}" cy="1.5" rx="8.4" ry="4.4" fill="#14101a" stroke-width="2.8"/><path d="M${side === 'l' ? -9 : 3} -3l${side === 'l' ? -3 : 3} -4M${side === 'l' ? -5 : 1} -4l0 -5" stroke="${STRAW}" stroke-width="2.2" stroke-linecap="round"/>`
      : straw;
    const limb = (b, sub, side, x, y, kind, w, c) => `<g class="${b} side-${side}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})">${tip(kind, side)}</g></g></g></g>`;
    const at = (x, y, inner) => `<g transform="translate(${f(x)} ${f(y)})">${inner}</g>`;
    const mid = (neck + hip) / 2;
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">`
        + `<g class="lower">${at(44, hip, limb('thigh', 'shin', 'l', -lx, ly, 'foot', 6.4, TROUSERS))}${at(56, hip, limb('thigh', 'shin', 'r', lx, ly, 'foot', 6.4, TROUSERS))}</g>`
        + `<g class="upper"><path d="M40 ${f(neck - 2)}L38 ${f(neck - 12)}M46 ${f(neck - 2)}L45 ${f(neck - 13)}M54 ${f(neck - 2)}L55 ${f(neck - 13)}M60 ${f(neck - 2)}L62 ${f(neck - 12)}" stroke="${STRAW}" stroke-width="2.4"/>`
        + `<rect class="torso" x="37" y="${f(neck)}" width="26" height="${f(hip - neck + 6)}" rx="5" fill="${JACKET}" stroke-width="3.2"/>`
        + `<rect x="${f(43)}" y="${f(mid)}" width="12" height="10" rx="1.4" fill="#ff9a2e" stroke-width="1.8" stroke-dasharray="2.4 2.4"/>`
        + `${at(36, shoulder, limb('arm', 'fore', 'l', -ax, ay, 'hand', 5.4, JACKET))}${at(64, shoulder, limb('arm', 'fore', 'r', ax, ay, 'hand', 5.4, JACKET))}`,
      close: '</g></g>' };
  }

  // a black iron crown with orange points and a gem (which twinkles), tilted a little
  const crown = (head) => `<g class="crown" transform="translate(50 ${headOf(head).top - 6}) rotate(-5)">
      <path d="M-16 10L-17 -8L-8 -1L0 -13L8 -1L17 -8L16 10Z" fill="#2a1f3a" stroke="#ff9a2e" stroke-width="2.8" stroke-linejoin="round"/>
      <circle class="gem" cx="0" cy="3.6" r="2.8" fill="var(--bean)"/>
    </g>`;

  function random(seed = Math.random() * 1e9) {
    const r = rng(seed | 0), pick = (list) => list[Math.floor(r() * list.length)];
    return { ...Object.fromEntries(ORDER.map(k => [k, pick(names(k))])), hat: 'none', skin: pick(Object.keys(SKIN)), hairColor: pick(Object.keys(GLOW)), scale: 1 };
  }

  // a relative keeps the head shape and the side pieces and the same kind of pumpkin or the next one over; the carving, the stalk and the marks are passed down or its own
  function derive(main, seed = 0) {
    return kin({ ...DEFAULT, ...main }, seed, {
      keep: { eyes: .5, mouth: .45, nose: .6, brows: .4, hair: .4, hairColor: .55, extra: .4 },
      pool: (k) => k === 'hairColor' ? Object.keys(GLOW) : names(k),
      tone: { key: 'skin', list: Object.keys(SKIN) },
    });
  }

  const colors = (table, i) => Object.fromEntries(Object.entries(table).map(([n, v]) => [n, i === null ? v : v[i]]));
  const editor = () => ({
    slots: [...ORDER, 'hat'].map(k => ({ key: k, options: names(k), fixed: false })),
    swatches: [{ key: 'skin', label: 'pumpkin', colors: colors(SKIN, 0) }, { key: 'hairColor', label: 'candle glow', colors: colors(GLOW, null) }],
  });

  return { name: 'halloween', label: 'Halloween', emoji: '🎃', description: 'Jack-o\'-lantern pumpkins with carved, glowing faces, on scarecrow bodies.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT };
})());
