// The "cel" face style: a kit of face parts, drawn like a Flintstones cel meets The Ricky Gervais Show: thick ink line, flat colour, a deadpan stare.
// Every part is an SVG fragment on a 100x100 head canvas (head centre about 50,52), so any part fits any head.
// A spec is { head, ears, eyes, brows, nose, mouth, hair, extra, hat, skin, hairColor, pawColor, scale }.
// The contract a style has to meet is described at the top of ../faces.js. To make another style, copy this file to faces/<name>.js, change `name`, and redraw the parts.
Faces.register((() => {
  const { rng, hash } = Faces;
  const INK = '#2b1b12';
  const L = `stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`; // the hard ink line
  const line = `fill="none" ${L}`;
  const mirror = (f) => f(1) + f(-1); // draws a part on the right side, then flips it to the left
  const side = (s, body) => `<g transform="translate(${s < 0 ? 100 : 0} 0) scale(${s} 1)">${body}</g>`;

  const SKIN = {
    peach: ['#f6c9a0', '#e3a26f'], pink: ['#f4b8a6', '#dd8f7d'], tan: ['#e0a878', '#c58352'],
    brown: ['#b87a52', '#955a37'], olive: ['#d9b77a', '#b99353'], pale: ['#f7dcc4', '#e5b99a'],
  };
  // paws and claws are not skin: they wear the card colours (the same pastel hues the agents get)
  const PAWCOLOR = Object.fromEntries([['peach', 25], ['sky', 205], ['mint', 150], ['lilac', 270], ['lemon', 50], ['rose', 340], ['lime', 90], ['aqua', 180]].map(([n, h]) => [n, [`hsl(${h} 85% 76%)`, `hsl(${h} 60% 56%)`]]));
  const HAIR = { ink: INK, ginger: '#d9622b', grey: '#9a948c', blond: '#e4b94d', brown: '#6b4026' };

  const PARTS = {
    // the head outline; everything else is clipped or placed against it
    head: {
      egg: 'M50 9C73 9 83 31 81 52C79 77 67 91 50 91C33 91 21 77 19 52C17 31 27 9 50 9Z',
      round: 'M50 14C72 14 86 31 86 53C86 76 70 92 50 92C30 92 14 76 14 53C14 31 28 14 50 14Z',
      square: 'M20 22Q20 11 32 11H68Q80 11 80 22V60Q80 74 70 84Q60 93 50 93Q40 93 30 84Q20 74 20 60Z',
      pear: 'M50 11C64 11 70 24 72 38C74 52 85 62 81 75C77 89 62 93 50 93C38 93 23 89 19 75C15 62 26 52 28 38C30 24 36 11 50 11Z',
      paw: 'M50 44c-17 0-30 14-30 28 0 10 8 16 17 16 6 0 9-3 13-3s7 3 13 3c9 0 17-6 17-16 0-14-13-28-30-28z',
      claw: 'M50 44c-17 0-30 14-30 28 0 10 8 16 17 16 6 0 9-3 13-3s7 3 13 3c9 0 17-6 17-16 0-14-13-28-30-28z',
      long: 'M50 5C69 5 77 22 77 45C77 71 67 95 50 95C33 95 23 71 23 45C23 22 31 5 50 5Z',
    },
    ears: {
      none: '',
      round: mirror(s => side(s, `<circle cx="17" cy="54" r="9" fill="var(--skin)" ${L}/><path d="M15 50Q19 54 15 59" ${line} stroke-width="2"/>`)),
      big: mirror(s => side(s, `<ellipse cx="14" cy="52" rx="9" ry="15" fill="var(--skin)" ${L}/><path d="M14 44Q19 52 14 61" ${line} stroke-width="2"/>`)),
      small: mirror(s => side(s, `<circle cx="19" cy="55" r="5.5" fill="var(--skin)" ${L}/>`)),
      flap: mirror(s => side(s, `<path d="M22 44Q6 40 8 56Q10 68 22 64Z" fill="var(--skin)" ${L}/><path d="M17 50Q13 54 17 59" ${line} stroke-width="2"/>`)),
    },
    eyes: {
      dots: mirror(s => side(s, `<circle cx="37" cy="48" r="3.4" fill="${INK}"/>`)),
      pupils: mirror(s => side(s, `<circle cx="37" cy="48" r="7" fill="#fff" ${L} stroke-width="2.6"/><circle cx="38.5" cy="48.5" r="2.4" fill="${INK}"/>`)),
      deadpan: mirror(s => side(s, `<circle cx="37" cy="48" r="7" fill="#fff" ${L} stroke-width="2.6"/><circle cx="38.5" cy="50" r="2.4" fill="${INK}"/><path d="M29.6 48H44.4V40H29.6Z" fill="var(--skin)"/><path d="M30 48H44" ${line} stroke-width="2.6"/>`)),
      beady: mirror(s => side(s, `<circle cx="42" cy="48" r="2.3" fill="${INK}"/>`)),
      bulgy: mirror(s => side(s, `<circle cx="36" cy="46" r="10" fill="#fff" ${L} stroke-width="2.6"/><circle cx="38" cy="47" r="3.2" fill="${INK}"/>`)),
      sleepy: mirror(s => side(s, `<path d="M30 48Q37 54 44 48" ${line} stroke-width="2.6"/>`)),
    },
    brows: {
      none: '',
      flat: mirror(s => side(s, `<path d="M28 36H46" ${line}/>`)),
      angry: mirror(s => side(s, `<path d="M28 34L46 40" ${line}/>`)),
      worried: mirror(s => side(s, `<path d="M28 40L46 33" ${line}/>`)),
      unibrow: `<path d="M27 38Q38 33 50 38Q62 33 73 38" ${line} stroke-width="4.2"/>`,
      bushy: mirror(s => side(s, `<path d="M27 38Q36 30 47 37Q38 36 27 38Z" fill="${INK}" ${L} stroke-width="2"/>`)),
    },
    nose: {
      button: `<circle cx="50" cy="61" r="4" fill="var(--skin-dark)" ${L} stroke-width="2.4"/>`,
      round: `<circle cx="50" cy="62" r="9" fill="var(--skin-dark)" ${L}/><path d="M45 60Q47 58 50 58" ${line} stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`,
      potato: `<path d="M41 62C41 53 59 53 59 62C59 70 41 70 41 62Z" fill="var(--skin-dark)" ${L}/>`,
      long: `<path d="M48 44Q42 60 44 68Q50 74 58 67Q54 66 54 62" fill="var(--skin-dark)" ${L}/>`,
      hook: `<path d="M50 46Q46 60 42 66Q50 70 58 64Q52 62 52 56" fill="var(--skin-dark)" ${L}/>`,
      pig: `<ellipse cx="50" cy="62" rx="10" ry="7" fill="var(--skin-dark)" ${L}/><circle cx="46" cy="62" r="1.8" fill="${INK}"/><circle cx="54" cy="62" r="1.8" fill="${INK}"/>`,
    },
    mouth: {
      flat: `<path d="M40 78H60" ${line}/>`,
      smirk: `<path d="M40 79Q52 81 61 74" ${line}/>`,
      frown: `<path d="M40 81Q50 73 60 81" ${line}/>`,
      open: `<path d="M40 74Q50 70 60 74Q60 88 50 88Q40 88 40 74Z" fill="${INK}" ${L} stroke-width="2.6"/><path d="M44 84Q50 80 56 84Q50 88 44 84Z" fill="#e0707c"/>`,
      overbite: `<path d="M40 77Q50 80 60 77" ${line}/><path d="M45 78.5V86H50V79M50 79V86H55V78.5" fill="#fff" ${L} stroke-width="2.2"/>`,
      small: `<ellipse cx="50" cy="79" rx="4" ry="5" fill="${INK}"/>`,
      grin: `<path d="M38 74Q50 86 62 74Z" fill="#fff" ${L} stroke-width="2.6"/><path d="M42 77H58" ${line} stroke-width="1.6"/>`,
    },
    hair: {
      bald: '',
      tuft: `<g fill="none" stroke="var(--hair)" stroke-width="3" stroke-linecap="round"><path d="M45 12Q40 3 47 0"/><path d="M50 11Q51 1 58 0"/><path d="M55 12Q61 5 67 8"/></g>`,
      sides: mirror(s => side(s, `<path d="M21 46Q16 30 28 24Q22 36 26 46Z" fill="var(--hair)" ${L} stroke-width="2.4"/>`)),
      swoop: `<path d="M20 36C22 12 52 4 76 20C80 24 81 30 80 36C71 25 58 22 46 28C38 32 28 36 20 36Z" fill="var(--hair)" ${L}/>`,
      mop: `<path d="M18 44C12 18 34 4 54 6C74 8 88 22 82 44C76 32 66 26 50 28C34 30 24 34 18 44Z" fill="var(--hair)" ${L}/>`,
      combover: `<g fill="none" stroke="var(--hair)" stroke-width="2.6" stroke-linecap="round"><path d="M26 22Q50 8 76 24"/><path d="M28 28Q50 14 74 30"/><path d="M32 17Q50 8 70 18"/></g>`,
      spikes: `<path d="M24 30L22 8L36 20L42 2L52 18L62 2L66 20L80 8L78 30Q50 18 24 30Z" fill="var(--hair)" ${L}/>`,
    },
    // marks that sit on top of the face (the stubble is a hard shadow clipped to the head)
    extra: {
      none: '',
      stubble: 'stubble',
      wrinkles: `<g ${line} stroke-width="2"><path d="M34 22Q50 17 66 22"/><path d="M36 28Q50 24 64 28"/></g>`,
      freckles: `<g fill="var(--skin-dark)">${[[34, 62], [39, 66], [30, 66], [66, 62], [61, 66], [70, 66]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5"/>`).join('')}</g>`,
      bags: mirror(s => side(s, `<path d="M30 57Q37 61 44 57" ${line} stroke-width="2"/>`)),
      cleft: `<path d="M49 87Q50 90 51 87" ${line} stroke-width="2"/>`,
    },
  };

  // paw and claw heads are the original cute paw, untouched: no ears, hair, brows or human features. Only the colour changes.
  // Their face is fixed (dot eyes, bean nose, tiny mouth, blush); the toes, pad and claws are the same shapes the cards use.
  const PAWLIKE = new Set(['paw', 'claw']);
  const TOE_AT = [[20, 42, 10, 13, -20, 'M16 31Q17 21 23 17Q24 25 24 31Z'], [38, 26, 10, 14, -6, 'M34 14Q35 4 41 0Q42 8 42 14Z'], [62, 26, 10, 14, 6, 'M58 14Q59 4 65 0Q66 8 66 14Z'], [80, 42, 10, 13, 20, 'M76 31Q77 21 83 17Q84 25 84 31Z']];
  const pawSvg = (claws) => `<g fill="var(--skin)" ${L} stroke-width="2.6">${TOE_AT.map(([cx, cy, rx, ry, rot, claw]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})"/>${claws ? `<path d="${claw}" transform="rotate(${rot} ${cx} ${cy})" fill="#f6efe6" stroke-width="2.2"/>` : ''}`).join('')}
    <path d="${PARTS.head.paw}"/></g>
    <g fill="#3b2f2f"><circle cx="41" cy="66" r="3.6"/><circle cx="59" cy="66" r="3.6"/></g><g fill="#fff"><circle cx="42.2" cy="64.8" r="1.1"/><circle cx="60.2" cy="64.8" r="1.1"/></g>
    <ellipse cx="50" cy="74" rx="3.4" ry="2.6" fill="#f07c8e"/><path d="M50 76.5v2.5m-4 0q4 3 8 0" stroke="#3b2f2f" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <circle cx="33" cy="73" r="3.5" fill="#f07c8e" opacity=".35"/><circle cx="67" cy="73" r="3.5" fill="#f07c8e" opacity=".35"/>`;


  // hats sit on the head with the brim line at y=0 and the crown going up; hatFor() moves one onto a given head. Sub-agents wear the one that matches their work.
  const HEAD_TOP = { egg: 9, round: 14, square: 11, pear: 11, long: 5 };
  const HAT = {
    none: '',
    pith: `<path d="M-23 0Q-23 -27 0 -29Q23 -27 23 0Z" fill="#dcc48e" ${L}/><path d="M-23 -5H23" ${line} stroke-width="2.4"/><path d="M-35 3Q0 -6 35 3Q30 10 0 10Q-30 10 -35 3Z" fill="#cdb078" ${L}/><path d="M0 -29V-34" ${line} stroke-width="3"/>`,
    sailor: `<path d="M-22 0Q-24 -19 0 -21Q24 -19 22 0Z" fill="#fff" ${L}/><path d="M-27 1Q0 9 27 1L23 -6Q0 0 -23 -6Z" fill="#3f63b8" ${L}/><path d="M-4 -12L4 -12" ${line} stroke-width="2"/>`,
    hard: `<path d="M-25 0Q-25 -27 0 -27Q25 -27 25 0Z" fill="#f3c531" ${L}/><path d="M-5 -27V-9H5V-27" fill="#e0a91a" ${L} stroke-width="2.4"/><path d="M-33 0H33V6H-33Z" fill="#f3c531" ${L}/>`,
    beanie: `<path d="M-24 3Q-27 -24 0 -26Q27 -24 24 3Z" fill="#c9473d" ${L}/><path d="M-25 -4H25V4H-25Z" fill="#e0675b" ${L} stroke-width="2.4"/><circle cy="-30" r="5" fill="#f2e2c4" ${L} stroke-width="2.4"/>`,
    bowler: `<path d="M-20 0Q-22 -23 0 -25Q22 -23 20 0Z" fill="#3d3b45" ${L}/><path d="M-20 -6H20" ${line} stroke="#e8645a" stroke-width="3"/><path d="M-31 1Q0 9 31 1Q28 8 0 9Q-28 8 -31 1Z" fill="#3d3b45" ${L}/>`,
    party: `<path d="M-15 2L0 -38L15 2Z" fill="#ec7fa6" ${L}/><path d="M-9 -12L9 -12M-5 -24L5 -24" ${line} stroke="#fff" stroke-width="2.6"/><circle cy="-40" r="4.2" fill="#f6c945" ${L} stroke-width="2.4"/>`,
    chef: `<path d="M-17 2V-8Q-30 -9 -25 -22Q-20 -35 0 -31Q20 -35 25 -22Q30 -9 17 -8V2Z" fill="#fff" ${L}/><path d="M-17 -4H17" ${line} stroke-width="2"/>`,
    wizard: `<path d="M-26 5L3 -44L26 5Z" fill="#5b4bb5" ${L}/><ellipse cy="5" rx="35" ry="7" fill="#5b4bb5" ${L}/><path d="M-4 -18l1.6 3.6 3.8.4-2.9 2.6.8 3.8-3.3-2-3.3 2 .8-3.8-2.9-2.6 3.8-.4Z" fill="#f6c945" stroke="none"/><circle cx="9" cy="-4" r="2" fill="#f6c945"/>`,
  };
  const hatFor = (name, head = 'egg') => HAT[name] ? `<g transform="translate(50 ${(HEAD_TOP[head] ?? 9) + 9}) scale(.95)">${HAT[name]}</g>` : '';

  PARTS.hat = HAT;
  const ORDER = ['head', 'ears', 'eyes', 'brows', 'nose', 'mouth', 'hair', 'extra']; // the order the pickers show
  let uid = 0;

  const DEFAULT = { head: 'egg', ears: 'round', eyes: 'deadpan', brows: 'none', nose: 'potato', mouth: 'flat', hair: 'tuft', extra: 'none', skin: 'peach', hairColor: 'ink', pawColor: 'peach', hat: 'none', scale: 1 };

  function pieces(spec = {}) {
    const s = { ...DEFAULT, ...spec };
    const [skin, skinDark] = SKIN[s.skin] || SKIN.peach;
    const id = `fc${++uid}`, pick = (k) => PARTS[k][s[k]] ?? '';
    const d = PARTS.head[s.head] || PARTS.head.egg;
    const stubble = `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})"><ellipse cx="50" cy="104" rx="46" ry="32" fill="${INK}" opacity=".28"/><g fill="${INK}" opacity=".7">${[[34, 70], [42, 74], [58, 74], [66, 70], [30, 78], [70, 78], [38, 84], [62, 84], [50, 88], [46, 82], [54, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1"/>`).join('')}</g></g>`;
    return { style: `--skin:${skin};--skin-dark:${skinDark};--hair:${HAIR[s.hairColor] || INK}`, ears: pick('ears'), head: `<path d="${d}" fill="var(--skin)" ${L}/>`,
      extra: s.extra === 'stubble' ? stubble : pick('extra'), hair: pick('hair'), eyes: pick('eyes'), brows: pick('brows'), nose: pick('nose'), mouth: pick('mouth'), hat: hatFor(s.hat, s.head), scale: s.scale || 1 };
  }

  function compose(spec = {}, { size = 120, title = '' } = {}) {
    const s = { ...DEFAULT, ...spec };
    const [skin, skinDark] = PAWLIKE.has(s.head) ? (PAWCOLOR[s.pawColor] || PAWCOLOR.peach) : (SKIN[s.skin] || SKIN.peach);
    const id = `fc${++uid}`, pawlike = PAWLIKE.has(s.head);
    const pick = (k) => PARTS[k][s[k]] ?? '';
    const stubble = s.extra === 'stubble'
      ? `<clipPath id="${id}"><path d="${PARTS.head[s.head] || PARTS.head.egg}"/></clipPath>
         <g clip-path="url(#${id})"><ellipse cx="50" cy="104" rx="46" ry="32" fill="${INK}" opacity=".28"/>
         <g fill="${INK}" opacity=".7">${[[34, 70], [42, 74], [58, 74], [66, 70], [30, 78], [70, 78], [38, 84], [62, 84], [50, 88], [46, 82], [54, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1"/>`).join('')}</g></g>` : '';
    const px = Math.round(size * (s.scale || 1));
    if (pawlike) return `<svg class="face" viewBox="-4 -8 108 108" width="${px}" height="${px}" role="img" aria-label="${title || s.head}" style="--skin:${skin};--skin-dark:${skinDark}">${pawSvg(s.head === 'claw')}</svg>`;
    return `<svg class="face" viewBox="-4 -4 108 108" width="${px}" height="${px}" role="img" aria-label="${title || 'face'}"
      style="--skin:${skin};--skin-dark:${skinDark};--hair:${HAIR[s.hairColor] || INK}">
      ${pick('ears')}
      <path d="${PARTS.head[s.head] || PARTS.head.egg}" fill="var(--skin)" ${L}/>
      ${stubble}${s.extra !== 'stubble' ? pick('extra') : ''}
      ${pick('hair')}${pick('eyes')}${pick('brows')}${pick('nose')}${pick('mouth')}${hatFor(s.hat, s.head)}
    </svg>`;
  }

  const names = (k) => Object.keys(PARTS[k]);

  // a child of `main`: like a family, each trait is either passed down or comes out different. The head shape and ears are always the parent's; the nose and skin run in the family most of the time,
  // so you can see who they belong to, but every child has a few features of its own (and at least two of its own, so none is a copy).
  const KEEP = { nose: .65, eyes: .5, mouth: .45, brows: .4, hair: .4, hairColor: .5, extra: .4 };
  function derive(main, seed = 0) {
    const r = rng(typeof seed === 'number' ? seed + 1 : hash(seed));
    const m = { ...DEFAULT, ...main };
    const out = { ...m, scale: +(0.55 + r() * 0.2).toFixed(2), hat: m.hat };
    if (PAWLIKE.has(m.head)) { out.pawColor = Object.keys(PAWCOLOR)[Math.floor(r() * 8)]; return out; }
    const skins = Object.keys(SKIN), at = skins.indexOf(m.skin);
    out.skin = skins[(at + [0, 0, 1, -1][Math.floor(r() * 4)] + skins.length) % skins.length]; // the same tone or the one next to it
    const traits = Object.keys(KEEP).sort(() => r() - .5);
    let change = traits.filter(k => r() >= KEEP[k]);
    for (const k of traits) if (change.length < 2 && !change.includes(k)) change.push(k); // never a copy
    for (const k of change) {
      const pool = k === 'hairColor' ? Object.keys(HAIR).filter(x => x !== m[k]) : names(k).filter(x => x !== m[k] && !(k === 'head' && PAWLIKE.has(x)));
      out[k] = pool[Math.floor(r() * pool.length)];
    }
    return out;
  }

  function random(seed = Math.random() * 1e9, { human = false } = {}) {
    const r = rng(seed | 0), pickOf = (k) => { const n = names(k).filter(x => !(human && k === 'head' && PAWLIKE.has(x))); return n[Math.floor(r() * n.length)]; };
    return { ...Object.fromEntries(ORDER.map(k => [k, pickOf(k)])), skin: Object.keys(SKIN)[Math.floor(r() * 6)], pawColor: Object.keys(PAWCOLOR)[Math.floor(r() * 8)], hairColor: Object.keys(HAIR)[Math.floor(r() * 5)], scale: 1 };
  }

  // the agent's head is a canvas of these heights; the stick body is half as tall and hangs from the chin
  const HEAD_Y = { egg: [9, 91], round: [14, 92], square: [11, 93], pear: [11, 93], long: [5, 95], paw: [44, 88], claw: [44, 88] };
  const headSpan = (head) => HEAD_Y[head] || HEAD_Y.egg;

  // the expressions the card swaps in over the spec's own eyes, brows and mouth: eyes sit at x 37 and 63, y 48; the mouth at y 80
  function mood(ink = INK) {
    const st = `stroke="${ink}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
    return `<g class="eye-closed" ${st} stroke-width="3"><path d="M30 48q7 5 14 0M56 48q7 5 14 0"/></g>
      <g class="eye-happy" ${st} stroke-width="3"><path d="M30 51q7-8 14 0M56 51q7-8 14 0"/></g>
      <g class="eye-sleepy" ${st} stroke-width="3"><path d="M30 48h14M56 48h14"/><path d="M31 48a6 6 0 0 0 12 0M57 48a6 6 0 0 0 12 0" fill="${ink}" stroke-width="1.6"/></g>
      <g class="eye-x" ${st} stroke-width="3"><path d="M32 43l10 10M42 43l-10 10M58 43l10 10M68 43l-10 10"/></g>
      <g class="dizzy-eyes" ${st} stroke-width="2"><circle cx="37" cy="48" r="7.5" fill="#fff"/><circle cx="63" cy="48" r="7.5" fill="#fff"/>
        <path d="M41 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(-4 -18)"/><path d="M59 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="translate(4 -18)"/></g>
      <g class="worry-eyes"><circle cx="37" cy="48" r="7.5" fill="#fff" stroke="${ink}" stroke-width="2.6"/><circle cx="63" cy="48" r="7.5" fill="#fff" stroke="${ink}" stroke-width="2.6"/>
        <circle class="pupil" cx="38" cy="46" r="2.6" fill="${ink}"/><circle class="pupil" cx="62" cy="46" r="2.6" fill="${ink}"/></g>
      <path class="worry-brows" d="M27 40L45 33M73 40L55 33" ${st} stroke-width="3"/>
      <path class="brows" d="M28 35L46 41M72 35L54 41" ${st} stroke-width="3.4"/>
      <ellipse class="yawn" cx="50" cy="80" rx="4.5" ry="5.5" fill="${ink}"/>
      <path class="worry-mouth" d="M40 82q5-4 10 0t10 0" ${st} stroke-width="3"/>`;
  }

  // a stick body hangs from the chin: half as tall as the head. It is jointed (thigh+shin, arm+forearm) so CSS can walk, run, squat and jump it.
  // `lower` is the legs, `upper` is torso+arms and stays open: the card puts the head inside it (so the head rides with the torso) and closes it.
  function body(head) {
    const [top, bot] = headSpan(head), B = (bot - top) / 2;            // body height = 50% of head height
    const neck = bot - 3, hip = bot + B * .4, shoulder = bot + B * .2, foot = bot + B;
    const lx = B * .22, ly = foot - hip, ax = B * .5, ay = B * .28;
    const f = n => +n.toFixed(2);
    // a two-bone limb drawn from (0,0) at its joint; `x`,`y` is the whole limb's vector. Left limbs get class side-l (--s:1), right ones side-r (--s:-1).
    const limb = (cls, bone, sub, side, x, y) => `<g class="${bone} side-${side}"><path d="M0 0l${f(x / 2)} ${f(y / 2)}"/><g transform="translate(${f(x / 2)} ${f(y / 2)})"><g class="${sub}"><path d="M0 0l${f(x / 2)} ${f(y / 2)}"/></g></g></g>`;
    const at = (x, y, inner) => `<g transform="translate(${x} ${f(y)})">${inner}</g>`;
    return { open: `<g class="stick" style="--d:${f(ly * .24)}px;--j:${f(B * .8)}px" stroke="#2b1b12" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="none">`
        + `<g class="lower">${at(50, hip, limb('', 'thigh', 'shin', 'l', -lx, ly) + limb('', 'thigh', 'shin', 'r', lx, ly))}</g>`
        + `<g class="upper"><path class="torso" d="M50 ${f(neck)}V${f(hip)}"/>${at(50, shoulder, limb('', 'arm', 'fore', 'l', -ax, ay) + limb('', 'arm', 'fore', 'r', ax, ay))}`,
      close: '</g></g>' };
  }

  // the main agent's crown, tilted on the head; the gem twinkles (class gem). The card shows it for the main agent only.
  const crown = () => `<g class="crown" transform="translate(50 6) rotate(-5)">
      <path d="M-15 8L-17 -8L-8 -1L0 -12L8 -1L17 -8L15 8Z" fill="#f6c945" stroke="#c9961a" stroke-width="2" stroke-linejoin="round"/>
      <rect x="-15" y="5" width="30" height="5.5" rx="2" fill="#e8b32c" stroke="#c9961a" stroke-width="1.6"/>
      <circle cx="-17" cy="-8" r="2.3" fill="#fff3b0" stroke="#c9961a" stroke-width="1.3"/><circle cx="0" cy="-12" r="2.3" fill="#fff3b0" stroke="#c9961a" stroke-width="1.3"/><circle cx="17" cy="-8" r="2.3" fill="#fff3b0" stroke="#c9961a" stroke-width="1.3"/>
      <circle class="gem" cx="0" cy="7.8" r="2" fill="var(--bean)"/>
    </g>`;

  // what faces.html shows: a row of part pickers and some colour swatches. Paws wear the card colours and have a fixed face, so only their colour is offered.
  function editor(spec = {}) {
    const paw = PAWLIKE.has(spec.head ?? DEFAULT.head);
    const colors = (table, i) => Object.fromEntries(Object.entries(table).map(([n, v]) => [n, i === null ? v : v[i]]));
    return {
      slots: [...ORDER, 'hat'].map(key => ({ key, options: names(key), fixed: paw && key !== 'head' })),
      swatches: paw ? [{ key: 'pawColor', label: 'paw colour', colors: colors(PAWCOLOR, 0) }]
        : [{ key: 'skin', label: 'skin', colors: colors(SKIN, 0) }, { key: 'hairColor', label: 'hair colour', colors: colors(HAIR, null) }],
    };
  }

  return { name: 'cel', label: 'Cel', emoji: '🗿', description: 'Thick ink line, flat colour and a deadpan stare.', compose, pieces, mood, hatFor, headSpan, body, crown, derive, random, editor, DEFAULT };
})());
