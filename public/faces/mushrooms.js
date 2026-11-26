// The "mushrooms" face style: little mushroom folk. The head is a pale stem with a face, under a toadstool cap; the cap's shape is the head, its markings the hair.
// Soft dark outline, flat colour. Every part is an SVG fragment on a 100x100 head canvas (the cap's rim at about y 38, eyes at y 50, the mouth at 74 to 88).
// A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat, skin, hairColor, scale }: `skin` is the stem's colour and `hairColor` the cap's.
// Cap markings are clipped to the cap with one clipPath per cap shape, defined inside the head piece (every copy is identical, so the page can resolve any).
// The contract a style has to meet is described at the top of ../faces.js.
Faces.register((() => {
  const { kin, rng } = Faces;
  const INK = '#3a2a22', MOUTH = '#6a2a2a', LEAF = '#6a9a3a', LEAF_DARK = '#4a7228';
  const L = `stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
  const line = (w = 2.8, c = INK) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const mirror = (f) => f(1) + f(-1);
  const side = (s, body) => `<g transform="translate(${s < 0 ? 100 : 0} 0) scale(${s} 1)">${body}</g>`;

  const SKIN = {
    cream: ['#f6ecd6', '#dcc9a4'], ivory: ['#fbf7ee', '#e0d8c4'], tan: ['#e6cfa6', '#c4a878'],
    rose: ['#f2d6d0', '#d4aea4'], lilac: ['#e2d8ec', '#bcaccc'], glow: ['#e4f4d8', '#b8d8a4'],
  };
  const CAP = { red: '#d0392b', brown: '#8a5a34', orange: '#e0802a', violet: '#7a4a9a', blue: '#3a72a8', yellow: '#dcaa2a' };

  // ---- heads: a cap and the stem under it; how far it reaches (the hat and the body hang from them) and the stem's left edge (for the ears) -----------
  const STEM = 'M24 34Q19 64 28 82Q36 92 50 92Q64 92 72 82Q81 64 76 34Z';
  const HEADS = {
    dome:  { cap: 'M12 40Q8 6 50 6Q92 6 88 40Q50 46 12 40Z', stem: STEM, top: 6, bottom: 92, left: 20 },
    bell:  { cap: 'M18 42Q20 10 50 0Q80 10 82 42Q50 48 18 42Z', stem: STEM, top: 0, bottom: 92, left: 20 },
    flat:  { cap: 'M4 34Q12 14 50 12Q88 14 96 34Q94 42 50 44Q6 42 4 34Z', stem: STEM, top: 12, bottom: 92, left: 20 },
    puff:  { cap: 'M16 38Q20 12 50 10Q80 12 84 38Q50 44 16 38Z', stem: 'M20 34Q14 66 26 84Q36 93 50 93Q64 93 74 84Q86 66 80 34Z', top: 10, bottom: 93, left: 16 },
    frilly: { cap: 'M8 32Q16 22 24 30Q32 18 40 27Q50 14 60 27Q68 18 76 30Q84 22 92 32Q88 44 50 46Q12 44 8 32Z', stem: STEM, top: 18, bottom: 92, left: 20 },
  };
  const headOf = (name) => HEADS[name] || HEADS.dome;
  const capClip = (name) => `mushrooms-cap-${HEADS[name] ? name : 'dome'}`;

  const PARTS = {
    head: Object.fromEntries(Object.keys(HEADS).map(k => [k, HEADS[k].cap])),
    // side pieces, drawn behind the head for a stem whose left edge is at x=20 (they are shifted for the others)
    ears: {
      none: '',
      sprout: `<path d="M22 70Q14 70 12 62" ${line(2.4)}/><path d="M4 62Q4 52 12 52Q20 52 20 62Z" fill="var(--cap)" ${L} stroke-width="2.4"/><circle cx="10" cy="57" r="1.6" fill="#fff"/>`,
      leaf: `<path d="M22 60Q6 50 2 62Q10 72 22 66Z" fill="${LEAF}" ${L} stroke-width="2.4"/><path d="M22 63L8 61" ${line(1.4, LEAF_DARK)}/>`,
      moss: `<path d="M22 72Q14 74 12 68Q8 66 12 62Q12 56 20 58Z" fill="#7aa84a" ${L} stroke-width="2.2"/>`,
    },
    eyes: {
      dot: mirror(s => side(s, `<ellipse cx="37" cy="52" rx="3.6" ry="4.6" fill="${INK}"/><circle cx="38.2" cy="50.4" r="1.3" fill="#fff"/>`)),
      round: mirror(s => side(s, `<circle cx="37" cy="51" r="6.6" fill="#fff" ${L} stroke-width="2.4"/><circle cx="38" cy="52" r="3.4" fill="${INK}"/><circle cx="39" cy="50.6" r="1.2" fill="#fff"/>`)),
      sparkle: mirror(s => side(s, `<ellipse cx="37" cy="52" rx="5" ry="6" fill="${INK}"/><circle cx="38.8" cy="49.6" r="1.9" fill="#fff"/><circle cx="35.4" cy="54.4" r="1" fill="#fff"/>`)),
      lidded: mirror(s => side(s, `<circle cx="37" cy="52" r="5.6" fill="#fff" ${L} stroke-width="2.2"/><circle cx="37.6" cy="53.4" r="2.8" fill="${INK}"/><path d="M31 51.6Q37 44 43 51.6Z" fill="var(--skin-dark)" ${L} stroke-width="2.2"/>`)),
      beady: mirror(s => side(s, `<circle cx="37" cy="52" r="2.4" fill="${INK}"/>`)),
      wide: mirror(s => side(s, `<circle cx="37" cy="51" r="7.6" fill="#fff" ${L} stroke-width="2.4"/><circle cx="37" cy="52" r="2" fill="${INK}"/>`)),
    },
    brows: {
      none: '',
      soft: mirror(s => side(s, `<path d="M31 43Q37 40 43 43" ${line(2.4)}/>`)),
      raised: mirror(s => side(s, `<path d="M30 42Q37 36 44 41" ${line(2.6)}/>`)),
      worried: mirror(s => side(s, `<path d="M30 41L44 44" ${line(2.6)}/>`)),
    },
    nose: {
      none: '',
      button: `<ellipse cx="50" cy="64" rx="3.6" ry="2.8" fill="var(--skin-dark)" ${L} stroke-width="2"/>`,
      dot: `<circle cx="50" cy="63" r="1.6" fill="${INK}"/>`,
      bulb: `<path d="M47 56Q44 66 50 68Q56 66 53 56" fill="var(--skin-dark)" ${L} stroke-width="2.2"/>`,
    },
    mouth: {
      smile: `<path d="M42 74Q50 81 58 74" ${line(2.8)}/>`,
      oh: `<ellipse cx="50" cy="78" rx="4" ry="5" fill="${MOUTH}" ${L} stroke-width="2.2"/>`,
      cat: `<path d="M41 74Q45.5 79 50 74Q54.5 79 59 74" ${line(2.6)}/>`,
      flat: `<path d="M43 77H57" ${line(2.8)}/>`,
      grin: `<path d="M38 72Q50 74 62 72Q60 86 50 86Q40 86 38 72Z" fill="${MOUTH}" ${L} stroke-width="2.4"/><path d="M40 73.4H60V77H40Z" fill="#fff"/><ellipse cx="50" cy="83" rx="5" ry="2.4" fill="#f08a8a"/>`,
      tongue: `<path d="M41 73Q50 80 59 73" ${line(2.8)}/><path d="M47 76.4Q47 83 50.4 83Q54 83 54 76.2" fill="#f08a8a" ${L} stroke-width="2"/>`,
    },
    // cap markings, drawn on a 100x100 canvas and clipped to whichever cap the head has
    hair: {
      none: '',
      spots: `<g fill="#fffaf0" ${L} stroke-width="2"><ellipse cx="30" cy="20" rx="6" ry="5"/><circle cx="54" cy="12" r="4.4"/><ellipse cx="70" cy="24" rx="7" ry="5.6"/><circle cx="44" cy="30" r="3.4"/><circle cx="20" cy="33" r="3"/><circle cx="84" cy="34" r="3"/></g>`,
      freckles: `<g fill="#fffaf0" opacity=".85">${[[26, 26], [34, 18], [42, 24], [50, 16], [58, 22], [66, 16], [74, 26], [30, 34], [46, 32], [62, 32], [80, 32], [56, 8], [40, 10]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8"/>`).join('')}</g>`,
      stripes: `<path d="M50 50L20 0M50 50L38 -4M50 50L62 -4M50 50L80 0M50 50L4 22M50 50L96 22" ${line(4, 'rgba(255,250,240,.55)')}/>`,
      band: `<path d="M0 30Q50 22 100 30V37Q50 29 0 37Z" fill="#fffaf0" opacity=".9"/>`,
      warts: `<g fill="var(--cap)" ${L} stroke-width="1.8">${[[28, 22], [44, 14], [60, 16], [74, 26], [38, 30], [56, 30]].map(([x, y]) => `<path d="M${x - 4} ${y + 2}Q${x} ${y - 5} ${x + 4} ${y + 2}"/>`).join('')}</g>`,
    },
    // marks on the face
    extra: {
      none: '',
      blush: mirror(s => side(s, `<ellipse cx="30" cy="64" rx="5.4" ry="3.2" fill="#f08a8a" opacity=".55"/>`)),
      moss: `<path d="M62 84Q70 76 74 82Q78 78 76 86Q70 90 62 84Z" fill="#7aa84a" ${L} stroke-width="1.8"/>`,
      dew: `<path d="M66 60Q62 66 66 68Q70 66 66 60Z" fill="#bfe4f4" ${L} stroke-width="1.6"/>`,
      glow: `<g fill="#c8f4a0">${[[28, 72], [70, 70], [34, 84], [64, 86], [74, 56]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join('')}</g>`,
      gills: `<path d="M30 42L34 46M40 43L42 47M50 43V47M60 43L58 47M70 42L66 46" ${line(1.6, 'var(--skin-dark)')}/>`,
    },
  };

  // ---- hats: small, perched on the cap; the brim line at y=0 and the crown going up. hatFor() puts one on a head --------------------------------------
  const HAT = {
    none: '',
    pith: `<path d="M-20 0Q-20 -24 0 -26Q20 -24 20 0Z" fill="#d8c08a" ${L}/><path d="M-20 -5H20" ${line(2.2)}/><path d="M-30 3Q0 -5 30 3Q26 9 0 9Q-26 9 -30 3Z" fill="#c0a46a" ${L}/>`,
    sailor: `<path d="M-19 0Q-21 -17 0 -19Q21 -17 19 0Z" fill="#fff" ${L}/><path d="M-24 1Q0 8 24 1L20 -5Q0 0 -20 -5Z" fill="#3a72a8" ${L}/>`,
    hard: `<path d="M-22 0Q-22 -24 0 -24Q22 -24 22 0Z" fill="#f2b62a" ${L}/><path d="M-4 -24V-8H4V-24" fill="#d0961a" ${L} stroke-width="2.2"/><path d="M-29 0H29V5H-29Z" fill="#f2b62a" ${L}/>`,
    beanie: `<path d="M-21 3Q-24 -21 0 -23Q24 -21 21 3Z" fill="#6a9a3a" ${L}/><path d="M-22 -3H22V4H-22Z" fill="#4a7228" ${L} stroke-width="2.2"/><circle cy="-27" r="4.4" fill="#f6ecd6" ${L} stroke-width="2.2"/>`,
    bowler: `<path d="M-14 0V-26Q-14 -30 -10 -30H10Q14 -30 14 -26V0Z" fill="#5a4234" ${L}/><path d="M-14 -6H14" ${line(3.4, '#d0392b')}/><path d="M-24 2Q0 8 24 2Q24 -3 14 -4H-14Q-24 -3 -24 2Z" fill="#5a4234" ${L}/>`,
    party: `<path d="M-13 2L0 -34L13 2Z" fill="#e0802a" ${L}/><circle cx="-3" cy="-9" r="2" fill="#fff"/><circle cx="4" cy="-18" r="2" fill="#fff"/><circle cy="-36" r="3.8" fill="#d0392b" ${L} stroke-width="2.2"/>`,
    chef: `<path d="M-15 2V-7Q-27 -8 -22 -20Q-18 -31 0 -28Q18 -31 22 -20Q27 -8 15 -7V2Z" fill="#fff" ${L}/><path d="M-15 -3H15" ${line(1.8)}/>`,
    wizard: `<path d="M-23 4L3 -40L23 4Z" fill="#7a4a9a" ${L}/><ellipse cy="4" rx="31" ry="6" fill="#7a4a9a" ${L}/><circle cx="-2" cy="-14" r="2" fill="#ffe9a0"/><circle cx="6" cy="-4" r="1.6" fill="#ffe9a0"/>`,
  };
  const hatFor = (name, head = 'dome') => HAT[name] ? `<g transform="translate(50 ${headOf(head).top + 6}) rotate(-6) scale(.9)">${HAT[name]}</g>` : '';
  PARTS.hat = HAT;

  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra'];
  const names = (k) => Object.keys(PARTS[k]);
  const DEFAULT = { head: 'dome', ears: 'none', eyes: 'dot', brows: 'soft', nose: 'none', mouth: 'smile', hair: 'spots', extra: 'blush', hat: 'none', skin: 'cream', hairColor: 'red', scale: 1 };

  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec }, h = headOf(s.head), [skin, skinDark] = SKIN[s.skin] || SKIN.cream, cap = CAP[s.hairColor] || CAP.red;
    const pick = (k) => PARTS[k][s[k]] ?? '', ears = pick('ears'), hair = pick('hair'), id = capClip(s.head);
    return {
      style: `--skin:${skin};--skin-dark:${skinDark};--cap:${cap};--hair:${cap};--accent:${cap}`,
      ears: ears ? mirror(sd => side(sd, `<g transform="translate(${h.left - 20} 0)">${ears}</g>`)) : '',
      head: `<defs><clipPath id="${id}"><path d="${h.cap}"/></clipPath></defs><path d="${h.stem}" fill="var(--skin)" ${L} stroke-width="3.2"/>`
        + `<path d="${h.cap}" fill="var(--cap)" ${L} stroke-width="3.2"/>`,
      extra: pick('extra'),
      // the markings, then a shine and the outline again on top so the clipped edges stay crisp
      hair: `<g clip-path="url(#${id})">${hair}<path d="M24 24Q30 12 44 10" ${line(4, 'rgba(255,255,255,.45)')}/></g><path d="${h.cap}" fill="none" ${L} stroke-width="3.2"/>`,
      eyes: pick('eyes'), brows: pick('brows'), nose: pick('nose'), mouth: pick('mouth'), hat: hatFor(s.hat, s.head), scale: s.scale || 1,
    };
  }

  function compose(spec = {}, { size = 120, title = '' } = {}) {
    const p = pieces(spec), px = Math.round(size * (p.scale || 1));
    return `<svg class="face" viewBox="-14 -32 128 128" width="${px}" height="${px}" role="img" aria-label="${title || 'face'}" style="${p.style}">${p.ears}${p.head}${p.extra}${p.hair}${p.eyes}${p.brows}${p.nose}${p.mouth}${p.hat}</svg>`;
  }

  const headSpan = (head) => [headOf(head).top, headOf(head).bottom];

  // the expressions the card swaps in over the spec's own eyes, brows and mouth: eyes at x 37 and 63, y 52; the mouth at y 72 to 86
  function mood(ink = INK) {
    const st = `fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round"`;
    return `<g class="eye-closed" ${st} stroke-width="3"><path d="M31 52Q37 57 43 52M57 52Q63 57 69 52"/></g>
      <g class="eye-happy" ${st} stroke-width="3"><path d="M31 55Q37 46 43 55M57 55Q63 46 69 55"/></g>
      <g class="eye-sleepy" ${st} stroke-width="3"><path d="M31 52H43M57 52H69"/><path d="M33 52Q37 56 41 52M59 52Q63 56 67 52" stroke-width="1.6"/></g>
      <g class="eye-x" ${st} stroke-width="3"><path d="M32 47L42 57M42 47L32 57M58 47L68 57M68 47L58 57"/></g>
      <g class="dizzy-eyes" ${st} stroke-width="2"><circle cx="37" cy="52" r="7" fill="#fff"/><circle cx="63" cy="52" r="7" fill="#fff"/>
        <path d="M41 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(-4 -14)"/><path d="M59 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(4 -14)"/></g>
      <g class="worry-eyes"><circle cx="37" cy="52" r="7" fill="#fff" stroke="${ink}" stroke-width="2.4"/><circle cx="63" cy="52" r="7" fill="#fff" stroke="${ink}" stroke-width="2.4"/>
        <circle class="pupil" cx="38" cy="50" r="2.8" fill="${ink}"/><circle class="pupil" cx="62" cy="50" r="2.8" fill="${ink}"/></g>
      <path class="worry-brows" d="M30 43Q37 38 44 42M70 43Q63 38 56 42" ${st} stroke-width="2.6"/>
      <path class="brows" d="M30 40L44 45M70 40L56 45" ${st} stroke-width="3"/>
      <g class="yawn"><ellipse cx="50" cy="79" rx="5.6" ry="7" fill="${ink}"/><ellipse cx="50" cy="83" rx="3.4" ry="2" fill="#f08a8a"/></g>
      <path class="worry-mouth" d="M41 79Q45.5 74 50 79T59 79" ${st} stroke-width="2.6"/>`;
  }

  // a stubby stem body with a frilly ring (the annulus) at the neck, short legs and root-like feet. Same joints and class names as any style
  // (see BODY_CLASSES in ../faces.js), so the page's animation moves these too.
  function body(head) {
    const [top, bot] = headSpan(head), B = (bot - top) / 2;
    const neck = bot - 3, hip = bot + B * .36, shoulder = bot + B * .16, foot = bot + B * .86;
    const lx = B * .16, ly = foot - hip, ax = B * .44, ay = B * .3;
    const f = n => +n.toFixed(2);
    const tube = (x, y, w, c) => `<path d="M0 0l${f(x)} ${f(y)}" stroke="${INK}" stroke-width="${w + 4.4}"/><path d="M0 0l${f(x)} ${f(y)}" stroke="${c}" stroke-width="${w}"/>`;
    const tip = (kind, side) => kind === 'foot'
      ? `<path d="M${side === 'l' ? -9 : -4} 3Q0 -3 ${side === 'l' ? 4 : 9} 3" fill="var(--skin)" stroke-width="2.4"/><path d="M${side === 'l' ? -6 : 6} 3l${side === 'l' ? -3 : 3} 3" stroke-width="1.8"/>`
      : `<circle r="4" fill="var(--skin)" stroke-width="2.4"/>`;
    const limb = (b, sub, side, x, y, kind, w, c) => `<g class="${b} side-${side}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})">${tip(kind, side)}</g></g></g></g>`;
    const at = (x, y, inner) => `<g transform="translate(${f(x)} ${f(y)})">${inner}</g>`;
    const ring = `<path d="M33 ${f(neck + 3)}Q50 ${f(neck - 3)} 67 ${f(neck + 3)}L64 ${f(neck + 10)}Q60 ${f(neck + 7)} 57 ${f(neck + 11)}Q53 ${f(neck + 7)} 50 ${f(neck + 11)}Q47 ${f(neck + 7)} 43 ${f(neck + 11)}Q40 ${f(neck + 7)} 36 ${f(neck + 10)}Z" fill="#fffaf0" stroke-width="2.4"/>`;
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" stroke="${INK}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none">`
        + `<g class="lower">${at(44, hip, limb('thigh', 'shin', 'l', -lx, ly, 'foot', 6, 'var(--skin)'))}${at(56, hip, limb('thigh', 'shin', 'r', lx, ly, 'foot', 6, 'var(--skin)'))}</g>`
        + `<g class="upper"><path class="torso" d="M38 ${f(neck)}H62Q66 ${f(hip)} 61 ${f(hip + 6)}H39Q34 ${f(hip)} 38 ${f(neck)}Z" fill="var(--skin)" stroke-width="3"/>${ring}`
        + `${at(38, shoulder, limb('arm', 'fore', 'l', -ax, ay, 'hand', 5, 'var(--skin)'))}${at(62, shoulder, limb('arm', 'fore', 'r', ax, ay, 'hand', 5, 'var(--skin)'))}`,
      close: '</g></g>' };
  }

  // a ring of three leaves with a dewdrop in the middle (the dewdrop is the gem, which twinkles)
  const crown = (head) => `<g class="crown" transform="translate(50 ${headOf(head).top - 4}) rotate(-6)">
      <path d="M0 4Q-18 2 -20 -12Q-6 -10 0 4Z M0 4Q-6 -12 0 -22Q6 -12 0 4Z M0 4Q18 2 20 -12Q6 -10 0 4Z" fill="${LEAF}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <circle class="gem" cx="0" cy="2" r="3.2" fill="var(--bean)" stroke="${INK}" stroke-width="1.6"/>
    </g>`;

  function random(seed = Math.random() * 1e9) {
    const r = rng(seed | 0), pick = (list) => list[Math.floor(r() * list.length)];
    return { ...Object.fromEntries(ORDER.map(k => [k, pick(names(k))])), hat: 'none', skin: pick(Object.keys(SKIN)), hairColor: pick(Object.keys(CAP)), scale: 1 };
  }

  // a relative keeps the cap shape and its colour more often than not, like a cluster growing from one patch; the face is passed down or its own
  function derive(main, seed = 0) {
    return kin({ ...DEFAULT, ...main }, seed, {
      keep: { eyes: .5, mouth: .45, nose: .6, brows: .4, hair: .5, hairColor: .7, extra: .4 },
      pool: (k) => k === 'hairColor' ? Object.keys(CAP) : names(k),
      tone: { key: 'skin', list: Object.keys(SKIN) },
    });
  }

  const colors = (table, i) => Object.fromEntries(Object.entries(table).map(([n, v]) => [n, i === null ? v : v[i]]));
  const editor = () => ({
    slots: [...ORDER, 'hat'].map(k => ({ key: k, options: names(k), fixed: false })),
    swatches: [{ key: 'skin', label: 'stem', colors: colors(SKIN, 0) }, { key: 'hairColor', label: 'cap', colors: colors(CAP, null) }],
  });

  return { name: 'mushrooms', label: 'Mushroom folk', emoji: '🍄', description: 'Little mushroom folk with spotted toadstool caps and frilly stems.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT };
})());
