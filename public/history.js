// "Recent" view: finished and running sessions of the last day as timelines, one bar per agent, with a replay that sweeps a playhead across them.
(() => {
  const KIND = { web: ['🌐', 'browsing the web'], code: ['⌨️', 'writing code'], explore: ['🔍', 'exploring'], shell: ['💻', 'running commands'],
    sql: ['🗄️', 'querying data'], ask: ['❓', 'asking you'], work: ['📋', 'work items'], think: ['💭', 'thinking'] };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtDur = ms => { const s = Math.round(ms / 1000); if (s < 60) return s + 's'; const m = Math.floor(s / 60); return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`; };
  const fmtAgo = ms => ms < 60e3 ? 'just now' : ms < 3600e3 ? Math.floor(ms / 60e3) + ' min ago' : ms < 86400e3 ? Math.floor(ms / 3600e3) + ' h ago' : Math.floor(ms / 86400e3) + ' d ago';

  const tabs = document.querySelectorAll('[data-view]');
  const box = document.getElementById('history');
  const live = [document.getElementById('grid'), document.getElementById('empty'), document.getElementById('demo'), document.getElementById('drift')];
  let view = 'live', data = null, timer = 0, replay = null, shown = false; // `shown`: a replay's paws are on screen, so a refresh must not wipe them
  const open = new Set(); // sessions the person expanded, kept across refreshes

  function bar(actor, s) {
    const span = Math.max(1, s.to - s.from);
    const segs = actor.segments.map(g => {
      const left = (g.from - s.from) / span * 100, w = Math.max(.4, (g.to - g.from) / span * 100);
      const [icon, label] = KIND[g.kind] || KIND.think;
      return `<i class="seg k-${esc(g.kind)}" style="left:${left.toFixed(2)}%;width:${w.toFixed(2)}%" title="${icon} ${label} · ${fmtDur(g.to - g.from)}${g.calls > 1 ? ` · ${g.calls} calls` : ''}${g.text ? '\n' + esc(g.text) : ''}"></i>`;
    }).join('');
    return `<div class="hbar" data-actor="${esc(actor.id)}">${segs}<b class="head" hidden></b></div>`;
  }

  function totals(actor) {
    return Object.entries(actor.totals).sort((a, b) => b[1] - a[1]).slice(0, 4)
      .map(([k, ms]) => `<span title="${(KIND[k] || KIND.think)[1]}">${(KIND[k] || KIND.think)[0]} ${fmtDur(ms)}</span>`).join('');
  }

  function render() {
    if (!data) return;
    if (!data.sessions.length) { box.innerHTML = '<p class="empty">Nothing recorded yet. Agents show up here once they have done some work.</p>'; return; }
    box.innerHTML = data.sessions.map(s => {
      const key = s.session, isOpen = open.has(key);
      const kinds = Object.keys(KIND).filter(k => s.actors.some(a => a.totals[k]));
      return `<section class="hsess${isOpen ? ' open' : ''}" data-session="${esc(key)}">
        <button class="hhead" type="button" aria-expanded="${isOpen}">
          <span class="hname">${esc(s.name)}</span>
          <span class="hmeta">${esc(s.source)}${s.project ? ' · ' + esc(s.project) : ''}${s.branch ? ' · ' + esc(s.branch) : ''}</span>
          <span class="hmeta">${s.live ? '<b class="hlive">live</b> · ' : ''}${fmtAgo(data.now - s.to)} · ${fmtDur(s.to - s.from)} · ${s.calls} tool call${s.calls === 1 ? '' : 's'} · ${s.actors.length} agent${s.actors.length === 1 ? '' : 's'}</span>
        </button>
        ${isOpen ? `<div class="hbody">
          <div class="hctl"><button class="replay" type="button">▶ Replay</button><span class="hnow" aria-live="off"></span></div>
          <div class="grid rgrid" hidden></div>
          ${s.actors.map(a => `<div class="hrow"><div class="hlabel"><span class="hn">${esc(a.name.replace(/[-_]+/g, ' '))}</span><span class="ht">${totals(a)}</span></div>${bar(a, s)}</div>`).join('')}
          <div class="hlegend">${kinds.map(k => `<span><i class="seg k-${k} sw"></i>${KIND[k][0]} ${KIND[k][1]}</span>`).join('')}</div>
        </div>` : ''}
      </section>`;
    }).join('');
  }

  // replay: the playhead crosses the whole session in about 12 seconds. The agents' real paw cards act out what each one was doing at that moment.
  const WORD = { running: 'working', idle: 'napping', done: 'done' };
  function pawCard(actor, s) {
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `<div class="stage"><span class="badge"></span>${parentChip(s.session, actor.id === 'main')}${agentSvg(s.source, s.session, actor.id, actor.id === 'main')}</div><div class="body"><div class="top"><span class="name"></span></div><div class="sub"></div><div class="doing"></div></div>`;
    el.style.setProperty('--h', hueOf(s.session + actor.id)); // the same colour the live card has
    el.dataset.source = s.source;
    el.insertAdjacentHTML('afterbegin', toolSvg(s.source));
    el.dataset.lv = 2;
    el.dataset.kind = actor.segments[0].kind;
    el.toggleAttribute('data-main', actor.id === 'main');
    el.querySelector('.name').textContent = actor.name.replace(/[-_]+/g, ' ');
    el.querySelector('.sub').textContent = actor.id === 'main' ? 'main agent' : actor.type;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) el.querySelector('svg').pauseAnimations();
    return el;
  }
  function paintCard(el, actor, at) {
    const first = actor.segments[0].from, last = actor.segments[actor.segments.length - 1].to;
    const g = actor.segments.find(x => at >= x.from && at <= x.to);
    const status = g ? 'running' : at > last ? 'done' : 'idle';
    if (el._status && el._status !== status && status === 'done' && typeof react === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches) react(el, 'cheer');
    el._status = status;
    el.dataset.status = status;
    if (g) el.dataset.kind = g.kind;
    el.querySelector('.badge').textContent = at < first && status === 'idle' ? 'not started' : WORD[status];
    const [icon, label] = g ? (KIND[g.kind] || KIND.think) : ['', ''];
    el.querySelector('.doing').innerHTML = g ? `<span class="lead">now</span>${esc(g.text || label)}` : status === 'done' ? '<span class="lead">did</span>all it was asked' : '';
  }

  function stopReplay() {
    if (replay) cancelAnimationFrame(replay.raf);
    replay = null;
    box.querySelectorAll('.replay').forEach(b => b.textContent = '▶ Replay');
    box.querySelectorAll('.head').forEach(h => h.hidden = true);
  }
  function startReplay(sec) {
    const s = data.sessions.find(x => x.session === sec.dataset.session);
    if (!s) return;
    stopReplay();
    const btn = sec.querySelector('.replay'), now = sec.querySelector('.hnow'), grid = sec.querySelector('.rgrid');
    btn.textContent = '■ Stop';
    grid.innerHTML = ''; grid.hidden = false;
    shown = true;
    const cardOf = new Map(s.actors.map(a => { const el = pawCard(a, s); grid.append(el); return [String(a.id), el]; }));
    const total = Math.max(1, s.to - s.from), dur = Math.min(20000, Math.max(5000, total / 60)), t0 = performance.now();
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), at = s.from + p * total;
      sec.querySelectorAll('.hbar').forEach(el => {
        const actor = s.actors.find(a => String(a.id) === el.dataset.actor), head = el.querySelector('.head');
        head.hidden = false; head.style.left = (p * 100) + '%';
        const g = actor?.segments.find(x => at >= x.from && at <= x.to);
        el.closest('.hrow').classList.toggle('active', !!g);
        el.closest('.hrow').querySelector('.ht').dataset.doing = g ? `${(KIND[g.kind] || KIND.think)[0]} ${g.text || (KIND[g.kind] || KIND.think)[1]}` : '';
        if (actor) paintCard(cardOf.get(String(actor.id)), actor, at);
      });
      now.textContent = new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (p < 1) replay.raf = requestAnimationFrame(step);
      else { cardOf.forEach((el, id) => paintCard(el, s.actors.find(a => String(a.id) === id), s.to + 1e6)); stopReplay(); } // the paws stay, wrapped up, until you close the session
    };
    replay = { raf: requestAnimationFrame(step) };
  }

  box.addEventListener('click', e => {
    const sec = e.target.closest('.hsess');
    if (!sec) return;
    if (e.target.closest('.replay')) { if (replay) stopReplay(); else startReplay(sec); return; }
    if (e.target.closest('.hhead')) {
      const k = sec.dataset.session;
      stopReplay(); shown = false;
      open.has(k) ? open.delete(k) : open.add(k);
      render();
    }
  });

  async function load() {
    try { data = await (await fetch('/api/history')).json(); if (!replay && !shown) render(); } catch {}
  }
  function show(v) {
    view = v;
    stopReplay(); shown = false;
    clearInterval(timer);
    tabs.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.view === v)));
    box.hidden = v !== 'recent';
    live.forEach(el => { if (el) el.style.display = v === 'recent' ? 'none' : ''; });
    if (v === 'recent') { load(); timer = setInterval(load, 5000); }
    try { location.hash = v === 'recent' ? '#recent' : ''; } catch {}
  }
  tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.view)));
  if (location.hash === '#recent') show('recent');
})();
