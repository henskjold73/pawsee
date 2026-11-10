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
const TOOL = { copilot: 'Copilot', claude: 'Claude Code', codex: 'Codex', gemini: 'Gemini' };
// the tool an agent belongs to is a little animated foot in the card's top right: Copilot round paw, Claude Code claws, Codex blocky toes, Gemini sparkle toes
const TOE_AT = [[20, 42, 10, 13, -20, 'M16 31Q17 21 23 17Q24 25 24 31Z'], [38, 26, 10, 14, -6, 'M34 14Q35 4 41 0Q42 8 42 14Z'], [62, 26, 10, 14, 6, 'M58 14Q59 4 65 0Q66 8 66 14Z'], [80, 42, 10, 13, 20, 'M76 31Q77 21 83 17Q84 25 84 31Z']];
function toolSvg(source) {
  const toes = TOE_AT.map(([cx, cy, rx, ry, rot, claw], i) => {
    const at = `transform="translate(${cx} ${cy}) rotate(${rot})"`;
    if (source === 'codex') return `<g class="toe"><rect ${at} x="-9" y="${-ry}" width="18" height="${ry * 2}" rx="5.5"/></g>`;
    if (source === 'gemini') { const R = i === 1 || i === 2 ? 17 : 15, k = R * .2; return `<g class="toe"><path ${at} d="M0 ${-R}Q${k} ${-k} ${R} 0Q${k} ${k} 0 ${R}Q${-k} ${k} ${-R} 0Q${-k} ${-k} 0 ${-R}Z"/></g>`; }
    return `<g class="toe"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})"/>${source === 'claude' ? `<path d="${claw}" transform="rotate(${rot} ${cx} ${cy})" fill="#f6efe6"/>` : ''}</g>`;
  }).join('');
  return `<span class="toolwrap" data-tool="${TOOL[source] || source}"><svg class="toolpaw" viewBox="-6 -6 112 100" role="img" aria-label="${TOOL[source] || source}"><title>${TOOL[source] || source}</title>
    <g fill="var(--paw)" stroke="#2b1b12" stroke-width="3.4" stroke-linejoin="round">${toes}<path d="M50 44c-17 0-30 14-30 28 0 10 8 16 17 16 6 0 9-3 13-3s7 3 13 3c9 0 17-6 17-16 0-14-13-28-30-28z"/></g>
    <g class="teyes" fill="#3b2f2f"><circle cx="41" cy="66" r="4.2"/><circle cx="59" cy="66" r="4.2"/></g>
    <ellipse cx="50" cy="75" rx="3.6" ry="2.7" fill="var(--bean)"/><path d="M45 79q5 4 10 0" stroke="#3b2f2f" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg></span>`;
}
const LABEL = { waiting: 'needs you', running: 'working', idle: 'napping', done: 'done', failed: 'failed', lost: 'lost' };

// every session has a family: the main agent is a human head, its sub-agents are smaller relatives of that head (same head and skin, a feature or two swapped)
const faceCache = new Map();
function mainFace(session) { if (!faceCache.has(session)) faceCache.set(session, Faces.random(Faces.hash('main:' + session), { human: true })); return faceCache.get(session); }
// a sub-agent card carries a small portrait of its parent (the session's main agent), framed in the main agent's colour
function parentChip(session, isMain) {
  if (isMain) return '';
  return `<span class="parentface" style="--mh:${hueOf(session + 'main')}" title="Main agent of this session">${Faces.compose(mainFace(session), { size: 30, title: 'main agent' })}</span>`;
}
// sub-agents wear the hat that fits what they are doing (the main agent keeps its crown)
const HAT_OF = { explore: 'pith', web: 'sailor', code: 'hard', shell: 'beanie', sql: 'bowler', ask: 'party', work: 'chef', think: 'wizard' };
function agentSvg(source, session = '', id = 'main', isMain = true) {
  const spec = isMain ? mainFace(session) : Faces.derive(mainFace(session), Faces.hash(session + id));
  const f = Faces.pieces(spec), k = isMain ? 1 : +(0.7 + (f.scale - 0.55)).toFixed(2); // relatives are drawn smaller, anchored at the chin
  const ink = '#2b1b12', st = `stroke="${ink}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  return `<svg class="paw" viewBox="-4 -22 124 124" aria-hidden="true">
    <g class="bodyg">
    <circle class="fx-halo" cx="50" cy="58" r="50" fill="none" stroke="var(--paw)" stroke-width="3"/>
    <g class="fx-orbit" transform="translate(50 58)"><g fill="var(--paw-dark)" opacity=".75">
      <circle cx="56" cy="0" r="2.6"/><circle cx="-28" cy="48.5" r="2.6"/><circle cx="-28" cy="-48.5" r="2.6"/></g>
      <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="16s" repeatCount="indefinite" additive="sum"/></g>
    <g class="bodyg"><g transform="translate(0 -2) scale(1.02)"><g transform="translate(50 90) scale(${k}) translate(-50 -90)" style="${f.style}">
      ${f.ears}${f.head}${f.extra}${f.hair}
      <g class="face">
      <g class="eye-open">${f.eyes}</g>
      <g class="eye-closed" ${st} stroke-width="3"><path d="M30 48q7 5 14 0M56 48q7 5 14 0"/></g>
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
      <path class="worry-mouth" d="M40 82q5-4 10 0t10 0" ${st} stroke-width="3"/>
      <g class="hbrows">${f.brows}</g>${f.nose}<g class="mouth">${f.mouth}</g>
      </g>${Object.keys(HAT_OF).map(k => `<g class="hat h-${k}">${Faces.hatFor(HAT_OF[k], spec.head)}</g>`).join('')}</g></g></g>
    <g class="crown" transform="translate(50 6) rotate(-5)">
      <path d="M-15 8L-17 -8L-8 -1L0 -12L8 -1L17 -8L15 8Z" fill="#f6c945" stroke="#c9961a" stroke-width="2" stroke-linejoin="round"/>
      <rect x="-15" y="5" width="30" height="5.5" rx="2" fill="#e8b32c" stroke="#c9961a" stroke-width="1.6"/>
      <circle cx="-17" cy="-8" r="2.3" fill="#fff3b0" stroke="#c9961a" stroke-width="1.3"/><circle cx="0" cy="-12" r="2.3" fill="#fff3b0" stroke="#c9961a" stroke-width="1.3"/><circle cx="17" cy="-8" r="2.3" fill="#fff3b0" stroke="#c9961a" stroke-width="1.3"/>
      <circle class="gem" cx="0" cy="7.8" r="2" fill="var(--bean)"/>
    </g>
    <g fill="#f6c945">
      <path class="fx-spark spark1" transform="translate(112 54)" d="M0 -5.5L1.5 -1.5L5.5 0L1.5 1.5L0 5.5L-1.5 1.5L-5.5 0L-1.5 -1.5Z"/><path class="fx-spark spark2" transform="translate(-1 48)" d="M0 -5.5L1.5 -1.5L5.5 0L1.5 1.5L0 5.5L-1.5 1.5L-5.5 0L-1.5 -1.5Z"/>
      <path class="fx-spark spark3" transform="translate(22 -8)" d="M0 -5.5L1.5 -1.5L5.5 0L1.5 1.5L0 5.5L-1.5 1.5L-5.5 0L-1.5 -1.5Z"/><path class="fx-spark spark4" transform="translate(106 90)" d="M0 -5.5L1.5 -1.5L5.5 0L1.5 1.5L0 5.5L-1.5 1.5L-5.5 0L-1.5 -1.5Z"/></g>
    </g>
    <g class="pbadge" transform="translate(82 4) scale(1.3)"><g class="bob">
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
  if (a.tokens > 0) { const t = PawMeter.tierOf(a.tokens); tags.push(`<span class="tag kib" title="Kibble eaten: fresh tokens this agent has read and written, cached ones not counted. Appetite: ${t.name}">${t.icon} ${PawMeter.fmt(a.tokens)} · ${t.name}</span>`); }
  if (a.zoomies === 'loop') tags.push(`<span class="tag zoom" title="The same call ${a.repeat} times in a row: it may be stuck in a loop">🌀 chasing its tail (same call ×${a.repeat})</span>`);
  else if (a.zoomies === 'burn') tags.push(`<span class="tag zoom" title="Eating far faster than the other agents">💨 zoomies: ${PawMeter.fmt(a.burn)}/min</span>`);
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
// done cards: small round badges for what the agent used (skills, connectors, CLIs, then the kinds of work), at most 4 and a "+n"
const KIND_ICONS = {
  shell: ['console', '<rect x="-11" y="-8" width="22" height="16" rx="3" fill="#2d2523"/><path d="M-7 -3l4 3-4 3" fill="none" stroke="#7fe3a6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 4h6" stroke="#7fe3a6" stroke-width="2" stroke-linecap="round"/>'],
  web: ['web', '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle r="9"/><ellipse rx="3.8" ry="9"/><path d="M-9 0h18"/></g>'],
  code: ['code', '<path d="M-4 -6l-6 6 6 6M4 -6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'],
  explore: ['search', '<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="-2" cy="-2" r="6"/><path d="M3 3l7 7"/></g>'],
  sql: ['database', '<g fill="none" stroke="currentColor" stroke-width="1.7"><ellipse cy="-6" rx="8" ry="3"/><path d="M-8 -6v12c0 1.8 3.6 3 8 3s8-1.2 8-3V-6M-8 0c0 1.8 3.6 3 8 3s8-1.2 8-3"/></g>'],
  work: ['work items', '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="-7" y="-9" width="14" height="18" rx="2.5"/><path d="M-3.5 -2l1.5 1.5 3-3M-3.5 4.5l1.5 1.5 3-3"/></g>'],
  skill: ['skill', '<path d="M0 -10l2.6 6.4L9 -2.4l-5 4.4 1.6 7L0 5.4 -5.6 9l1.6-7-5-4.4 6.4-1.2z" fill="#f6c945" stroke="#c9961a" stroke-width="1.4" stroke-linejoin="round"/>'],
};
let toastTimer;
function toast(text) {
  const t = document.getElementById('toast');
  t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3500);
}
async function jumpTo(session) {
  try {
    const r = await fetch('/focus', { method: 'POST', headers: { 'content-type': 'application/json', 'x-pawsee': '1' }, body: JSON.stringify({ session }) });
    const j = await r.json();
    toast(j.ok ? (j.how === 'tab' ? `Jumped to its tab in ${j.app}` : `Brought ${j.app} forward`) : j.reason || 'Could not jump there');
  } catch { toast('Could not reach pawsee'); }
}
const SHOWN_USED = 4;
function usedBadges(box, used, logos) {
  const list = used || [], sig = list.join(',');
  box.hidden = !list.length;
  if (box._sig === sig) return;
  box._sig = sig;
  const rank = k => BRAND_ICONS[k] || k.startsWith('custom:') ? 0 : 1; // brands first, then the generic kinds; first use order within each
  const sorted = list.map((k, i) => [k, i]).sort((x, y) => rank(x[0]) - rank(y[0]) || x[1] - y[1]).map(x => x[0]).filter(k => BRAND_ICONS[k] || k.startsWith('custom:') || KIND_ICONS[k]);
  const chip = k => {
    if (BRAND_ICONS[k]) return `<span class="uchip" title="${k}"><svg viewBox="-10 -10 20 20">${BRAND_ICONS[k]}</svg></span>`;
    if (k.startsWith('custom:')) { const f = logos?.[k.slice(7)]; return f ? `<span class="uchip" title="${k.slice(7)}"><img src="${f}" alt=""></span>` : ''; }
    return `<span class="uchip kind" title="${KIND_ICONS[k][0]}"><svg viewBox="-12 -12 24 24">${KIND_ICONS[k][1]}</svg></span>`;
  };
  const more = sorted.length - SHOWN_USED;
  box.innerHTML = sorted.slice(0, SHOWN_USED).map(chip).join('') + (more > 0 ? `<span class="uchip more" title="${sorted.slice(SHOWN_USED).map(k => k.replace(/^custom:/, '')).join(', ')}">+${more}</span>` : '');
}

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
  const SAMPLE = ['nx', 'shell', 'git', 'skill', 'github', 'web', 'code'];
  rest.forEach((x, i) => { x.used = SAMPLE.slice(i, i + 2 + i * 2); }); // demo only: the done card shows 4 and a +n
  const cyc = all.find(x => x.id === 'r0'), phase = Math.floor(now / 9000) % 4; // demo only: one card keeps finishing and failing, to preview the reactions
  if (cyc && phase % 2) Object.assign(cyc, { status: phase === 1 ? 'done' : 'failed', endedAt: now - 1000 }); // running, done, running, failed
  all.forEach((x, i) => { x.source = ['copilot', 'claude', 'codex', 'gemini'][i % 4]; }); // the demo cards cycle through the four tools
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

// desktop notifications: opt in with the Notify pill (the click is also what lets the browser ask for permission). They only show while
// the tab is hidden or unfocused, since the page itself already shows what's happening. The choice is remembered.
let notifyOn = false;
try { notifyOn = localStorage.getItem('pawsee-notify') === '1'; } catch {}
const notifyBtn = document.getElementById('ntf');
const canNotify = typeof Notification !== 'undefined';
function showNotify() {
  const denied = canNotify && Notification.permission === 'denied';
  if (denied || !canNotify) notifyOn = false;
  notifyBtn.textContent = notifyOn ? '🖥 Notify on' : '🖥 Notify off';
  notifyBtn.setAttribute('aria-pressed', String(notifyOn));
  notifyBtn.disabled = denied || !canNotify;
  notifyBtn.title = !canNotify ? 'This browser has no desktop notifications'
    : denied ? 'Notifications are blocked for this page. Allow them in your browser\'s site settings to use this'
    : notifyOn ? 'Notifications are on: a desktop notification when something needs you or work finishes while this tab is in the background. Click to turn off'
    : 'Notifications are off. Click to get a desktop notification when something needs you or work finishes while this tab is in the background';
}
notifyBtn.onclick = async () => {
  if (!canNotify) return;
  if (notifyOn) notifyOn = false;
  else {
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    notifyOn = perm === 'granted';
  }
  try { localStorage.setItem('pawsee-notify', notifyOn ? '1' : '0'); } catch {}
  showNotify();
};
function notifyDesktop(kind, agents) {
  if (!notifyOn || !canNotify || Notification.permission !== 'granted') return;
  if (!document.hidden && document.hasFocus()) return;
  try {
    const names = agents.filter(a => a.status === 'waiting').map(a => a.type === 'main agent' ? a.name : a.name.replace(/[-_]+/g, ' '));
    const waiting = kind === 'attention';
    new Notification(waiting ? '🐾 Something needs you' : '🐾 Work finished', {
      body: waiting ? (names.join(', ') || 'An agent is waiting for you') : 'All agents are done',
      tag: 'pawsee-' + kind,
    });
  } catch {}
}
showNotify();

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

let bootId = null; // the server's start id: when it changes the server was restarted (an update, or `npm run dev`), so load the new page
function render(snap) {
  if (snap.boot) { if (bootId && snap.boot !== bootId) return location.reload(); bootId = snap.boot; }
  if (snap.version) document.getElementById('ver').textContent = 'v' + snap.version;
  // FLIP: remember where every card is now (including mid-slide), so reordering can glide instead of jump
  const before = new Map();
  for (const el of cards.values()) {
    before.set(el, el.getBoundingClientRect());
    el.getAnimations().forEach(an => { if (an.id === 'move') an.cancel(); });
  }
  if (DEMO) { const ag = demo(snap.now); ag.forEach((x, i) => { x.aic = 3.2 + i * 9.7; x.tokens = Math.round(1500 * (i + 1) ** 2.6); x.burn = x.kind === 'shell' ? 90e3 : 2e3; x.repeat = x.kind === 'explore' ? 7 : 0; }); snap = { now: snap.now, agents: ag, tokens: ag.reduce((n, x) => n + x.tokens, 0), aic: 214.6, aicSessions: 1, update: { version: '9.9.9', url: 'https://github.com/henskjold73/pawsee/releases' }, problems: new URLSearchParams(location.search).has('drift') ? [{ source: 'Claude Code', reason: 'unrecognised', sessions: 2 }] : [] }; }
  const { now } = snap;
  showUpdate(snap.update);
  showProblems(snap.problems);
  const agents = snap.agents, fadeMs = snap.fadeMs || 240e3;
  const seen = new Set();
  let cheered = 0; // agents that wrapped up since the last render
  for (const a of agents) a.zoomies = PawMeter.zoomiesOf(a, agents.filter(o => o !== a));
  agents.forEach((a, i) => {
    const key = a.session + a.id;
    seen.add(key);
    let el = cards.get(key);
    if (!el) {
      el = document.createElement('article');
      el.className = 'card';
      el.innerHTML = `<div class="stage"><span class="badge"></span><span class="fails" hidden></span><span class="typebadge" hidden></span><span class="used" hidden></span>${parentChip(a.session, a.type === 'main agent')}${agentSvg(a.source, a.session, a.id, a.type === 'main agent')}</div><div class="body"><div class="top"><span class="name"></span></div>
        <div class="sub"></div><div class="doing"></div><div class="meta"></div></div>`;
      el.style.setProperty('--h', hueOf(key));
      const stage = el.querySelector('.stage');
      stage.addEventListener('click', () => { if (stage.classList.contains('jump')) jumpTo(stage._session); });
      const doing = el.querySelector('.doing');
      doing.tabIndex = 0;
      doing.setAttribute('role', 'button');
      const toggle = () => { el.classList.toggle('open'); last && render(last); };
      doing.onclick = e => { if (!getSelection().toString()) toggle(); };
      doing.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } };
      if (reduceMotion.matches) { el.querySelector('svg').pauseAnimations(); document.getElementById('boilsvg')?.pauseAnimations(); }
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
    el.dataset.source = a.source || 'copilot';
    if (el._tool !== (a.source || 'copilot')) { el._tool = a.source || 'copilot'; el.querySelector('.toolwrap')?.remove(); el.insertAdjacentHTML('afterbegin', toolSvg(el._tool)); }
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
    if (a.zoomies) el.dataset.zoomies = a.zoomies; else delete el.dataset.zoomies;
    el.dataset.kind = a.kind || 'think';
    el.querySelector('.name').textContent = a.type === 'main agent' ? a.name : a.name.replace(/[-_]+/g, ' '); // agent names are slugs; a prompt title is already prose
    el.querySelector('.badge').textContent = a.label || LABEL[a.status];
    const tb = el.querySelector('.typebadge'), type = a.type && a.type !== 'general-purpose' ? a.type.replace(/[-_]+/g, ' ') : '';
    const st = el.querySelector('.stage');
    st.classList.toggle('jump', !!a.canFocus && !DEMO);
    st.title = a.canFocus && !DEMO ? 'Click to jump to its terminal' : '';
    st._session = a.session;
    const done = a.status === 'done';
    tb.hidden = !type || done; tb.textContent = type;
    usedBadges(el.querySelector('.used'), done ? a.used : [], snap.logos);
    el.querySelector('.sub').textContent = [a.project, a.branch].filter(Boolean).join(' · ');
    el.title = [a.description, a.sessionName].filter(Boolean).join('\n');
    el.querySelector('.doing').innerHTML = doingHtml(a, el.classList.contains('open'));
    el.querySelector('.meta').innerHTML = metaHtml(a, now);
    if (grid.children[i] !== el) grid.insertBefore(el, grid.children[i] || null);
  });
  for (const [k, el] of cards) if (!seen.has(k)) { el.remove(); cards.delete(k); }

  const n = s => agents.filter(a => a.status === s).length;
  const credits = snap.aic > 0 ? `<span title="All AI credits used so far in the Copilot session${snap.aicSessions > 1 ? 's' : ''} shown here: the main agent, every agent, and earlier tasks"><b>⚡ ${fmtAic(snap.aic)}</b> AIC ${snap.aicSessions > 1 ? 'across sessions' : 'this session'}</span>` : '';
  const kibble = snap.tokens > 0 ? `<span title="Kibble eaten across the sessions pawsee has seen in the last day: fresh tokens read and written, cached ones not counted"><b>${PawMeter.tierOf(snap.tokens).icon} ${PawMeter.fmt(snap.tokens)}</b> kibble eaten</span>` : '';
  summary.innerHTML = [['need you', n('waiting')], ['working', n('running')], ['napping', n('idle')], ['failed', n('failed')], ['done', n('done')]]
    .filter(([, c]) => c).map(([l, c]) => `<span><b>${c}</b> ${l}</span>`).join('') + kibble + credits || '<span>all quiet</span>';
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
  if (chime) { playSound(chime); notifyDesktop(chime, agents); }
  if (agents.some(a => a.status === 'running')) finishedAway = false; // work resumed: the tick is stale
  applyTab();
}

let last;
const es = new EventSource('/events');
es.onmessage = e => { last = JSON.parse(e.data); render(last); };
