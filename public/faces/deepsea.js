// The "deepsea" face style: creatures from the deep. Anglerfish, jellyfish, squid, pufferfish and blobfish heads in abyssal blues and violets,
// with glowing (bioluminescent) spots, lures and eyes. The glow is one blur filter, defined inside the head piece and shared by every glowing bit.
// The main agent's crown is a lure: a stalk curling up from the head with a glowing bulb as its gem. The body is a frilly mantle over tentacle legs,
// with a fish tail behind (class tail, which the page's CSS swishes).
// A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat, skin, hairColor, scale }: `hairColor` is the colour of the glow.
// The contract a style has to meet is described at the top of ../faces.js.
Faces.register((() => {
  const { kin, rng } = Faces;
  const INK = '#0c1622', MOUTH = '#1a0c1e', TOOTH = '#f4f6ee', EYE = '#e8f4f4';
  const L = `stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
  const line = (w = 2.8, c = INK) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  // ids are the same in every card and every copy is identical, so it doesn't matter which one the page resolves
  const DEFS = `<defs><filter id="deepsea-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  const GLOW = 'filter="url(#deepsea-glow)"';
  const mirror = (f) => f(1) + f(-1);
  const side = (s, body) => `<g transform="translate(${s < 0 ? 100 : 0} 0) scale(${s} 1)">${body}</g>`;
  const f1 = n => +n.toFixed(1);

  const SKIN = {
    abyss: ['#3a5a8a', '#24406a'], violet: ['#6a4a9a', '#4a3074'], teal: ['#2a7a8a', '#1a5866'],
    jelly: ['#e8a0d0', '#c278ae'], blob: ['#ecbcbc', '#cc9696'], ghost: ['#c8d8f0', '#9cb0d0'],
  };
  const GLOWS = { cyan: '#8af4f0', lime: '#c4f46a', pink: '#ff9ae0', gold: '#ffd86a', blue: '#8ab4ff', white: '#f4fbff' };

  // a pufferfish: a circle bristling with spines
  const spiky = 'M' + [...Array(32)].map((_, i) => { const a = i / 32 * Math.PI * 2, r = i % 2 ? 34 : 40; return `${f1(50 + r * Math.sin(a))} ${f1(52 - r * Math.cos(a))}`; }).join('L') + 'Z';

  // ---- heads: the outline, how far it reaches (the hat and the body hang from them) and where its left edge is (for the ears) -----------------------------
  const HEADS = {
    angler: { d: 'M14 54Q12 20 50 16Q88 20 86 54Q86 82 50 90Q14 82 14 54Z', top: 16, bottom: 90, left: 14 },
    jelly:  { d: 'M12 86Q8 14 50 10Q92 14 88 86Q80 80 74 88Q66 80 58 88Q50 80 42 88Q34 80 26 88Q20 80 12 86Z', top: 10, bottom: 88, left: 10 },
    squid:  { d: 'M50 2L76 34Q82 60 74 82Q64 92 50 92Q36 92 26 82Q18 60 24 34Z', top: 2, bottom: 92, left: 20 },
    puffer: { d: spiky, top: 12, bottom: 92, left: 10 },
    blob:   { d: 'M50 14Q80 14 84 44Q88 70 74 86Q62 94 50 92Q38 94 26 86Q12 70 16 44Q20 14 50 14Z', top: 14, bottom: 93, left: 16 },
  };
  const headOf = (name) => HEADS[name] || HEADS.angler;

  const PARTS = {
    head: Object.fromEntries(Object.keys(HEADS).map(k => [k, HEADS[k].d])),
    // side pieces, drawn behind the head for a head whose left edge is at x=20 (they are shifted for the others)
    ears: {
      none: '',
      fins: `<path d="M24 56Q4 44 0 60Q6 74 24 66Z" fill="var(--skin-dark)" ${L} stroke-width="2.6"/><path d="M20 58L6 56M20 62L6 64" ${line(1.6)}/>`,
      gills: `<path d="M24 46Q8 40 6 50Q2 56 8 62Q4 70 14 72Q18 76 24 70Z" fill="#e06a8a" ${L} stroke-width="2.4"/>`,
      wings: `<path d="M24 30L4 18L14 50L24 52Z" fill="var(--skin-dark)" ${L} stroke-width="2.6"/>`,
    },
    eyes: {
      big: mirror(s => side(s, `<circle cx="35" cy="48" r="10" fill="${EYE}" ${L} stroke-width="2.6"/><circle cx="36" cy="49" r="6.6" fill="${INK}"/><circle cx="38.4" cy="46" r="2.4" fill="#fff"/><circle cx="33.6" cy="52" r="1.1" fill="#fff"/>`)),
      tiny: mirror(s => side(s, `<circle cx="36" cy="48" r="2.4" fill="${INK}"/>`)),
      glow: mirror(s => side(s, `<circle cx="36" cy="48" r="7" fill="var(--glow)" ${GLOW}/><circle cx="36" cy="48" r="2.6" fill="${INK}"/>`)),
      odd: `<circle cx="34" cy="47" r="11" fill="${EYE}" ${L} stroke-width="2.6"/><circle cx="35" cy="48" r="7" fill="${INK}"/><circle cx="37.6" cy="45" r="2.4" fill="#fff"/>`
        + `<circle cx="66" cy="50" r="4.4" fill="${EYE}" ${L} stroke-width="2.2"/><circle cx="66" cy="50.6" r="2.2" fill="${INK}"/>`,
      lidded: mirror(s => side(s, `<circle cx="36" cy="48" r="8" fill="${EYE}" ${L} stroke-width="2.6"/><circle cx="36" cy="51" r="4" fill="${INK}"/><path d="M27.8 48A8 8 0 0 1 44.2 48Z" fill="var(--skin-dark)" ${L} stroke-width="2.6"/>`)),
      void: mirror(s => side(s, `<ellipse cx="36" cy="48" rx="7" ry="8" fill="${INK}"/><circle cx="38.6" cy="45" r="1.8" fill="var(--glow)"/>`)),
    },
    brows: {
      none: '',
      ridge: mirror(s => side(s, `<path d="M24 38Q36 30 47 37" ${line(3.4, 'var(--skin-dark)')}/>`)),
      worried: mirror(s => side(s, `<path d="M26 37L45 32" ${line(3)}/>`)),
      spines: mirror(s => side(s, `<path d="M27 38L25 28M34 35L34 25M41 35L43 26" ${line(2.4)}/>`)),
    },
    nose: {
      none: '',
      droop: `<path d="M42 56Q38 72 50 74Q62 72 58 56Q50 52 42 56Z" fill="var(--skin-dark)" ${L} stroke-width="2.6"/>`,
      nostrils: `<circle cx="46" cy="62" r="1.6" fill="${INK}"/><circle cx="54" cy="62" r="1.6" fill="${INK}"/>`,
      snout: `<path d="M44 60Q50 54 56 60" ${line(2.4)}/>`,
    },
    mouth: {
      fangs: `<path d="M30 70Q50 82 70 70Q68 90 50 90Q32 90 30 70Z" fill="${MOUTH}" ${L} stroke-width="2.6"/>`
        + `<path d="M34 72.6L36 82L38.6 74.4M42 75.6L44 86L46.4 76.6M54 76.6L56 86L58 75.6M62 74.4L64 82L66 72.6" fill="${TOOTH}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`,
      gulp: `<path d="M30 74Q50 70 70 74Q68 86 50 88Q32 86 30 74Z" fill="${MOUTH}" ${L} stroke-width="2.6"/><path d="M38 82Q50 78 62 82" ${line(2, '#e06a8a')}/>`,
      oh: `<ellipse cx="50" cy="80" rx="5" ry="6.4" fill="${MOUTH}" ${L} stroke-width="2.4"/>`,
      flat: `<path d="M40 80H60" ${line(2.8)}/>`,
      smile: `<path d="M40 76Q50 85 60 76" ${line(2.8)}/>`,
      underbite: `<path d="M34 78Q50 74 66 78Q64 90 50 90Q36 90 34 78Z" fill="${MOUTH}" ${L} stroke-width="2.6"/>`
        + `<path d="M38 80L40 72L42 79M48 78L50 70L52 78M58 79L60 72L62 80" fill="${TOOTH}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`,
    },
    // what grows from the top of the head, drawn for a head whose top is at y=14 (shifted for the others)
    hair: {
      none: '',
      lure: `<path d="M50 16Q48 -6 66 -10Q80 -12 80 2" ${line(3)}/><circle cx="80" cy="6" r="5" fill="var(--glow)" ${GLOW}/><circle cx="80" cy="6" r="5" fill="none" stroke="${INK}" stroke-width="1.6"/>`,
      feelers: mirror(s => side(s, `<path d="M42 16Q36 0 24 -4" ${line(2.4)}/><circle cx="23" cy="-4" r="2.8" fill="var(--glow)" ${GLOW}/>`)),
      crest: `<path d="M30 20Q34 4 40 16Q44 -2 50 14Q56 -2 60 16Q66 4 70 20Z" fill="#e06a8a" ${L} stroke-width="2.4"/>`,
      coral: `<path d="M46 16V2M46 8L38 0M46 6L52 -2M56 16L58 4L64 -2M58 8L52 2" ${line(4.4, INK)}/><path d="M46 16V2M46 8L38 0M46 6L52 -2M56 16L58 4L64 -2M58 8L52 2" ${line(2.2, '#f07a6a')}/>`,
      frills: `<path d="M24 26Q26 14 34 20Q36 8 44 16Q50 4 56 16Q64 8 66 20Q74 14 76 26Q50 18 24 26Z" fill="var(--glow)" opacity=".75" ${L} stroke-width="2"/>`,
    },
    // marks on the face
    extra: {
      none: '',
      spots: `<g fill="var(--glow)" ${GLOW}>${[[24, 62], [30, 72], [72, 60], [76, 70], [66, 30], [34, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2"/>`).join('')}</g>`,
      stripes: `<path d="M22 40Q26 54 22 68M78 40Q74 54 78 68" ${line(3.4, 'var(--skin-dark)')}/>`,
      barbel: `<path d="M50 88Q48 100 54 106" ${line(2)}/><circle cx="55" cy="107" r="2.6" fill="var(--glow)" ${GLOW}/>`,
      bubbles: `<g fill="none" stroke="${EYE}" stroke-width="1.4" opacity=".85"><circle cx="82" cy="30" r="3.6"/><circle cx="88" cy="20" r="2.4"/><circle cx="84" cy="11" r="1.6"/></g>`,
      freckles: mirror(s => side(s, `<g fill="var(--skin-dark)"><circle cx="26" cy="60" r="1.6"/><circle cx="31" cy="64" r="1.4"/><circle cx="25" cy="66" r="1.2"/></g>`)),
    },
  };

  // ---- hats: the brim line at y=0 and the crown going up, with a little seaweed and barnacle about them. hatFor() puts one on a head ------------------
  const HAT = {
    none: '',
    pith: `<path d="M-22 0Q-22 -26 0 -28Q22 -26 22 0Z" fill="#9a8a6a" ${L}/><path d="M-22 -5H22" ${line(2.2)}/><path d="M-33 3Q0 -6 33 3Q29 10 0 10Q-29 10 -33 3Z" fill="#7a6a4a" ${L}/>`,
    sailor: `<path d="M-21 0Q-23 -18 0 -20Q23 -18 21 0Z" fill="#e8eef4" ${L}/><path d="M-26 1Q0 8 26 1L22 -6Q0 0 -22 -6Z" fill="#1a3a6a" ${L}/>`,
    hard: `<path d="M-22 -2Q-22 -28 0 -28Q22 -28 22 -2Z" fill="#b8c4cc" ${L}/><circle cy="-14" r="8" fill="#6ab4d0" ${L} stroke-width="2.4"/><path d="M-6 -14H6M0 -20V-8" ${line(1.6)}/><path d="M-28 -2H28V4H-28Z" fill="#c8a040" ${L}/>`,
    beanie: `<path d="M-22 3Q-25 -22 0 -24Q25 -22 22 3Z" fill="#c03a3a" ${L}/><path d="M-23 -4H23V4H-23Z" fill="#8a2a2a" ${L} stroke-width="2.2"/><circle cy="-27" r="4.4" fill="#f4f6ee" ${L} stroke-width="2.2"/>`,
    bowler: `<path d="M-15 0V-30Q-15 -33 -12 -33H12Q15 -33 15 -30V0Z" fill="#1a2430" ${L}/><path d="M-15 -8H15" ${line(3.4, '#3aa86a')}/><path d="M-26 2Q0 8 26 2Q26 -3 15 -4H-15Q-26 -3 -26 2Z" fill="#1a2430" ${L}/>`,
    party: `<path d="M-13 2L0 -36L13 2Z" fill="#e06a8a" ${L}/><circle cx="-3" cy="-10" r="2" fill="#8af4f0"/><circle cx="4" cy="-20" r="2" fill="#8af4f0"/><circle cy="-38" r="4" fill="#ffd86a" ${L} stroke-width="2.2"/>`,
    chef: `<path d="M-16 2V-8Q-28 -9 -23 -22Q-18 -34 0 -30Q18 -34 23 -22Q28 -9 16 -8V2Z" fill="#f4f6ee" ${L}/><path d="M-16 -4H16" ${line(1.8)}/>`,
    wizard: `<path d="M-24 5L4 -42L24 5Z" fill="#2a2a6a" ${L}/><ellipse cy="5" rx="33" ry="6.6" fill="#2a2a6a" ${L}/><circle cx="2" cy="-18" r="3" fill="#8af4f0" ${GLOW}/><circle cx="-6" cy="-6" r="1.6" fill="#8af4f0"/>`,
  };
  const hatFor = (name, head = 'angler') => HAT[name] ? `<g transform="translate(50 ${headOf(head).top + 9}) rotate(-5) scale(.95)">${HAT[name]}</g>` : '';
  PARTS.hat = HAT;

  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra'];
  const names = (k) => Object.keys(PARTS[k]);
  const DEFAULT = { head: 'angler', ears: 'fins', eyes: 'big', brows: 'none', nose: 'none', mouth: 'fangs', hair: 'lure', extra: 'spots', hat: 'none', skin: 'abyss', hairColor: 'cyan', scale: 1 };

  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec }, h = headOf(s.head), [skin, skinDark] = SKIN[s.skin] || SKIN.abyss, glow = GLOWS[s.hairColor] || GLOWS.cyan;
    const pick = (k) => PARTS[k][s[k]] ?? '', ears = pick('ears'), hair = pick('hair');
    return {
      style: `--skin:${skin};--skin-dark:${skinDark};--glow:${glow};--hair:${glow};--accent:${glow}`,
      ears: ears ? mirror(sd => side(sd, `<g transform="translate(${h.left - 20} 0)">${ears}</g>`)) : '',
      head: `${DEFS}<path d="${h.d}" fill="var(--skin)" ${L} stroke-width="3.2"/><path d="M28 30Q36 22 46 22" ${line(3.4, 'rgba(255,255,255,.25)')}/>`,
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

  // the expressions the card swaps in over the spec's own eyes, brows and mouth: eyes at x 36 and 64, y 48; the mouth at y 74 to 90
  function mood(ink = INK) {
    const st = `fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round"`;
    return `<g class="eye-closed" ${st} stroke-width="3.2"><path d="M27 48Q36 55 45 48M55 48Q64 55 73 48"/></g>
      <g class="eye-happy" ${st} stroke-width="3.2"><path d="M27 53Q36 42 45 53M55 53Q64 42 73 53"/></g>
      <g class="eye-sleepy" ${st} stroke-width="3.2"><path d="M27 48H45M55 48H73"/><path d="M29 48Q36 54 43 48M57 48Q64 54 71 48" stroke-width="1.8"/></g>
      <g class="eye-x" ${st} stroke-width="3.2"><path d="M30 42L42 54M42 42L30 54M58 42L70 54M70 42L58 54"/></g>
      <g class="dizzy-eyes" ${st} stroke-width="2.2"><circle cx="36" cy="48" r="9" fill="${EYE}"/><circle cx="64" cy="48" r="9" fill="${EYE}"/>
        <path d="M41 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(-5 -18)"/><path d="M59 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(5 -18)"/></g>
      <g class="worry-eyes"><circle cx="36" cy="48" r="9" fill="${EYE}" stroke="${ink}" stroke-width="2.6"/><circle cx="64" cy="48" r="9" fill="${EYE}" stroke="${ink}" stroke-width="2.6"/>
        <circle class="pupil" cx="37" cy="46" r="4" fill="${ink}"/><circle class="pupil" cx="63" cy="46" r="4" fill="${ink}"/></g>
      <path class="worry-brows" d="M26 40Q35 32 46 37M74 40Q65 32 54 37" ${st} stroke-width="3.2"/>
      <path class="brows" d="M27 35L46 42M73 35L54 42" ${st} stroke-width="3.8"/>
      <g class="yawn"><ellipse cx="50" cy="81" rx="7" ry="8.6" fill="${ink}"/><circle cx="62" cy="70" r="3" fill="none" stroke="${EYE}" stroke-width="1.4"/><circle cx="67" cy="63" r="2" fill="none" stroke="${EYE}" stroke-width="1.2"/></g>
      <path class="worry-mouth" d="M40 84Q45 78 50 84T60 84" ${st} stroke-width="3"/>`;
  }

  // a frilly mantle over tentacle legs (with suckers for feet), fin-tipped arms, and a fish tail behind that the page's CSS swishes.
  // Same joints and class names as any style (see BODY_CLASSES in ../faces.js), so the page's animation moves these too.
  function body(head) {
    const [top, bot] = headSpan(head), B = (bot - top) / 2;
    const neck = bot - 3, hip = bot + B * .4, shoulder = bot + B * .2, foot = bot + B;
    const lx = B * .22, ly = foot - hip, ax = B * .5, ay = B * .28;
    const f = n => +n.toFixed(2);
    const tube = (x, y, w, c) => `<path d="M0 0l${f(x)} ${f(y)}" stroke="${INK}" stroke-width="${w + 4.4}"/><path d="M0 0l${f(x)} ${f(y)}" stroke="${c}" stroke-width="${w}"/>`;
    const tip = (kind, side) => kind === 'foot'
      ? `<path d="M0 -2Q${side === 'l' ? -10 : 10} 2 ${side === 'l' ? -8 : 8} -6" stroke="${INK}" stroke-width="8.4"/><path d="M0 -2Q${side === 'l' ? -10 : 10} 2 ${side === 'l' ? -8 : 8} -6" stroke="var(--skin)" stroke-width="4.4"/>`
      : `<path d="M0 0L${side === 'l' ? -6 : 6} -5L${side === 'l' ? -7 : 7} 4Z" fill="var(--skin-dark)" stroke-width="2.2"/>`;
    const limb = (b, sub, side, x, y, kind, w, c) => `<g class="${b} side-${side}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})">${tip(kind, side)}</g></g></g></g>`;
    const at = (x, y, inner) => `<g transform="translate(${f(x)} ${f(y)})">${inner}</g>`;
    const tail = `<g class="tail"><path d="M0 0Q14 -2 20 -12" stroke="${INK}" stroke-width="9.4"/><path d="M0 0Q14 -2 20 -12" stroke="var(--skin)" stroke-width="5"/>`
      + `<path d="M20 -12L18 -28L26 -18L34 -24L28 -10Z" fill="var(--skin-dark)" stroke-width="2.4"/></g>`;
    const yb = hip + 8, frill = [64, 57, 50, 43, 36].map((x, i) => `Q${x + 3.5} ${f(yb + 6)} ${x} ${f(yb)}`).join('');
    const mantle = `<path d="M38 ${f(neck)}H62Q68 ${f(hip)} 68 ${f(yb)}H64${frill}H32Q32 ${f(hip)} 38 ${f(neck)}Z" fill="var(--skin)" stroke-width="2.8"/>`
      + `<g fill="var(--glow)" stroke="none" ${GLOW}><circle cx="44" cy="${f(hip - 2)}" r="1.6"/><circle cx="56" cy="${f(hip - 2)}" r="1.6"/><circle cx="50" cy="${f(hip + 3)}" r="1.6"/></g>`;
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" stroke="${INK}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none">`
        + `<g class="lower">${at(58, hip - 2, tail)}${at(44, hip, limb('thigh', 'shin', 'l', -lx, ly, 'foot', 5.4, 'var(--skin)'))}${at(56, hip, limb('thigh', 'shin', 'r', lx, ly, 'foot', 5.4, 'var(--skin)'))}</g>`
        + `<g class="upper"><g class="torso">${mantle}</g>`
        + `${at(38, shoulder, limb('arm', 'fore', 'l', -ax, ay, 'hand', 4.6, 'var(--skin)'))}${at(62, shoulder, limb('arm', 'fore', 'r', ax, ay, 'hand', 4.6, 'var(--skin)'))}`,
      close: '</g></g>' };
  }

  // the lure: a stalk curling up from the head with a glowing bulb (the gem, which twinkles)
  const crown = (head) => `<g class="crown" transform="translate(50 ${headOf(head).top + 2})">
      <path d="M0 0Q-2 -18 12 -22Q24 -24 24 -12" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="24" cy="-8" r="7" fill="var(--glow)" opacity=".5" ${GLOW}/>
      <circle class="gem" cx="24" cy="-8" r="4" fill="var(--bean)" stroke="${INK}" stroke-width="1.8"/>
    </g>`;

  function random(seed = Math.random() * 1e9) {
    const r = rng(seed | 0), pick = (list) => list[Math.floor(r() * list.length)];
    return { ...Object.fromEntries(ORDER.map(k => [k, pick(names(k))])), hat: 'none', skin: pick(Object.keys(SKIN)), hairColor: pick(Object.keys(GLOWS)), scale: 1 };
  }

  // a relative keeps the head and its fins and has a nearby colour; the eyes, the mouth and what grows on top are passed down or its own
  function derive(main, seed = 0) {
    return kin({ ...DEFAULT, ...main }, seed, {
      keep: { eyes: .55, mouth: .45, nose: .6, brows: .4, hair: .4, hairColor: .6, extra: .4 },
      pool: (k) => k === 'hairColor' ? Object.keys(GLOWS) : names(k),
      tone: { key: 'skin', list: Object.keys(SKIN) },
    });
  }

  const colors = (table, i) => Object.fromEntries(Object.entries(table).map(([n, v]) => [n, i === null ? v : v[i]]));
  const editor = () => ({
    slots: [...ORDER, 'hat'].map(k => ({ key: k, options: names(k), fixed: false })),
    swatches: [{ key: 'skin', label: 'skin', colors: colors(SKIN, 0) }, { key: 'hairColor', label: 'glow', colors: colors(GLOWS, null) }],
  });

  // the map: the ocean floor at night. Every domain is a glowing reef, the base is a submarine resting on a rock, and the web is a sonar beacon (see map.js)
  const map = (() => {
    const ROCK = '#4a5870', ROCK_DARK = '#313c4e', SAND = '#3a3a4a', HULL = '#e0b040', HULL_DARK = '#a8802a', LIGHT = '#bff4ff';
    const CORAL = ['#ff6f8a', '#ff9a4a', '#c86aff', '#5ae0c8', '#ffd04a'];
    // a soft lumpy outline round 0,0: the same seed always gives the same shape
    const blob = (r, seed, bumps = 12, wob = 0.2, squash = 0.62) => Faces.blob(r, seed, { bumps, wob, squash });
    const mound = (r, seed) => `<ellipse rx="${r * 1.25}" ry="${r * .5}" cy="${r * .18}" fill="${SAND}" opacity=".7"/>`
      + `<path d="${blob(r, seed)}" fill="${ROCK}" stroke="${INK}" stroke-width="3"/><path d="${blob(r * .7, seed + 4, 9, .25, .5)}" transform="translate(${-r * .12} ${-r * .12})" fill="${ROCK_DARK}" opacity=".6"/>`;
    // a branching coral: a stem that forks twice, in one colour
    const coral = (x, y, k, c, lean) => { const b = (x0, y0, dx, dy) => `M${f1(x0)} ${f1(y0)}q${f1(dx * .2)} ${f1(dy * .6)} ${f1(dx)} ${f1(dy)}`;
      const top = [x + lean * 4 * k, y - 22 * k];
      return `<path d="${b(x, y, lean * 4 * k, -22 * k)}${b(...top, -9 * k, -12 * k)}${b(...top, 9 * k, -14 * k)}${b(x + lean * 2 * k, y - 11 * k, -11 * k, -8 * k)}" fill="none" stroke="${INK}" stroke-width="${7 * k}" stroke-linecap="round"/>`
        + `<path d="${b(x, y, lean * 4 * k, -22 * k)}${b(...top, -9 * k, -12 * k)}${b(...top, 9 * k, -14 * k)}${b(x + lean * 2 * k, y - 11 * k, -11 * k, -8 * k)}" fill="none" stroke="${c}" stroke-width="${4 * k}" stroke-linecap="round"/>`; };
    const glowDot = (x, y, r, c) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${c}" filter="url(#deepsea-map-glow)"/>`;
    return {
      backdrop: (w, h) => `<defs><linearGradient id="deepsea-abyss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#123a5a"/><stop offset=".55" stop-color="#0a1f36"/><stop offset="1" stop-color="#050d1c"/></linearGradient>
        <filter id="deepsea-map-glow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <pattern id="deepsea-snow" width="70" height="90" patternUnits="userSpaceOnUse"><circle cx="12" cy="14" r="1.6" fill="#fff" opacity=".35"/><circle cx="48" cy="40" r="1.1" fill="#fff" opacity=".3"/><circle cx="30" cy="74" r="1.4" fill="#cfefff" opacity=".28"/><circle cx="62" cy="80" r=".9" fill="#fff" opacity=".25"/></pattern></defs>
        <rect width="${w}" height="${h}" fill="url(#deepsea-abyss)"/><rect width="${w}" height="${h}" fill="url(#deepsea-snow)"/>
        <path d="M0 ${h}V${h * .9}Q${w * .25} ${h * .86} ${w * .5} ${h * .9}T${w} ${h * .89}V${h}Z" fill="${SAND}" opacity=".55"/>`,
      base: (seed) => mound(96, seed)
        + `<g transform="translate(0 -30)"><path d="M-70 0q0-30 34-34h66q40 0 52 34q-12 34-52 34h-66q-34-4-34-34z" fill="${HULL}" stroke="${INK}" stroke-width="3"/>
          <path d="M-62 14q30 16 120 6" fill="none" stroke="${HULL_DARK}" stroke-width="5" stroke-linecap="round"/>
          <path d="M-18 -34v-20q0-8 8-8h24q8 0 8 8v20z" fill="${HULL}" stroke="${INK}" stroke-width="3"/><path d="M4 -62v-16h10" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
          <path d="M-70 0l-14-12v24z" fill="${HULL_DARK}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
          ${[-36, -6, 24].map(x => `<circle cx="${x}" cy="-4" r="9" fill="${INK}"/>${glowDot(x, -4, 6, LIGHT)}`).join('')}
          <path d="M82 -4l60 -22v44z" fill="${LIGHT}" opacity=".12"/></g>`,
      place: (name, seed, n) => { const r = 62 + Math.min(n, 4) * 3, rnd = rng(seed | 0), c1 = CORAL[Math.floor(rnd() * CORAL.length)], c2 = CORAL[Math.floor(rnd() * CORAL.length)];
        return mound(r, seed) + coral(-r * .62, -r * .1, .9, c1, -1) + coral(r * .6, -r * .05, .75, c2, 1) + (rnd() < .6 ? coral(r * .1, -r * .42, .6, c1, rnd() < .5 ? -1 : 1) : '')
          + [...Array(4)].map(() => glowDot((rnd() - .5) * r * 1.4, (rnd() - .3) * r * .5, 2.4, CORAL[Math.floor(rnd() * CORAL.length)])).join(''); },
      // a conch shell, lying on its side with a round door
      building: () => `<path d="M-15 8q-4-18 10-22q18-4 20 10q1 12-12 14z" fill="#f2c8b0" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M-9 -4q6-8 14-4M-12 3q8-6 18-2" fill="none" stroke="#c88a7a" stroke-width="1.6" stroke-linecap="round"/><circle cx="6" cy="3" r="4.5" fill="${INK}"/>${glowDot(-15, -14, 2.2, LIGHT)}`,
      // a trail of bubbles rising from the base to the reef
      route: (x1, y1, x2, y2) => { const n = Math.max(4, Math.round(Math.hypot(x2 - x1, y2 - y1) / 26));
        return [...Array(n)].map((_, i) => { const t = (i + .5) / n, wob = Math.sin(i * 1.7) * 8;
          return `<circle cx="${f1(x1 + (x2 - x1) * t + wob)}" cy="${f1(y1 + (y2 - y1) * t)}" r="${2.4 + (i % 3)}" fill="none" stroke="${LIGHT}" stroke-opacity=".7" stroke-width="1.8"/>`; }).join(''); },
      // a sonar beacon on a rock, pinging the surface
      sea: () => mound(30, 11) + `<path d="M0 -10v-46" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M0 -10v-46" stroke="#8a9ab0" stroke-width="2.5" stroke-linecap="round"/>`
        + [20, 32, 44].map((r, i) => `<path d="M${-r} ${-56 - r * .3}q${r} ${-r * .9} ${r * 2} 0" fill="none" stroke="${LIGHT}" stroke-opacity="${.55 - i * .15}" stroke-width="2.4" stroke-linecap="round"/>`).join('')
        + glowDot(0, -58, 6, '#7affd0'),
    };
  })();

  return { name: 'deepsea', label: 'Deep sea', emoji: '🐙', description: 'Anglerfish, jellyfish and squid from the deep, with glowing lures and spots.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT, map };
})());
