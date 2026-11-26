// The "tiki" face style: carved wooden masks. Tall heads of teak, koa or driftwood with a wood grain, big almond and shell-inlay eyes, broad flat noses,
// wide mouths full of flat teeth, painted bands, and leaves for hair. The body wears a grass skirt and a shell necklace; the crown is a fan of feathers.
// The grain is one shared SVG pattern laid over the head, defined inside the head piece (every copy is identical, so the page can resolve any).
// A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat, skin, hairColor, scale }: `skin` is the wood and `hairColor` the leaves.
// The contract a style has to meet is described at the top of ../faces.js.
Faces.register((() => {
  const { kin, rng } = Faces;
  const INK = '#2a160c', MOUTH = '#3a1a0e', TOOTH = '#f2e8d0', SHELL = '#f6efe0', RED = '#c83a2a', TEAL = '#2aa0a0', YELLOW = '#f0c040', GRASS = '#c8a050', GRASS_DARK = '#9a7430';
  const L = `stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
  const line = (w = 2.8, c = INK) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const DEFS = `<defs><pattern id="tiki-grain" width="9" height="40" patternUnits="userSpaceOnUse"><path d="M2 0Q5 10 2 20T2 40M6.5 0Q4 12 6.5 22T6.5 40" fill="none" stroke="#000" stroke-opacity=".13" stroke-width="1"/></pattern></defs>`;
  const mirror = (f) => f(1) + f(-1);
  const side = (s, body) => `<g transform="translate(${s < 0 ? 100 : 0} 0) scale(${s} 1)">${body}</g>`;

  const SKIN = {
    teak: ['#b87a44', '#8a5428'], mahogany: ['#9a5232', '#6e3420'], driftwood: ['#c8b496', '#a08c6e'],
    ebony: ['#5a4030', '#3a281c'], koa: ['#c8904a', '#a06c2c'], palm: ['#dcae6e', '#b4864a'],
  };
  const LEAF = { palm: '#4a9a3a', lime: '#8ac43a', teal: '#2a9a8a', ti: '#b8342a', gold: '#e0b42a', dry: '#9a7a3a' };

  // ---- heads: the outline, how far it reaches (the hat and the body hang from them) and where its left edge is (for the ears) -----------------------------
  const HEADS = {
    totem:  { d: 'M24 12H76Q82 12 82 18V86Q82 92 76 92H24Q18 92 18 86V18Q18 12 24 12Z', top: 12, bottom: 92, left: 18 },
    round:  { d: 'M12 52A38 38 0 1 0 88 52A38 38 0 1 0 12 52Z', top: 14, bottom: 90, left: 12 },
    tall:   { d: 'M50 4C70 4 78 24 78 48C78 74 68 94 50 94C32 94 22 74 22 48C22 24 30 4 50 4Z', top: 4, bottom: 94, left: 22 },
    crest:  { d: 'M20 22L36 10L50 18L64 10L80 22V84Q80 92 72 92H28Q20 92 20 84Z', top: 10, bottom: 92, left: 20 },
    wide:   { d: 'M10 34Q10 16 30 16H70Q90 16 90 34V74Q90 92 70 92H30Q10 92 10 74Z', top: 16, bottom: 92, left: 10 },
  };
  const headOf = (name) => HEADS[name] || HEADS.totem;

  const PARTS = {
    head: Object.fromEntries(Object.keys(HEADS).map(k => [k, HEADS[k].d])),
    // side pieces, drawn behind the head for a head whose left edge is at x=20 (they are shifted for the others)
    ears: {
      none: '',
      plugs: `<path d="M22 44Q10 44 10 56Q10 68 22 68Z" fill="var(--skin)" ${L}/><circle cx="15" cy="56" r="4.6" fill="${SHELL}" ${L} stroke-width="2"/>`,
      long: `<path d="M22 40Q8 42 8 60Q8 82 20 84L22 76Q14 72 14 60Q14 48 22 48Z" fill="var(--skin)" ${L}/>`,
      flower: `<g transform="translate(10 50)"><g fill="#f28ab0" ${L} stroke-width="1.6">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-6" rx="3.6" ry="6" transform="rotate(${a})"/>`).join('')}</g><circle r="2.6" fill="${YELLOW}" ${L} stroke-width="1.4"/></g>`,
    },
    eyes: {
      almond: mirror(s => side(s, `<path d="M24 48Q36 34 48 48Q36 58 24 48Z" fill="${INK}"/><path d="M27 48Q36 38 45 48Q36 55 27 48Z" fill="${SHELL}"/><circle cx="37" cy="48" r="4" fill="${INK}"/>`)),
      rims: mirror(s => side(s, `<circle cx="36" cy="48" r="10" fill="var(--skin-dark)" ${L}/><circle cx="36" cy="48" r="6" fill="${SHELL}" ${L} stroke-width="2.2"/><circle cx="36" cy="48" r="2.6" fill="${INK}"/>`)),
      slits: mirror(s => side(s, `<path d="M25 46L47 50L45 53L26 49Z" fill="${INK}"/>`)),
      spiral: mirror(s => side(s, `<circle cx="36" cy="48" r="9" fill="var(--skin-dark)" ${L}/><path d="M36 48m0-.2a1.4 1.4 0 1 1 2 1.6a3.6 3.6 0 1 1-5-4.2a6 6 0 1 1 7.8 7.4" ${line(2)}/>`)),
      shell: mirror(s => side(s, `<ellipse cx="36" cy="48" rx="10" ry="7.4" fill="${SHELL}" ${L}/><ellipse cx="36" cy="48" rx="3.2" ry="6" fill="${INK}"/>`)),
      angry: mirror(s => side(s, `<path d="M24 42L48 48Q38 58 26 50Z" fill="${INK}"/><path d="M28 45L44 49Q37 54 29 50Z" fill="${SHELL}"/><circle cx="37" cy="49.6" r="2.6" fill="${INK}"/>`)),
    },
    brows: {
      none: '',
      ridge: `<path d="M20 36Q36 28 50 34Q64 28 80 36V41Q64 34 50 40Q36 34 20 41Z" fill="var(--skin-dark)" ${L} stroke-width="2.6"/>`,
      arch: mirror(s => side(s, `<path d="M24 40Q36 26 48 38" ${line(3.6)}/>`)),
      zigzag: mirror(s => side(s, `<path d="M24 38L29 33L34 38L39 33L44 38L48 34" ${line(2.6)}/>`)),
    },
    nose: {
      none: '',
      wide: `<path d="M44 46Q42 58 36 64Q38 70 46 68Q50 72 54 68Q62 70 64 64Q58 58 56 46" fill="var(--skin-dark)" ${L}/><ellipse cx="42" cy="66" rx="2.4" ry="1.6" fill="${INK}"/><ellipse cx="58" cy="66" rx="2.4" ry="1.6" fill="${INK}"/>`,
      long: `<path d="M46 40V64Q42 66 44 70H56Q58 66 54 64V40" fill="var(--skin-dark)" ${L} stroke-width="2.6"/>`,
      hook: `<path d="M50 42Q40 60 42 68Q50 72 58 66Q52 66 54 56" fill="var(--skin-dark)" ${L} stroke-width="2.6"/>`,
    },
    mouth: {
      grin: `<path d="M24 72H76Q74 92 50 92Q26 92 24 72Z" fill="${MOUTH}" ${L}/><path d="M28 73H72V80H28Z" fill="${TOOTH}"/><path d="M34 73V80M40 73V80M46 73V80M52 73V80M58 73V80M64 73V80" ${line(1.4)}/>`,
      roar: `<ellipse cx="50" cy="80" rx="17" ry="12" fill="${MOUTH}" ${L}/><path d="M36 74L39 80L42 72L45 79L48 71L51 79L54 71L57 79L60 72L63 80L65 75Z" fill="${TOOTH}" stroke="${INK}" stroke-width="1"/><path d="M38 88L41 83L44 89L47 84L50 90L53 84L56 89L59 83L62 88Z" fill="${TOOTH}" stroke="${INK}" stroke-width="1"/>`,
      tongue: `<path d="M30 72H70Q68 86 50 86Q32 86 30 72Z" fill="${MOUTH}" ${L}/><path d="M34 73H66V78H34Z" fill="${TOOTH}"/><path d="M42 80Q42 98 50 98Q58 98 58 80Z" fill="${RED}" ${L} stroke-width="2.4"/><path d="M50 84V94" ${line(1.4)}/>`,
      flat: `<path d="M32 78H68" ${line(3.4)}/><path d="M32 74V82M68 74V82" ${line(2.4)}/>`,
      smile: `<path d="M32 74Q50 90 68 74Q50 82 32 74Z" fill="${MOUTH}" ${L}/><path d="M38 77Q50 82 62 77" ${line(1.6, TOOTH)}/>`,
      chomp: `<path d="M28 72H72V88H28Z" fill="${MOUTH}" ${L}/><path d="M28 80L33 74L38 80L43 74L48 80L53 74L58 80L63 74L68 80L72 75V73H28Z" fill="${TOOTH}" stroke="${INK}" stroke-width="1"/>`,
    },
    // leaves, feathers or carved spikes, drawn for a head whose top is at y=12 (shifted for the others)
    hair: {
      none: '',
      fronds: [-50, -28, -8, 8, 28, 50].map(a => `<g transform="rotate(${a} 50 16)"><path d="M50 16Q44 -6 50 -24Q56 -6 50 16Z" fill="var(--hair)" ${L} stroke-width="2.2"/><path d="M50 14V-20" ${line(1.2, 'rgba(0,0,0,.35)')}/></g>`).join(''),
      ti: mirror(s => side(s, `<path d="M40 16Q20 -4 14 -22Q30 -8 46 14Z" fill="var(--hair)" ${L} stroke-width="2.2"/><path d="M46 14Q40 -10 32 -28Q48 -12 50 14Z" fill="var(--hair)" ${L} stroke-width="2.2"/>`)),
      spikes: `<path d="M22 18L26 -4L34 14L40 -10L46 12L50 -14L54 12L60 -10L66 14L74 -4L78 18Z" fill="var(--skin-dark)" ${L}/>`,
      feathers: [[-30, '#c83a2a'], [-10, 'var(--hair)'], [10, '#f0c040'], [30, 'var(--hair)']].map(([a, c]) => `<g transform="rotate(${a} 50 18)"><path d="M50 18Q42 0 50 -24Q58 0 50 18Z" fill="${c}" ${L} stroke-width="2"/><path d="M50 16V-20" ${line(1.2)}/></g>`).join(''),
      tuft: `<path d="M30 16Q26 4 22 0M38 14Q36 0 34 -6M46 12Q46 -2 46 -10M54 12Q56 -2 58 -8M62 14Q66 2 70 -2M70 16Q76 8 80 6" ${line(5.6)}/><path d="M30 16Q26 4 22 0M38 14Q36 0 34 -6M46 12Q46 -2 46 -10M54 12Q56 -2 58 -8M62 14Q66 2 70 -2M70 16Q76 8 80 6" ${line(3, 'var(--hair)')}/>`,
    },
    // paint and carving on the face
    extra: {
      none: '',
      bands: mirror(s => side(s, `<path d="M20 58H32M20 63H32" ${line(3, RED)}/><path d="M20 68H32" ${line(3, YELLOW)}/>`)),
      dots: `<g fill="${SHELL}">${[[26, 62], [32, 66], [26, 70], [74, 62], [68, 66], [74, 70], [50, 26], [44, 28], [56, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8"/>`).join('')}</g>`,
      chevrons: `<path d="M38 24L50 18L62 24M40 30L50 25L60 30" ${line(3, TEAL)}/>`,
      stripe: `<path d="M50 14V36" ${line(5, RED)}/><path d="M50 14V36" ${line(1.6, YELLOW)}/>`,
      crack: `<path d="M70 18L66 30L72 36L68 48" ${line(1.8)}/>`,
    },
  };

  // ---- hats: island versions; the brim line at y=0 and the crown going up. hatFor() puts one on a head --------------------------------------------------
  const HAT = {
    none: '',
    pith: `<path d="M-22 0Q-22 -26 0 -28Q22 -26 22 0Z" fill="#e0c890" ${L}/><path d="M-22 -6H22" ${line(3, RED)}/><path d="M-33 3Q0 -6 33 3Q29 10 0 10Q-29 10 -33 3Z" fill="#c8a868" ${L}/>`,
    sailor: `<path d="M-21 0Q-23 -18 0 -20Q23 -18 21 0Z" fill="#f4efe4" ${L}/><path d="M-26 1Q0 8 26 1L22 -6Q0 0 -22 -6Z" fill="${TEAL}" ${L}/>`,
    hard: `<path d="M-23 0Q-23 -25 0 -25Q23 -25 23 0Z" fill="#f2b62a" ${L}/><path d="M-4 -25V-8H4V-25" fill="#d0961a" ${L} stroke-width="2.2"/><path d="M-30 0H30V5H-30Z" fill="#f2b62a" ${L}/>`,
    beanie: `<path d="M-22 3Q-25 -22 0 -24Q25 -22 22 3Z" fill="${TEAL}" ${L}/><path d="M-23 -4H23V4H-23Z" fill="${YELLOW}" ${L} stroke-width="2.2"/><circle cy="-27" r="4.6" fill="${RED}" ${L} stroke-width="2.2"/>`,
    bowler: `<path d="M-30 2Q0 -10 30 2Q0 8 -30 2Z" fill="#e0c890" ${L}/><path d="M-14 -2Q-14 -20 0 -20Q14 -20 14 -2Z" fill="#e0c890" ${L}/><path d="M-14 -5H14" ${line(3, RED)}/>`,
    party: `<path d="M-14 2L0 -38L14 2Z" fill="${RED}" ${L}/><path d="M-9 -12H9M-5 -24H5" ${line(2.4, YELLOW)}/><circle cy="-40" r="4.4" fill="${YELLOW}" ${L} stroke-width="2.2"/>`,
    chef: `<path d="M-16 2V-8Q-28 -9 -23 -22Q-18 -34 0 -30Q18 -34 23 -22Q28 -9 16 -8V2Z" fill="#f4efe4" ${L}/><path d="M-16 -4H16" ${line(1.8)}/>`,
    wizard: `<path d="M-24 5L4 -42L24 5Z" fill="#2a5a7a" ${L}/><ellipse cy="5" rx="33" ry="6.6" fill="#2a5a7a" ${L}/><path d="M-10 -8L4 -16L14 -8" ${line(2.4, YELLOW)}/><circle cx="2" cy="-26" r="2.2" fill="${YELLOW}"/>`,
  };
  const hatFor = (name, head = 'totem') => HAT[name] ? `<g transform="translate(50 ${headOf(head).top + 8}) rotate(-5) scale(.95)">${HAT[name]}</g>` : '';
  PARTS.hat = HAT;

  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra'];
  const names = (k) => Object.keys(PARTS[k]);
  const DEFAULT = { head: 'totem', ears: 'plugs', eyes: 'shell', brows: 'ridge', nose: 'wide', mouth: 'grin', hair: 'fronds', extra: 'bands', hat: 'none', skin: 'teak', hairColor: 'palm', scale: 1 };

  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec }, h = headOf(s.head), [skin, skinDark] = SKIN[s.skin] || SKIN.teak;
    const pick = (k) => PARTS[k][s[k]] ?? '', ears = pick('ears'), hair = pick('hair');
    return {
      style: `--skin:${skin};--skin-dark:${skinDark};--hair:${LEAF[s.hairColor] || LEAF.palm};--accent:${LEAF[s.hairColor] || LEAF.palm}`,
      ears: ears ? mirror(sd => side(sd, `<g transform="translate(${h.left - 20} 0)">${ears}</g>`)) : '',
      head: `${DEFS}<path d="${h.d}" fill="var(--skin)"/><path d="${h.d}" fill="url(#tiki-grain)"/><path d="${h.d}" fill="none" ${L} stroke-width="3.6"/>`,
      extra: pick('extra'),
      hair: hair ? `<g transform="translate(0 ${h.top - 12})">${hair}</g>` : '',
      eyes: pick('eyes'), brows: pick('brows'), nose: pick('nose'), mouth: pick('mouth'), hat: hatFor(s.hat, s.head), scale: s.scale || 1,
    };
  }

  function compose(spec = {}, { size = 120, title = '' } = {}) {
    const p = pieces(spec), px = Math.round(size * (p.scale || 1));
    return `<svg class="face" viewBox="-14 -32 128 128" width="${px}" height="${px}" role="img" aria-label="${title || 'face'}" style="${p.style}">${p.ears}${p.head}${p.extra}${p.hair}${p.eyes}${p.brows}${p.nose}${p.mouth}${p.hat}</svg>`;
  }

  const headSpan = (head) => [headOf(head).top, headOf(head).bottom];

  // the expressions the card swaps in over the spec's own eyes, brows and mouth: eyes at x 36 and 64, y 48; the mouth at y 72 to 92. Carved, like the rest
  function mood(ink = INK) {
    const st = `fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round"`;
    return `<g class="eye-closed" ${st} stroke-width="3.6"><path d="M25 48Q36 56 47 48M53 48Q64 56 75 48"/></g>
      <g class="eye-happy" ${st} stroke-width="3.6"><path d="M25 53Q36 41 47 53M53 53Q64 41 75 53"/></g>
      <g class="eye-sleepy" ${st} stroke-width="3.6"><path d="M25 48H47M53 48H75"/><path d="M28 48Q36 54 44 48M56 48Q64 54 72 48" stroke-width="2"/></g>
      <g class="eye-x" ${st} stroke-width="3.6"><path d="M29 41L43 55M43 41L29 55M57 41L71 55M71 41L57 55"/></g>
      <g class="dizzy-eyes" ${st} stroke-width="2.4"><ellipse cx="36" cy="48" rx="10" ry="8" fill="${SHELL}"/><ellipse cx="64" cy="48" rx="10" ry="8" fill="${SHELL}"/>
        <path d="M41 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(-5 -18)"/><path d="M59 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(5 -18)"/></g>
      <g class="worry-eyes"><ellipse cx="36" cy="48" rx="10" ry="8" fill="${SHELL}" stroke="${ink}" stroke-width="3"/><ellipse cx="64" cy="48" rx="10" ry="8" fill="${SHELL}" stroke="${ink}" stroke-width="3"/>
        <circle class="pupil" cx="37" cy="46" r="3.6" fill="${ink}"/><circle class="pupil" cx="63" cy="46" r="3.6" fill="${ink}"/></g>
      <path class="worry-brows" d="M24 40Q35 31 47 36M76 40Q65 31 53 36" ${st} stroke-width="4"/>
      <path class="brows" d="M24 33L47 41M76 33L53 41" ${st} stroke-width="4.6"/>
      <g class="yawn"><ellipse cx="50" cy="82" rx="10" ry="10" fill="${ink}"/><path d="M42 76H58V79H42Z" fill="${TOOTH}"/></g>
      <path class="worry-mouth" d="M34 84L40 78L46 84L52 78L58 84L64 78L66 80" ${st} stroke-width="3.2"/>`;
  }

  // a carved wooden torso with a shell necklace, wooden limbs and a grass skirt (in front of the thighs, so it sways with the legs' group).
  // Same joints and class names as any style (see BODY_CLASSES in ../faces.js), so the page's animation moves these too.
  function body(head) {
    const [top, bot] = headSpan(head), B = (bot - top) / 2;
    const neck = bot - 3, hip = bot + B * .4, shoulder = bot + B * .2, foot = bot + B;
    const lx = B * .22, ly = foot - hip, ax = B * .5, ay = B * .28;
    const f = n => +n.toFixed(2);
    const tube = (x, y, w, c) => `<path d="M0 0l${f(x)} ${f(y)}" stroke="${INK}" stroke-width="${w + 4.4}"/><path d="M0 0l${f(x)} ${f(y)}" stroke="${c}" stroke-width="${w}"/>`;
    const tip = (kind, side) => kind === 'foot' ? `<ellipse cx="${side === 'l' ? -3 : 3}" cy="1.5" rx="7" ry="3.8" fill="var(--skin-dark)" stroke-width="2.6"/>` : `<circle r="4.6" fill="var(--skin)" stroke-width="2.6"/>`;
    const limb = (b, sub, side, x, y, kind, w, c) => `<g class="${b} side-${side}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})">${tip(kind, side)}</g></g></g></g>`;
    const at = (x, y, inner) => `<g transform="translate(${f(x)} ${f(y)})">${inner}</g>`;
    const len = ly * .55, blades = [...Array(13)].map((_, i) => { const x = 33 + i * 2.8, c = i % 2 ? GRASS : GRASS_DARK; return `<path d="M${f(x)} ${f(hip)}Q${f(x - 1.4)} ${f(hip + len / 2)} ${f(x + (i - 6) * .5)} ${f(hip + len)}" stroke="${c}" stroke-width="3.6"/>`; }).join('');
    const skirt = `<path d="M32 ${f(hip - 2)}H68V${f(hip + 3)}H32Z" fill="${GRASS_DARK}" stroke-width="2.2"/>${blades}`;
    const beads = [36, 40.5, 45, 50, 55, 59.5, 64].map((x, i) => `<ellipse cx="${x}" cy="${f(neck + 2 + Math.sin((i / 6) * Math.PI) * 5)}" rx="2.2" ry="2.8" fill="${SHELL}" stroke-width="1.2"/>`).join('');
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" stroke="${INK}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none">`
        + `<g class="lower">${at(44, hip, limb('thigh', 'shin', 'l', -lx, ly, 'foot', 6.2, 'var(--skin)'))}${at(56, hip, limb('thigh', 'shin', 'r', lx, ly, 'foot', 6.2, 'var(--skin)'))}${skirt}</g>`
        + `<g class="upper"><g class="torso"><path d="M37 ${f(neck)}H63Q66 ${f(hip)} 64 ${f(hip + 1)}H36Q34 ${f(hip)} 37 ${f(neck)}Z" fill="var(--skin)" stroke-width="3"/>`
        + `<path d="M40 ${f(hip - 7)}H60" stroke="${RED}" stroke-width="2.4"/>${beads}</g>`
        + `${at(37, shoulder, limb('arm', 'fore', 'l', -ax, ay, 'hand', 5.6, 'var(--skin)'))}${at(63, shoulder, limb('arm', 'fore', 'r', ax, ay, 'hand', 5.6, 'var(--skin)'))}`,
      close: '</g></g>' };
  }

  // a fan of feathers standing up from a carved band, with a shell for the gem (which twinkles)
  const crown = (head) => `<g class="crown" transform="translate(50 ${headOf(head).top - 4})">
      ${[[-36, RED], [-18, YELLOW], [0, TEAL], [18, YELLOW], [36, RED]].map(([a, c]) => `<g transform="rotate(${a} 0 6)"><path d="M0 6Q-6 -8 0 -22Q6 -8 0 6Z" fill="${c}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/></g>`).join('')}
      <path d="M-14 2H14V9H-14Z" fill="#8a5428" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
      <circle class="gem" cx="0" cy="5.4" r="3" fill="var(--bean)" stroke="${INK}" stroke-width="1.6"/>
    </g>`;

  function random(seed = Math.random() * 1e9) {
    const r = rng(seed | 0), pick = (list) => list[Math.floor(r() * list.length)];
    return { ...Object.fromEntries(ORDER.map(k => [k, pick(names(k))])), hat: 'none', skin: pick(Object.keys(SKIN)), hairColor: pick(Object.keys(LEAF)), scale: 1 };
  }

  // a relative keeps the head and ears and is carved from a nearby wood; the eyes, the mouth and the leaves are passed down or its own
  function derive(main, seed = 0) {
    return kin({ ...DEFAULT, ...main }, seed, {
      keep: { eyes: .55, mouth: .45, nose: .6, brows: .4, hair: .4, hairColor: .5, extra: .4 },
      pool: (k) => k === 'hairColor' ? Object.keys(LEAF) : names(k),
      tone: { key: 'skin', list: Object.keys(SKIN) },
    });
  }

  const colors = (table, i) => Object.fromEntries(Object.entries(table).map(([n, v]) => [n, i === null ? v : v[i]]));
  const editor = () => ({
    slots: [...ORDER, 'hat'].map(k => ({ key: k, options: names(k), fixed: false })),
    swatches: [{ key: 'skin', label: 'wood', colors: colors(SKIN, 0) }, { key: 'hairColor', label: 'leaves', colors: colors(LEAF, null) }],
  });

  // the map: a lagoon of small islands, one per domain, round a big home island with a longhouse and a dock (see map.js)
  const map = (() => {
    const SEA = '#1f8fb0', DEEP = '#13607e', SHALLOW = '#6fd3d0', SAND = '#f0d79a', SAND_DARK = '#d7b46a', TURF = '#6fae3e', TURF_DARK = '#4f8a2e', WOOD = '#9a5a2c', THATCH = '#d2a24c';
    // a soft lumpy outline round 0,0: the same seed always gives the same island
    const blob = (r, seed, bumps = 13, wob = 0.16, squash = 0.82) => Faces.blob(r, seed, { bumps, wob, squash });
    const island = (r, seed) => `<path d="${blob(r * 1.22, seed + 7, 11, .1)}" fill="${SHALLOW}" opacity=".55"/>`
      + `<path d="${blob(r, seed)}" fill="${SAND}" stroke="${SAND_DARK}" stroke-width="3"/>`
      + `<path d="${blob(r * .68, seed + 3)}" transform="translate(0 -4)" fill="${TURF}" stroke="${TURF_DARK}" stroke-width="2.5"/>`;
    const palm = (x, y, lean = 1, k = 1) => {
      const tx = x + 10 * lean * k, ty = y - 44 * k;
      const fronds = [-150, -110, -70, -30, 10, -170].map(a => { const r = a * Math.PI / 180, ex = tx + Math.cos(r) * 26 * k, ey = ty + Math.sin(r) * 16 * k + 8 * k;
        return `<path d="M${tx} ${ty}Q${(tx + ex) / 2} ${ty - 12 * k} ${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="${TURF_DARK}" stroke-width="${7 * k}" fill="none" stroke-linecap="round"/>`; }).join('');
      return `<path d="M${x} ${y}Q${x + 2 * lean * k} ${y - 26 * k} ${tx} ${ty}" stroke="${INK}" stroke-width="${7.5 * k}" fill="none" stroke-linecap="round"/>`
        + `<path d="M${x} ${y}Q${x + 2 * lean * k} ${y - 26 * k} ${tx} ${ty}" stroke="${WOOD}" stroke-width="${4.5 * k}" fill="none" stroke-linecap="round" stroke-dasharray="${5 * k} ${1.5 * k}"/>`
        + fronds + `<circle cx="${tx}" cy="${ty + 3 * k}" r="${3.2 * k}" fill="#6a4020"/>`;
    };
    const hut = (w = 30) => { const h = w * .55, f = n => +n.toFixed(1);
      return `<rect x="${f(-w * .36)}" y="${f(-h * .2)}" width="${f(w * .72)}" height="${f(h * .75)}" fill="${WOOD}" stroke="${INK}" stroke-width="2"/>`
        + `<rect x="${f(-w * .1)}" y="${f(h * .1)}" width="${f(w * .2)}" height="${f(h * .45)}" rx="2" fill="${INK}"/>`
        + `<path d="M${f(-w * .55)} ${f(-h * .1)}L0 ${f(-h * 1.15)}L${f(w * .55)} ${f(-h * .1)}Z" fill="${THATCH}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`
        + `<path d="M${f(-w * .3)} ${f(-h * .4)}h${f(w * .6)}M${f(-w * .18)} ${f(-h * .72)}h${f(w * .36)}" stroke="${GRASS_DARK}" stroke-width="1.6"/>`; };
    return {
      backdrop: (w, h) => `<defs><radialGradient id="tiki-lagoon" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="${SEA}"/><stop offset="1" stop-color="${DEEP}"/></radialGradient>
        <pattern id="tiki-waves" width="90" height="60" patternUnits="userSpaceOnUse"><path d="M8 18q7-6 14 0t14 0M52 48q7-6 14 0t14 0" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2.4" stroke-linecap="round"/></pattern></defs>
        <rect width="${w}" height="${h}" fill="url(#tiki-lagoon)"/><rect width="${w}" height="${h}" fill="url(#tiki-waves)"/>`,
      base: (seed) => island(100, seed)
        + `<path d="M-14 70h28v70h-28z" fill="${WOOD}" stroke="${INK}" stroke-width="2.5"/><path d="M-14 84h28M-14 98h28M-14 112h28M-14 126h28" stroke="${INK}" stroke-width="1.4" opacity=".6"/>`
        + palm(-80, -4, -1, 1) + palm(76, -10, 1, .9)
        + `<g transform="translate(0 -38)"><rect x="-46" y="-6" width="92" height="30" fill="${WOOD}" stroke="${INK}" stroke-width="2.5"/><rect x="-46" y="-6" width="92" height="30" fill="url(#tiki-grain)"/>
          <rect x="-9" y="4" width="18" height="20" rx="3" fill="${INK}"/><path d="M-58 -2L-36 -40H36L58 -2Z" fill="${THATCH}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M-44 -14h88M-38 -27h76" stroke="${GRASS_DARK}" stroke-width="2"/><path d="M-36 -40l-6-10M36 -40l6-10" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></g>`,
      place: (name, seed, n) => { const r = 64 + Math.min(n, 4) * 3, rnd = rng(seed | 0), lean = rnd() < .5 ? -1 : 1;
        return island(r, seed) + palm(lean * (r * .62), -r * .32, lean, .8) + (rnd() < .5 ? palm(-lean * r * .7, r * .05, -lean, .65) : ''); },
      building: () => hut(30),
      route: (x1, y1, x2, y2) => { const mx = (x1 + x2) / 2 + (y2 - y1) * .12, my = (y1 + y2) / 2 - (x2 - x1) * .12;
        return `<path d="M${x1} ${y1}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2} ${y2}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-dasharray="1 14" stroke-linecap="round"/>`; },
      sea: () => `<path d="${blob(34, 5, 9, .3)}" fill="#7d7468" stroke="${INK}" stroke-width="2.5"/>`
        + `<rect x="-5" y="-58" width="10" height="56" fill="${WOOD}" stroke="${INK}" stroke-width="2"/><path d="M-5 -44h10M-5 -30h10" stroke="${RED}" stroke-width="4"/>`
        + `<circle cy="-66" r="22" fill="${YELLOW}" opacity=".25"/><path d="M0 -82q11 9 5 18q-5 6-10 0q-6-9 5-18z" fill="#f08a24" stroke="${INK}" stroke-width="2"/><path d="M0 -74q5 5 2 9q-3 3-5 0q-2-5 3-9z" fill="${YELLOW}"/>`,
    };
  })();

  return { name: 'tiki', label: 'Tiki', emoji: '🌴', description: 'Carved wooden tiki masks with flat teeth, painted bands, leaf hair and a grass skirt.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT, map };
})());
