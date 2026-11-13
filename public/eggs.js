// A few hidden surprises. They are harmless, they never touch real alerts, and `?eggs=0` in the address turns them all off (remembered; `?eggs=1` turns them back on).
// The first part is plain logic that tests can run; the second part (the bottom of the file) wires it to the page, and only runs in a browser.
const PawEggs = (() => {
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  const isFriday13 = (d) => d.getDay() === 5 && d.getDate() === 13;

  // feed it key names one at a time; it says true on the key that completes the code. It looks at the last few keys, so an extra key before the code (or an extra arrow that is part of it) is fine.
  function konami(code = KONAMI) {
    let recent = [];
    return (key) => {
      recent.push(key.length === 1 ? key.toLowerCase() : key);
      if (recent.length > code.length) recent.shift();
      if (recent.length === code.length && recent.every((k, i) => k === code[i])) { recent = []; return true; }
      return false;
    };
  }

  // have all of `wanted` been seen?
  const hasSeenAll = (seen, wanted) => wanted.length > 0 && wanted.every(n => seen.includes(n));

  // `?today=2026-11-13` pretends it is that day (for trying the calendar egg); anything else is the real date
  function today(search = '', now = new Date()) {
    const m = /[?&]today=(\d{4})-(\d{2})-(\d{2})(?:&|$)/.exec(search);
    return m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : now;
  }

  return { KONAMI, isFriday13, konami, hasSeenAll, today };
})();
if (typeof module !== 'undefined') module.exports = PawEggs;

(function wire() {
  if (typeof document === 'undefined' || typeof Faces === 'undefined') return;
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
  const asked = new URLSearchParams(location.search).get('eggs');
  if (asked !== null) store.set('pawsee-eggs', asked === '0' ? '0' : '1');
  if (store.get('pawsee-eggs') === '0') return;

  // 1. Friday the 13th: the day belongs to the vampires, unless you have picked a style yourself. Nothing is saved, so the next day everything is back to normal.
  if (PawEggs.isFriday13(PawEggs.today(location.search)) && !store.get('pawsee.faces') && Faces.styles().some(s => s.name === 'vampires')) {
    Faces.use('vampires', { save: false });
    if (typeof showFaces === 'function') showFaces(); // the menu was drawn before this, so it must be told
    const note = document.getElementById('eggnote');
    if (note) { note.textContent = '🦇 Friday the 13th: unlucky for bugs'; note.hidden = false; }
  }

  // 2. The old code: up up down down left right left right b a. Every card throws a party. Arrow keys in a menu or a text box are left alone.
  const feed = PawEggs.konami();
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target && e.target.tagName)) return;
    if (feed(e.key)) party();
  });
  function party() {
    const body = document.body;
    body.classList.remove('party');
    void body.offsetWidth; // so that a second go restarts the jumps
    const calm = typeof reduceMotion !== 'undefined' && reduceMotion.matches;
    if (!calm) {
      body.classList.add('party');
      [...document.querySelectorAll('.card')].forEach((el, i) => setTimeout(() => react(el, 'cheer'), i * 90));
      setTimeout(() => body.classList.remove('party'), 4400);
    }
    toast('🎉 kibble party!');
  }

  // 3. Try every style and a secret one turns up in the menu. What has been tried is remembered, and it counts when a style is chosen from the menu or from the address.
  const SEEN = 'pawsee-seen-faces';
  const seenNow = () => { try { return JSON.parse(store.get(SEEN) || '[]'); } catch { return []; } };
  function noteSeen(style) {
    const seen = seenNow();
    if (!seen.includes(style.name)) { seen.push(style.name); store.set(SEEN, JSON.stringify(seen)); }
    const open = Faces.styles({ all: true }).filter(s => !s.secret).map(s => s.name);
    if (!PawEggs.hasSeenAll(seen, open)) return;
    for (const s of Faces.styles({ all: true }).filter(x => x.secret && x.locked)) {
      if (!Faces.unlock(s.name)) continue;
      if (typeof showFaces === 'function') showFaces();
      toast(`👻 a new style has appeared in the menu: ${s.label}`);
    }
  }
  noteSeen(Faces.style);
  Faces.onUse(noteSeen);
})();
