// The "knitted" face style: hand-knitted toys. Wool heads with a knit-stitch texture, button and felt eyes, yarn hair and mouths sewn on in running stitch.
// The texture is one SVG pattern of little V stitches, laid over each wool piece (and used as a stroke on the limbs), defined inside the head piece.
// Its id is the same in every card and every copy is identical, so it doesn't matter which one the page resolves.
// A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat, skin, hairColor, scale }: `skin` is the head's wool and `hairColor` the yarn's.
// The contract a style has to meet is described at the top of ../faces.js.
Faces.register((() => {
  const { kin, rng } = Faces;
  const INK = '#4a3436', THREAD = '#3a2a2c', FELT_RED = '#d8444a', FELT_PINK = '#f29aa8', CREAM = '#f6f0e2', JUMPER = '#4a7ac0';
  const L = `stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`;
  const line = (w = 2.6, c = INK) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  // running stitch: a dashed thread
  const stitch = (d, w = 2.2, c = THREAD) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="3.4 2.6"/>`;
  const KNIT = 'url(#knit-stitch)';
  // a piece of wool: the colour, the stitches over it, then a soft outline
  const wool = (d, fill, w = 2.6) => `<path d="${d}" fill="${fill}"/><path d="${d}" fill="${KNIT}"/><path d="${d}" fill="none" ${L} stroke-width="${w}"/>`;
  const DEFS = `<defs><pattern id="knit-stitch" width="6" height="5" patternUnits="userSpaceOnUse"><path d="M.6 .4L3 4.2L5.4 .4" fill="none" stroke="#000" stroke-opacity=".16" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></pattern></defs>`;
  const mirror = (f) => f(1) + f(-1);
  const side = (s, body) => `<g transform="translate(${s < 0 ? 100 : 0} 0) scale(${s} 1)">${body}</g>`;

  const SKIN = {
    oatmeal: ['#e8d8b8', '#c8b48e'], rose: ['#eaa4a4', '#c87a7a'], sky: ['#9ac0e0', '#6e98c0'],
    sage: ['#a8c49a', '#80a070'], mustard: ['#e2b44c', '#bc8e2c'], lavender: ['#c2aad8', '#9a80b8'],
  };
  const YARN = { cherry: '#c8343a', chestnut: '#7a4a2a', ginger: '#d8742a', butter: '#f0d060', charcoal: '#3a3a40', cream: CREAM };

  // ---- heads: the outline, how far it reaches (the hat and the body hang from them) and where its left edge is (for the ears) -----------------------------
  const HEADS = {
    round:   { d: 'M12 52A38 38 0 1 0 88 52A38 38 0 1 0 12 52Z', top: 14, bottom: 90, left: 12 },
    sock:    { d: 'M24 92V36Q24 10 50 10Q76 10 76 36V92Z', top: 10, bottom: 92, left: 24 },
    cushion: { d: 'M20 18Q50 10 80 18Q88 52 80 86Q50 94 20 86Q12 52 20 18Z', top: 14, bottom: 90, left: 14 },
    egg:     { d: 'M50 10C70 10 82 34 82 56C82 78 68 92 50 92C32 92 18 78 18 56C18 34 30 10 50 10Z', top: 10, bottom: 92, left: 18 },
    wide:    { d: 'M10 56A40 34 0 1 0 90 56A40 34 0 1 0 10 56Z', top: 22, bottom: 90, left: 10 },
  };
  const headOf = (name) => HEADS[name] || HEADS.round;

  const PARTS = {
    head: Object.fromEntries(Object.keys(HEADS).map(k => [k, HEADS[k].d])),
    // side pieces, drawn behind the head for a head whose left edge is at x=20 (they are shifted for the others)
    ears: {
      none: '',
      bear: `${wool('M10 30A11 11 0 1 0 32 30A11 11 0 1 0 10 30Z', 'var(--skin)')}<circle cx="21" cy="30" r="5" fill="var(--skin-dark)"/>`,
      bunny: wool('M26 30Q14 -10 22 -14Q32 -14 34 24Z', 'var(--skin)'),
      pompom: `<g fill="var(--hair)" ${L} stroke-width="1.6">${[[14, 48], [10, 54], [14, 60], [20, 52], [18, 58]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</g>`,
    },
    eyes: {
      buttons: mirror(s => side(s, `<circle cx="36" cy="48" r="6.6" fill="var(--hair)" ${L} stroke-width="2"/><g fill="${CREAM}"><circle cx="34.2" cy="46.2" r="1.1"/><circle cx="37.8" cy="46.2" r="1.1"/><circle cx="34.2" cy="49.8" r="1.1"/><circle cx="37.8" cy="49.8" r="1.1"/></g><path d="M34.2 46.2L37.8 49.8M37.8 46.2L34.2 49.8" stroke="${THREAD}" stroke-width=".9"/>`)),
      safety: mirror(s => side(s, `<circle cx="36" cy="48" r="5.6" fill="#141016"/><ellipse cx="34.4" cy="46" rx="2" ry="1.4" fill="#fff" opacity=".85"/>`)),
      felt: mirror(s => side(s, `<circle cx="36" cy="48" r="8" fill="${CREAM}" ${L} stroke-width="1.6"/>${stitch('M30 48A6 6 0 1 0 42 48A6 6 0 1 0 30 48', 1, '#bbb')}<circle cx="37" cy="49" r="3.4" fill="#141016"/>`)),
      sewn: mirror(s => side(s, `<path d="M30 46Q36 53 42 46" ${line(2.6, THREAD)}/><path d="M31 47.6L29 50.6M36 49.6V53M41 47.6L43 50.6" ${line(1.6, THREAD)}/>`)),
      odd: `<circle cx="36" cy="48" r="7.6" fill="#3a7ac0" ${L} stroke-width="2"/><g fill="${CREAM}"><circle cx="34" cy="46" r="1.2"/><circle cx="38" cy="46" r="1.2"/><circle cx="34" cy="50" r="1.2"/><circle cx="38" cy="50" r="1.2"/></g>`
        + `<circle cx="64" cy="48" r="5" fill="${FELT_RED}" ${L} stroke-width="2"/><g fill="${CREAM}"><circle cx="62.8" cy="48" r="1"/><circle cx="65.2" cy="48" r="1"/></g>`,
      dots: mirror(s => side(s, `<circle cx="36" cy="48" r="3.4" fill="#141016"/>`)),
    },
    brows: {
      none: '',
      stitch: mirror(s => side(s, stitch('M28 38Q36 34 44 38', 2.2))),
      yarn: mirror(s => side(s, `<path d="M27 38Q31 34 35 37Q39 40 44 35" ${line(3.4, 'var(--hair)')}/>`)),
      felt: mirror(s => side(s, `<path d="M27 39Q36 31 45 38Q36 35 27 39Z" fill="var(--hair)" ${L} stroke-width="1.4"/>`)),
    },
    nose: {
      none: '',
      button: `<circle cx="50" cy="63" r="4.4" fill="var(--skin-dark)" ${L} stroke-width="1.8"/><circle cx="48.8" cy="63" r=".9" fill="${CREAM}"/><circle cx="51.2" cy="63" r=".9" fill="${CREAM}"/>`,
      stitched: `<path d="M45 60H55L50 67Z" fill="${THREAD}"/><path d="M46 61.6H54M47.4 63.4H52.6" stroke="${INK}" stroke-width=".8" opacity=".6"/>`,
      pompom: `<circle cx="50" cy="63" r="5" fill="${FELT_PINK}" ${L} stroke-width="1.6"/><circle cx="48.4" cy="61.4" r="1.4" fill="#fff" opacity=".6"/>`,
    },
    mouth: {
      smile: stitch('M38 74Q50 86 62 74', 2.4),
      cross: `<path d="M38 78L42 82M42 78L38 82M45 79L49 83M49 79L45 83M51 79L55 83M55 79L51 83M58 78L62 82M62 78L58 82" ${line(1.8, THREAD)}/>`,
      felt: `<path d="M38 74Q50 90 62 74Q50 80 38 74Z" fill="${FELT_RED}" ${L} stroke-width="1.8"/>`,
      oh: `<circle cx="50" cy="80" r="5.4" fill="${FELT_RED}" ${L} stroke-width="1.8"/><circle cx="50" cy="80" r="2.4" fill="${THREAD}"/>`,
      zigzag: `<path d="M38 80L42 76L46 80L50 76L54 80L58 76L62 80" ${line(2.2, THREAD)}/>`,
      tongue: `${stitch('M40 75Q50 83 60 75', 2.2)}<path d="M46 78Q46 86 50.4 86Q55 86 55 78Z" fill="${FELT_PINK}" ${L} stroke-width="1.6"/>`,
    },
    // yarn hair, drawn for a head whose top is at y=14 (shifted for the others)
    hair: {
      none: '',
      loops: `<g fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round">${[[22, 28], [30, 18], [41, 12], [52, 10], [63, 12], [72, 18], [79, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6"/>`).join('')}</g>`
        + `<g fill="none" stroke="var(--hair)" stroke-width="4" stroke-linecap="round">${[[22, 28], [30, 18], [41, 12], [52, 10], [63, 12], [72, 18], [79, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6"/>`).join('')}</g>`,
      strands: [...Array(11)].map((_, i) => { const x = 22 + i * 5.6; return `<path d="M${x} ${16 + Math.abs(i - 5) * 2}Q${x - 3} ${30 + Math.abs(i - 5)} ${x + 1} ${36 + Math.abs(i - 5) * 1.6}" fill="none" stroke="${INK}" stroke-width="5.4" stroke-linecap="round"/><path d="M${x} ${16 + Math.abs(i - 5) * 2}Q${x - 3} ${30 + Math.abs(i - 5)} ${x + 1} ${36 + Math.abs(i - 5) * 1.6}" fill="none" stroke="var(--hair)" stroke-width="3" stroke-linecap="round"/>`; }).join(''),
      pigtails: `${wool('M16 40Q18 12 50 10Q82 12 84 40Q66 26 50 28Q34 26 16 40Z', 'var(--hair)')}`
        + mirror(s => side(s, `${wool('M14 36Q2 44 4 62Q8 74 14 66Q12 52 20 42Z', 'var(--hair)')}<path d="M8 46H18" ${line(4, FELT_RED)}/>`)),
      tuft: `<g fill="none" stroke-linecap="round"><path d="M50 18Q44 2 36 4M50 18Q52 0 58 -2M50 18Q58 6 66 8" stroke="${INK}" stroke-width="5.6"/><path d="M50 18Q44 2 36 4M50 18Q52 0 58 -2M50 18Q58 6 66 8" stroke="var(--hair)" stroke-width="3.2"/></g>`,
      cap: `${wool('M14 42Q12 10 50 8Q88 10 86 42Q70 30 50 32Q30 30 14 42Z', 'var(--hair)')}${stitch('M18 38Q32 28 50 30Q68 28 82 38', 1.6, 'rgba(0,0,0,.35)')}`,
    },
    // things sewn onto the face
    extra: {
      none: '',
      cheeks: mirror(s => side(s, `<circle cx="27" cy="64" r="5.4" fill="${FELT_PINK}" ${L} stroke-width="1.2"/>`)),
      patch: `<path d="M62 24H78V38H62Z" fill="#e0c070" ${L} stroke-width="1.6" transform="rotate(8 70 31)"/>${stitch('M64 26H76V36H64Z', 1.2)}`,
      heart: `<path d="M72 74L66 68Q64 63 68 62Q71 62 72 65Q73 62 76 62Q80 63 78 68Z" fill="${FELT_RED}" ${L} stroke-width="1.4"/>`,
      knots: mirror(s => side(s, `<g fill="var(--skin-dark)"><circle cx="27" cy="60" r="1.6"/><circle cx="32" cy="63" r="1.6"/><circle cx="27" cy="66" r="1.6"/></g>`)),
      seam: stitch('M74 22Q84 52 74 84', 1.8),
    },
  };

  // ---- hats: knitted and felt; the brim line at y=0 and the crown going up. hatFor() puts one on a head ---------------------------------------------------
  const HAT = {
    none: '',
    pith: `${wool('M-22 0Q-22 -26 0 -28Q22 -26 22 0Z', '#d8c08a')}${wool('M-32 0H32V6H-32Z', '#b89a60')}`,
    sailor: `${wool('M-21 0Q-23 -18 0 -20Q23 -18 21 0Z', CREAM)}${wool('M-26 1Q0 8 26 1L22 -6Q0 0 -22 -6Z', JUMPER)}`,
    hard: `${wool('M-23 0Q-23 -25 0 -25Q23 -25 23 0Z', '#f2b62a')}${wool('M-30 0H30V5H-30Z', '#e0a420')}${stitch('M0 -24V-2', 1.6)}`,
    beanie: `${wool('M-22 3Q-25 -22 0 -24Q25 -22 22 3Z', FELT_RED)}${wool('M-23 -4H23V4H-23Z', CREAM)}<g fill="${CREAM}" ${L} stroke-width="1.4">${[[0, -30], [-4, -27], [4, -27], [-2, -33], [3, -33]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6"/>`).join('')}</g>`,
    bowler: `${wool('M-15 0V-30Q-15 -33 -12 -33H12Q15 -33 15 -30V0Z', '#3a3a40')}<path d="M-15 -8H15" ${line(3.6, FELT_RED)}/>${wool('M-26 2Q0 8 26 2Q26 -3 15 -4H-15Q-26 -3 -26 2Z', '#3a3a40')}`,
    party: `${wool('M-14 2L0 -38L14 2Z', '#3aa86a')}<circle cx="-3" cy="-10" r="2.2" fill="${CREAM}"/><circle cx="4" cy="-20" r="2.2" fill="${CREAM}"/><circle cy="-40" r="4.6" fill="#f0d060" ${L} stroke-width="1.8"/>`,
    chef: `${wool('M-16 2V-8Q-28 -9 -23 -22Q-18 -34 0 -30Q18 -34 23 -22Q28 -9 16 -8V2Z', CREAM)}${stitch('M-16 -4H16', 1.4)}`,
    wizard: `${wool('M-24 5L4 -42L24 5Z', '#6a4aa8')}${wool('M-33 0H33V9H-33Z', '#4a3080')}<path d="M2 -24L4 -19L9 -19L5 -16L7 -11L2 -14L-3 -11L-1 -16L-5 -19L0 -19Z" fill="#f0d060" ${L} stroke-width="1"/>`,
  };
  const hatFor = (name, head = 'round') => HAT[name] ? `<g transform="translate(50 ${headOf(head).top + 9}) rotate(-6) scale(.95)">${HAT[name]}</g>` : '';
  PARTS.hat = HAT;

  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra'];
  const names = (k) => Object.keys(PARTS[k]);
  const DEFAULT = { head: 'round', ears: 'bear', eyes: 'buttons', brows: 'none', nose: 'stitched', mouth: 'smile', hair: 'tuft', extra: 'cheeks', hat: 'none', skin: 'oatmeal', hairColor: 'chestnut', scale: 1 };

  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec }, h = headOf(s.head), [skin, skinDark] = SKIN[s.skin] || SKIN.oatmeal;
    const pick = (k) => PARTS[k][s[k]] ?? '', ears = pick('ears'), hair = pick('hair');
    return {
      style: `--skin:${skin};--skin-dark:${skinDark};--hair:${YARN[s.hairColor] || YARN.chestnut};--accent:${YARN[s.hairColor] || YARN.chestnut}`,
      ears: ears ? mirror(sd => side(sd, `<g transform="translate(${h.left - 20} 0)">${ears}</g>`)) : '',
      head: `${DEFS}${wool(h.d, 'var(--skin)', 3)}`,
      extra: pick('extra'),
      hair: hair ? `<g transform="translate(0 ${h.top - 14})">${hair}</g>` : '',
      eyes: pick('eyes'), brows: pick('brows'), nose: pick('nose'), mouth: pick('mouth'), hat: hatFor(s.hat, s.head), scale: s.scale || 1,
    };
  }

  function compose(spec = {}, { size = 120, title = '' } = {}) {
    const p = pieces(spec), px = Math.round(size * (p.scale || 1));
    return `<svg class="face" viewBox="-14 -32 128 128" width="${px}" height="${px}" role="img" aria-label="${title || 'face'}" style="${p.style}">${p.ears}${p.head}${p.extra}${p.hair}${p.eyes}${p.brows}${p.nose}${p.mouth}${p.hat}</svg>`;
  }

  const headSpan = (head) => [headOf(head).top, headOf(head).bottom];

  // the expressions the card swaps in over the spec's own eyes, brows and mouth: eyes at x 36 and 64, y 48; the mouth at y 74 to 90. Sewn in thread
  function mood(ink = THREAD) {
    const st = `fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round"`;
    return `<g class="eye-closed" ${st} stroke-width="2.8"><path d="M29 48Q36 54 43 48M57 48Q64 54 71 48"/></g>
      <g class="eye-happy" ${st} stroke-width="2.8"><path d="M29 52Q36 43 43 52M57 52Q64 43 71 52"/></g>
      <g class="eye-sleepy" ${st} stroke-width="2.8"><path d="M29 48H43M57 48H71"/><path d="M30 48L29 51.6M36 48V52M42 48L43 51.6M58 48L57 51.6M64 48V52M70 48L71 51.6" stroke-width="1.6"/></g>
      <g class="eye-x" ${st} stroke-width="3"><path d="M31 43L41 53M41 43L31 53M59 43L69 53M69 43L59 53"/></g>
      <g class="dizzy-eyes" ${st} stroke-width="2"><circle cx="36" cy="48" r="8" fill="${CREAM}"/><circle cx="64" cy="48" r="8" fill="${CREAM}"/>
        <path d="M41 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(-5 -18)"/><path d="M59 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(5 -18)"/></g>
      <g class="worry-eyes"><circle cx="36" cy="48" r="8" fill="${CREAM}" stroke="${ink}" stroke-width="2"/><circle cx="64" cy="48" r="8" fill="${CREAM}" stroke="${ink}" stroke-width="2"/>
        <circle class="pupil" cx="37" cy="46" r="3.4" fill="#141016"/><circle class="pupil" cx="63" cy="46" r="3.4" fill="#141016"/></g>
      <path class="worry-brows" d="M27 39Q36 33 45 37M73 39Q64 33 55 37" ${st} stroke-width="2.6" stroke-dasharray="3.4 2.6"/>
      <path class="brows" d="M28 34L45 41M72 34L55 41" ${st} stroke-width="3" stroke-dasharray="3.4 2.6"/>
      <g class="yawn"><ellipse cx="50" cy="81" rx="6.4" ry="8" fill="${ink}"/><ellipse cx="50" cy="85" rx="3.6" ry="2.2" fill="${FELT_PINK}"/></g>
      <path class="worry-mouth" d="M39 82L43 78L47 82L51 78L55 82L59 78L61 80" ${st} stroke-width="2.4"/>`;
  }

  // a striped knitted jumper and floppy wool limbs, the knit stitch running along them (the pattern used as a stroke).
  // Same joints and class names as any style (see BODY_CLASSES in ../faces.js), so the page's animation moves these too.
  function body(head) {
    const [top, bot] = headSpan(head), B = (bot - top) / 2;
    const neck = bot - 3, hip = bot + B * .42, shoulder = bot + B * .2, foot = bot + B;
    const lx = B * .2, ly = foot - hip, ax = B * .5, ay = B * .3;
    const f = n => +n.toFixed(2);
    const tube = (x, y, w, c) => `<path d="M0 0l${f(x)} ${f(y)}" stroke="${INK}" stroke-width="${w + 4}"/><path d="M0 0l${f(x)} ${f(y)}" stroke="${c}" stroke-width="${w}"/><path d="M0 0l${f(x)} ${f(y)}" stroke="${KNIT}" stroke-width="${w}"/>`;
    const tip = (kind, side) => kind === 'foot' ? `<ellipse cx="${side === 'l' ? -3 : 3}" cy="1.6" rx="7.4" ry="4.4" fill="${FELT_RED}" stroke-width="2.2"/>` : `<circle r="4.8" fill="var(--skin)" stroke-width="2.2"/>`;
    const limb = (b, sub, side, x, y, kind, w, c) => `<g class="${b} side-${side}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})">${tip(kind, side)}</g></g></g></g>`;
    const at = (x, y, inner) => `<g transform="translate(${f(x)} ${f(y)})">${inner}</g>`;
    const jumper = `M36 ${f(neck)}H64Q67 ${f(hip)} 64 ${f(hip + 6)}H36Q33 ${f(hip)} 36 ${f(neck)}Z`;
    const band = (y) => `<path d="M35 ${f(y)}H65" stroke="${CREAM}" stroke-width="3.4"/>`;
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none">`
        + `<g class="lower">${at(44, hip, limb('thigh', 'shin', 'l', -lx, ly, 'foot', 6.4, 'var(--skin)'))}${at(56, hip, limb('thigh', 'shin', 'r', lx, ly, 'foot', 6.4, 'var(--skin)'))}</g>`
        + `<g class="upper"><g class="torso"><path d="${jumper}" fill="${JUMPER}"/>${band(neck + 8)}${band(hip - 2)}<path d="${jumper}" fill="${KNIT}"/><path d="${jumper}" fill="none" stroke-width="2.6"/>${stitch(`M36 ${f(hip + 3)}H64`, 1.4, 'rgba(0,0,0,.3)')}</g>`
        + `${at(37, shoulder, limb('arm', 'fore', 'l', -ax, ay, 'hand', 5.6, JUMPER))}${at(63, shoulder, limb('arm', 'fore', 'r', ax, ay, 'hand', 5.6, JUMPER))}`,
      close: '</g></g>' };
  }

  // a felt crown sewn round the edge, with a button for the gem (which twinkles)
  const crown = (head) => `<g class="crown" transform="translate(50 ${headOf(head).top - 6}) rotate(-6)">
      <path d="M-16 10L-17 -8L-8 -1L0 -13L8 -1L17 -8L16 10Z" fill="#f0c030" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      ${stitch('M-13 7L-14 -3L-8 2L0 -8L8 2L14 -3L13 7Z', 1.2)}
      <circle class="gem" cx="0" cy="3.6" r="3.2" fill="var(--bean)" stroke="${INK}" stroke-width="1.4"/>
    </g>`;

  function random(seed = Math.random() * 1e9) {
    const r = rng(seed | 0), pick = (list) => list[Math.floor(r() * list.length)];
    return { ...Object.fromEntries(ORDER.map(k => [k, pick(names(k))])), hat: 'none', skin: pick(Object.keys(SKIN)), hairColor: pick(Object.keys(YARN)), scale: 1 };
  }

  // a relative keeps the head and ears and is knitted from a nearby wool; the eyes, the mouth and the hair are passed down or its own
  function derive(main, seed = 0) {
    return kin({ ...DEFAULT, ...main }, seed, {
      keep: { eyes: .55, mouth: .45, nose: .6, brows: .4, hair: .4, hairColor: .5, extra: .4 },
      pool: (k) => k === 'hairColor' ? Object.keys(YARN) : names(k),
      tone: { key: 'skin', list: Object.keys(SKIN) },
    });
  }

  const colors = (table, i) => Object.fromEntries(Object.entries(table).map(([n, v]) => [n, i === null ? v : v[i]]));
  const editor = () => ({
    slots: [...ORDER, 'hat'].map(k => ({ key: k, options: names(k), fixed: false })),
    swatches: [{ key: 'skin', label: 'wool', colors: colors(SKIN, 0) }, { key: 'hairColor', label: 'yarn', colors: colors(YARN, null) }],
  });

  // the map: a patchwork quilt. Every domain is a felt patch sewn on with running stitch, the base is a wicker sewing basket,
  // the ways are strands of yarn, and the web is a tangled ball of yarn (see map.js)
  const map = (() => {
    const KNIT = 'url(#knit-map-stitch)'; // the map's own copy of the stitch, so it never depends on a paw being drawn
    const QUILT = ['#f2d8c8', '#d8e4f0', '#e8e0c4', '#e2d4ea', '#d4e8d4'], FELT = ['#e8706a', '#6a9ad8', '#e8b84a', '#8ac06a', '#b08ad8', '#e88ab0'];
    const WICKER = '#c8944a', WICKER_DARK = '#8a5e2a';
    const f = n => +n.toFixed(1);
    const stitch = (d, c = THREAD) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="2.4" stroke-dasharray="7 6" stroke-linecap="round"/>`;
    const button = (x, y, r, c) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${c}" stroke="${INK}" stroke-width="2"/>${[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => `<circle cx="${f(x + a * r * .3)}" cy="${f(y + b * r * .3)}" r="${f(r * .14)}" fill="${INK}"/>`).join('')}`;
    const ball = (x, y, r, c) => `<g transform="translate(${f(x)} ${f(y)})"><circle r="${r}" fill="${c}" stroke="${INK}" stroke-width="2.4"/><circle r="${r}" fill="${KNIT}"/>`
      + `<path d="M${f(-r * .8)} ${f(-r * .3)}q${f(r * .8)} ${f(r * .6)} ${f(r * 1.6)} 0M${f(-r * .6)} ${f(r * .5)}q${f(r * .7)} ${f(-r * .7)} ${f(r * 1.3)} ${f(-r * .2)}M${f(-r * .2)} ${f(-r * .9)}q${f(r * .5)} ${f(r * .9)} ${f(r * .1)} ${f(r * 1.8)}" fill="none" stroke="${THREAD}" stroke-opacity=".5" stroke-width="1.6"/></g>`;
    return {
      backdrop: (w, h) => `<defs><pattern id="knit-map-stitch" width="6" height="5" patternUnits="userSpaceOnUse"><path d="M.6 .4L3 4.2L5.4 .4" fill="none" stroke="#000" stroke-opacity=".16" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></pattern><pattern id="knitted-quilt" width="240" height="240" patternUnits="userSpaceOnUse">
          ${[[0, 0, 0], [120, 0, 1], [0, 120, 2], [120, 120, 3]].map(([x, y, i]) => `<rect x="${x}" y="${y}" width="120" height="120" fill="${QUILT[i]}"/>`).join('')}
          <path d="M0 0H240M0 120H240M0 0V240M120 0V240" stroke="#a88a8a" stroke-width="2.4" stroke-dasharray="7 6"/><path d="M30 30l60 60M90 30l-60 60M150 150l60 60M210 150l-60 60" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
          <rect x="120" y="0" width="120" height="120" fill="url(#knit-map-stitch)"/><rect x="0" y="120" width="120" height="120" fill="url(#knit-map-stitch)"/></pattern></defs>
        <rect width="${w}" height="${h}" fill="url(#knitted-quilt)"/>`,
      // a wicker sewing basket full of yarn balls, with knitting needles stuck in
      base: () => `<ellipse cy="46" rx="112" ry="30" fill="#000" opacity=".12"/>`
        + `<path d="M-60 -50l120 -16M-50 -62l100 26" stroke="#a8a8b8" stroke-width="5" stroke-linecap="round"/><circle cx="62" cy="-66" r="5" fill="${FELT_RED}" stroke="${INK}" stroke-width="1.6"/><circle cx="52" cy="-36" r="5" fill="${JUMPER}" stroke="${INK}" stroke-width="1.6"/>`
        + ball(-44, -20, 26, FELT[0]) + ball(10, -28, 30, FELT[1]) + ball(52, -14, 22, FELT[2])
        + `<path d="M-90 -12h180l-14 60q-2 8-12 8h-128q-10 0-12-8z" fill="${WICKER}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`
        + [-1, 1, 3].map(i => `<path d="M-86 ${4 + i * 9}h172" stroke="${WICKER_DARK}" stroke-width="3" stroke-dasharray="10 6"/>`).join('')
        + `<rect x="-96" y="-18" width="192" height="12" rx="6" fill="${WICKER}" stroke="${INK}" stroke-width="3"/>`,
      // a felt patch, sewn on round its edge, with a button or two
      place: (name, seed, n) => { const r = 62 + Math.min(n, 4) * 3, rnd = rng(seed | 0), c = FELT[Math.floor(rnd() * FELT.length)], d = Faces.blob(r, seed, { bumps: 10, wob: .14, squash: .64 });
        return `<path d="${d}" fill="#000" opacity=".12" transform="translate(3 5)"/><path d="${d}" fill="${c}" stroke="${INK}" stroke-width="2.6"/><path d="${d}" fill="${KNIT}"/>`
          + `<g transform="scale(.86)">${stitch(d, CREAM)}</g>` + button(-r * .55, -r * .25, 7, CREAM) + (rnd() < .6 ? button(r * .6, r * .12, 5.5, FELT[Math.floor(rnd() * FELT.length)]) : ''); },
      // a tomato pincushion with pins in it
      building: (name, seed) => `<ellipse cy="6" rx="16" ry="11" fill="${FELT[(seed >>> 0) % FELT.length]}" stroke="${INK}" stroke-width="2"/><path d="M-8 -2q-2 8 0 16M0 -4v20M8 -2q2 8 0 16" fill="none" stroke="${INK}" stroke-opacity=".4" stroke-width="1.2"/>`
        + `<path d="M-6 -4l-4-10M3 -5l2-12M9 -2l6-8" stroke="#a8a8b8" stroke-width="1.6"/><circle cx="-10" cy="-14" r="2.4" fill="${JUMPER}"/><circle cx="5" cy="-17" r="2.4" fill="${CREAM}" stroke="${INK}" stroke-width=".8"/><circle cx="15" cy="-10" r="2.4" fill="#e8b84a"/>`,
      // a strand of yarn, wavy, from the basket to the patch
      route: (x1, y1, x2, y2) => { const n = 6, nx = -(y2 - y1) / Math.hypot(x2 - x1, y2 - y1 || 1), ny = (x2 - x1) / Math.hypot(x2 - x1, y2 - y1 || 1);
        let d = `M${x1} ${y1}`;
        for (let i = 1; i <= n; i++) { const t = i / n, c = (i - .5) / n, w = (i % 2 ? 14 : -14);
          d += `Q${f(x1 + (x2 - x1) * c + nx * w)} ${f(y1 + (y2 - y1) * c + ny * w)} ${f(x1 + (x2 - x1) * t)} ${f(y1 + (y2 - y1) * t)}`; }
        return `<path d="${d}" fill="none" stroke="${FELT_RED}" stroke-opacity=".75" stroke-width="4" stroke-linecap="round"/>`; },
      // a tangled ball of yarn: the web
      sea: () => ball(0, -22, 26, '#8ac06a') + `<path d="M-20 -6q-30 10-24 28t30 4q18-14 40-2t22-12" fill="none" stroke="#8ac06a" stroke-width="3.4" stroke-linecap="round"/><path d="M14 -40q22-18 34-2" fill="none" stroke="#8ac06a" stroke-width="3.4" stroke-linecap="round"/>`,
    };
  })();

  return { name: 'knitted', label: 'Knitted', emoji: '🧶', description: 'Hand-knitted toys with button eyes, yarn hair and a striped jumper.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT, map };
})());
