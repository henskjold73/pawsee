// The "glass" face style: stained-glass windows. Each head is a window (a round, an arch, a lancet, a shield, a rose) of tinted glass panels held in thick dark lead.
// Every glass piece gets the same diagonal sheen (one shared gradient), and the head's own lead lines are clipped to its outline (one clipPath per shape).
// Those defs live inside the head piece; every copy is identical, so it doesn't matter which one the page resolves.
// A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat, skin, hairColor, scale }: `skin` is the face's glass and `hairColor` the hair's.
// The ears slot also holds the halo, since it is drawn behind the head. The contract a style has to meet is at the top of ../faces.js.
Faces.register((() => {
  const { kin, rng } = Faces;
  const LEAD = '#1e1a1c', CLEAR = '#f4f0dc', GOLD = '#e8b830', ROBE = '#2a5ab0', ROBE_2 = '#8a2a4a', RUBY = '#c0283a';
  const L = `stroke="${LEAD}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"`;
  const lead = (w = 3.4) => `fill="none" stroke="${LEAD}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const SHEEN = `fill="url(#glass-sheen)"`;
  // a piece of glass: the tint, the sheen on top, then the lead round it
  const pane = (d, fill, w = 3.4) => `<path d="${d}" fill="${fill}"/><path d="${d}" ${SHEEN}/><path d="${d}" ${lead(w)}/>`;
  const mirror = (f) => f(1) + f(-1);
  const side = (s, body) => `<g transform="translate(${s < 0 ? 100 : 0} 0) scale(${s} 1)">${body}</g>`;
  const f1 = n => +n.toFixed(1);

  const SKIN = {
    amber: ['#f2c27a', '#d89a48'], rose: ['#f0a8b4', '#d47a8c'], sea: ['#8ad0c8', '#5aaca4'],
    violet: ['#b49ae0', '#8a6ac4'], pearl: ['#ece4d0', '#c8bc9c'], gold: ['#f0d468', '#ccaa38'],
  };
  const HAIR = { cobalt: '#2a5ab0', ruby: '#c0283a', emerald: '#2a9a5a', amber: '#d8862a', violet: '#6a3aa8', smoke: '#5a5660' };

  // a rose window's lead: an inner ring and spokes out to the rim
  const roseLeads = 'M31 52A19 19 0 1 0 69 52A19 19 0 1 0 31 52' + [...Array(10)].map((_, i) => { const a = i / 10 * Math.PI * 2, s = Math.sin(a), c = Math.cos(a); return `M${f1(50 + 19 * s)} ${f1(52 - 19 * c)}L${f1(50 + 40 * s)} ${f1(52 - 40 * c)}`; }).join('');

  // ---- heads: the window's outline, its lead lines, how far it reaches (the hat and the body hang from them) and its left edge (for the ears) ----------
  const HEADS = {
    round:  { d: 'M12 52A38 38 0 1 0 88 52A38 38 0 1 0 12 52Z', leads: 'M10 34H90M50 10V34M10 68H90M32 68L28 94M68 68L72 94', top: 14, bottom: 90, left: 12 },
    arch:   { d: 'M18 92V44Q18 12 50 10Q82 12 82 44V92Z', leads: 'M16 36H84M50 8V36M16 68H84M34 68V94M66 68V94', top: 10, bottom: 92, left: 18 },
    lancet: { d: 'M22 92V48Q22 20 50 6Q78 20 78 48V92Z', leads: 'M20 36H80M50 4V36M20 68H80M50 68V94', top: 6, bottom: 92, left: 22 },
    shield: { d: 'M16 16H84V52Q84 80 50 94Q16 80 16 52Z', leads: 'M14 36H86M50 14V36M14 68H86M50 68V96', top: 16, bottom: 94, left: 16 },
    rose:   { d: 'M12 52A38 38 0 1 0 88 52A38 38 0 1 0 12 52Z', leads: roseLeads, top: 14, bottom: 90, left: 12 },
  };
  const headOf = (name) => HEADS[name] || HEADS.round;
  const clipId = (name) => `glass-head-${HEADS[name] ? name : 'round'}`;

  const PARTS = {
    head: Object.fromEntries(Object.keys(HEADS).map(k => [k, HEADS[k].d])),
    // side pieces, drawn behind the head for a head whose left edge is at x=20 (they are shifted for the others). The halo is two mirrored halves
    ears: {
      none: '',
      round: pane('M22 46Q10 44 10 54Q10 64 22 62Z', 'var(--skin)', 3),
      leaf: pane('M22 48Q4 40 2 54Q8 66 22 60Z', '#3aa86a', 3),
      halo: `<path d="M50 -2A46 46 0 0 0 4 44L14 46A36 36 0 0 1 50 8Z" fill="${GOLD}"/><path d="M50 -2A46 46 0 0 0 4 44L14 46A36 36 0 0 1 50 8Z" ${SHEEN}/><path d="M50 -2A46 46 0 0 0 4 44L14 46A36 36 0 0 1 50 8ZM20 12L27 19M36 1L39 10" ${lead(3)}/>`,
    },
    eyes: {
      almond: mirror(s => side(s, `${pane('M26 48Q36 38 46 48Q36 56 26 48Z', CLEAR, 2.8)}<circle cx="36" cy="48" r="3.4" fill="${LEAD}"/>`)),
      round: mirror(s => side(s, `${pane('M28 48A8 8 0 1 0 44 48A8 8 0 1 0 28 48Z', CLEAR, 2.8)}<circle cx="36.6" cy="48.6" r="3.6" fill="var(--hair)" stroke="${LEAD}" stroke-width="1.6"/>`)),
      lidded: mirror(s => side(s, `${pane('M26 48Q36 40 46 48Q36 55 26 48Z', CLEAR, 2.8)}<circle cx="36" cy="49.4" r="3" fill="${LEAD}"/><path d="M26 48Q36 40 46 48Q36 45 26 48Z" fill="var(--skin-dark)" ${lead(2.8)}/>`)),
      jewel: mirror(s => side(s, pane('M36 40L44 48L36 56L28 48Z', 'var(--hair)', 2.8))),
      dots: mirror(s => side(s, `<circle cx="36" cy="48" r="4" fill="${LEAD}"/>`)),
      gaze: mirror(s => side(s, `${pane('M26 48Q36 38 46 48Q36 56 26 48Z', CLEAR, 2.8)}<circle cx="40" cy="47" r="3.4" fill="${LEAD}"/>`)),
    },
    brows: {
      none: '',
      arch: mirror(s => side(s, `<path d="M26 40Q36 32 46 39" ${lead(3.6)}/>`)),
      heavy: mirror(s => side(s, `<path d="M26 39Q36 34 46 38" ${lead(5)}/>`)),
      sad: mirror(s => side(s, `<path d="M27 38L45 34" ${lead(3.6)}/>`)),
    },
    nose: {
      none: '',
      long: `<path d="M46 40Q48 56 44 66Q48 69 54 66" ${lead(2.8)}/>`,
      shard: pane('M50 54L44 68H56Z', 'var(--skin-dark)', 2.6),
      dot: `<circle cx="50" cy="64" r="2" fill="${LEAD}"/>`,
    },
    mouth: {
      serene: `<path d="M43 78Q50 81 57 78" ${lead(3)}/>`,
      smile: pane('M38 74Q50 88 62 74Q50 80 38 74Z', RUBY, 2.8),
      oh: pane('M44 80A6 7 0 1 0 56 80A6 7 0 1 0 44 80Z', RUBY, 2.8),
      flat: `<path d="M40 79H60" ${lead(3.4)}/>`,
      grin: `${pane('M36 74H64Q62 90 50 90Q38 90 36 74Z', RUBY, 2.8)}<path d="M37 74H63V79H37Z" fill="${CLEAR}" ${lead(2.2)}/>`,
      frown: `<path d="M40 82Q50 74 60 82" ${lead(3)}/>`,
    },
    // hair, drawn for a head whose top is at y=14 (shifted for the others): each is a few panes of glass with lead between them
    hair: {
      none: '',
      cap: `${pane('M14 44Q12 8 50 6Q88 8 86 44Q70 30 50 32Q30 30 14 44Z', 'var(--hair)')}<path d="M32 10L36 31M50 6V32M68 10L64 31" ${lead(2.6)}/>`,
      curls: [[20, 34], [28, 20], [40, 12], [52, 9], [64, 12], [74, 20], [81, 34]].map(([x, y]) => pane(`M${x - 9} ${y}A9 9 0 1 0 ${x + 9} ${y}A9 9 0 1 0 ${x - 9} ${y}Z`, 'var(--hair)', 3)).join(''),
      long: `${pane('M12 90Q4 40 20 18Q50 -2 80 18Q96 40 88 90H76L74 36Q50 26 26 36L24 90Z', 'var(--hair)')}<path d="M12 60H24M76 60H88M50 4V28" ${lead(2.6)}/>`,
      flame: pane('M16 40L12 14L28 24L32 0L44 18L50 -4L56 18L68 0L72 24L88 14L84 40Q50 26 16 40Z', 'var(--hair)', 3) + `<path d="M28 24L34 34M50 -2V30M72 24L66 34" ${lead(2.4)}/>`,
      bob: `${pane('M14 66Q6 14 50 8Q94 14 86 66H76L74 34Q50 24 26 34L24 66Z', 'var(--hair)')}<path d="M14 40H26M74 40H86M40 10L42 27M60 10L58 27" ${lead(2.6)}/>`,
    },
    // more glass set into the face
    extra: {
      none: '',
      cheeks: mirror(s => side(s, pane('M22 64A6 6 0 1 0 34 64A6 6 0 1 0 22 64Z', '#f07a8a', 2.4))),
      tear: pane('M66 58Q62 66 66 69Q70 66 66 58Z', '#7ac0f0', 2.2),
      sun: `${pane('M44 28A6 6 0 1 0 56 28A6 6 0 1 0 44 28Z', GOLD, 2.4)}<path d="M50 18V20M50 36V38M40 28H42M58 28H60" ${lead(2)}/>`,
      crack: `<path d="M70 30L64 42L72 48L66 60M64 42L58 44" fill="none" stroke="${CLEAR}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`,
      diamonds: `<g>${[[30, 70], [70, 70], [50, 22]].map(([x, y]) => pane(`M${x} ${y - 5}L${x + 4} ${y}L${x} ${y + 5}L${x - 4} ${y}Z`, '#3aa86a', 2)).join('')}</g>`,
    },
  };

  // ---- hats: glass too; the brim line at y=0 and the crown going up. hatFor() puts one on a head -------------------------------------------------------
  const HAT = {
    none: '',
    pith: `${pane('M-22 0Q-22 -26 0 -28Q22 -26 22 0Z', '#d8b878')}${pane('M-32 0H32V6H-32Z', '#b8944a')}<path d="M0 -28V0" ${lead(2.4)}/>`,
    sailor: `${pane('M-21 0Q-23 -18 0 -20Q23 -18 21 0Z', CLEAR)}${pane('M-26 1Q0 8 26 1L22 -6Q0 0 -22 -6Z', ROBE)}`,
    hard: `${pane('M-23 0Q-23 -25 0 -25Q23 -25 23 0Z', GOLD)}${pane('M-4 -25V-8H4V-25Z', '#c08a20', 2.4)}${pane('M-30 0H30V5H-30Z', GOLD)}`,
    beanie: `${pane('M-22 3Q-25 -22 0 -24Q25 -22 22 3Z', ROBE_2)}${pane('M-23 -4H23V4H-23Z', RUBY, 2.6)}${pane('M-5 -28A5 5 0 1 0 5 -28A5 5 0 1 0 -5 -28Z', CLEAR, 2.4)}`,
    bowler: `${pane('M-15 0V-30Q-15 -33 -12 -33H12Q15 -33 15 -30V0Z', '#3a3a4a')}${pane('M-15 -9H15V-4H-15Z', RUBY, 2.4)}${pane('M-26 2Q0 8 26 2Q26 -3 15 -4H-15Q-26 -3 -26 2Z', '#3a3a4a')}`,
    party: `${pane('M-14 2L0 -38L14 2Z', '#3aa86a')}<path d="M-9 -12L9 -12M-5 -24L5 -24" ${lead(2.4)}/>${pane('M-4 -40A4 4 0 1 0 4 -40A4 4 0 1 0 -4 -40Z', GOLD, 2.4)}`,
    chef: `${pane('M-16 2V-8Q-28 -9 -23 -22Q-18 -34 0 -30Q18 -34 23 -22Q28 -9 16 -8V2Z', CLEAR)}<path d="M-16 -4H16M0 -30V-4" ${lead(2.4)}/>`,
    wizard: `${pane('M-25 5L3 -44L25 5Z', ROBE)}${pane('M-34 0H34V9H-34Z', '#1a3a80')}${pane('M2 -24L5 -18L2 -12L-1 -18Z', GOLD, 2)}<path d="M-13 -18L17 -18" ${lead(2.4)}/>`,
  };
  const hatFor = (name, head = 'round') => HAT[name] ? `<g transform="translate(50 ${headOf(head).top + 9}) rotate(-5) scale(.95)">${HAT[name]}</g>` : '';
  PARTS.hat = HAT;

  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra'];
  const names = (k) => Object.keys(PARTS[k]);
  const DEFAULT = { head: 'arch', ears: 'none', eyes: 'almond', brows: 'arch', nose: 'long', mouth: 'serene', hair: 'cap', extra: 'none', hat: 'none', skin: 'amber', hairColor: 'cobalt', scale: 1 };

  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec }, h = headOf(s.head), [skin, skinDark] = SKIN[s.skin] || SKIN.amber, id = clipId(s.head);
    const pick = (k) => PARTS[k][s[k]] ?? '', ears = pick('ears'), hair = pick('hair');
    const defs = `<defs><linearGradient id="glass-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/>`
      + `<stop offset=".7" stop-color="#000" stop-opacity=".08"/><stop offset=".85" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`
      + `<clipPath id="${id}"><path d="${h.d}"/></clipPath></defs>`;
    return {
      style: `--skin:${skin};--skin-dark:${skinDark};--hair:${HAIR[s.hairColor] || HAIR.cobalt};--accent:${HAIR[s.hairColor] || HAIR.cobalt}`,
      // the halo's two halves meet in the middle, so it is not shifted to the head's edge like real side pieces
      ears: ears ? mirror(sd => side(sd, `<g transform="translate(${s.ears === 'halo' ? 0 : h.left - 20} 0)">${ears}</g>`)) : '',
      head: `${defs}<path d="${h.d}" fill="var(--skin)"/><path d="${h.d}" ${SHEEN}/><path d="${h.leads}" clip-path="url(#${id})" ${lead(2.6)}/><path d="${h.d}" ${lead(4.6)}/>`,
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

  // the expressions the card swaps in over the spec's own eyes, brows and mouth: eyes at x 36 and 64, y 48; the mouth at y 74 to 90. Drawn in lead
  function mood(ink = LEAD) {
    const st = `fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round"`;
    return `<g class="eye-closed" ${st} stroke-width="3.4"><path d="M27 48Q36 55 45 48M55 48Q64 55 73 48"/></g>
      <g class="eye-happy" ${st} stroke-width="3.4"><path d="M27 53Q36 42 45 53M55 53Q64 42 73 53"/></g>
      <g class="eye-sleepy" ${st} stroke-width="3.4"><path d="M27 48H45M55 48H73"/><path d="M29 48Q36 54 43 48M57 48Q64 54 71 48" stroke-width="1.8"/></g>
      <g class="eye-x" ${st} stroke-width="3.4"><path d="M30 42L42 54M42 42L30 54M58 42L70 54M70 42L58 54"/></g>
      <g class="dizzy-eyes" ${st} stroke-width="2.4"><circle cx="36" cy="48" r="8.4" fill="${CLEAR}"/><circle cx="64" cy="48" r="8.4" fill="${CLEAR}"/>
        <path d="M41 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(-5 -18)"/><path d="M59 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(5 -18)"/></g>
      <g class="worry-eyes"><circle cx="36" cy="48" r="8.4" fill="${CLEAR}" stroke="${ink}" stroke-width="2.8"/><circle cx="64" cy="48" r="8.4" fill="${CLEAR}" stroke="${ink}" stroke-width="2.8"/>
        <circle class="pupil" cx="37" cy="46" r="3.2" fill="${ink}"/><circle class="pupil" cx="63" cy="46" r="3.2" fill="${ink}"/></g>
      <path class="worry-brows" d="M26 40Q35 32 46 37M74 40Q65 32 54 37" ${st} stroke-width="3.6"/>
      <path class="brows" d="M27 35L46 42M73 35L54 42" ${st} stroke-width="4.2"/>
      <g class="yawn"><ellipse cx="50" cy="81" rx="7" ry="8.6" fill="${ink}"/></g>
      <path class="worry-mouth" d="M40 84Q45 78 50 84T60 84" ${st} stroke-width="3.2"/>`;
  }

  // a long robe of glass panels, its sleeves and legs as leaded tubes. The robe sits in the legs' group, behind the torso.
  // Same joints and class names as any style (see BODY_CLASSES in ../faces.js), so the page's animation moves these too.
  function body(head) {
    const [top, bot] = headSpan(head), B = (bot - top) / 2;
    const neck = bot - 3, hip = bot + B * .4, shoulder = bot + B * .2, foot = bot + B;
    const lx = B * .2, ly = foot - hip, ax = B * .5, ay = B * .28;
    const f = n => +n.toFixed(2);
    const tube = (x, y, w, c) => `<path d="M0 0l${f(x)} ${f(y)}" stroke="${LEAD}" stroke-width="${w + 5}"/><path d="M0 0l${f(x)} ${f(y)}" stroke="${c}" stroke-width="${w}"/>`;
    const tip = (kind, side) => kind === 'foot' ? `<ellipse cx="${side === 'l' ? -3 : 3}" cy="1.5" rx="7.6" ry="4" fill="#5a3a2a" stroke-width="2.8"/>` : `<circle r="4.6" fill="var(--skin)" stroke-width="2.8"/>`;
    const limb = (b, sub, side, x, y, kind, w, c) => `<g class="${b} side-${side}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}">${tube(x / 2, y / 2, w, c)}<g transform="translate(${f(x / 2)} ${f(y / 2)})">${tip(kind, side)}</g></g></g></g>`;
    const at = (x, y, inner) => `<g transform="translate(${f(x)} ${f(y)})">${inner}</g>`;
    const hem = foot - 8;
    const robe = pane(`M38 ${f(neck)}H62L70 ${f(hem)}H30Z`, ROBE_2) + `<path d="M50 ${f(neck)}V${f(hem)}M34 ${f(hip + 6)}H66" ${lead(2.6)}/>`;
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" stroke="${LEAD}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">`
        + `<g class="lower">${at(44, hip, limb('thigh', 'shin', 'l', -lx, ly, 'foot', 5.6, ROBE_2))}${at(56, hip, limb('thigh', 'shin', 'r', lx, ly, 'foot', 5.6, ROBE_2))}${robe}</g>`
        + `<g class="upper"><g class="torso">${pane(`M38 ${f(neck)}H62L64 ${f(hip + 2)}H36Z`, ROBE)}${pane(`M44 ${f(neck + 2)}L50 ${f(neck + 12)}L56 ${f(neck + 2)}Z`, GOLD, 2.4)}</g>`
        + `${at(38, shoulder, limb('arm', 'fore', 'l', -ax, ay, 'hand', 5.4, ROBE))}${at(62, shoulder, limb('arm', 'fore', 'r', ax, ay, 'hand', 5.4, ROBE))}`,
      close: '</g></g>' };
  }

  // a gold glass crown in leaded panes, with one jewel (which twinkles)
  const crown = (head) => `<g class="crown" transform="translate(50 ${headOf(head).top - 6}) rotate(-4)">
      ${pane('M-16 10L-17 -8L-8 -1L0 -13L8 -1L17 -8L16 10Z', GOLD, 2.8)}<path d="M-8 -1V10M8 -1V10" ${lead(2)}/>
      <circle class="gem" cx="0" cy="3.6" r="3" fill="var(--bean)" stroke="${LEAD}" stroke-width="1.8"/>
    </g>`;

  function random(seed = Math.random() * 1e9) {
    const r = rng(seed | 0), pick = (list) => list[Math.floor(r() * list.length)];
    return { ...Object.fromEntries(ORDER.map(k => [k, pick(names(k))])), hat: 'none', skin: pick(Object.keys(SKIN)), hairColor: pick(Object.keys(HAIR)), scale: 1 };
  }

  // a relative keeps the window shape and its side pieces and has a nearby tint; the eyes, the mouth and the hair are passed down or its own
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
    swatches: [{ key: 'skin', label: 'glass', colors: colors(SKIN, 0) }, { key: 'hairColor', label: 'hair', colors: colors(HAIR, null) }],
  });

  // the map: one great window of coloured glass. Every domain is a small rose window, the base is the big rose window in the middle,
  // the ways are bands of lead, and the web is a bell that rings out far and wide (see map.js)
  const map = (() => {
    const PANES = ['#c0283a', '#2a5ab0', '#e8b830', '#2a9a6a', '#8a3a9a', '#e8702a', '#4ab0d0'], BACK = '#2a3a5a';
    const f = n => +n.toFixed(1);
    const lead = (w = 3.4) => `stroke="${LEAD}" stroke-width="${w}" stroke-linejoin="round"`;
    // a rose window: rings of petals round a hub, each pane tinted, all held in lead; squashed for the tilt of the map
    const rose = (r, seed, petals) => { const rnd = rng(seed | 0), c1 = PANES[Math.floor(rnd() * PANES.length)], c2 = PANES[Math.floor(rnd() * PANES.length)], c3 = PANES[Math.floor(rnd() * PANES.length)];
      const ring = (r0, r1, c, off) => [...Array(petals)].map((_, i) => { const a0 = (i + off) / petals * 2 * Math.PI, a1 = (i + 1 + off) / petals * 2 * Math.PI, p = (a, r) => `${f(Math.cos(a) * r)} ${f(Math.sin(a) * r * .64)}`;
        return `<path d="M${p(a0, r0)}L${p(a0, r1)}A${f(r1)} ${f(r1 * .64)} 0 0 1 ${p(a1, r1)}L${p(a1, r0)}A${f(r0)} ${f(r0 * .64)} 0 0 0 ${p(a0, r0)}Z" fill="${i % 2 ? c : c3}" ${lead(2.6)}/>`; }).join('');
      return `<ellipse rx="${f(r + 8)}" ry="${f((r + 8) * .64)}" fill="${LEAD}"/>` + ring(r * .55, r, c1, 0) + ring(r * .25, r * .55, c2, .5)
        + `<ellipse rx="${f(r * .25)}" ry="${f(r * .16)}" fill="${GOLD}" ${lead(2.6)}/><ellipse rx="${f(r)}" ry="${f(r * .64)}" fill="url(#glass-map-sheen)"/>`; };
    return {
      backdrop: (w, h) => `<defs><linearGradient id="glass-map-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
          <pattern id="glass-quarries" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="44" height="44" fill="${BACK}"/><rect x="2" y="2" width="40" height="40" fill="#3a5078"/><path d="M0 0H44V44" fill="none" stroke="${LEAD}" stroke-width="4"/></pattern></defs>
        <rect width="${w}" height="${h}" fill="url(#glass-quarries)"/>`,
      base: (seed) => rose(108, seed, 12),
      place: (name, seed, n) => rose(60 + Math.min(n, 4) * 3, seed, 8),
      // a tall lancet pane with a pointed top
      building: (name, seed) => `<path d="M-9 12v-20q0-12 9-16q9 4 9 16v20z" fill="${PANES[(seed >>> 0) % PANES.length]}" ${lead(2.4)}/><path d="M-9 0h18M0 -24v36" ${lead(1.8)}/>`,
      // a band of lead with a gold edge
      route: (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${GOLD}" stroke-opacity=".7" stroke-width="12" stroke-linecap="round"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="${LEAD}" stroke-width="7" stroke-linecap="round"/>`,
      // a bell in a gold pane, ringing out
      sea: () => `<ellipse cy="-30" rx="38" ry="38" fill="${LEAD}"/><ellipse cy="-30" rx="33" ry="33" fill="${PANES[6]}"/><path d="M-16 -16q0-30 16-34q16 4 16 34l4 6h-40z" fill="${GOLD}" ${lead(2.6)}/>`
        + `<circle cy="-8" r="4" fill="${GOLD}" ${lead(2)}/><path d="M-26 -50q-6 10 0 20M26 -50q6 10 0 20" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2.4" stroke-linecap="round"/>`,
    };
  })();

  return { name: 'glass', label: 'Stained glass', emoji: '🪟', description: 'Stained-glass window heads of tinted panes held in thick dark lead.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT, map };
})());
