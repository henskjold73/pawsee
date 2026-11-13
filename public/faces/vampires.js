// The "vampires" face style: gaunt, pale gentlemen and ladies of the night. Red eyes, fangs, slicked hair with a widow's peak, sunken cheeks, a dark suit and a flowing cape.
// Bold dark outline, flat colour. Every part is an SVG fragment on a 100x100 head canvas (eyes at y 48, the nose at 56 to 68, the mouth at 74 to 90), so any part fits any head.
// A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat, skin, hairColor, scale }: `skin` is the pallor and `hairColor` the colour of the hair.
// The contract a style has to meet is described at the top of ../faces.js.
Faces.register((() => {
  const { kin, rng } = Faces;
  const INK = '#1d1226', RED = '#e0283c', DARKRED = '#5a1020', MOUTH = '#3b1020', SUIT = '#2a2236', GOLD = '#d9a400';
  const L = `stroke="${INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"`;
  const line = (w = 3, c = INK) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const mirror = (f) => f(1) + f(-1);
  const side = (s, body) => `<g transform="translate(${s < 0 ? 100 : 0} 0) scale(${s} 1)">${body}</g>`;

  const SKIN = {
    ghost: ['#f1ecf4', '#cfc5d8'], pale: ['#efe3dc', '#d2bcb0'], ash: ['#d6d6dc', '#a9a9b6'],
    sickly: ['#d4e3c8', '#a9bd98'], lilac: ['#d9cbe8', '#b3a0cc'], dusk: ['#a190b8', '#7b6a94'],
  };
  const HAIR = { raven: '#1c1624', silver: '#b9bcc8', blood: '#8e1830', white: '#f4f4f8', auburn: '#8a3a22', violet: '#5a3a9a' };

  // ---- heads: the outline, how far it reaches (the hat and the body hang from them) and where its left edge is (for the ears) -----------------------------
  const HEADS = {
    narrow:  { d: 'M50 10C68 10 76 28 76 48C76 70 64 92 50 92C36 92 24 70 24 48C24 28 32 10 50 10Z', top: 10, bottom: 92, left: 24 },
    pointed: { d: 'M22 22Q50 6 78 22Q82 52 72 70L50 92L28 70Q18 52 22 22Z', top: 12, bottom: 92, left: 20 },
    round:   { d: 'M50 12C72 12 84 30 82 52C80 76 66 91 50 91C34 91 20 76 18 52C16 30 28 12 50 12Z', top: 12, bottom: 91, left: 18 },
    square:  { d: 'M24 14H76Q82 14 82 22V62Q82 74 72 84Q62 92 50 92Q38 92 28 84Q18 74 18 62V22Q18 14 24 14Z', top: 14, bottom: 92, left: 18 },
    gaunt:   { d: 'M50 10C70 10 80 26 78 46C77 56 70 62 70 70C70 82 62 92 50 92C38 92 30 82 30 70C30 62 23 56 22 46C20 26 30 10 50 10Z', top: 10, bottom: 92, left: 22 },
  };
  const headOf = (name) => HEADS[name] || HEADS.narrow;

  const PARTS = {
    head: Object.fromEntries(Object.keys(HEADS).map(k => [k, HEADS[k].d])),
    // side pieces, drawn behind the head for a head whose left edge is at x=20 (they are shifted for the others)
    ears: {
      none: '',
      pointy: `<path d="M24 44L2 30L22 58Z" fill="var(--skin)" ${L}/>`,
      bat: `<path d="M26 48L6 12L11 50L26 62Z" fill="var(--skin)" ${L}/><path d="M22 46L11 26L14 48Z" fill="#c98ab0" opacity=".6"/>`,
      round: `<ellipse cx="17" cy="52" rx="7.5" ry="10" fill="var(--skin)" ${L}/>`,
      long: `<path d="M24 40L8 36Q2 58 14 72L24 62Z" fill="var(--skin)" ${L}/>`,
    },
    eyes: {
      red: mirror(s => side(s, `<circle cx="36" cy="48" r="7.4" fill="#fff" ${L} stroke-width="2.6"/><circle cx="36.6" cy="48.4" r="4.4" fill="${RED}"/><ellipse cx="36.6" cy="48.4" rx="1.2" ry="3.6" fill="${INK}"/>`)),
      glow: mirror(s => side(s, `<circle cx="36" cy="48" r="10.6" fill="${RED}" opacity=".3"/><circle cx="36" cy="48" r="6" fill="${RED}" ${L} stroke-width="2.4"/><circle cx="36" cy="48" r="2" fill="#ffd0d6"/>`)),
      hooded: mirror(s => side(s, `<circle cx="36" cy="48" r="7.4" fill="#fff" ${L} stroke-width="2.6"/><circle cx="37" cy="50" r="4.2" fill="${RED}"/><circle cx="37" cy="50" r="1.8" fill="${INK}"/><path d="M28.6 48H43.4V40H28.6Z" fill="var(--skin)"/><path d="M29 48H44" ${line(2.8)}/>`)),
      slit: mirror(s => side(s, `<path d="M26 49Q36 40 46 48Q36 56 26 49Z" fill="${RED}" ${L} stroke-width="2.6"/><ellipse cx="36.4" cy="48.4" rx="1.3" ry="5" fill="${INK}"/>`)),
      sunken: mirror(s => side(s, `<ellipse cx="36" cy="49" rx="8.6" ry="6.6" fill="#4a3560" opacity=".45"/><circle cx="36" cy="48.4" r="3.6" fill="${RED}"/><circle cx="37" cy="47.4" r="1.1" fill="#fff"/>`)),
      wide: mirror(s => side(s, `<circle cx="36" cy="48" r="8.6" fill="#fff" ${L} stroke-width="2.6"/><circle cx="36.6" cy="48.6" r="2.4" fill="${RED}"/>`)),
      monocle: `<g><circle cx="36" cy="48" r="7.4" fill="#fff" ${L} stroke-width="2.6"/><circle cx="36.6" cy="48.4" r="4.4" fill="${RED}"/><ellipse cx="36.6" cy="48.4" rx="1.2" ry="3.6" fill="${INK}"/></g>`
        + `<circle cx="64" cy="48" r="7.4" fill="#fff" ${L} stroke-width="2.6"/><circle cx="64.6" cy="48.4" r="4.4" fill="${RED}"/><ellipse cx="64.6" cy="48.4" rx="1.2" ry="3.6" fill="${INK}"/>`
        + `<circle cx="64" cy="48" r="11" fill="#fff" fill-opacity=".18" stroke="${GOLD}" stroke-width="2.8"/><path d="M73 56Q82 70 76 86" ${line(1.8, GOLD)}/>`,
    },
    brows: {
      none: '',
      arch: mirror(s => side(s, `<path d="M26 40Q35 28 46 37" ${line(3.6)}/>`)),
      angry: mirror(s => side(s, `<path d="M26 35L46 42" ${line(4.2)}/>`)),
      cocked: `<path d="M27 38H45" ${line(3.6)}/><path d="M55 38Q64 26 74 34" ${line(3.6)}/>`,
      bushy: mirror(s => side(s, `<path d="M26 40Q35 30 47 38L45 42Q36 36 28 43Z" fill="${INK}" ${L} stroke-width="1.6"/>`)),
    },
    nose: {
      none: '',
      thin: `<path d="M50 50L45 66Q50 69 55 66Z" fill="var(--skin-dark)" opacity=".6"/><path d="M50 50L45.4 65.6Q50 68.6 54.6 65.6" ${line(2.4)}/>`,
      hook: `<path d="M50 48Q44 62 43 68Q50 72 57 66Q51 64 52 56" fill="var(--skin-dark)" ${L} stroke-width="2.6"/>`,
      dots: `<ellipse cx="46.6" cy="64" rx="1.8" ry="2.6" fill="${INK}"/><ellipse cx="53.4" cy="64" rx="1.8" ry="2.6" fill="${INK}"/>`,
      bat: `<path d="M42 62Q50 56 58 62Q54 68 50 66Q46 68 42 62Z" fill="var(--skin-dark)" ${L} stroke-width="2.4"/>`,
    },
    mouth: {
      fangs: `<path d="M38 76Q50 82 62 76" ${line(3)}/><path d="M41 78L43.6 88L46.6 79Z" fill="#fff" ${L} stroke-width="2"/><path d="M59 78L56.4 88L53.4 79Z" fill="#fff" ${L} stroke-width="2"/>`,
      grin: `<path d="M35 74Q50 79 65 74Q63 90 50 90Q37 90 35 74Z" fill="${MOUTH}" ${L} stroke-width="2.8"/><path d="M38.6 75L41.8 85L45 76Z" fill="#fff" ${L} stroke-width="1.8"/><path d="M61.4 75L58.2 85L55 76Z" fill="#fff" ${L} stroke-width="1.8"/><ellipse cx="50" cy="86" rx="6" ry="2.8" fill="#ff7a96"/>`,
      smirk: `<path d="M40 82Q52 84 63 75" ${line(3)}/><path d="M56.4 79.4L58.8 88L62 78Z" fill="#fff" ${L} stroke-width="2"/>`,
      bite: `<path d="M35 74Q50 79 65 74Q63 90 50 90Q37 90 35 74Z" fill="${MOUTH}" ${L} stroke-width="2.8"/><path d="M38.6 75L41.8 85L45 76Z" fill="#fff" ${L} stroke-width="1.8"/><path d="M61.4 75L58.2 85L55 76Z" fill="#fff" ${L} stroke-width="1.8"/><path d="M42 84V92Q43.6 97 45.4 92V84Z" fill="${RED}" ${L} stroke-width="1.8"/>`,
      flat: `<path d="M40 79H60" ${line(3)}/><path d="M43 79.4L44.6 86L46.8 79.6Z" fill="#fff" ${L} stroke-width="1.8"/><path d="M57 79.4L55.4 86L53.2 79.6Z" fill="#fff" ${L} stroke-width="1.8"/>`,
      hiss: `<path d="M34 72Q50 66 66 72Q66 92 50 92Q34 92 34 72Z" fill="${MOUTH}" ${L} stroke-width="2.8"/><path d="M38 72.6L41.4 83L45 72.6Z" fill="#fff" ${L} stroke-width="1.8"/><path d="M62 72.6L58.6 83L55 72.6Z" fill="#fff" ${L} stroke-width="1.8"/><ellipse cx="50" cy="87" rx="8" ry="3.6" fill="#ff7a96"/>`,
      oh: `<ellipse cx="50" cy="80" rx="6.4" ry="8" fill="${MOUTH}" ${L} stroke-width="2.6"/><path d="M45.4 73.6L47 80L49 73.4Z" fill="#fff" ${L} stroke-width="1.6"/><path d="M54.6 73.6L53 80L51 73.4Z" fill="#fff" ${L} stroke-width="1.6"/>`,
    },
    // hair, drawn for a head whose top is at y=12 (shifted for the others)
    hair: {
      none: '',
      slick: `<path d="M19 44C16 16 36 4 50 10C64 4 84 16 81 44C75 30 62 26 50 38C38 26 25 30 19 44Z" fill="var(--hair)" ${L}/><path d="M34 14Q42 20 50 34M66 14Q58 20 50 34" ${line(1.8, 'rgba(255,255,255,.35)')}/>`,
      peak: `<path d="M20 46Q14 14 40 8L50 24L60 8Q86 14 80 46Q72 28 50 40Q28 28 20 46Z" fill="var(--hair)" ${L}/>`,
      long: `<path d="M19 44C16 16 36 4 50 10C64 4 84 16 81 44C75 30 62 26 50 38C38 26 25 30 19 44Z" fill="var(--hair)" ${L}/><path d="M20 38Q10 66 20 88L30 62Z" fill="var(--hair)" ${L}/><path d="M80 38Q90 66 80 88L70 62Z" fill="var(--hair)" ${L}/>`,
      spiky: `<path d="M22 34L18 10L34 22L40 2L50 20L60 2L66 22L82 10L78 34Q50 18 22 34Z" fill="var(--hair)" ${L}/>`,
      quiff: `<path d="M20 42Q14 14 40 8Q56 2 70 10Q84 18 80 42Q74 26 56 30Q50 18 36 24Q26 28 20 42Z" fill="var(--hair)" ${L}/><path d="M42 12Q32 4 44 -2Q56 0 52 10" fill="var(--hair)" ${L} stroke-width="2.6"/>`,
    },
    // marks on the face
    extra: {
      none: '',
      bags: mirror(s => side(s, `<path d="M28 57Q36 62 44 57" ${line(2.4, '#6a4a86')} opacity=".75"/>`)),
      hollow: mirror(s => side(s, `<path d="M27 56Q31 69 42 75" ${line(3, 'var(--skin-dark)')} opacity=".7"/>`)),
      bite: `<circle cx="70" cy="72" r="1.8" fill="${RED}"/><circle cx="75" cy="76" r="1.8" fill="${RED}"/>`,
      scar: `<path d="M64 34L76 62" ${line(2.8, '#b0485c')}/><path d="M62 42L69 39M65 50L72 47M69 57L76 54" ${line(2, '#b0485c')}/>`,
      rouge: mirror(s => side(s, `<ellipse cx="27" cy="64" rx="6" ry="3.6" fill="#d04a6a" opacity=".4"/>`)),
    },
  };

  // ---- hats: dark and a little sinister; the brim line at y=0 and the crown going up. hatFor() puts one on a head -----------------------------------------
  const HAT = {
    none: '',
    pith: `<path d="M-23 0Q-23 -27 0 -29Q23 -27 23 0Z" fill="#7a6a58" ${L}/><path d="M-23 -5H23" ${line(2.4)}/><path d="M-35 3Q0 -6 35 3Q30 10 0 10Q-30 10 -35 3Z" fill="#5f5040" ${L}/>`,
    sailor: `<path d="M-22 0Q-24 -19 0 -21Q24 -19 22 0Z" fill="#e8e4f0" ${L}/><path d="M-27 1Q0 9 27 1L23 -6Q0 0 -23 -6Z" fill="#3a2a6a" ${L}/>`,
    hard: `<path d="M-25 0Q-25 -27 0 -27Q25 -27 25 0Z" fill="#d97a1a" ${L}/><path d="M-5 -27V-9H5V-27" fill="#a85a10" ${L} stroke-width="2.4"/><path d="M-33 0H33V6H-33Z" fill="#d97a1a" ${L}/>`,
    beanie: `<path d="M-24 3Q-27 -24 0 -26Q27 -24 24 3Z" fill="#6a1a3a" ${L}/><path d="M-25 -4H25V4H-25Z" fill="#9a2a52" ${L} stroke-width="2.4"/><circle cy="-30" r="5" fill="#b9bcc8" ${L} stroke-width="2.4"/>`,
    bowler: `<path d="M-16 0V-31Q-16 -35 -12 -35H12Q16 -35 16 -31V0Z" fill="#1d1a26" ${L}/><path d="M-16 -7H16" ${line(4, RED)}/><path d="M-27 2Q0 9 27 2Q27 -3 16 -4H-16Q-27 -3 -27 2Z" fill="#1d1a26" ${L}/>`,
    party: `<path d="M-15 2L0 -38L15 2Z" fill="#2a2236" ${L}/><circle cx="-3" cy="-10" r="2.2" fill="${RED}"/><circle cx="4" cy="-20" r="2.2" fill="${RED}"/><circle cx="-1" cy="-29" r="1.8" fill="${RED}"/><circle cy="-40" r="4.2" fill="${RED}" ${L} stroke-width="2.4"/>`,
    chef: `<path d="M-17 2V-8Q-30 -9 -25 -22Q-20 -35 0 -31Q20 -35 25 -22Q30 -9 17 -8V2Z" fill="#f4f0f8" ${L}/><path d="M-17 -4H17" ${line(2)}/>`,
    wizard: `<path d="M-26 5L3 -44L26 5Z" fill="#3a2a6a" ${L}/><ellipse cy="5" rx="35" ry="7" fill="#3a2a6a" ${L}/><path d="M-3 -22Q-9 -16 -3 -10Q-10 -12 -10 -17Q-10 -24 -3 -22Z" fill="#ffe9a0" stroke="none"/><circle cx="8" cy="-8" r="1.8" fill="#ffe9a0"/>`,
  };
  const hatFor = (name, head = 'narrow') => HAT[name] ? `<g transform="translate(50 ${headOf(head).top + 9}) rotate(-4) scale(.95)">${HAT[name]}</g>` : '';
  PARTS.hat = HAT;

  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra'];
  const names = (k) => Object.keys(PARTS[k]);
  const DEFAULT = { head: 'narrow', ears: 'pointy', eyes: 'red', brows: 'arch', nose: 'thin', mouth: 'fangs', hair: 'slick', extra: 'bags', hat: 'none', skin: 'ghost', hairColor: 'raven', scale: 1 };

  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec }, h = headOf(s.head), [skin, skinDark] = SKIN[s.skin] || SKIN.ghost;
    const pick = (k) => PARTS[k][s[k]] ?? '', ears = pick('ears'), hair = pick('hair');
    return {
      style: `--skin:${skin};--skin-dark:${skinDark};--hair:${HAIR[s.hairColor] || HAIR.raven};--accent:${HAIR[s.hairColor] || HAIR.raven}`,
      ears: ears ? mirror(sd => side(sd, `<g transform="translate(${h.left - 20} 0)">${ears}</g>`)) : '',
      head: `<path d="${h.d}" fill="var(--skin)" ${L} stroke-width="3.4"/>`,
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

  // the expressions the card swaps in over the spec's own eyes, brows and mouth: eyes at x 36 and 64, y 48; the mouth at y 74 to 90
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
      <path class="brows" d="M27 35L46 42M73 35L54 42" ${st} stroke-width="4"/>
      <g class="yawn"><ellipse cx="50" cy="81" rx="7" ry="8.6" fill="${ink}"/><path d="M44.6 74.6L46.6 81L49 74.4Z M55.4 74.6L53.4 81L51 74.4Z" fill="#fff" stroke="none"/></g>
      <path class="worry-mouth" d="M40 84Q45 78 50 84T60 84" ${st} stroke-width="3"/>`;
  }

  // a dark suit under a high-collared cape. The cape and collar sit in the legs' group, behind the torso, and hang to the ground; the shirt front is a white V with a red cravat.
  // Same joints and class names as any style (see BODY_CLASSES in ../faces.js), so the page's animation moves these too.
  function body(head) {
    const [top, bot] = headSpan(head), B = (bot - top) / 2;
    const neck = bot - 3, hip = bot + B * .4, shoulder = bot + B * .2, foot = bot + B;
    const lx = B * .22, ly = foot - hip, ax = B * .5, ay = B * .28;
    const f = n => +n.toFixed(2);
    const tube = (x, y, w, c) => `<path d="M0 0l${f(x)} ${f(y)}" stroke="${INK}" stroke-width="${w + 4.6}"/><path d="M0 0l${f(x)} ${f(y)}" stroke="${c}" stroke-width="${w}"/>`;
    const tip = (kind, side) => kind === 'foot' ? `<ellipse cx="${side === 'l' ? -3 : 3}" cy="1.5" rx="8" ry="4" fill="#14101a" stroke-width="2.6"/>` : `<circle r="4.6" fill="var(--skin)" stroke-width="2.6"/>`;
    const limb = (b, sub, side, x, y, kind, w, c) => `<g class="${b} side-${side}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})">${tip(kind, side)}</g></g></g></g>`;
    const at = (x, y, inner) => `<g transform="translate(${f(x)} ${f(y)})">${inner}</g>`;
    const yb = foot - 3, hem = [83, 67, 51, 35, 19].map((x, i, xs) => i ? `Q${(x + xs[i - 1]) / 2} ${f(yb + 9)} ${x} ${f(yb)}` : `L${x} ${f(yb)}`).join('');
    const cape = `<path d="M37 ${f(neck)}L63 ${f(neck)}${hem}Z" fill="${DARKRED}" stroke-width="3.2"/>`
      + `<path d="M37 ${f(neck + 2)}L26 ${f(neck - 16)}L48 ${f(neck - 1)}Z" fill="#7a1a30" stroke-width="2.8"/><path d="M63 ${f(neck + 2)}L74 ${f(neck - 16)}L52 ${f(neck - 1)}Z" fill="#7a1a30" stroke-width="2.8"/>`;
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">`
        + `<g class="lower">${cape}${at(44, hip, limb('thigh', 'shin', 'l', -lx, ly, 'foot', 6.4, SUIT))}${at(56, hip, limb('thigh', 'shin', 'r', lx, ly, 'foot', 6.4, SUIT))}</g>`
        + `<g class="upper"><rect class="torso" x="38" y="${f(neck)}" width="24" height="${f(hip - neck + 6)}" rx="5" fill="${SUIT}" stroke-width="3.2"/>`
        + `<path d="M44 ${f(neck + 1)}L50 ${f(hip + 1)}L56 ${f(neck + 1)}Z" fill="#f4f0f8" stroke-width="1.8"/><circle cx="50" cy="${f(neck + 6)}" r="2.8" fill="${RED}" stroke-width="1.6"/>`
        + `${at(37, shoulder, limb('arm', 'fore', 'l', -ax, ay, 'hand', 5.4, SUIT))}${at(63, shoulder, limb('arm', 'fore', 'r', ax, ay, 'hand', 5.4, SUIT))}`,
      close: '</g></g>' };
  }

  // a dark coronet trimmed in gold, with a blood-red gem (which twinkles), tilted a little
  const crown = (head) => `<g class="crown" transform="translate(50 ${headOf(head).top - 6}) rotate(-5)">
      <path d="M-16 10L-17 -8L-8 -1L0 -13L8 -1L17 -8L16 10Z" fill="#3a2a4a" stroke="${GOLD}" stroke-width="2.8" stroke-linejoin="round"/>
      <circle class="gem" cx="0" cy="3.6" r="2.8" fill="var(--bean)"/>
    </g>`;

  function random(seed = Math.random() * 1e9) {
    const r = rng(seed | 0), pick = (list) => list[Math.floor(r() * list.length)];
    return { ...Object.fromEntries(ORDER.map(k => [k, pick(names(k))])), hat: 'none', skin: pick(Object.keys(SKIN)), hairColor: pick(Object.keys(HAIR)), scale: 1 };
  }

  // a relative keeps the head and ears and has a similar pallor; the eyes, the mouth and the hair are passed down or its own
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
    swatches: [{ key: 'skin', label: 'pallor', colors: colors(SKIN, 0) }, { key: 'hairColor', label: 'hair', colors: colors(HAIR, null) }],
  });

  return { name: 'vampires', label: 'Vampires', description: 'Pale, gaunt vampires with red eyes, fangs and a flowing cape.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT };
})());
