// The "inkwell" face style: gloomy storybook folk drawn in scratchy ink on old parchment. Hollow eyes, wild hair, stitched mouths, spindly limbs and a patched coat.
// The hand-drawn wobble is one SVG filter (turbulence pushing the outlines about), defined once inside the head piece and used by the head, ears, hair and body.
// The eyes and mouth stay unfiltered so the expressions read cleanly at small sizes. Shadows are a cross-hatch pattern over the right side of the head.
// A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat, skin, hairColor, scale }. The contract a style has to meet is at the top of ../faces.js.
Faces.register((() => {
  const { kin, rng } = Faces;
  const INK = '#1a140e', MOUTH = '#2a1a12', COAT = '#3d3428', PATCH = '#6b5a3e', TIN = '#a89c84';
  const WOB = 'filter="url(#inkwell-wobble)"';
  // ids are the same in every card, and every copy is identical, so it doesn't matter which one the page resolves
  const DEFS = `<defs><filter id="inkwell-wobble" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="3.2"/></filter>`
    + `<pattern id="inkwell-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><path d="M0 0V4" stroke="${INK}" stroke-width="1"/></pattern>`
    + `<clipPath id="inkwell-shade"><rect x="60" y="0" width="60" height="110"/></clipPath></defs>`;
  const L = `stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
  const line = (w = 2.6, c = INK) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const stroke = (w) => `stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const mirror = (f) => f(1) + f(-1);
  const side = (s, body) => `<g transform="translate(${s < 0 ? 100 : 0} 0) scale(${s} 1)">${body}</g>`;

  const SKIN = {
    parchment: ['#efe2c4', '#cdb88e'], bone: ['#ebe6d8', '#c6bfa8'], tallow: ['#ead7a2', '#c4ad72'],
    ash: ['#d3cec3', '#a9a393'], moss: ['#ccd0a4', '#a3a876'], bruise: ['#cbbcc8', '#9f8ca0'],
  };
  const HAIR = { ink: '#15110d', soot: '#3a332c', rust: '#7a3b1e', straw: '#b89a4a', grey: '#8a857c', moss: '#4a5a2e' };

  // ---- heads: the outline, how far it reaches (the hat and the body hang from them) and where its left edge is (for the ears) -----------------------------
  const HEADS = {
    long:  { d: 'M50 8C66 8 74 26 73 48C72 72 63 93 50 93C37 93 28 72 27 48C26 26 34 8 50 8Z', top: 8, bottom: 93, left: 27 },
    egg:   { d: 'M50 12C70 12 82 34 81 56C80 78 67 91 50 91C33 91 20 78 19 56C18 34 30 12 50 12Z', top: 12, bottom: 91, left: 19 },
    gourd: { d: 'M50 10C63 10 69 22 69 34C69 44 82 52 81 68C80 84 67 92 50 92C33 92 20 84 19 68C18 52 31 44 31 34C31 22 37 10 50 10Z', top: 10, bottom: 92, left: 19 },
    jaw:   { d: 'M28 14Q50 6 72 14Q80 34 78 56Q76 74 66 86Q58 92 50 92Q42 92 34 86Q24 74 22 56Q20 34 28 14Z', top: 10, bottom: 92, left: 21 },
    bean:  { d: 'M44 12C64 8 80 24 79 46C78 60 72 64 74 74C76 88 62 94 48 91C32 88 20 74 21 54C22 30 28 15 44 12Z', top: 10, bottom: 92, left: 21 },
  };
  const headOf = (name) => HEADS[name] || HEADS.long;

  const PARTS = {
    head: Object.fromEntries(Object.keys(HEADS).map(k => [k, HEADS[k].d])),
    // side pieces, drawn behind the head for a head whose left edge is at x=20 (they are shifted for the others)
    ears: {
      none: '',
      small: `<path d="M23 46Q12 44 13 54Q14 62 23 60" fill="var(--skin)" ${L}/>`,
      jug: `<path d="M23 42Q4 36 6 54Q8 70 24 62" fill="var(--skin)" ${L}/><path d="M18 48Q12 52 18 58" ${line(1.8)}/>`,
      pointy: `<path d="M23 44L6 34L22 60Z" fill="var(--skin)" ${L}/>`,
    },
    eyes: {
      hollow: mirror(s => side(s, `<ellipse cx="36" cy="48" rx="8.4" ry="9.6" fill="var(--skin-dark)" ${stroke(2)}/><ellipse cx="36" cy="48.6" rx="6" ry="7" fill="#fbf6e8"/><circle cx="36.4" cy="49" r="1.7" fill="${INK}"/>`)),
      pin: mirror(s => side(s, `<circle cx="36" cy="48" r="7" fill="#fbf6e8" ${stroke(2.4)}/><circle cx="36" cy="48" r="1.3" fill="${INK}"/>`)),
      button: mirror(s => side(s, `<circle cx="36" cy="48" r="6.6" fill="${INK}"/><circle cx="34" cy="46" r="1.1" fill="var(--skin)"/><circle cx="38" cy="46" r="1.1" fill="var(--skin)"/><circle cx="34" cy="50" r="1.1" fill="var(--skin)"/><circle cx="38" cy="50" r="1.1" fill="var(--skin)"/>`)),
      spiral: mirror(s => side(s, `<circle cx="36" cy="48" r="7.4" fill="#fbf6e8" ${stroke(2.2)}/><path d="M36 48m0-.2a1 1 0 1 1 1.4 1.2a2.6 2.6 0 1 1-3.6-3a4.4 4.4 0 1 1 5.8 5.4" ${line(1.4)}/>`)),
      odd: `<circle cx="36" cy="48" r="9" fill="#fbf6e8" ${stroke(2.4)}/><circle cx="37" cy="49" r="2" fill="${INK}"/><circle cx="64" cy="49" r="5" fill="#fbf6e8" ${stroke(2.4)}/><circle cx="64" cy="49.4" r="1.4" fill="${INK}"/>`,
      dots: mirror(s => side(s, `<ellipse cx="36" cy="48" rx="2.6" ry="3.4" fill="${INK}"/>`)),
    },
    brows: {
      none: '',
      scratch: mirror(s => side(s, `<path d="M27 38L45 36M28 40L44 39" ${line(2)}/>`)),
      worried: mirror(s => side(s, `<path d="M27 38Q36 34 45 32" ${line(3)}/>`)),
      crooked: `<path d="M27 36L45 39" ${line(3)}/><path d="M55 40L73 32" ${line(3)}/>`,
      uni: `<path d="M26 38Q38 31 50 37Q62 31 74 38" ${line(3.4)}/>`,
    },
    nose: {
      none: '',
      long: `<path d="M50 50L46 70L54 68Z" fill="var(--skin-dark)" ${L} stroke-width="2.2"/>`,
      stub: `<path d="M46 64Q50 58 54 64" ${line(2.4)}/>`,
      dots: `<circle cx="47" cy="64" r="1.5" fill="${INK}"/><circle cx="53" cy="64" r="1.5" fill="${INK}"/>`,
      hook: `<path d="M50 50Q44 62 46 68Q51 70 54 66" ${line(2.4)}/>`,
    },
    mouth: {
      stitched: `<path d="M36 79Q50 83 64 79" ${line(2.4)}/><path d="M40 75V85M46 76.6V86.6M52 77V87M58 76.4V86.4" ${line(1.6)}/>`,
      crooked: `<path d="M38 81Q46 84 54 80T64 76" ${line(2.8)}/>`,
      gap: `<path d="M37 75Q50 80 63 75Q61 89 50 89Q39 89 37 75Z" fill="${MOUTH}" ${L} stroke-width="2.4"/><path d="M42 76.4V81.4H47V77.6M53 77.6V81.4H58V76.4" fill="#f4ecd4" stroke="${INK}" stroke-width="1.4"/>`,
      flat: `<path d="M40 80H60" ${line(2.8)}/>`,
      grim: `<path d="M38 84Q50 74 62 84Z" fill="${MOUTH}" ${L} stroke-width="2.4"/><path d="M44 80V84M50 78V84M56 80V84" stroke="#f4ecd4" stroke-width="1.6"/>`,
      oh: `<ellipse cx="50" cy="81" rx="4.6" ry="6.4" fill="${MOUTH}" ${L} stroke-width="2.4"/>`,
    },
    // hair, drawn for a head whose top is at y=12 (shifted for the others). Shapes are lopsided on purpose
    hair: {
      none: '',
      wild: `<path d="M20 40L12 22L26 26L22 4L36 18L42 -4L50 14L60 -6L64 16L78 2L74 24L88 20L80 40Q66 24 50 30Q34 22 20 40Z" fill="var(--hair)" ${L}/>`,
      tuft: `<path d="M38 16Q40 2 50 0Q46 8 52 10Q58 0 66 4Q58 10 62 18Q50 10 38 16Z" fill="var(--hair)" ${L}/>`,
      parted: `<path d="M19 42C16 18 32 6 50 8C68 6 84 18 81 42C76 30 70 24 58 22L56 14Q46 26 26 28Q21 34 19 42Z" fill="var(--hair)" ${L}/>`,
      strands: `<path d="M44 14Q40 2 46 -4M50 12Q52 0 48 -8M56 14Q62 4 58 -2" ${line(2.2)}/>`,
      shaggy: `<path d="M18 50Q10 20 34 8Q50 0 66 8Q90 20 82 50L76 40L72 50L66 34L60 42L56 30L50 38L44 28L40 40L34 32L30 46L24 38Z" fill="var(--hair)" ${L}/>`,
    },
    // marks on the face
    extra: {
      none: '',
      rings: mirror(s => side(s, `<path d="M27 56Q36 63 45 56" ${line(2.2, '#5a4636')} opacity=".7"/><path d="M29 59Q36 64 43 59" ${line(1.4, '#5a4636')} opacity=".5"/>`)),
      stubble: `<g fill="${INK}" opacity=".55">${[[38, 86], [43, 89], [50, 90], [57, 89], [62, 86], [40, 91], [47, 93], [54, 93], [60, 91]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9"/>`).join('')}</g>`,
      scar: `<path d="M62 30L74 58" ${line(2.2)}/><path d="M61 36L68 34M64 43L71 41M67 50L74 48" ${line(1.6)}/>`,
      freckles: mirror(s => side(s, `<g fill="#7a4a2a" opacity=".6"><circle cx="28" cy="62" r="1.2"/><circle cx="33" cy="65" r="1.1"/><circle cx="26" cy="67" r="1"/></g>`)),
      gaunt: mirror(s => side(s, `<path d="M28 58Q30 70 40 76" ${line(2.2, 'var(--skin-dark)')}/>`)),
    },
  };

  // ---- hats: tall, crooked and a bit battered; the brim line at y=0 and the crown going up. hatFor() puts one on a head -----------------------------------
  const HAT = {
    none: '',
    pith: `<path d="M-22 0Q-22 -26 0 -28Q22 -26 22 0Z" fill="#b8a478" ${L}/><path d="M-22 -5H22" ${line(2)}/><path d="M-34 3Q0 -6 34 3Q30 10 0 10Q-30 10 -34 3Z" fill="#9a8860" ${L}/>`,
    sailor: `<path d="M-21 0Q-23 -18 0 -20Q23 -18 21 0Z" fill="#e8e0cc" ${L}/><path d="M-26 1Q0 9 26 1L22 -6Q0 0 -22 -6Z" fill="#3a4a5a" ${L}/>`,
    hard: `<path d="M-24 0Q-24 -26 0 -26Q24 -26 24 0Z" fill="#c08a3a" ${L}/><path d="M-5 -26V-9H5V-26" fill="#966a28" ${L} stroke-width="2.2"/><path d="M-32 0H32V6H-32Z" fill="#c08a3a" ${L}/>`,
    beanie: `<path d="M-23 3Q-24 -22 -4 -30Q10 -34 14 -44Q24 -20 23 3Z" fill="#5a3a2a" ${L}/><path d="M-24 -4H24V4H-24Z" fill="#7a5038" ${L} stroke-width="2.2"/><circle cx="14" cy="-46" r="4" fill="#cdb88e" ${L} stroke-width="2"/>`,
    bowler: `<path d="M-14 0V-40Q-14 -44 -10 -44H12Q15 -44 15 -40L17 0Z" fill="${COAT}" ${L}/><path d="M-14 -8H16" ${line(4, PATCH)}/><path d="M-27 2Q0 9 28 2Q27 -3 16 -4H-14Q-27 -3 -27 2Z" fill="${COAT}" ${L}/>`,
    party: `<path d="M-14 2L4 -40L14 2Z" fill="#8a3a2a" ${L}/><path d="M-9 -10L9 -14M-4 -22L8 -25" ${line(2, '#efe2c4')}/><circle cx="4" cy="-42" r="4" fill="#efe2c4" ${L} stroke-width="2"/>`,
    chef: `<path d="M-16 2V-8Q-29 -10 -24 -24Q-19 -38 2 -33Q21 -36 25 -22Q29 -9 16 -8V2Z" fill="#f2ead6" ${L}/><path d="M-16 -4H16" ${line(1.8)}/>`,
    wizard: `<path d="M-25 5Q-6 -18 -2 -36Q4 -46 16 -50Q10 -36 12 -22Q18 -8 25 5Z" fill="#3a3a52" ${L}/><ellipse cy="5" rx="34" ry="7" fill="#3a3a52" ${L}/><path d="M-4 -14L-2 -9L3 -8L-1 -5L0 0L-4 -3L-8 0L-7 -5L-11 -8L-6 -9Z" fill="#e8d6a0" stroke="none"/>`,
  };
  const hatFor = (name, head = 'long') => HAT[name] ? `<g transform="translate(50 ${headOf(head).top + 9}) rotate(-7) scale(.95)" ${WOB}>${HAT[name]}</g>` : '';
  PARTS.hat = HAT;

  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra'];
  const names = (k) => Object.keys(PARTS[k]);
  const DEFAULT = { head: 'long', ears: 'small', eyes: 'hollow', brows: 'worried', nose: 'long', mouth: 'stitched', hair: 'wild', extra: 'rings', hat: 'none', skin: 'parchment', hairColor: 'ink', scale: 1 };

  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec }, h = headOf(s.head), [skin, skinDark] = SKIN[s.skin] || SKIN.parchment;
    const pick = (k) => PARTS[k][s[k]] ?? '', ears = pick('ears'), hair = pick('hair');
    return {
      style: `--skin:${skin};--skin-dark:${skinDark};--hair:${HAIR[s.hairColor] || HAIR.ink};--accent:${HAIR[s.hairColor] || HAIR.ink}`,
      ears: ears ? `<g ${WOB}>${mirror(sd => side(sd, `<g transform="translate(${h.left - 20} 0)">${ears}</g>`))}</g>` : '',
      head: `${DEFS}<g ${WOB}><path d="${h.d}" fill="var(--skin)"/><path d="${h.d}" fill="url(#inkwell-hatch)" opacity=".35" clip-path="url(#inkwell-shade)"/><path d="${h.d}" fill="none" ${L} stroke-width="3.2"/></g>`,
      extra: pick('extra'),
      hair: hair ? `<g transform="translate(0 ${h.top - 12})" ${WOB}>${hair}</g>` : '',
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
    return `<g class="eye-closed" ${st} stroke-width="3"><path d="M28 49Q36 55 44 49M56 49Q64 55 72 49"/></g>
      <g class="eye-happy" ${st} stroke-width="3"><path d="M28 53Q36 43 44 53M56 53Q64 43 72 53"/></g>
      <g class="eye-sleepy" ${st} stroke-width="3"><path d="M27 47H45M55 47H73"/><path d="M29 47Q36 54 43 47M57 47Q64 54 71 47" stroke-width="1.6"/><path d="M30 56Q36 59 42 56M58 56Q64 59 70 56" stroke-width="1.2" opacity=".6"/></g>
      <g class="eye-x" ${st} stroke-width="3"><path d="M30 42L42 54M42 42L30 54M58 42L70 54M70 42L58 54"/></g>
      <g class="dizzy-eyes" ${st} stroke-width="2"><circle cx="36" cy="48" r="8.4" fill="#fbf6e8"/><circle cx="64" cy="48" r="8.4" fill="#fbf6e8"/>
        <path d="M41 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(-5 -18)"/><path d="M59 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(5 -18)"/></g>
      <g class="worry-eyes"><circle cx="36" cy="48" r="8.4" fill="#fbf6e8" stroke="${ink}" stroke-width="2.4"/><circle cx="64" cy="48" r="8.4" fill="#fbf6e8" stroke="${ink}" stroke-width="2.4"/>
        <circle class="pupil" cx="37" cy="46" r="1.8" fill="${ink}"/><circle class="pupil" cx="63" cy="46" r="1.8" fill="${ink}"/></g>
      <path class="worry-brows" d="M26 40Q35 32 46 36M74 40Q65 32 54 36" ${st} stroke-width="3"/>
      <path class="brows" d="M27 34L46 41M73 34L54 41" ${st} stroke-width="3.4"/>
      <g class="yawn"><ellipse cx="50" cy="81" rx="6.4" ry="8.4" fill="${ink}"/></g>
      <path class="worry-mouth" d="M40 84L44 80L48 84L52 80L56 84L60 80" ${st} stroke-width="2.4"/>`;
  }

  // spindly ink-stick limbs under a long, patched coat with a ragged hem. The coat sits in the legs' group, behind the torso.
  // Same joints and class names as any style (see BODY_CLASSES in ../faces.js), so the page's animation moves these too.
  function body(head) {
    const [top, bot] = headSpan(head), B = (bot - top) / 2;
    const neck = bot - 3, hip = bot + B * .4, shoulder = bot + B * .2, foot = bot + B;
    const lx = B * .2, ly = foot - hip, ax = B * .52, ay = B * .3;
    const f = n => +n.toFixed(2);
    const tube = (x, y, w, c) => `<path d="M0 0l${f(x)} ${f(y)}" stroke="${INK}" stroke-width="${w + 3.6}"/><path d="M0 0l${f(x)} ${f(y)}" stroke="${c}" stroke-width="${w}"/>`;
    const tip = (kind, side) => kind === 'foot' ? `<path d="M${side === 'l' ? -9 : 9} 3L0 -2L${side === 'l' ? 2 : -2} 3Z" fill="${INK}" stroke-width="2"/>` : `<circle r="3.6" fill="var(--skin)" stroke-width="2.2"/>`;
    const limb = (b, sub, side, x, y, kind, w, c) => `<g class="${b} side-${side}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})">${tip(kind, side)}</g></g></g></g>`;
    const at = (x, y, inner) => `<g transform="translate(${f(x)} ${f(y)})">${inner}</g>`;
    const yb = hip + ly * .55, rag = [70, 64, 58, 52, 46, 40, 34, 30].map((x, i) => `L${x} ${f(yb + (i % 2 ? 6 : 0))}`).join('');
    const coat = `<path d="M40 ${f(neck)}L60 ${f(neck)}L70 ${f(yb)}${rag}Z" fill="${COAT}" stroke-width="2.8"/>`
      + `<path d="M58 ${f(hip - 2)}h7v7h-7z" fill="${PATCH}" stroke-width="1.6"/><path d="M59 ${f(hip)}l5 4M64 ${f(hip)}l-5 4" stroke-width="1"/>`;
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none">`
        + `<g class="lower" ${WOB}>${coat}${at(45, hip, limb('thigh', 'shin', 'l', -lx, ly, 'foot', 2.6, COAT))}${at(55, hip, limb('thigh', 'shin', 'r', lx, ly, 'foot', 2.6, COAT))}</g>`
        + `<g class="upper"><rect class="torso" x="41" y="${f(neck)}" width="18" height="${f(hip - neck + 6)}" rx="4" fill="${COAT}" stroke-width="2.8" ${WOB}/>`
        + `<path d="M46 ${f(neck + 1)}L50 ${f(neck + 9)}L54 ${f(neck + 1)}" fill="#efe2c4" stroke-width="1.6"/><circle cx="50" cy="${f(neck + 13)}" r="1.4" fill="${INK}"/><circle cx="50" cy="${f(neck + 19)}" r="1.4" fill="${INK}"/>`
        + `${at(41, shoulder, limb('arm', 'fore', 'l', -ax, ay, 'hand', 2.4, COAT))}${at(59, shoulder, limb('arm', 'fore', 'r', ax, ay, 'hand', 2.4, COAT))}`,
      close: '</g></g>' };
  }

  // a bent tin crown, tilted, with one gem (which twinkles)
  const crown = (head) => `<g class="crown" transform="translate(50 ${headOf(head).top - 6}) rotate(8)" ${WOB}>
      <path d="M-15 10L-17 -9L-8 -1L-1 -14L7 -2L17 -6L15 10Z" fill="${TIN}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
      <circle class="gem" cx="0" cy="3.6" r="2.8" fill="var(--bean)"/>
    </g>`;

  function random(seed = Math.random() * 1e9) {
    const r = rng(seed | 0), pick = (list) => list[Math.floor(r() * list.length)];
    return { ...Object.fromEntries(ORDER.map(k => [k, pick(names(k))])), hat: 'none', skin: pick(Object.keys(SKIN)), hairColor: pick(Object.keys(HAIR)), scale: 1 };
  }

  // a relative keeps the head and ears and has a similar skin; the eyes, the mouth and the hair are passed down or its own
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
    swatches: [{ key: 'skin', label: 'skin', colors: colors(SKIN, 0) }, { key: 'hairColor', label: 'hair', colors: colors(HAIR, null) }],
  });

  // the map: an old parchment chart of a gloomy wood, drawn in the same scratchy ink. Every domain is a camp in a clearing among
  // spindly bare trees, the base is a crooked cottage with a chimney, the ways are dotted footpaths, and the web is a raven
  // on a dead tree that brings the news (see map.js). Everything here is drawn fresh for pawsee, in a generic storybook look.
  const map = (() => {
    const PAPER = '#e6d6b0', PAPER_DARK = '#c8b080', WASH = '#8a7a5a', MOSS = '#6a6a3a', FIRE = '#e08a2a', GLOW = '#f2c24a';
    const MW = 'filter="url(#inkwell-map-wobble)"', HATCH = 'url(#inkwell-map-hatch)';
    const f = n => +n.toFixed(1);
    const ink = (w = 2.6) => `fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
    // a spindly bare tree: a crooked trunk that forks into thin twigs
    const tree = (x, y, k, rnd) => { const lean = (rnd() - .5) * 10 * k, tx = x + lean, ty = y - 58 * k;
      const twig = (a, l) => `M${f(tx)} ${f(ty + 14 * k)}l${f(Math.cos(a) * l * k)} ${f(Math.sin(a) * l * k)}`;
      return `<g ${MW}><path d="M${f(x - 4 * k)} ${y}q${f(lean * .3)} ${f(-30 * k)} ${f(lean + 2 * k)} ${f(-58 * k)}L${f(x + 4 * k)} ${y}z" fill="${INK}"/>`
        + `<path d="${twig(-2.3, 22)}${twig(-1.2, 26)}${twig(-.4, 20)}${twig(-1.8, 30)}M${f(tx)} ${f(ty)}q${f(-6 * k)} ${f(-10 * k)} ${f(-2 * k)} ${f(-18 * k)}" ${ink(2 * k)}/></g>`; };
    const clearing = (r, seed) => `<path d="${Faces.blob(r * 1.1, seed + 5, { squash: .6, wob: .3 })}" fill="${WASH}" opacity=".35" ${MW}/><path d="${Faces.blob(r, seed, { squash: .58, wob: .25 })}" fill="${PAPER}" ${ink(2.6)} ${MW}/>`;
    return {
      backdrop: (w, h) => `<defs><filter id="inkwell-map-wobble" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="3.5"/></filter>
          <pattern id="inkwell-map-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><path d="M0 0V6" stroke="${INK}" stroke-width="1" stroke-opacity=".55"/></pattern>
          <radialGradient id="inkwell-map-age" cx="50%" cy="50%" r="72%"><stop offset=".55" stop-color="${PAPER_DARK}" stop-opacity="0"/><stop offset="1" stop-color="#6a4a24" stop-opacity=".55"/></radialGradient>
          <pattern id="inkwell-map-grass" width="110" height="90" patternUnits="userSpaceOnUse"><path d="M12 30l3-8 3 8M60 70l2-7 3 7M90 20l3-8 2 8M36 82l2-6 3 6" fill="none" stroke="${INK}" stroke-opacity=".35" stroke-width="1.4" stroke-linecap="round"/></pattern></defs>
        <rect width="${w}" height="${h}" fill="${PAPER_DARK}"/><rect width="${w}" height="${h}" fill="url(#inkwell-map-grass)"/><rect width="${w}" height="${h}" fill="url(#inkwell-map-age)"/>`,
      // a crooked cottage: leaning walls, a sagging roof, a lit window and a chimney (no smoke: it would run into the repo's name above)
      base: (seed) => { const rnd = rng(seed | 0);
        return clearing(104, seed) + tree(-92, 6, 1.1, rnd) + tree(88, -2, 1, rnd)
          + `<g ${MW} transform="translate(0 -8)"><path d="M-44 30l4-62h76l6 62z" fill="#7a6a50" ${ink(3)}/><path d="M-44 30l4-62h76l6 62z" fill="${HATCH}"/>`
          + `<path d="M-58 -26q20-46 50-58q34 10 54 58z" fill="#4a3a2a" ${ink(3)}/><path d="M-46 -42l84 2M-36 -58l66 0" ${ink(1.6)}/>`
          + `<path d="M18 -70v-26h14v34" fill="#5a4a3a" ${ink(2.6)}/>`
          + `<path d="M-10 30v-24q0-10 10-10t10 10v24z" fill="${INK}"/><rect x="-34" y="-18" width="16" height="16" fill="${GLOW}" ${ink(2.4)}/><path d="M-26 -18v16M-34 -10h16" ${ink(1.6)}/></g>`; },
      // a camp in a clearing: a lantern on a post and a few bare trees round the edge
      place: (name, seed, n) => { const r = 60 + Math.min(n, 4) * 3, rnd = rng(seed | 0), trees = 2 + Math.floor(rnd() * 2);
        return clearing(r, seed) + [...Array(trees)].map((_, i) => { const a = Math.PI * (1.15 + i * .7 / trees) + rnd() * .3; return tree(Math.cos(a) * r * .9, Math.sin(a) * r * .5, .75 + rnd() * .2, rnd); }).join('')
          + `<g ${MW} transform="translate(${f(r * .62)} ${f(-r * .06)})"><path d="M0 0v-40M0 -40h8" ${ink(3)}/><rect x="4" y="-38" width="9" height="12" fill="${GLOW}" ${ink(2)}/></g>`
          + `<circle cx="${f(r * .66)}" cy="${f(-r * .06 - 32)}" r="12" fill="${GLOW}" opacity=".25"/>`; },
      // a little crooked shack with a patched roof
      building: () => `<g ${MW}><path d="M-12 10l1-18h22l2 18z" fill="#7a6a50" ${ink(2)}/><path d="M-16 -6l15-14 17 13z" fill="${PATCH}" ${ink(2)}/><path d="M-3 10v-9h6v9z" fill="${INK}"/></g>`,
      // a dotted footpath, wandering a little
      route: (x1, y1, x2, y2) => { const mx = (x1 + x2) / 2 + (y2 - y1) * .15, my = (y1 + y2) / 2 - (x2 - x1) * .15;
        return `<path d="M${x1} ${y1}Q${f(mx)} ${f(my)} ${x2} ${y2}" fill="none" stroke="${INK}" stroke-opacity=".6" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>`; },
      // a raven on a dead tree: it brings news from far away
      sea: () => { const rnd = rng(31);
        return `<ellipse rx="34" ry="12" fill="${WASH}" opacity=".4"/>` + tree(0, 4, 1.2, rnd)
          + `<g transform="translate(-14 -62)" ${MW}><path d="M-12 0q4-12 16-12q8 0 10 6l8 2-8 3q-2 10-14 10q-10 0-12-9z" fill="${INK}"/><path d="M-12 0l-10 6 10-1" fill="${INK}"/><circle cx="8" cy="-5" r="1.8" fill="${GLOW}"/></g>`; },
    };
  })();

  return { name: 'inkwell', label: 'Inkwell', emoji: '🖋️', description: 'Gloomy storybook folk in scratchy ink on parchment, with hollow eyes and spindly limbs.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT, map };
})());
