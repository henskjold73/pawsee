// Map view: the agents walk around a map drawn in the face style, going to the part of the codebase (the domain) they are working in.
// The engine here lays out the world and moves the paws; the look comes from the face style's optional `map` kit (see faces.js).
// A style without a kit shows the cards, so the Map button only means something for styles that have one.
const PawMap = (() => {
  const section = document.getElementById('map');
  const btn = document.getElementById('mapbtn');
  const RING = 210;    // distance between rings of places around the base
  const MAX_PLACES = 36, MAX_BUILDINGS = 6;
  const ROAM_MS = 1600; // how long a walk between two spots takes

  const kit = () => Faces.style.map || null; // a style without a kit shows the cards

  // ---- the toggle: Map or Cards, remembered; a style without a map shows the cards ----
  let want = false;
  try { want = localStorage.getItem('pawsee-mode') === 'map'; } catch {}
  function showButton() {
    const has = !!kit(), on = want && has;
    document.body.classList.toggle('mapmode', on);
    btn.textContent = on ? '▦ Cards' : '🗺 Map';
    btn.setAttribute('aria-pressed', String(on));
    btn.disabled = !has;
    btn.title = !has ? `No map for the ${Faces.style.label} style yet` : on ? 'Show the agents as cards' : `Show the agents on a ${Faces.style.label} map`;
  }
  btn.onclick = () => {
    want = !(want && kit());
    try { localStorage.setItem('pawsee-mode', want ? 'map' : 'cards'); } catch {}
    showButton();
    if (last) render(last); // app.js's render, which draws the map too
  };
  showButton();

  // ---- places: every domain seen in a project keeps its spot, remembered across reloads ----
  let places = {};
  try { places = JSON.parse(localStorage.getItem('pawsee-map')) || {}; } catch {}
  function remember(project, w, now) {
    const pl = places[project] ??= {};
    let p = pl[w.domain];
    if (!p) {
      const names = Object.keys(pl);
      if (names.length >= MAX_PLACES) delete pl[names.sort((x, y) => pl[x].t - pl[y].t)[0]]; // the place left longest ago makes room
      p = pl[w.domain] = { ...slotFor(w.domain, Object.values(pl)), b: [], t: now };
    }
    p.t = now;
    if (w.building && !p.b.includes(w.building) && p.b.length < MAX_BUILDINGS) p.b.push(w.building);
    return p;
  }
  // rings of 6, 12, 18 ... slots around the base; a name hashes to a slot (the next free one if taken), so it lands in the same spot every time
  function slotFor(name, taken) {
    for (let ring = 1; ; ring++) {
      const n = 6 * ring, used = new Set(taken.filter(p => p.ring === ring).map(p => p.slot));
      if (used.size >= n) continue;
      let slot = Faces.hash(name) % n;
      while (used.has(slot)) slot = (slot + 1) % n;
      return { ring, slot };
    }
  }

  // ---- layout: one island group per project, side by side ----
  function layout(projects) {
    let x = 0;
    const groups = projects.map(project => {
      const pl = Object.entries(places[project] || {});
      const rings = Math.max(1, ...pl.map(([, p]) => p.ring));
      const r = RING * rings + 120, cx = x + r, cy = r; x += 2 * r;
      const spots = Object.fromEntries(pl.map(([name, p]) => {
        const n = 6 * p.ring, ang = (p.slot / n) * 2 * Math.PI + p.ring * 0.5 - Math.PI / 2;
        return [name, { x: Math.round(cx + Math.cos(ang) * RING * p.ring), y: Math.round(cy + Math.sin(ang) * RING * p.ring), b: p.b }];
      }));
      return { project, r, cx, cy, spots, sea: { x: Math.round(cx - r * .72), y: Math.round(cy - r * .72) } };
    });
    return { w: Math.max(x, 1), h: Math.max(1, ...groups.map(g => 2 * g.r)), groups };
  }
  // a building's spot on its place, around the middle
  const buildingAt = (i, n) => n < 2 ? { x: 0, y: -14 } : { x: Math.round(Math.cos(i / n * 2 * Math.PI - Math.PI / 2) * 40), y: Math.round(Math.sin(i / n * 2 * Math.PI - Math.PI / 2) * 34) };
  const label = (x, y, text, size = 18) => `<text class="mlab" x="${x}" y="${y}" text-anchor="middle" font-size="${size}">${esc(text)}</text>`;

  function drawWorld(k, L) {
    let s = k.backdrop(L.w, L.h);
    for (const g of L.groups) {
      for (const p of Object.values(g.spots)) s += k.route(g.cx, g.cy, p.x, p.y);
      for (const [name, p] of Object.entries(g.spots)) {
        s += `<g transform="translate(${p.x} ${p.y})">${k.place(name, Faces.hash(name), p.b.length)}`;
        p.b.forEach((b, i) => { const at = buildingAt(i, p.b.length); s += `<g transform="translate(${at.x} ${at.y})">${k.building(b, Faces.hash(name + '/' + b))}</g>`; });
        s += `</g>${label(p.x, p.y + 84, name)}`;
      }
      s += `<g transform="translate(${g.cx} ${g.cy})">${k.base(Faces.hash(g.project))}</g>`;
      s += `<g transform="translate(${g.sea.x} ${g.sea.y})">${k.sea()}</g>`;
      if (g.project) s += label(g.cx, g.cy - 116, g.project, 22);
    }
    return s;
  }

  // ---- where an agent stands ----
  function spotOf(a, g) {
    const home = ['waiting', 'idle', 'failed', 'lost', 'done'].includes(a.status) || a.kind === 'ask';
    if (home) return { key: 'base', x: g.cx, y: g.cy + 40 };
    if (a.kind === 'web') return { key: 'sea', x: g.sea.x, y: g.sea.y + 30 };
    const p = a.where && g.spots[a.where.domain];
    if (!p) return { key: 'base', x: g.cx, y: g.cy + 40 };
    const i = a.where.building ? p.b.indexOf(a.where.building) : -1, at = i < 0 ? { x: 0, y: 0 } : buildingAt(i, p.b.length);
    return { key: a.where.domain + '/' + i, x: p.x + at.x, y: p.y + at.y + 30 };
  }
  // several paws on one spot stand in a little crowd around it
  const CROWD = [[0, 0], [-60, 6], [60, 6], [-30, 54], [30, 54], [-90, 54], [90, 54], [-120, 6], [120, 6], [0, 102], [-60, 102], [60, 102]];

  // the bar over the map: which repo it shows, and how many agents are working elsewhere
  section.innerHTML = `<div class="mapbar"><select class="snd pick" aria-label="Repository on the map"></select><span class="mapnote"></span></div><div class="maphold"></div>`;
  const pick = section.querySelector('select'), note = section.querySelector('.mapnote'), hold = section.querySelector('.maphold');
  let picked = null;
  try { picked = localStorage.getItem('pawsee-map-repo'); } catch {}
  pick.onchange = () => { picked = pick.value; try { localStorage.setItem('pawsee-map-repo', picked); } catch {} if (last) render(last); };
  function showBar(repos, repo, count, others) {
    const opts = repos.map(r => `${r}\u0000${count.get(r)}`).join('|');
    if (pick._opts !== opts) {
      pick.replaceChildren(...repos.map(r => new Option(`🗺 ${r || 'no repo'} (${count.get(r)})`, r)));
      pick._opts = opts;
    }
    pick.value = repo;
    pick.hidden = repos.length < 2;
    note.textContent = others ? `${others} agent${others > 1 ? 's' : ''} in other repos: pick one, or switch to the cards to see them all` : '';
  }

  const paws = new Map();
  let lastSig = '', world = null;
  const AGENT = 76; // a paw's size in map units

  function render(snap) {
    showButton();
    const k = kit();
    if (!document.body.classList.contains('mapmode')) return;
    const now = snap.now || Date.now(), all = snap.agents;
    for (const a of all) if (a.where) remember(a.project || '', a.where, now);
    try { localStorage.setItem('pawsee-map', JSON.stringify(places)); } catch {}
    // a map is one repo's world, so it shows one repo at a time (the busiest, unless one was picked); the cards show them all
    const count = new Map();
    for (const a of all) count.set(a.project || '', (count.get(a.project || '') || 0) + 1);
    const repos = [...count.keys()].sort();
    const repo = count.has(picked) ? picked : repos.slice().sort((x, y) => count.get(y) - count.get(x))[0] ?? '';
    const agents = all.filter(a => (a.project || '') === repo), others = all.length - agents.length;
    showBar(repos, repo, count, others);
    hold.hidden = !agents.length; // no agents: the page's own "No agents yet" says so
    const L = layout([repo]);
    const sig = Faces.style.name + JSON.stringify(L);
    if (sig !== lastSig || !world) {
      hold.innerHTML = `<div class="mapworld"><svg class="mapbg" viewBox="0 0 ${L.w} ${L.h}" role="img" aria-label="Map of where the agents are working">${drawWorld(k, L)}</svg><div class="mapagents"></div></div>`;
      world = hold.querySelector('.mapagents');
      hold.firstElementChild.style.width = `min(100%, calc(72vh * ${(L.w / L.h).toFixed(3)}))`;
      for (const el of paws.values()) world.appendChild(el); // keep the paws (and their walk) across a redraw
      lastSig = sig;
    }
    const crowd = new Map(), seen = new Set();
    for (const a of agents) {
      const key = a.session + a.id, g = L.groups.find(x => x.project === (a.project || ''));
      seen.add(key);
      const spot = spotOf(a, g), n = crowd.get(spot.key) || 0;
      crowd.set(spot.key, n + 1);
      const [dx, dy] = CROWD[n % CROWD.length], x = spot.x + dx, y = spot.y + dy + Math.floor(n / CROWD.length) * 48;
      const isMain = a.type === 'main agent', face = Faces.style.name + ':' + a.session + '#' + (taskOf.get(a.session) || 0);
      let el = paws.get(key);
      if (!el) {
        el = document.createElement('div');
        el.className = 'card mpaw';
        el.style.setProperty('--h', hueOf(key));
        el.innerHTML = `<div class="flip"></div><span class="mname"></span>`;
        el.addEventListener('click', () => { if (el._jump) jumpTo(el._session); });
        el.addEventListener('transitionend', e => { if (e.propertyName === 'left' && el._a) pawState(el, el._a, Date.now()); });
        world.appendChild(el);
        paws.set(key, el);
      }
      if (el._face !== face) { el.querySelector('.flip').innerHTML = agentSvg(a.source, a.session, a.id, isMain); el._face = face; }
      const left = (x / L.w * 100).toFixed(3) + '%', top = (y / L.h * 100).toFixed(3) + '%';
      if (el._x != null && (el._x !== x || el._y !== y) && !reduceMotion.matches) { // (reduced motion: no transition, so no transitionend to end the walk)
        el._until = Date.now() + ROAM_MS; el.classList.toggle('west', x < el._x); }
      el._x = x; el._y = y;
      el.style.left = left; el.style.top = top;
      el.style.width = (AGENT / L.w * 100).toFixed(3) + '%';
      // on the way somewhere it walks, whatever it is doing; it settles into its own state when it gets there (transitionend)
      el._a = a;
      pawState(el, el._until > Date.now() ? { ...a, status: 'running' } : a, now);
      el._session = a.session; el._jump = !!a.canFocus && !DEMO;
      el.classList.toggle('jump', el._jump);
      el.style.zIndex = Math.round(y);
      const name = isMain ? a.name : a.name.replace(/[-_]+/g, ' ');
      el.querySelector('.mname').textContent = name.length > 18 ? name.slice(0, 17) + '…' : name;
      el.title = [name, a.activity, a.where && `in ${a.where.domain}${a.where.building ? ' › ' + a.where.building : ''}`, el._jump && 'Click to jump to its terminal'].filter(Boolean).join('\n');
    }
    for (const [key, el] of paws) if (!seen.has(key)) { el.remove(); paws.delete(key); }
  }

  return { render };
})();
