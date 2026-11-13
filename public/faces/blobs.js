// The "blobs" face style: soft, squishy pastel creatures. A thin outline in the body's own darker shade, a soft shadow at the bottom, big shiny dot eyes and a tiny mouth.
// Every part is an SVG fragment on a 100x100 head canvas (eyes at y 52, the mouth at y 66 to 72), so any part fits any head.
// A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat, skin, hairColor, scale }: `skin` is the body colour and `hairColor` the colour of the spots, horns and the antenna ball.
// The contract a style has to meet is described at the top of ../faces.js.
Faces.register((() => {
  const { kin, rng } = Faces;
  const INK = '#3a2a3a';
  const S = `stroke="var(--skin-dark)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`;   // the soft outline, in the body's own shade
  const pen = (w = 3, c = INK) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const A = 'var(--accent)';
  const mirror = (f) => f(1) + f(-1);
  const side = (s, body) => `<g transform="translate(${s < 0 ? 100 : 0} 0) scale(${s} 1)">${body}</g>`;

  const SKIN = {
    peach: ['#ffc9a8', '#f0a07c'], mint: ['#a8e8c8', '#78c9a0'], sky: ['#a8d4ff', '#78aef0'], lilac: ['#d2b8ff', '#ab88ee'],
    lemon: ['#fff0a0', '#e8d060'], rose: ['#ffb3c8', '#ee86a4'], lime: ['#cdee8a', '#a0cc58'], aqua: ['#9eeaee', '#6cc6cc'],
  };
  const ACCENT = { coral: '#ff7a7a', sun: '#ffc233', leaf: '#5cc96a', berry: '#9a5be0', ocean: '#3f8fe6', pink: '#ff7ab8' };

  // ---- heads: the outline, the top and bottom (for the hat and the body) and where an ear attaches (the left one; it is mirrored) ---------------------
  const HEADS = {
    blob:  { d: 'M50 12C74 12 88 30 88 54C88 78 72 90 50 90C28 90 12 78 12 54C12 30 26 12 50 12Z', top: 12, bottom: 90, ear: [28, 22] },
    bean:  { d: 'M30 14C52 8 84 22 86 52C88 80 66 92 44 90C20 88 12 70 14 48C15 30 20 18 30 14Z', top: 10, bottom: 91, ear: [30, 22] },
    drop:  { d: 'M50 6C58 24 86 38 86 62C86 80 70 92 50 92C30 92 14 80 14 62C14 38 42 24 50 6Z', top: 6, bottom: 92, ear: [38, 34] },
    cloud: { d: 'M26 40C14 40 10 56 20 64C14 76 28 90 42 86C48 94 62 94 68 86C82 90 94 76 82 64C92 56 86 40 74 40C70 24 54 18 46 26C38 18 28 26 26 40Z', top: 20, bottom: 91, ear: [30, 30] },
    jelly: { d: 'M50 8C70 8 80 26 80 50C80 74 74 92 50 92C26 92 20 74 20 50C20 26 30 8 50 8Z', top: 8, bottom: 92, ear: [32, 18] },
    mochi: { d: 'M50 26C78 26 92 42 92 62C92 82 74 90 50 90C26 90 8 82 8 62C8 42 22 26 50 26Z', top: 26, bottom: 90, ear: [24, 36] },
  };
  const headOf = (name) => HEADS[name] || HEADS.blob;

  const PARTS = {
    head: Object.fromEntries(Object.keys(HEADS).map(k => [k, HEADS[k].d])),
    // ears, drawn behind the head for an ear that attaches at (28,22) and shifted for the others
    ears: {
      none: '',
      cat: `<path d="M20 32L16 4L44 18Z" fill="var(--skin)" ${S}/><path d="M24 24L22 11L34 18Z" fill="#ff9ab4" opacity=".7"/>`,
      bear: `<circle cx="22" cy="20" r="11" fill="var(--skin)" ${S}/><circle cx="22" cy="20" r="5.5" fill="var(--skin-dark)" opacity=".45"/>`,
      bunny: `<g transform="rotate(-14 30 24)"><ellipse cx="30" cy="2" rx="8.5" ry="21" fill="var(--skin)" ${S}/><ellipse cx="30" cy="4" rx="3.6" ry="13" fill="#ff9ab4" opacity=".65"/></g>`,
      horns: `<path d="M24 30Q14 16 22 2Q28 14 40 22Z" fill="${A}" ${S}/>`,
      floppy: `<path d="M26 22Q6 18 8 46Q10 58 24 48Z" fill="var(--skin)" ${S}/>`,
    },
    eyes: {
      dots: mirror(s => side(s, `<circle cx="36" cy="52" r="4.6" fill="${INK}"/>`)),
      big: mirror(s => side(s, `<circle cx="36" cy="52" r="8" fill="${INK}"/><circle cx="38.6" cy="49" r="2.6" fill="#fff"/>`)),
      shiny: mirror(s => side(s, `<circle cx="36" cy="52" r="7" fill="${INK}"/><circle cx="38.4" cy="49.4" r="2.5" fill="#fff"/><circle cx="33.6" cy="55" r="1.3" fill="#fff"/>`)),
      oval: mirror(s => side(s, `<ellipse cx="36" cy="52" rx="4.2" ry="6.6" fill="${INK}"/><circle cx="37.4" cy="49.6" r="1.6" fill="#fff"/>`)),
      tiny: mirror(s => side(s, `<circle cx="38" cy="52" r="2.6" fill="${INK}"/>`)),
      happy: mirror(s => side(s, `<path d="M29 55Q36 45 43 55" ${pen(3.2)}/>`)),
      sleepy: mirror(s => side(s, `<path d="M30 51Q36 57 42 51" ${pen(3.2)}/>`)),
      cyclops: `<circle cx="50" cy="50" r="11" fill="#fff" ${S}/><circle cx="51" cy="51" r="6.4" fill="${INK}"/><circle cx="53" cy="48.6" r="2.2" fill="#fff"/>`,
    },
    brows: {
      none: '',
      arc: mirror(s => side(s, `<path d="M28 40Q36 34 44 40" ${pen(2.6)}/>`)),
      angry: mirror(s => side(s, `<path d="M28 38L45 44" ${pen(3.2)}/>`)),
      worried: mirror(s => side(s, `<path d="M28 44L45 37" ${pen(3.2)}/>`)),
      dash: mirror(s => side(s, `<path d="M32 40H42" ${pen(3)}/>`)),
    },
    nose: {
      none: '',
      dot: `<circle cx="50" cy="61" r="2.2" fill="var(--skin-dark)"/>`,
      snout: `<ellipse cx="50" cy="62" rx="7" ry="5" fill="var(--skin-dark)" opacity=".7"/><circle cx="47.4" cy="62" r="1.2" fill="${INK}"/><circle cx="52.6" cy="62" r="1.2" fill="${INK}"/>`,
      heart: `<path d="M50 66C42 60 44 55 47.4 55.6C49 56 50 57.4 50 58.4C50 57.4 51 56 52.6 55.6C56 55 58 60 50 66Z" fill="#ff7a96"/>`,
      button: `<ellipse cx="50" cy="60" rx="3.6" ry="2.6" fill="${INK}"/>`,
    },
    mouth: {
      smile: `<path d="M43 67Q50 74 57 67" ${pen(3)}/>`,
      cat: `<path d="M41 66Q45.5 73 50 67Q54.5 73 59 66" ${pen(2.8)}/>`,
      o: `<ellipse cx="50" cy="70" rx="3.4" ry="4.4" fill="${INK}"/>`,
      flat: `<path d="M44 69H56" ${pen(3)}/>`,
      open: `<path d="M41 66Q50 64 59 66Q58 80 50 80Q42 80 41 66Z" fill="${INK}"/><path d="M44.5 76Q50 71 55.5 76Q50 80 44.5 76Z" fill="#ff7a96"/>`,
      tooth: `<path d="M43 67Q50 74 57 67" ${pen(3)}/><path d="M47 70.6V75.6H52V71" fill="#fff" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`,
      blep: `<path d="M43 67Q50 74 57 67" ${pen(3)}/><path d="M50 71.6Q50 79 54.6 76.6Q57 74.6 55.6 71.2Z" fill="#ff7a96" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`,
      frown: `<path d="M43 73Q50 66 57 73" ${pen(3)}/>`,
    },
    // what sits on top, drawn for a head whose top is at y=12 (shifted for the others)
    hair: {
      none: '',
      sprout: `<path d="M50 14V3" ${pen(3, '#3f9a4e')}/><path d="M50 5Q40 -6 31 2Q40 11 50 5Z" fill="#5cc96a" stroke="#3f9a4e" stroke-width="2" stroke-linejoin="round"/><path d="M50 5Q60 -8 70 0Q62 11 50 5Z" fill="#5cc96a" stroke="#3f9a4e" stroke-width="2" stroke-linejoin="round"/>`,
      curl: `<path d="M50 14Q42 3 51 0Q60 -3 59 6Q57 11 52 8" ${pen(4, 'var(--skin-dark)')}/>`,
      antenna: `<path d="M50 14V1" ${pen(3, 'var(--skin-dark)')}/><circle cx="50" cy="-3" r="5.4" fill="${A}" ${S}/>`,
      bow: `<g transform="translate(14 3)"><path d="M50 9L33 0V18Z" fill="${A}" ${S} stroke-width="2"/><path d="M50 9L67 0V18Z" fill="${A}" ${S} stroke-width="2"/><circle cx="50" cy="9" r="4.2" fill="${A}" ${S} stroke-width="2"/></g>`,
      flower: `<g fill="${A}" ${S} stroke-width="1.6">${[0, 72, 144, 216, 288].map(a => `<circle cx="${(50 + 6.6 * Math.sin(a * Math.PI / 180)).toFixed(1)}" cy="${(3 - 6.6 * Math.cos(a * Math.PI / 180)).toFixed(1)}" r="4.6"/>`).join('')}</g><circle cx="50" cy="3" r="3.6" fill="#ffd23f"/>`,
    },
    // marks on the face; the spots and stripes are clipped to the head
    extra: {
      none: '',
      cheeks: mirror(s => side(s, `<ellipse cx="27" cy="62" rx="7" ry="4.6" fill="#ff7a9a" opacity=".5"/>`)),
      shine: `<path d="M24 38Q27 26 40 21" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="4.5" stroke-linecap="round"/>`,
      whiskers: mirror(s => side(s, `<path d="M16 58L29 60M15 65L29 65" ${pen(1.8)} opacity=".7"/>`)),
      spots: 'spots',
      stripes: 'stripes',
    },
  };

  // ---- hats: round and soft, the brim line at y=0 and the crown going up; hatFor() puts one on a head ---------------------------------------------
  const HAT = {
    none: '',
    pith: `<path d="M-22 0Q-22 -26 0 -26Q22 -26 22 0Z" fill="#ecd9a2" stroke="#c9b070" stroke-width="2" stroke-linejoin="round"/><path d="M-33 3Q0 -4 33 3Q28 10 0 10Q-28 10 -33 3Z" fill="#d9c288" stroke="#c9b070" stroke-width="2" stroke-linejoin="round"/>`,
    sailor: `<path d="M-20 0Q-22 -20 0 -21Q22 -20 20 0Z" fill="#fff" stroke="#c8d0e0" stroke-width="2" stroke-linejoin="round"/><path d="M-24 0Q0 8 24 0L22 -7Q0 0 -22 -7Z" fill="#5b86d6" stroke="#3f63b8" stroke-width="2" stroke-linejoin="round"/>`,
    hard: `<path d="M-24 0Q-24 -27 0 -27Q24 -27 24 0Z" fill="#ffd23f" stroke="#d9a400" stroke-width="2" stroke-linejoin="round"/><rect x="-5" y="-27" width="10" height="20" rx="3" fill="#f2b705" stroke="#d9a400" stroke-width="2"/><path d="M-32 0H32Q32 7 24 7H-24Q-32 7 -32 0Z" fill="#ffd23f" stroke="#d9a400" stroke-width="2" stroke-linejoin="round"/>`,
    beanie: `<path d="M-23 3Q-26 -23 0 -25Q26 -23 23 3Z" fill="#ff7a7a" stroke="#e05555" stroke-width="2" stroke-linejoin="round"/><rect x="-25" y="-5" width="50" height="9" rx="4.5" fill="#ffa0a0" stroke="#e05555" stroke-width="2"/><circle cy="-29" r="5.5" fill="#fff3dc" stroke="#e0c9a0" stroke-width="2"/>`,
    bowler: `<path d="M-19 0Q-21 -23 0 -24Q21 -23 19 0Z" fill="#5a5470" stroke="#3f3a52" stroke-width="2" stroke-linejoin="round"/><path d="M-19.5 -6Q0 -2 19.5 -6" fill="none" stroke="#ff7a7a" stroke-width="3.4" stroke-linecap="round"/><path d="M-30 2Q0 10 30 2Q26 8 0 9Q-26 8 -30 2Z" fill="#5a5470" stroke="#3f3a52" stroke-width="2" stroke-linejoin="round"/>`,
    party: `<path d="M-14 3Q0 -2 14 3L0 -37Z" fill="#ff8fc0" stroke="#e0609a" stroke-width="2" stroke-linejoin="round"/><g fill="#fff"><circle cx="-3" cy="-8" r="2.2"/><circle cx="4" cy="-17" r="2.2"/><circle cx="-1" cy="-26" r="1.8"/></g><circle cy="-39" r="4.4" fill="#ffd23f" stroke="#d9a400" stroke-width="2"/>`,
    chef: `<g fill="#fff" stroke="#d0d6e0" stroke-width="2"><circle cx="-12" cy="-14" r="11"/><circle cx="12" cy="-14" r="11"/><circle cx="0" cy="-20" r="12"/></g><path d="M-16 2V-8H16V2Z" fill="#fff" stroke="#d0d6e0" stroke-width="2" stroke-linejoin="round"/>`,
    wizard: `<path d="M-24 5L1 -43L24 5Z" fill="#7a63d0" stroke="#5b4bb5" stroke-width="2" stroke-linejoin="round"/><path d="M-34 5Q0 -3 34 5Q30 12 0 12Q-30 12 -34 5Z" fill="#7a63d0" stroke="#5b4bb5" stroke-width="2" stroke-linejoin="round"/><path d="M-4 -14l1.5 3.4 3.6.4-2.7 2.4.8 3.6-3.2-1.9-3.2 1.9.8-3.6-2.7-2.4 3.6-.4Z" fill="#ffd23f"/>`,
  };
  const hatFor = (name, head = 'blob') => HAT[name] ? `<g transform="translate(50 ${headOf(head).top + 9}) scale(.95)">${HAT[name]}</g>` : '';
  PARTS.hat = HAT;

  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra'];
  const names = (k) => Object.keys(PARTS[k]);
  const DEFAULT = { head: 'blob', ears: 'none', eyes: 'shiny', brows: 'none', nose: 'none', mouth: 'smile', hair: 'sprout', extra: 'cheeks', hat: 'none', skin: 'peach', hairColor: 'coral', scale: 1 };
  let uid = 0;

  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec }, h = headOf(s.head), [skin, skinDark] = SKIN[s.skin] || SKIN.peach;
    const id = `bl${++uid}`, pick = (k) => PARTS[k][s[k]] ?? '';
    const clipped = (inner) => `<clipPath id="${id}c"><path d="${h.d}"/></clipPath><g clip-path="url(#${id}c)">${inner}</g>`;
    const extra = s.extra === 'spots' ? clipped(`<g fill="${A}" opacity=".85">${[[40, 27, 4.4], [58, 31, 3.4], [66, 23, 2.8], [30, 40, 2.6], [50, 22, 2.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`)
      : s.extra === 'stripes' ? clipped(`<g ${pen(4.6, A)} opacity=".85"><path d="M6 40Q22 42 30 52"/><path d="M6 52Q20 54 26 62"/><path d="M94 40Q78 42 70 52"/><path d="M94 52Q80 54 74 62"/></g>`)
      : pick('extra');
    const ears = pick('ears'), hair = pick('hair');
    return {
      style: `--skin:${skin};--skin-dark:${skinDark};--accent:${ACCENT[s.hairColor] || ACCENT.coral};--hair:${ACCENT[s.hairColor] || ACCENT.coral}`,
      ears: ears ? mirror(sd => side(sd, `<g transform="translate(${h.ear[0] - 28} ${h.ear[1] - 22})">${ears}</g>`)) : '',
      head: `<path d="${h.d}" fill="var(--skin)"/><clipPath id="${id}"><path d="${h.d}"/></clipPath><ellipse cx="50" cy="106" rx="54" ry="36" fill="var(--skin-dark)" opacity=".38" clip-path="url(#${id})"/><path d="${h.d}" fill="none" ${S}/>`,
      extra,
      hair: hair ? `<g transform="translate(0 ${h.top - 12})">${hair}</g>` : '',
      eyes: pick('eyes'), brows: pick('brows'), nose: pick('nose'), mouth: pick('mouth'), hat: hatFor(s.hat, s.head), scale: s.scale || 1,
    };
  }

  function compose(spec = {}, { size = 120, title = '' } = {}) {
    const p = pieces(spec), px = Math.round(size * (p.scale || 1));
    return `<svg class="face" viewBox="-12 -30 124 124" width="${px}" height="${px}" role="img" aria-label="${title || 'face'}" style="${p.style}">${p.ears}${p.head}${p.extra}${p.hair}${p.eyes}${p.brows}${p.nose}${p.mouth}${p.hat}</svg>`;
  }

  const headSpan = (head) => [headOf(head).top, headOf(head).bottom];

  // the expressions the card swaps in over the spec's own eyes, brows and mouth: eyes at x 36 and 64, y 52; the mouth at y 66 to 72
  function mood(ink = INK) {
    const st = `fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round"`;
    return `<g class="eye-closed" ${st} stroke-width="3.2"><path d="M30 51Q36 57 42 51M58 51Q64 57 70 51"/></g>
      <g class="eye-happy" ${st} stroke-width="3.2"><path d="M29 55Q36 45 43 55M57 55Q64 45 71 55"/></g>
      <g class="eye-sleepy" ${st} stroke-width="3.2"><path d="M30 52H42M58 52H70"/><path d="M31 52Q36 58 41 52M59 52Q64 58 69 52" stroke-width="1.8"/></g>
      <g class="eye-x" ${st} stroke-width="3.2"><path d="M31 46L41 58M41 46L31 58M59 46L69 58M69 46L59 58"/></g>
      <g class="dizzy-eyes" ${st} stroke-width="2"><circle cx="36" cy="52" r="8" fill="#fff"/><circle cx="64" cy="52" r="8" fill="#fff"/>
        <path d="M41 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(-5 -14)"/><path d="M59 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(5 -14)"/></g>
      <g class="worry-eyes"><circle cx="36" cy="52" r="8.6" fill="#fff" stroke="${ink}" stroke-width="2.4"/><circle cx="64" cy="52" r="8.6" fill="#fff" stroke="${ink}" stroke-width="2.4"/>
        <circle class="pupil" cx="37" cy="50" r="3.2" fill="${ink}"/><circle class="pupil" cx="63" cy="50" r="3.2" fill="${ink}"/></g>
      <path class="worry-brows" d="M27 43Q34 34 45 38M73 43Q66 34 55 38" ${st} stroke-width="3"/>
      <path class="brows" d="M28 39L45 45M72 39L55 45" ${st} stroke-width="3.2"/>
      <ellipse class="yawn" cx="50" cy="70" rx="5" ry="6.6" fill="${ink}"/>
      <path class="worry-mouth" d="M41 73Q45.5 67 50 73T59 73" ${st} stroke-width="3"/>`;
  }

  // a squishy body: a little rounded belly and noodle limbs in the body's darker shade, with round ends for hands and soft oval feet.
  // Same joints and class names as any style (see BODY_CLASSES in ../faces.js), so the page's animation moves these too.
  function body(head) {
    const [top, bot] = headSpan(head), B = (bot - top) / 2;
    const neck = bot - 3, hip = bot + B * .4, shoulder = bot + B * .2, foot = bot + B;
    const lx = B * .22, ly = foot - hip, ax = B * .5, ay = B * .28;
    const f = n => +n.toFixed(2);
    const noodle = (x, y) => `<path d="M0 0l${f(x)} ${f(y)}"/>`;
    const tip = (kind, side) => kind === 'foot' ? `<ellipse cx="${side === 'l' ? -3 : 3}" cy="1" rx="7" ry="3.6" fill="var(--skin-dark)" stroke="none"/>` : '';
    const limb = (b, sub, side, x, y, kind) => `<g class="${b} side-${side}">${noodle(x / 2, y / 2)}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}">${noodle(x / 2, y / 2)}<g transform="translate(${f(x / 2)} ${f(y / 2)})">${tip(kind, side)}</g></g></g></g>`;
    const at = (x, y, inner) => `<g transform="translate(${f(x)} ${f(y)})">${inner}</g>`;
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" stroke="var(--skin-dark)" stroke-width="6.6" stroke-linecap="round" stroke-linejoin="round" fill="none">`
        + `<g class="lower">${at(45, hip, limb('thigh', 'shin', 'l', -lx, ly, 'foot'))}${at(55, hip, limb('thigh', 'shin', 'r', lx, ly, 'foot'))}</g>`
        + `<g class="upper"><ellipse class="torso" cx="50" cy="${f((neck + hip) / 2 + 3)}" rx="13" ry="${f((hip - neck) / 2 + 6)}" fill="var(--skin)" stroke-width="2.6"/>`
        + `${at(40, shoulder, limb('arm', 'fore', 'l', -ax, ay, 'hand'))}${at(60, shoulder, limb('arm', 'fore', 'r', ax, ay, 'hand'))}`,
      close: '</g></g>' };
  }

  // a chubby gold crown with rounded points and a gem (which twinkles), tilted a little
  const crown = (head) => `<g class="crown" transform="translate(50 ${headOf(head).top - 5}) rotate(-5)">
      <path d="M-15 10V-3Q-14 -8 -9 -3L-3 -11Q0 -13 3 -11L9 -3Q14 -8 15 -3V10Z" fill="#ffd23f" stroke="#e3a600" stroke-width="3" stroke-linejoin="round"/>
      <circle class="gem" cx="0" cy="3" r="2.8" fill="var(--bean)"/>
    </g>`;

  function random(seed = Math.random() * 1e9) {
    const r = rng(seed | 0), pick = (list) => list[Math.floor(r() * list.length)];
    return { ...Object.fromEntries(ORDER.map(k => [k, pick(names(k))])), hat: 'none', skin: pick(Object.keys(SKIN)), hairColor: pick(Object.keys(ACCENT)), scale: 1 };
  }

  // a relative keeps the head shape and the ears and is the same colour or the next one over; the rest is passed down or its own
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
    swatches: [{ key: 'skin', label: 'colour', colors: colors(SKIN, 0) }, { key: 'hairColor', label: 'accent', colors: colors(ACCENT, null) }],
  });

  return { name: 'blobs', label: 'Blobs', description: 'Soft pastel blobs with big shiny eyes and a tiny mouth.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT };
})());
