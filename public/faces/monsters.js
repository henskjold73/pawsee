// The "monsters" face style: fuzzy, spiky and slimy creatures with one, two or three eyes, fangs and tusks, horns, and tentacle limbs.
// Bold dark outline, bright flat colour. Every part is an SVG fragment on a 100x100 head canvas (eyes at y 48, the mouth at y 70 to 88), so any part fits any head.
// A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat, skin, hairColor, scale }: `skin` is the body colour and `hairColor` the accent: irises, horns, the crest, spots.
// The contract a style has to meet is described at the top of ../faces.js.
Faces.register((() => {
  const { kin, rng } = Faces;
  const INK = '#2a1b3a', MOUTH = '#3a1730', TONGUE = '#ff7a96';
  const L = `stroke="${INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"`;
  const line = (w = 3.2, c = INK) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const A = 'var(--accent)';
  const mirror = (f) => f(1) + f(-1);
  const side = (s, body) => `<g transform="translate(${s < 0 ? 100 : 0} 0) scale(${s} 1)">${body}</g>`;
  const f1 = (n) => +n.toFixed(1);

  const SKIN = {
    purple: ['#b07cf0', '#8a54cc'], green: ['#7fd66a', '#56b043'], orange: ['#ffa24d', '#e07a20'],
    teal: ['#4fd0c0', '#2aa595'], magenta: ['#f06ab4', '#cc4690'], blue: ['#6aa0f5', '#4678d0'],
  };
  const ACCENT = { yellow: '#ffe14d', red: '#ff4d4d', lime: '#b8f04d', cyan: '#4de1ff', pink: '#ff8ad8', amber: '#ff9a3d' };

  // ---- heads: a fuzzy edge is a ring of bumps (soft) or points (sharp) round an ellipse -------------------------------------------------------------
  function fuzz(cx, cy, rx, ry, n, amp, sharp) {
    const pt = (a, k) => [cx + (rx + k) * Math.cos(a), cy + (ry + k) * Math.sin(a)], ang = (i) => i / n * 2 * Math.PI - Math.PI / 2;
    let d = '';
    for (let i = 0; i < n; i++) {
      const [x0, y0] = pt(ang(i), 0), [x1, y1] = pt(ang(i + 1), 0), am = (ang(i) + ang(i + 1)) / 2;
      if (!i) d += `M${f1(x0)} ${f1(y0)}`;
      if (sharp) { const [px, py] = pt(am, amp); d += `L${f1(px)} ${f1(py)}L${f1(x1)} ${f1(y1)}`; }
      else { const [qx, qy] = pt(am, amp * 2); d += `Q${f1(qx)} ${f1(qy)} ${f1(x1)} ${f1(y1)}`; }
    }
    return d + 'Z';
  }
  // d: the outline; top and bottom: how far it reaches (the hat and the body hang from them); ear: where the left ear attaches (it is mirrored)
  const HEADS = {
    fuzzy:  { d: fuzz(50, 52, 34, 36, 18, 5, false), top: 11, bottom: 93, ear: [30, 22] },
    round:  { d: 'M50 14C74 14 88 32 88 54C88 78 72 90 50 90C28 90 12 78 12 54C12 32 26 14 50 14Z', top: 14, bottom: 90, ear: [30, 22] },
    square: { d: 'M22 18H78Q84 18 84 24V80Q84 88 76 88H24Q16 88 16 80V24Q16 18 22 18Z', top: 18, bottom: 88, ear: [24, 22] },
    tall:   { d: fuzz(50, 50, 26, 40, 18, 4, false), top: 6, bottom: 94, ear: [34, 16] },
    wide:   { d: fuzz(50, 56, 40, 30, 22, 5, false), top: 21, bottom: 91, ear: [24, 34] },
    spiky:  { d: fuzz(50, 50, 32, 34, 14, 9, true), top: 7, bottom: 93, ear: [32, 20] },
  };
  const headOf = (name) => HEADS[name] || HEADS.fuzzy;

  const PARTS = {
    head: Object.fromEntries(Object.keys(HEADS).map(k => [k, HEADS[k].d])),
    // ears, drawn behind the head for an ear that attaches at (30,22) and shifted for the others
    ears: {
      none: '',
      horns: `<path d="M27 30Q8 22 14 0Q26 12 40 22Z" fill="${A}" ${L}/>`,
      bat: `<path d="M30 32L4 6Q4 28 12 40Q18 32 30 36Z" fill="var(--skin)" ${L}/><path d="M24 30L10 16Q11 28 16 34Z" fill="#ff9ab4" opacity=".7"/>`,
      pointy: `<path d="M24 24L0 28L22 44Z" fill="var(--skin)" ${L}/>`,
      nubs: `<circle cx="22" cy="22" r="9" fill="var(--skin)" ${L}/>`,
      floppy: `<path d="M30 20Q6 12 8 44Q10 58 26 44Z" fill="var(--skin)" ${L}/>`,
    },
    eyes: {
      cyclops: `<circle cx="50" cy="46" r="13.5" fill="#fff" ${L}/><circle cx="51" cy="47" r="7.4" fill="${A}" ${L} stroke-width="2"/><circle cx="52" cy="47.4" r="3.4" fill="${INK}"/><circle cx="54" cy="44.4" r="1.6" fill="#fff"/>`,
      googly: mirror(s => side(s, `<circle cx="35" cy="48" r="9" fill="#fff" ${L} stroke-width="2.8"/><circle cx="37.6" cy="51" r="3.8" fill="${INK}"/>`)),
      triple: `<circle cx="50" cy="35" r="7.4" fill="#fff" ${L} stroke-width="2.6"/><circle cx="50" cy="36.4" r="3" fill="${INK}"/>`
        + mirror(s => side(s, `<circle cx="32" cy="52" r="8" fill="#fff" ${L} stroke-width="2.6"/><circle cx="33.4" cy="53.6" r="3.2" fill="${INK}"/>`)),
      slit: mirror(s => side(s, `<ellipse cx="35" cy="48" rx="8.4" ry="9.4" fill="${A}" ${L} stroke-width="2.6"/><ellipse cx="35" cy="48" rx="1.9" ry="7.4" fill="${INK}"/>`)),
      beady: mirror(s => side(s, `<circle cx="36" cy="48" r="3.8" fill="${INK}"/><circle cx="37.2" cy="46.8" r="1.1" fill="#fff"/>`)),
      glow: mirror(s => side(s, `<circle cx="35" cy="48" r="8.4" fill="${A}" ${L} stroke-width="2.6"/><circle cx="35" cy="48" r="2.8" fill="${INK}"/>`)),
      sleepy: mirror(s => side(s, `<circle cx="35" cy="48" r="8.4" fill="#fff" ${L} stroke-width="2.6"/><circle cx="36.4" cy="51.6" r="3.2" fill="${INK}"/><path d="M26.6 48A8.4 8.4 0 0 1 43.4 48Z" fill="var(--skin)" ${L} stroke-width="2.6"/>`)),
    },
    brows: {
      none: '',
      bushy: mirror(s => side(s, `<path d="M25 38Q35 27 46 37L44 41Q35 34 27 42Z" fill="${INK}" ${L} stroke-width="1.6"/>`)),
      angry: mirror(s => side(s, `<path d="M26 34L45 41" ${line(4.4)}/>`)),
      worried: mirror(s => side(s, `<path d="M26 42L45 33" ${line(4.4)}/>`)),
      zig: mirror(s => side(s, `<path d="M26 38L31 32L36 38L41 32L46 38" ${line(3)}/>`)),
    },
    nose: {
      none: '',
      nostrils: `<ellipse cx="45.6" cy="63" rx="2" ry="3" fill="${INK}"/><ellipse cx="54.4" cy="63" rx="2" ry="3" fill="${INK}"/>`,
      blob: `<circle cx="50" cy="60" r="6.4" fill="var(--skin-dark)" ${L} stroke-width="2.6"/><circle cx="48" cy="58" r="1.8" fill="#fff" opacity=".7"/>`,
      snout: `<ellipse cx="50" cy="62" rx="10.6" ry="7.4" fill="var(--skin-dark)" ${L} stroke-width="2.6"/><circle cx="46" cy="62" r="1.8" fill="${INK}"/><circle cx="54" cy="62" r="1.8" fill="${INK}"/>`,
      beak: `<path d="M43 55L50 71L57 55Z" fill="${A}" ${L} stroke-width="2.6"/>`,
    },
    mouth: {
      smile: `<path d="M38 74Q50 85 62 74" ${line(3.4)}/>`,
      fangs: `<path d="M35 73Q50 86 65 73" ${line(3.4)}/><path d="M40 77L43 86L46 79Z" fill="#fff" ${L} stroke-width="2"/><path d="M60 77L57 86L54 79Z" fill="#fff" ${L} stroke-width="2"/>`,
      jaws: `<path d="M33 70Q50 66 67 70Q67 88 50 88Q33 88 33 70Z" fill="${MOUTH}" ${L} stroke-width="2.8"/><path d="M35 70.4L39 77L43 71.4L47 78L51 71.4L55 78L59 71.4L63 77L65.4 70.6Z" fill="#fff" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><ellipse cx="50" cy="84" rx="8" ry="3.4" fill="${TONGUE}"/>`,
      tongue: `<path d="M38 73Q50 82 62 73" ${line(3.4)}/><path d="M45.5 77V85Q50 91 54.5 85V77Z" fill="${TONGUE}" ${L} stroke-width="2.4"/><path d="M50 79V85" ${line(1.6, '#c4455f')}/>`,
      grin: `<path d="M32 70Q50 92 68 70Z" fill="#fff" ${L} stroke-width="2.8"/><path d="M40 73V83M50 76V88M60 73V83" ${line(2)}/>`,
      tusks: `<path d="M38 79Q50 85 62 79" ${line(3.4)}/><path d="M40 81L37 67L46 79Z" fill="#fff" ${L} stroke-width="2.2"/><path d="M60 81L63 67L54 79Z" fill="#fff" ${L} stroke-width="2.2"/>`,
      stitch: `<path d="M35 79H65" ${line(3)}/><path d="M40 74V84M46 74V84M52 74V84M58 74V84" ${line(2.4)}/>`,
      oh: `<ellipse cx="50" cy="79" rx="6.4" ry="8.4" fill="${MOUTH}" ${L} stroke-width="2.6"/><ellipse cx="50" cy="84" rx="3.6" ry="2.6" fill="${TONGUE}"/>`,
    },
    // what sits on top, drawn for a head whose top is at y=14 (shifted for the others)
    hair: {
      none: '',
      mohawk: `<path d="M36 19L32 0L42 10L46 -8L52 8L60 -6L62 10L70 2L66 19Z" fill="${A}" ${L}/>`,
      tuft: `<g ${line(3.2)}><path d="M44 17Q39 5 45 -1"/><path d="M50 16Q52 3 59 1"/><path d="M56 17Q64 9 69 12"/></g>`,
      unicorn: `<path d="M43 19L50 -17L57 19Z" fill="${A}" ${L}/><path d="M45 8L55 4M46 -1L54 -5M47 -8L53 -11" ${line(2)}/>`,
      antennae: `<path d="M40 18Q34 4 29 -6M60 18Q66 4 71 -6" ${line(3)}/><circle cx="28" cy="-9" r="6" fill="${A}" ${L} stroke-width="2.6"/><circle cx="72" cy="-9" r="6" fill="${A}" ${L} stroke-width="2.6"/>`,
      fin: `<path d="M28 24L36 4L42 18L50 -6L58 18L64 4L72 24Z" fill="${A}" ${L}/>`,
      tentacles: `<g fill="none" stroke-linecap="round"><path d="M40 18Q30 6 38 -4Q44 -10 39 -17" stroke="${INK}" stroke-width="9"/><path d="M40 18Q30 6 38 -4Q44 -10 39 -17" stroke="var(--skin)" stroke-width="4.6"/><path d="M60 18Q70 6 62 -4Q56 -10 61 -17" stroke="${INK}" stroke-width="9"/><path d="M60 18Q70 6 62 -4Q56 -10 61 -17" stroke="var(--skin)" stroke-width="4.6"/></g>`,
    },
    // marks on the face; spots, stripes and stitches are clipped to the head
    extra: {
      none: '',
      spots: 'spots', stripes: 'stripes', stitches: 'stitches',
      scar: `<path d="M62 34L74 62" ${line(3)}/><path d="M60 44L67 41M63 52L70 49M67 59L74 56" ${line(2.2)}/>`,
      blush: mirror(s => side(s, `<ellipse cx="25" cy="64" rx="7.4" ry="4.8" fill="#ff7ac0" opacity=".5"/>`)),
    },
  };

  // ---- hats: bold and a little crooked; the brim line at y=0 and the crown going up. hatFor() puts one on a head --------------------------------------
  const HAT = {
    none: '',
    pith: `<path d="M-23 0Q-23 -27 0 -29Q23 -27 23 0Z" fill="#e5cf94" ${L}/><path d="M-23 -5H23" ${line(2.4)}/><path d="M-35 3Q0 -6 35 3Q30 10 0 10Q-30 10 -35 3Z" fill="#cdb078" ${L}/>`,
    sailor: `<path d="M-22 0Q-24 -19 0 -21Q24 -19 22 0Z" fill="#fff" ${L}/><path d="M-27 1Q0 9 27 1L23 -6Q0 0 -23 -6Z" fill="#3f63b8" ${L}/><path d="M-4 -12H4" ${line(2)}/>`,
    hard: `<path d="M-25 0Q-25 -27 0 -27Q25 -27 25 0Z" fill="#ffd23f" ${L}/><path d="M-5 -27V-9H5V-27" fill="#e0a91a" ${L} stroke-width="2.4"/><path d="M-33 0H33V6H-33Z" fill="#ffd23f" ${L}/>`,
    beanie: `<path d="M-24 3Q-27 -24 0 -26Q27 -24 24 3Z" fill="#e8453c" ${L}/><path d="M-25 -4H25V4H-25Z" fill="#ff7a70" ${L} stroke-width="2.4"/><circle cy="-30" r="5.4" fill="#fff0d2" ${L} stroke-width="2.4"/>`,
    bowler: `<path d="M-20 0Q-22 -23 0 -25Q22 -23 20 0Z" fill="#46405a" ${L}/><path d="M-20.5 -6H20.5" ${line(3, '#ff5a5a')}/><path d="M-31 1Q0 9 31 1Q28 8 0 9Q-28 8 -31 1Z" fill="#46405a" ${L}/>`,
    party: `<path d="M-15 2L0 -38L15 2Z" fill="#ff7ab8" ${L}/><path d="M-9 -12L9 -12M-5 -24L5 -24" ${line(2.6, '#fff')}/><circle cy="-40" r="4.4" fill="#ffe14d" ${L} stroke-width="2.4"/>`,
    chef: `<path d="M-17 2V-8Q-30 -9 -25 -22Q-20 -35 0 -31Q20 -35 25 -22Q30 -9 17 -8V2Z" fill="#fff" ${L}/><path d="M-17 -4H17" ${line(2)}/>`,
    wizard: `<path d="M-26 5L3 -44L26 5Z" fill="#5b4bb5" ${L}/><ellipse cy="5" rx="35" ry="7" fill="#5b4bb5" ${L}/><path d="M-4 -18l1.6 3.6 3.8.4-2.9 2.6.8 3.8-3.3-2-3.3 2 .8-3.8-2.9-2.6 3.8-.4Z" fill="#ffe14d" stroke="none"/>`,
  };
  const hatFor = (name, head = 'fuzzy') => HAT[name] ? `<g transform="translate(50 ${headOf(head).top + 9}) rotate(-5) scale(.95)">${HAT[name]}</g>` : '';
  PARTS.hat = HAT;

  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra'];
  const names = (k) => Object.keys(PARTS[k]);
  const DEFAULT = { head: 'fuzzy', ears: 'nubs', eyes: 'googly', brows: 'none', nose: 'nostrils', mouth: 'fangs', hair: 'tuft', extra: 'none', hat: 'none', skin: 'purple', hairColor: 'yellow', scale: 1 };
  let uid = 0;

  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec }, h = headOf(s.head), [skin, skinDark] = SKIN[s.skin] || SKIN.purple;
    const id = `mo${++uid}`, pick = (k) => PARTS[k][s[k]] ?? '';
    const clipped = (inner) => `<clipPath id="${id}"><path d="${h.d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
    const extra = s.extra === 'spots' ? clipped(`<g fill="${A}" opacity=".9">${[[38, 26, 5], [58, 30, 3.8], [68, 22, 3], [26, 40, 3], [50, 20, 2.6], [72, 70, 3.4], [28, 74, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`)
      : s.extra === 'stripes' ? clipped(`<g ${line(6, 'var(--skin-dark)')} opacity=".85"><path d="M18 14L28 38"/><path d="M34 10L42 32"/><path d="M66 10L58 32"/><path d="M82 14L72 38"/></g>`)
      : s.extra === 'stitches' ? clipped(`<g ${line(2.6)}><path d="M26 24Q50 14 74 24"/><path d="M36 17V27M46 15V25M56 15V25M66 17V27"/></g>`)
      : pick('extra');
    const ears = pick('ears'), hair = pick('hair');
    return {
      style: `--skin:${skin};--skin-dark:${skinDark};--accent:${ACCENT[s.hairColor] || ACCENT.yellow};--hair:${ACCENT[s.hairColor] || ACCENT.yellow}`,
      ears: ears ? mirror(sd => side(sd, `<g transform="translate(${h.ear[0] - 30} ${h.ear[1] - 22})">${ears}</g>`)) : '',
      head: `<path d="${h.d}" fill="var(--skin)" ${L} stroke-width="3.4"/>`,
      extra,
      hair: hair ? `<g transform="translate(0 ${h.top - 14})">${hair}</g>` : '',
      eyes: pick('eyes'), brows: pick('brows'), nose: pick('nose'), mouth: pick('mouth'), hat: hatFor(s.hat, s.head), scale: s.scale || 1,
    };
  }

  function compose(spec = {}, { size = 120, title = '' } = {}) {
    const p = pieces(spec), px = Math.round(size * (p.scale || 1));
    return `<svg class="face" viewBox="-12 -32 128 128" width="${px}" height="${px}" role="img" aria-label="${title || 'face'}" style="${p.style}">${p.ears}${p.head}${p.extra}${p.hair}${p.eyes}${p.brows}${p.nose}${p.mouth}${p.hat}</svg>`;
  }

  const headSpan = (head) => [headOf(head).top, headOf(head).bottom];

  // the expressions the card swaps in over the spec's own eyes, brows and mouth: eyes at x 35 and 65, y 48; the mouth at y 70 to 88
  function mood(ink = INK) {
    const st = `fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round"`;
    return `<g class="eye-closed" ${st} stroke-width="3.6"><path d="M27 49Q35 56 43 49M57 49Q65 56 73 49"/></g>
      <g class="eye-happy" ${st} stroke-width="3.6"><path d="M27 54Q35 42 43 54M57 54Q65 42 73 54"/></g>
      <g class="eye-sleepy" ${st} stroke-width="3.6"><path d="M27 49H43M57 49H73"/><path d="M29 49Q35 56 41 49M59 49Q65 56 71 49" stroke-width="2"/></g>
      <g class="eye-x" ${st} stroke-width="3.6"><path d="M29 42L41 54M41 42L29 54M59 42L71 54M71 42L59 54"/></g>
      <g class="dizzy-eyes" ${st} stroke-width="2.2"><circle cx="35" cy="48" r="9.4" fill="#fff"/><circle cx="65" cy="48" r="9.4" fill="#fff"/>
        <path d="M41 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(-6 -18)"/><path d="M59 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(6 -18)"/></g>
      <g class="worry-eyes"><circle cx="35" cy="48" r="9.4" fill="#fff" stroke="${ink}" stroke-width="2.8"/><circle cx="65" cy="48" r="9.4" fill="#fff" stroke="${ink}" stroke-width="2.8"/>
        <circle class="pupil" cx="36" cy="46" r="3.4" fill="${ink}"/><circle class="pupil" cx="64" cy="46" r="3.4" fill="${ink}"/></g>
      <path class="worry-brows" d="M25 40Q33 32 44 37M75 40Q67 32 56 37" ${st} stroke-width="3.6"/>
      <path class="brows" d="M26 35L44 42M74 35L56 42" ${st} stroke-width="4.2"/>
      <ellipse class="yawn" cx="50" cy="78" rx="7" ry="9" fill="${ink}"/>
      <path class="worry-mouth" d="M38 82Q44 74 50 82T62 82" ${st} stroke-width="3.4"/>`;
  }

  // a round, furry belly with tentacle limbs: each bone is a tube (a dark outline with the body colour inside), the hands round and the feet big ovals.
  // Same joints and class names as any style (see BODY_CLASSES in ../faces.js), so the page's animation moves these too.
  function body(head) {
    const [top, bot] = headSpan(head), B = (bot - top) / 2;
    const neck = bot - 3, hip = bot + B * .4, shoulder = bot + B * .2, foot = bot + B;
    const lx = B * .22, ly = foot - hip, ax = B * .5, ay = B * .28;
    const f = n => +n.toFixed(2);
    const tube = (x, y, w) => `<path d="M0 0l${f(x)} ${f(y)}" stroke="${INK}" stroke-width="${w + 4.6}"/><path d="M0 0l${f(x)} ${f(y)}" stroke="var(--skin)" stroke-width="${w}"/>`;
    const tip = (kind, side) => kind === 'foot' ? `<ellipse cx="${side === 'l' ? -3 : 3}" cy="1.5" rx="8.4" ry="4.4" fill="var(--skin)" stroke-width="2.8"/>` : `<circle r="5.2" fill="var(--skin)" stroke-width="2.8"/>`;
    const limb = (b, sub, side, x, y, kind, w) => `<g class="${b} side-${side}">${tube(x / 2, y / 2, w)}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}">${tube(x / 2, y / 2, w)}<g transform="translate(${f(x / 2)} ${f(y / 2)})">${tip(kind, side)}</g></g></g></g>`;
    const at = (x, y, inner) => `<g transform="translate(${f(x)} ${f(y)})">${inner}</g>`;
    const cy = (neck + hip) / 2 + 2;
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">`
        + `<g class="lower">${at(43, hip, limb('thigh', 'shin', 'l', -lx, ly, 'foot', 6.4))}${at(57, hip, limb('thigh', 'shin', 'r', lx, ly, 'foot', 6.4))}</g>`
        + `<g class="upper"><ellipse class="torso" cx="50" cy="${f(cy)}" rx="17" ry="${f((hip - neck) / 2 + 8)}" fill="var(--skin)" stroke-width="3.2"/><ellipse cx="50" cy="${f(cy + 2)}" rx="9" ry="${f((hip - neck) / 2 + 2)}" fill="#fff" opacity=".28" stroke="none"/>`
        + `${at(36, shoulder, limb('arm', 'fore', 'l', -ax, ay, 'hand', 5.2))}${at(64, shoulder, limb('arm', 'fore', 'r', ax, ay, 'hand', 5.2))}`,
      close: '</g></g>' };
  }

  // a jagged gold crown with a gem (which twinkles), tilted a little
  const crown = (head) => `<g class="crown" transform="translate(50 ${headOf(head).top - 6}) rotate(-5)">
      <path d="M-16 10L-17 -6L-8 0L0 -12L8 0L17 -6L16 10Z" fill="#ffd23f" ${L} stroke-width="2.8"/>
      <circle class="gem" cx="0" cy="3.6" r="2.8" fill="var(--bean)"/>
    </g>`;

  function random(seed = Math.random() * 1e9) {
    const r = rng(seed | 0), pick = (list) => list[Math.floor(r() * list.length)];
    return { ...Object.fromEntries(ORDER.map(k => [k, pick(names(k))])), hat: 'none', skin: pick(Object.keys(SKIN)), hairColor: pick(Object.keys(ACCENT)), scale: 1 };
  }

  // a relative keeps the head and the ears and the same colour or the next one over; the rest is passed down or its own
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

  return { name: 'monsters', label: 'Monsters', emoji: '👹', description: 'Fuzzy, spiky and slimy creatures with fangs, horns and tentacle limbs.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT };
})());
