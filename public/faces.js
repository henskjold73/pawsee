// Face styles. A style is one complete way of drawing the agents' heads; this file is the registry that the rest of the page talks to.
// Styles live in public/faces/<name>.js and call Faces.register({...}) when they load (see faces/cel.js, the reference style).
//
// Pick one with ?faces=<name> (remembered in localStorage), or Faces.use('<name>'). The default is DEFAULT_STYLE.
//
// What a style provides. Every drawing is an SVG fragment on a 100x100 head canvas (head centre about 50,52):
//   name, label                      id (file name) and a human title
//   compose(spec, {size,title})      -> a standalone <svg> string for one head (cards' portraits, pickers)
//   pieces(spec)                     -> the layers of one head for the animated card: { style, ears, head, extra, hair, eyes, brows, nose, mouth, hat, scale }
//                                       (style is a CSS custom-property string such as "--skin:#fff"; scale is how big a relative is drawn)
//   mood(ink)                        -> the expressions the card swaps in (sleepy, happy, worried, dizzy, failed ...): one SVG fragment holding
//                                       an element for each class in MOOD_CLASSES. The page's CSS shows and hides them, the style only draws them.
//   hatFor(name, head)               -> a hat (names in HAT_NAMES) placed on that head, or '' when the style has no such hat
//   headSpan(head)                   -> [top, bottom] of the head outline in canvas y; the body is sized and hung from it
//   body(head)                       -> the body hanging from the chin, as { open, close }: two strings of SVG that wrap the head (open is written before the head,
//                                       close after it, so the head rides with the torso). The page's CSS walks, runs, squats and jumps it by class, so it must
//                                       contain the elements named in BODY_CLASSES: .stick holds .lower (legs) and .upper (torso and arms, left open for the head);
//                                       a leg is .thigh with a .shin inside it, an arm is .arm with a .fore inside it, each marked .side-l or .side-r and drawn from
//                                       its joint at the local origin; set --d (how far a squat drops) and --j (how high a jump goes, px) on .stick.
//   crown(head)                      -> the main agent's crown: a <g class="crown"> placed on the head, with an element of class gem inside it that twinkles
//                                       A body may also carry a tail: any element with class tail inside .stick is swished by the page's CSS (optional).
//   random(seed, {human})            -> a spec, the same seed always giving the same spec. human:true leaves out heads that are not people (paws)
//   derive(main, seed)               -> a smaller relative of the main spec, for sub-agents
//   editor(spec)                     -> what faces.html needs to show pickers: { slots: [{key, options, fixed}], swatches: [{key, label, colors}] }
//   DEFAULT                          -> a complete spec
// Faces.kin() is there so a style's derive() can be one call: see faces/pixel.js.
// A style with `secret: true` is left out of styles() until Faces.unlock(name) has been called for it (or while it is the one in use).
// A spec is plain JSON, owned by its style, so each style can have its own parts. Unknown parts are ignored, so a spec from one style can be handed to another.
const Faces = (() => {
  const DEFAULT_STYLE = 'cel';
  const FUNCTIONS = ['compose', 'pieces', 'mood', 'hatFor', 'headSpan', 'body', 'crown', 'random', 'derive', 'editor'];
  const PIECES = ['style', 'ears', 'head', 'extra', 'hair', 'eyes', 'brows', 'nose', 'mouth', 'hat', 'scale'];
  const MOOD_CLASSES = ['eye-closed', 'eye-happy', 'eye-sleepy', 'eye-x', 'dizzy-eyes', 'worry-eyes', 'worry-brows', 'brows', 'yawn', 'worry-mouth'];
  const BODY_CLASSES = ['stick', 'lower', 'upper', 'torso', 'thigh', 'shin', 'arm', 'fore', 'side-l', 'side-r'];
  const HAT_NAMES = ['pith', 'sailor', 'hard', 'beanie', 'bowler', 'party', 'chef', 'wizard'];

  // small seeded random and string hash, shared so that a style's agents keep their faces from one run to the next
  const rng = (seed) => { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hash = (str) => { let h = 2166136261; for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

  // A relative of `main` for derive(): the tone key moves to the same or a neighbouring value, then each trait in `keep` (trait -> chance it is passed down)
  // is kept or swapped for another option from pool(trait); at least two always change, so a relative is never a copy.
  function kin(main, seed, { keep, pool, tone }) {
    const r = rng(typeof seed === 'number' ? seed + 1 : hash(seed));
    const out = { ...main, scale: +(0.55 + r() * 0.2).toFixed(2) };
    if (tone) {
      const at = tone.list.indexOf(main[tone.key]);
      out[tone.key] = tone.list[(at + [0, 0, 1, -1][Math.floor(r() * 4)] + tone.list.length) % tone.list.length];
    }
    const traits = Object.keys(keep).sort(() => r() - .5), change = traits.filter(k => r() >= keep[k]);
    for (const k of traits) if (change.length < 2 && !change.includes(k)) change.push(k);
    for (const k of change) { const options = pool(k).filter(x => x !== main[k]); if (options.length) out[k] = options[Math.floor(r() * options.length)]; }
    return out;
  }

  const styles = new Map();
  let current = null;

  // what is wrong with a style, as a list of sentences (empty when it is fine). register() throws on these; tests run it too.
  function problems(s) {
    const out = [];
    if (!s || typeof s !== 'object') return ['a style is an object'];
    if (!/^[a-z][a-z0-9-]*$/.test(s.name || '')) out.push('name must be lowercase letters, digits and dashes (it is the file name)');
    if (typeof s.label !== 'string' || !s.label) out.push('label is missing');
    for (const f of FUNCTIONS) if (typeof s[f] !== 'function') out.push(`${f} must be a function`);
    if (!s.DEFAULT || typeof s.DEFAULT !== 'object') out.push('DEFAULT must be a spec');
    return out;
  }
  function register(style) {
    const bad = problems(style);
    if (bad.length) throw new Error(`face style ${style && style.name || '?'}: ${bad.join('; ')}`);
    styles.set(style.name, style);
    if (!current || style.name === wanted()) current = style;
    return style;
  }
  function wanted() {
    try { const q = new URLSearchParams(location.search).get('faces'); if (q) { try { localStorage.setItem('pawsee.faces', q); } catch {} return q; } } catch {}
    try { return localStorage.getItem('pawsee.faces') || DEFAULT_STYLE; } catch { return DEFAULT_STYLE; }
  }
  // use(name) switches to a style and remembers the choice; use(name, { save: false }) switches for now only
  const listeners = [];
  function use(name, { save = true } = {}) {
    if (!styles.has(name)) throw new Error(`no face style "${name}" (have: ${[...styles.keys()].join(', ') || 'none'})`);
    current = styles.get(name);
    if (save) try { localStorage.setItem('pawsee.faces', name); } catch {}
    for (const fn of listeners) try { fn(current); } catch {}
    return current;
  }
  // secret styles stay out of the list until they are unlocked (the unlocks are remembered)
  const unlockedNames = () => { try { return JSON.parse(localStorage.getItem('pawsee.unlocked') || '[]'); } catch { return []; } };
  const unlocked = new Set(unlockedNames());
  function unlock(name) {
    if (!styles.has(name) || unlocked.has(name)) return false;
    unlocked.add(name);
    try { localStorage.setItem('pawsee.unlocked', JSON.stringify([...unlocked])); } catch {}
    return true;
  }
  // the styles to offer; { all: true } also gives the ones still locked, marked locked: true
  function list({ all = false } = {}) {
    return [...styles.values()].map(s => ({ name: s.name, label: s.label, description: s.description || '', secret: !!s.secret, locked: !!s.secret && !unlocked.has(s.name) && s !== current }))
      .filter(s => all || !s.locked);
  }
  const active = () => {
    if (!current) throw new Error('no face style loaded: include faces/<name>.js after faces.js');
    return current;
  };

  const api = {
    register, use, problems, rng, hash, kin, MOOD_CLASSES, BODY_CLASSES, HAT_NAMES, PIECES, DEFAULT_STYLE,
    styles: list, unlock, onUse: (fn) => { listeners.push(fn); },
    get style() { return active(); },
    get DEFAULT() { return active().DEFAULT; },
  };
  for (const f of FUNCTIONS) api[f] = (...args) => active()[f](...args);
  return api;
})();
if (typeof module !== 'undefined') module.exports = Faces;
