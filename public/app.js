const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const summary = document.getElementById('summary');
const cards = new Map();

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const KIND = { web: '🌐 browsing the web', code: '⌨️ writing code', explore: '🔍 exploring', shell: '💻 running commands',
  sql: '🗄️ querying data', ask: '❓ asking you', work: '📋 work items', think: '💭 thinking' };
// random hue per agent, remembered across reloads; prefers hues far from the ones already in use
const hues = (() => { try { return JSON.parse(localStorage.getItem('pawsee-hues')) || {}; } catch { return {}; } })();
const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };
function hueOf(key) {
  if (hues[key] != null) return hues[key];
  const used = Object.values(hues).slice(-24);
  let best = Math.random() * 360 | 0, bestScore = -1;
  for (let i = 0; i < 12; i++) {
    const h = Math.random() * 360 | 0;
    const score = Math.min(360, ...used.map(u => hueDist(h, u)));
    if (score > bestScore) { best = h; bestScore = score; }
  }
  hues[key] = best;
  try { localStorage.setItem('pawsee-hues', JSON.stringify(hues)); } catch {}
  return best;
}
// reasoning effort -> how much detail the paw gets (1 plainest .. 4 fanciest); unknown = the standard look
const LEVEL = { low: 1, medium: 2, high: 3, xhigh: 4, max: 4 };
const LABEL = { waiting: 'needs you', running: 'working', idle: 'napping', done: 'done', failed: 'failed', lost: 'lost' };

function pawSvg() {
  // main pad + four toe beans, with a tiny face on the pad
  return `<svg class="paw" viewBox="-4 -22 124 124" aria-hidden="true">
    <circle class="fx-halo" cx="50" cy="58" r="50" fill="none" stroke="var(--paw)" stroke-width="3"/>
    <g class="fx-orbit" transform="translate(50 58)"><g fill="var(--paw-dark)" opacity=".75">
      <circle cx="56" cy="0" r="2.6"/><circle cx="-28" cy="48.5" r="2.6"/><circle cx="-28" cy="-48.5" r="2.6"/></g>
      <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="16s" repeatCount="indefinite" additive="sum"/></g>
    <g class="toes" fill="var(--paw)" stroke="var(--paw-dark)" stroke-width="2">
      <g class="toe"><ellipse cx="20" cy="42" rx="10" ry="13" transform="rotate(-20 20 42)"/><path class="claw" transform="rotate(-20 20 42)" d="M16 31Q17 21 23 17Q24 25 24 31Z"/></g>
      <g class="toe"><ellipse cx="38" cy="26" rx="10" ry="14" transform="rotate(-6 38 26)"/><path class="claw" transform="rotate(-6 38 26)" d="M34 14Q35 4 41 0Q42 8 42 14Z"/></g>
      <g class="toe"><ellipse cx="62" cy="26" rx="10" ry="14" transform="rotate(6 62 26)"/><path class="claw" transform="rotate(6 62 26)" d="M58 14Q59 4 65 0Q66 8 66 14Z"/></g>
      <g class="toe"><ellipse cx="80" cy="42" rx="10" ry="13" transform="rotate(20 80 42)"/><path class="claw" transform="rotate(20 80 42)" d="M76 31Q77 21 83 17Q84 25 84 31Z"/></g>
    </g>
    <path d="M50 44c-17 0-30 14-30 28 0 10 8 16 17 16 6 0 9-3 13-3s7 3 13 3c9 0 17-6 17-16 0-14-13-28-30-28z"
      fill="var(--paw)" stroke="var(--paw-dark)" stroke-width="2"/>
    <g class="face">
      <g class="eye-open" fill="#3b2f2f"><circle cx="41" cy="66" r="3.6"/><circle cx="59" cy="66" r="3.6"/>
        <circle cx="42.2" cy="64.8" r="1.1" fill="#fff"/><circle cx="60.2" cy="64.8" r="1.1" fill="#fff"/></g>
      <g class="eye-closed" stroke="#3b2f2f" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M37 66q4 3 8 0M55 66q4 3 8 0"/></g>
      <g class="eye-happy" stroke="#3b2f2f" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M37 68q4-6 8 0M55 68q4-6 8 0"/></g>
      <g class="eye-sleepy" stroke="#3b2f2f" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M37.4 66.5h7.2M55.4 66.5h7.2"/><path d="M38 66.5a3.2 3.2 0 0 0 6 0M56 66.5a3.2 3.2 0 0 0 6 0" fill="#3b2f2f" stroke-width="1.4"/></g>
      <g class="dizzy-eyes" stroke="#3b2f2f" stroke-width="1.8" stroke-linecap="round" fill="none"><circle cx="41" cy="66" r="5.4" fill="#fff" stroke-width="1.5"/><circle cx="59" cy="66" r="5.4" fill="#fff" stroke-width="1.5"/>
        <path d="M41 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2" transform="rotate(0 41 66)"/><path d="M59 66m0-.1a1 1 0 1 1 1.6 1.4a2.6 2.6 0 1 1-3.8-3 4 4 0 1 1 5.4 5.2"/></g>
      <ellipse class="yawn" cx="50" cy="82" rx="3.2" ry="3.8" fill="#3b2f2f"/>
      <g class="eye-x" stroke="#3b2f2f" stroke-width="2.4" stroke-linecap="round"><path d="M38 63l6 6M44 63l-6 6M56 63l6 6M62 63l-6 6"/></g>
      <ellipse cx="50" cy="74" rx="3.4" ry="2.6" fill="var(--bean)"/>
      <path class="mouth" d="M50 76.5v2.5m-4 0q4 3 8 0" stroke="#3b2f2f" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <circle class="cheek" cx="33" cy="73" r="3.5" fill="var(--bean)" opacity=".35"/><circle class="cheek" cx="67" cy="73" r="3.5" fill="var(--bean)" opacity=".35"/>
      <g class="worry-eyes"><circle cx="41" cy="66" r="5.4" fill="#fff" stroke="#3b2f2f" stroke-width="1.5"/><circle cx="59" cy="66" r="5.4" fill="#fff" stroke="#3b2f2f" stroke-width="1.5"/>
        <circle class="pupil" cx="41.8" cy="64.6" r="2.1" fill="#3b2f2f"/><circle class="pupil" cx="58.2" cy="64.6" r="2.1" fill="#3b2f2f"/></g>
      <path class="worry-brows" d="M34 59.5L43 55.2M66 59.5L57 55.2" stroke="#3b2f2f" stroke-width="2.3" stroke-linecap="round" fill="none"/>
      <path class="worry-mouth" d="M44 83q3-2.8 6 0t6 0" stroke="#3b2f2f" stroke-width="1.9" stroke-linecap="round" fill="none"/>
      <path class="brows" d="M35 59.5l8-2.6M65 59.5l-8-2.6" stroke="#3b2f2f" stroke-width="2.3" stroke-linecap="round" fill="none"/>
    </g>
    <g class="crown" transform="translate(50 9) rotate(-5)">
      <path d="M-15 8L-17 -8L-8 -1L0 -12L8 -1L17 -8L15 8Z" fill="#f6c945" stroke="#c9961a" stroke-width="2" stroke-linejoin="round"/>
      <rect x="-15" y="5" width="30" height="5.5" rx="2" fill="#e8b32c" stroke="#c9961a" stroke-width="1.6"/>
      <circle cx="-17" cy="-8" r="2.3" fill="#fff3b0" stroke="#c9961a" stroke-width="1.3"/><circle cx="0" cy="-12" r="2.3" fill="#fff3b0" stroke="#c9961a" stroke-width="1.3"/><circle cx="17" cy="-8" r="2.3" fill="#fff3b0" stroke="#c9961a" stroke-width="1.3"/>
      <circle class="gem" cx="0" cy="7.8" r="2" fill="var(--bean)"/>
    </g>
    <g fill="#f6c945">
      <path class="fx-spark spark1" transform="translate(112 54)" d="M0 -5.5L1.5 -1.5L5.5 0L1.5 1.5L0 5.5L-1.5 1.5L-5.5 0L-1.5 -1.5Z"/><path class="fx-spark spark2" transform="translate(-1 48)" d="M0 -5.5L1.5 -1.5L5.5 0L1.5 1.5L0 5.5L-1.5 1.5L-5.5 0L-1.5 -1.5Z"/>
      <path class="fx-spark spark3" transform="translate(22 -8)" d="M0 -5.5L1.5 -1.5L5.5 0L1.5 1.5L0 5.5L-1.5 1.5L-5.5 0L-1.5 -1.5Z"/><path class="fx-spark spark4" transform="translate(106 90)" d="M0 -5.5L1.5 -1.5L5.5 0L1.5 1.5L0 5.5L-1.5 1.5L-5.5 0L-1.5 -1.5Z"/></g>
    <g class="pbadge" transform="translate(90 2) scale(1.35)"><g class="bob">
      <circle class="base" r="19" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
      <g class="thought">
        <g fill="var(--card)" stroke="var(--line)" stroke-width="4"><circle cx="-10" cy="-6" r="10"/><circle cx="8" cy="-8" r="11"/><circle cx="15" cy="4" r="9"/><circle cx="-1" cy="11" r="11"/><circle cx="-14" cy="6" r="8"/><circle cx="1" cy="0" r="11"/></g><g fill="var(--card)"><circle cx="-10" cy="-6" r="10"/><circle cx="8" cy="-8" r="11"/><circle cx="15" cy="4" r="9"/><circle cx="-1" cy="11" r="11"/><circle cx="-14" cy="6" r="8"/><circle cx="1" cy="0" r="11"/></g>
        <circle class="trail1" cx="-22" cy="19" r="4.2" fill="var(--card)" stroke="var(--line)" stroke-width="1.8"/>
        <circle class="trail2" cx="-29" cy="27" r="2.6" fill="var(--card)" stroke="var(--line)" stroke-width="1.5"/>
        <circle class="plate" r="12.6" fill="#fff"/>
        <g class="brandicon b-custom"><image x="-9.5" y="-9.5" width="19" height="19" preserveAspectRatio="xMidYMid meet"/></g>
        ${Object.entries(BRAND_ICONS).map(([k, svg]) => `<g class="brandicon b-${k}">${svg}</g>`).join('')}
      </g>
      <g class="prop p-web" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round">
        <circle r="10.5"/><ellipse class="meridian" rx="4.5" ry="10.5"/><path d="M-10.5 0h21M-8 -5.5h16M-8 5.5h16"/></g>
      <g class="prop p-code" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-5 -7l-7 7 7 7M5 -7l7 7-7 7"/><path class="slash" d="M1.5 -9l-3 18"/></g>
      <g class="prop p-explore"><g class="sweep" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round">
        <circle cx="-2" cy="-2" r="7"/><path d="M3 3l8 8"/></g></g>
      <g class="prop p-shell"><rect x="-12" y="-9" width="24" height="18" rx="3.5" fill="#2d2523"/>
        <path d="M-8 -3l4 3-4 3" fill="none" stroke="#7fe3a6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <rect class="cursor" x="0" y="2.5" width="7" height="2.4" rx="1" fill="#7fe3a6"/></g>
      <g class="prop p-sql" fill="none" stroke="var(--ink)" stroke-width="1.8"><ellipse cy="-6.5" rx="9" ry="3.4"/>
        <path d="M-9 -6.5v13c0 2 4 3.4 9 3.4s9-1.4 9-3.4v-13M-9 0c0 2 4 3.4 9 3.4s9-1.4 9-3.4"/>
        <circle class="row" cx="0" cy="-6.5" r="1.8" fill="var(--bean)" stroke="none"/></g>
      <text class="prop p-ask" y="7.5" text-anchor="middle" font-size="22" font-weight="800" fill="var(--ink)">?</text>
      <g class="prop p-work" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="-8.5" y="-10" width="17" height="21" rx="2.5"/><rect x="-3.5" y="-12.5" width="7" height="4.5" rx="1.5" fill="var(--card)"/>
        <path class="t1" d="M-5.5 -2l1.6 1.6 3-3.2"/><path class="t2" d="M-5.5 4.5l1.6 1.6 3-3.2"/><path d="M0 -2h5M0 4.5h5"/></g>
      <g class="prop p-think" fill="var(--ink)"><circle class="d1" cx="-8" cy="3" r="2.6"/><circle class="d2" cx="0" cy="0" r="3.4"/><circle class="d3" cx="8" cy="-4" r="4.4"/></g>
    </g></g>
    <g class="dizzy-stars" fill="#f6c945"><g class="spin"><path transform="translate(18 14)" d="M0 -5L1.4 -1.4L5 0L1.4 1.4L0 5L-1.4 1.4L-5 0L-1.4 -1.4Z"/><path transform="translate(82 10)" d="M0 -4L1.1 -1.1L4 0L1.1 1.1L0 4L-1.1 1.1L-4 0L-1.1 -1.1Z"/><path transform="translate(50 -6)" d="M0 -5L1.4 -1.4L5 0L1.4 1.4L0 5L-1.4 1.4L-5 0L-1.4 -1.4Z"/></g></g>
    <g class="zzz zzz2" fill="var(--idle)" font-weight="700"><text x="64" y="34" font-size="20">z</text><text x="92" y="18" font-size="14">z</text></g>
    <g class="zzz" fill="var(--idle)" font-weight="700"><text x="74" y="20" font-size="16">z</text><text x="84" y="8" font-size="11">z</text></g>
    <path class="sweat" d="M78 40q4 7 0 9-4-2 0-9z" fill="#7bc4ec"/><path class="sweat sweat2" d="M22 42q-4 7 0 9 4-2 0-9z" fill="#7bc4ec"/>
  </svg>`;
}

// AI credits: fewer decimals as the number grows
const fmtAic = n => n >= 100 ? Math.round(n).toLocaleString() : n >= 10 ? n.toFixed(1) : n.toFixed(2);

function dur(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
}
const ago = ms => dur(ms) + ' ago';

function doingHtml(a, full) {
  const act = (full && a.activityFull) || a.activity, said = (full && a.saidFull) || a.said;
  if (a.status === 'waiting') return `<span class="lead">✋</span>${esc(act)}`;
  if (a.status === 'running') return `<span class="lead">now</span>${esc(act)}<span class="dots"><span>.</span><span>.</span><span>.</span></span>`;
  if (a.status === 'failed') return `<span class="lead">oops</span>${esc(act)}`;
  if (a.status === 'lost') return `<span class="lead">last seen</span>${esc(act)}`;
  const text = said || act;
  const lead = a.status === 'done' ? 'did' : 'last';
  return `<span class="lead">${lead}</span>${esc(text)}`;
}

function metaHtml(a, now) {
  const live = a.status === 'running';
  const t = a.status === 'waiting' ? `⏳ waiting ${dur(now - a.waitingSince)}` : live ? `⏱ ${dur(now - a.startedAt)}` : a.status === 'idle' ? `💤 ${ago(now - a.endedAt)}`
    : `✓ ${a.durationMs ? 'took ' + dur(a.durationMs) : ago(now - (a.endedAt ?? a.startedAt))}`;
  const tags = [`<span class="tag">${t}</span>`];
  if (a.tools != null) tags.push(`<span class="tag">🔧 ${a.tools}</span>`);
  if (a.status === 'running' && a.worry > 0 && now - a.worryAt < 15e3) tags.push(`<span class="tag" title="${esc(a.lastError || 'the last attempt failed')}">😰 ${a.worry > 1 ? 'retrying (' + a.worry + ' fails)' : 'retrying'}</span>`);
  if (a.effort) tags.push(`<span class="tag" title="Reasoning effort this agent runs with">🧠 ${esc(a.effort)}</span>`);
  if (a.aic > 0) tags.push(`<span class="tag" title="AI credits used by this agent">⚡ ${fmtAic(a.aic)} AIC</span>`);
  if (a.asksParent) tags.push('<span class="tag">❓ ends with a question</span>');
  if (KIND[a.kind]) tags.push(`<span class="tag">${KIND[a.kind]}</span>`);
  if (a.mode === 'async') tags.push('<span class="tag">background</span>');
  if (a.model) tags.push(`<span class="tag">${esc(a.model)}</span>`);
  return tags.join('');
}

const DEMO = new URLSearchParams(location.search).has('demo');
if (DEMO) document.getElementById('demo').hidden = false;
let demoOrder = null, demoStep = null;
const demo = now => {
  const acts = { web: 'Fetching docs.github.com/copilot', code: 'Editing src/auth.ts', explore: 'Grep “TODO”', shell: '$ npm test -- auth',
    sql: 'Querying todos table', ask: 'Waiting for your answer', work: 'Reading work item 4821', think: 'Planning the next step' };
  const run = Object.keys(acts).map((kind, i) => ({ id: 'r' + i, session: 'demo', status: 'running', kind, name: 'demo-' + kind,
    activity: acts[kind], startedAt: now - 30e3 * (i + 1), tools: 3 + i, endedAt: null }));
  const rest = ['idle', 'done', 'failed', 'lost'].map((status, i) => ({ id: 's' + i, session: 'demo', status, kind: 'code',
    name: ['demo-idle', 'demo-done', 'demo-failed', 'demo-lost'][i], tools: 9, startedAt: now - 95e3, endedAt: now - 20e3,
    durationMs: 75e3, activity: 'Edited 3 files', said: 'Wrapped up and all checks pass.' }));
  const wait = [
    { id: 'w0', name: 'main', type: 'main agent', status: 'waiting', kind: 'ask', waitingSince: now - 70e3, startedAt: now - 70e3,
      activity: 'asks: Which branch should I base the fix on?', activityFull: 'Question\nWhich branch should I base the fix on?\n• Branch: main or the release branch' },
    { id: 'w1', name: 'demo-fix-lint', status: 'waiting', kind: 'ask', waitingSince: now - 25e3, startedAt: now - 90e3, tools: 12,
      activity: 'needs your approval: Run the test suite', activityFull: 'Approval needed\nRun the test suite\n$ npm test -- --coverage' }];
  const BR = Object.keys(BRAND_ICONS), rot = Math.floor(now / 5000);
  run.forEach((x, i) => { x.brand = BR[(i + rot) % BR.length]; x.brandAt = now; });
  run.forEach((x, i) => { x.worry = [0, 0, 1, 0, 2, 0, 3, 0][i % 8]; x.worryAt = now - 2000; x.lastError = 'Path does not exist'; x.fails = [0, 2, 1, 4, 2, 0, 9, 13][i % 8]; });
  [...run, ...rest].forEach((x, i) => { x.effort = ['low', 'medium', 'high', 'xhigh'][i % 4]; });
  const all = [...wait, ...run, ...rest];
  const cyc = all.find(x => x.id === 'r0'), phase = Math.floor(now / 9000) % 4; // demo only: one card keeps finishing and failing, to preview the reactions
  if (cyc && phase % 2) Object.assign(cyc, { status: phase === 1 ? 'done' : 'failed', endedAt: now - 1000 }); // running, done, running, failed
  all.forEach((x, i) => { x.source = i % 3 === 1 ? 'claude' : 'copilot'; }); // some of the demo cards are Claude Code ones
  // demo only: every few seconds 2-3 random cards jump to the front and push the rest back, to preview the slide
  const step = Math.floor(now / 5000);
  if (!demoOrder) demoOrder = all.map(x => x.id);
  if (step !== demoStep) {
    if (demoStep !== null) {
      const picked = [...demoOrder].sort(() => Math.random() - .5).slice(0, 2 + Math.floor(Math.random() * 2));
      demoOrder = [...picked, ...demoOrder.filter(id => !picked.includes(id))];
    }
    demoStep = step;
  }
  all.sort((x, y) => demoOrder.indexOf(x.id) - demoOrder.indexOf(y.id));
  return all.map(a => ({ type: { explore: 'explore', code: 'code-review', shell: 'task' }[a.kind] || 'general-purpose', project: 'pawsee', branch: 'demo', mode: 'sync', model: 'demo', ...a }));
};

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

// "pawsee can't read some logs": the Copilot CLI / Claude Code log format may have changed under it
function showProblems(list) {
  const el = document.getElementById('drift');
  el.hidden = !list?.length;
  if (el.hidden) return;
  const what = p => `${p.source} (${p.sessions} session${p.sessions > 1 ? 's' : ''}, ${p.reason === 'unreadable' ? 'lines that will not parse' : 'nothing recognised'})`;
  el.innerHTML = `⚠ pawsee can't make sense of some logs: ${list.map(what).join('; ')}. The log format may have changed, so some agents could be missing. `
    + `<a href="https://github.com/henskjold73/pawsee/issues" target="_blank" rel="noopener">Update pawsee or report it</a>.`;
}

// soft chimes, made with the browser's own synth (no sound files). They are off every time the page loads, on purpose: a browser only lets
// a page make noise after you've clicked it, and switching sounds on is that click.
const NOTES = { attention: [[784, 0], [988, .16]], finished: [[523, 0], [659, .14], [784, .28]] };
let soundOn = false, audio = null;
function playSound(kind) {
  if (!soundOn) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const t0 = audio.currentTime + .02;
    for (const [freq, at] of NOTES[kind]) {
      const osc = audio.createOscillator(), gain = audio.createGain(), t = t0 + at;
      osc.type = 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(.0001, t);
      gain.gain.exponentialRampToValueAtTime(.12, t + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, t + .45);
      osc.connect(gain).connect(audio.destination);
      osc.start(t); osc.stop(t + .5);
    }
  } catch {}
}
function showSound() {
  const b = document.getElementById('snd');
  b.textContent = soundOn ? '🔔 Sound on' : '🔇 Sound off';
  b.setAttribute('aria-pressed', String(soundOn));
  b.title = soundOn ? 'Sounds are on: a chime when something needs you, another when work finishes. Click to turn off' : 'Sounds are off. Click to play a soft chime when something needs you or work finishes';
}
document.getElementById('snd').onclick = () => {
  soundOn = !soundOn;
  showSound();
  playSound('attention'); // a preview, and the click that lets the browser play sound
};
showSound();

// "a newer version is out": a small pill by the version, hidden per version when you dismiss it
function showUpdate(u) {
  const wrap = document.getElementById('updwrap'), link = document.getElementById('upd');
  let hidden = '';
  try { hidden = localStorage.getItem('pawsee-update-hidden') || ''; } catch {}
  wrap.hidden = !u || u.version === hidden;
  if (wrap.hidden) return;
  link.textContent = `⬆ v${u.version} available`;
  if (u.url) link.href = u.url; else link.removeAttribute('href');
  link.title = 'To update: re-run the installer, or npm install -g @horrible73/pawsee, then restart pawsee';
  document.getElementById('updx').onclick = () => { try { localStorage.setItem('pawsee-update-hidden', u.version); } catch {} wrap.hidden = true; };
}

// a happy hop with confetti when an agent finishes, a flop when it fails
function react(el, kind) {
  el.classList.remove('cheer', 'flop');
  void el.offsetWidth; // restart the animation if it is already playing
  el.classList.add(kind);
  setTimeout(() => el.classList.remove(kind), 2200);
  if (kind !== 'cheer') return;
  const stage = el.querySelector('.stage');
  const colors = ['#f6c945', '#ef6f6c', '#59c3a5', '#6aa7f5', '#c58bf2', '#ff9f5a'];
  for (let i = 0; i < 16; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    const ang = (-80 + (i / 15) * 160) * Math.PI / 180, dist = 60 + Math.random() * 50;
    c.style.cssText = `--dx:${Math.round(Math.sin(ang) * dist)}px;--dy:${Math.round(-Math.cos(ang) * dist - 10)}px;--r:${Math.round(Math.random() * 540 - 270)}deg;--c:${colors[i % colors.length]};--d:${Math.round(Math.random() * 120)}ms`;
    stage.appendChild(c);
    setTimeout(() => c.remove(), 1700);
  }
}

// tab alerts: icon + title while something needs you, and a tick if work finished while you were looking elsewhere
let finishedAway = false, lastFav = '', flash = false;
document.addEventListener('visibilitychange', () => { if (!document.hidden) { finishedAway = false; applyTab(); } });
setInterval(() => { flash = !flash; if (document.hidden) applyTab(); }, 1500);
function applyTab() {
  const fav = PawMood.faviconFor(tabWaiting, finishedAway && !tabWaiting);
  if (fav !== lastFav) { document.getElementById('fav').href = fav; lastFav = fav; }
  document.title = PawMood.titleFor(tabWaiting, finishedAway, document.hidden && flash);
}
let tabWaiting = 0, lastCounts = null;

function render(snap) {
  if (snap.version) document.getElementById('ver').textContent = 'v' + snap.version;
  // FLIP: remember where every card is now (including mid-slide), so reordering can glide instead of jump
  const before = new Map();
  for (const el of cards.values()) {
    before.set(el, el.getBoundingClientRect());
    el.getAnimations().forEach(an => { if (an.id === 'move') an.cancel(); });
  }
  if (DEMO) { const ag = demo(snap.now); ag.forEach((x, i) => { x.aic = 3.2 + i * 9.7; }); snap = { now: snap.now, agents: ag, aic: 214.6, aicSessions: 1, update: { version: '9.9.9', url: 'https://github.com/henskjold73/pawsee/releases' }, problems: new URLSearchParams(location.search).has('drift') ? [{ source: 'Claude Code', reason: 'unrecognised', sessions: 2 }] : [] }; }
  const { now } = snap;
  showUpdate(snap.update);
  showProblems(snap.problems);
  const agents = snap.agents, fadeMs = snap.fadeMs || 240e3;
  const seen = new Set();
  let cheered = 0; // agents that wrapped up since the last render
  agents.forEach((a, i) => {
    const key = a.session + a.id;
    seen.add(key);
    let el = cards.get(key);
    if (!el) {
      el = document.createElement('article');
      el.className = 'card';
      el.innerHTML = `<div class="stage"><span class="badge"></span><span class="fails" hidden></span><span class="typebadge" hidden></span>${pawSvg()}</div><div class="body"><div class="top"><span class="name"></span></div>
        <div class="sub"></div><div class="doing"></div><div class="meta"></div></div>`;
      el.style.setProperty('--h', hueOf(key));
      const doing = el.querySelector('.doing');
      doing.tabIndex = 0;
      doing.setAttribute('role', 'button');
      const toggle = () => { el.classList.toggle('open'); last && render(last); };
      doing.onclick = e => { if (!getSelection().toString()) toggle(); };
      doing.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } };
      if (reduceMotion.matches) el.querySelector('svg').pauseAnimations();
      cards.set(key, el);
    }
    const reaction = el._status && PawMood.reactionOf(el._status, a); // only for an agent we saw running, never on page load
    if (reaction && !reduceMotion.matches) react(el, reaction);
    if (reaction && document.hidden) finishedAway = true;
    if (reaction === 'cheer') cheered++;
    el._status = a.status;
    el.dataset.status = a.status;
    const mood = PawMood.moodOf(a, now);
    if (mood) el.dataset.mood = mood; else delete el.dataset.mood;
    el.dataset.source = a.source || 'copilot'; // Claude Code agents have claws, not paws
    el.toggleAttribute('data-main', a.type === 'main agent'); // the one in charge wears a crown
    el.dataset.lv = LEVEL[a.effort] || 2;
    // one red cross under the paw for every failed attempt so far (the newest pops in)
    const fails = a.fails || 0, fx = el.querySelector('.fails');
    if (el._fails !== fails) {
      const shown = Math.min(fails, 6);
      fx.hidden = !fails;
      fx.title = `${fails} failed attempt${fails === 1 ? '' : 's'}`;
      fx.innerHTML = Array.from({ length: shown }, (_, i) => `<span class="x${el._fails != null && i === shown - 1 && fails > el._fails ? ' new' : ''}">✕</span>`).join('')
        + (fails > shown ? `<span class="plus">+${fails - shown}</span>` : '');
      el._fails = fails;
    }
    // a failed attempt, and the agent is trying again: worried, more so the more it fails in a row
    if (a.status === 'running' && a.worry > 0 && now - a.worryAt < 15e3) el.dataset.worried = Math.min(a.worry, 3); else delete el.dataset.worried;
    // thinking about a skill / connector it just used: the round badge turns into a thought bubble with its logo
    if (a.status === 'running' && a.brand && now - a.brandAt < 12e3) el.dataset.brand = a.brand; else delete el.dataset.brand;
    const logo = a.brand?.startsWith('custom:') && snap.logos?.[a.brand.slice(7)];
    if (logo) { const im = el.querySelector('.b-custom image'); if (im.getAttribute('href') !== logo) im.setAttribute('href', logo); }
    el.classList.toggle('fading', a.label !== 'waiting on agents' && ['done', 'failed', 'lost', 'idle'].includes(a.status) && now - (a.endedAt ?? a.activityAt) > fadeMs - 15e3);
    el.dataset.kind = a.kind || 'think';
    el.querySelector('.name').textContent = a.type === 'main agent' ? a.name : a.name.replace(/[-_]+/g, ' '); // agent names are slugs; a prompt title is already prose
    el.querySelector('.badge').textContent = a.label || LABEL[a.status];
    const tb = el.querySelector('.typebadge'), type = a.type && a.type !== 'general-purpose' ? a.type.replace(/[-_]+/g, ' ') : '';
    tb.hidden = !type; tb.textContent = type;
    el.querySelector('.sub').textContent = [a.project, a.branch].filter(Boolean).join(' · ');
    el.title = [a.description, a.sessionName].filter(Boolean).join('\n');
    el.querySelector('.doing').innerHTML = doingHtml(a, el.classList.contains('open'));
    el.querySelector('.meta').innerHTML = metaHtml(a, now);
    if (grid.children[i] !== el) grid.insertBefore(el, grid.children[i] || null);
  });
  for (const [k, el] of cards) if (!seen.has(k)) { el.remove(); cards.delete(k); }

  const n = s => agents.filter(a => a.status === s).length;
  const credits = snap.aic > 0 ? `<span title="All AI credits used so far in the Copilot session${snap.aicSessions > 1 ? 's' : ''} shown here: the main agent, every agent, and earlier tasks"><b>⚡ ${fmtAic(snap.aic)}</b> AIC ${snap.aicSessions > 1 ? 'across sessions' : 'this session'}</span>` : '';
  summary.innerHTML = [['need you', n('waiting')], ['working', n('running')], ['napping', n('idle')], ['failed', n('failed')], ['done', n('done')]]
    .filter(([, c]) => c).map(([l, c]) => `<span><b>${c}</b> ${l}</span>`).join('') + credits || '<span>all quiet</span>';
  empty.hidden = agents.length > 0;
  if (!reduceMotion.matches) {
    for (const [el, from] of before) {
      if (!el.isConnected) continue;
      const to = el.getBoundingClientRect();
      const dx = from.left - to.left, dy = from.top - to.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { id: 'move', duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  }
  tabWaiting = n('waiting');
  const counts = { waiting: tabWaiting, running: n('running'), cheered };
  const chime = PawMood.soundFor(lastCounts, counts);
  lastCounts = counts;
  if (chime) playSound(chime);
  if (agents.some(a => a.status === 'running')) finishedAway = false; // work resumed: the tick is stale
  applyTab();
}

let last;
const es = new EventSource('/events');
es.onmessage = e => { last = JSON.parse(e.data); render(last); };
