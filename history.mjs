// Session history: a trail of "who did what kind of work when", recorded from the same events that drive the cards,
// and folded into timelines (segments + time per kind) for the Recent view. Pure functions: server.mjs only calls them.

export const GAP_MS = 60e3;     // a pause longer than this isn't counted as work of the last kind
export const TRAIL_MAX = 4000;  // events kept per session (oldest dropped first)

/** remember one tool call. `who` is null for the main agent, else the sub-agent id */
export function recordTool(s, who, ts, kind, text = '') {
  const trail = (s.trail ??= []);
  trail.push({ t: ts, who, kind, text: String(text).slice(0, 140) });
  if (trail.length > TRAIL_MAX) trail.splice(0, trail.length - TRAIL_MAX);
}

/** the person's prompts mark where a new task begins */
export function recordPrompt(s, ts, text = '') {
  const prompts = (s.prompts ??= []);
  prompts.push({ t: ts, text: String(text).slice(0, 140) });
  if (prompts.length > 200) prompts.shift();
}

/** one actor's events -> segments of the same kind, each ending at the next event (capped at GAP_MS), plus the time per kind */
export function timeline(events) {
  const sorted = [...events].sort((a, b) => a.t - b.t);
  const segments = [], totals = {};
  sorted.forEach((e, i) => {
    const next = sorted[i + 1];
    const to = next ? Math.min(next.t, e.t + GAP_MS) : e.t + 1000; // the last call gets a second so it still shows
    const last = segments[segments.length - 1];
    if (last && last.kind === e.kind && e.t - last.to <= 1) { last.to = to; last.calls += 1; }
    else segments.push({ kind: e.kind, from: e.t, to, calls: 1, text: e.text });
    totals[e.kind] = (totals[e.kind] || 0) + (to - e.t);
  });
  return { segments, totals, calls: sorted.length };
}

/** every session that has a trail, newest activity first: one actor per agent (main first) */
export function buildHistory(sessions, { now = Date.now(), limit = 40, maxAgeMs = Infinity } = {}) {
  const out = [];
  for (const [id, s] of sessions) {
    if (!s.trail?.length) continue;
    const byWho = new Map();
    for (const e of s.trail) { if (!byWho.has(e.who)) byWho.set(e.who, []); byWho.get(e.who).push(e); }
    const main = s.promptTitle || s.meta?.name || s.product || 'Copilot';
    const actors = [...byWho].map(([who, events]) => {
      const a = who && s.agents?.get(who);
      return { id: who ?? 'main', name: who ? (a?.name || 'agent') : main, type: who ? (a?.type || '') : 'main agent', ...timeline(events) };
    }).sort((x, y) => (x.id === 'main' ? -1 : y.id === 'main' ? 1 : x.segments[0].from - y.segments[0].from));
    const from = Math.min(...actors.map(a => a.segments[0].from));
    const to = Math.max(...actors.map(a => a.segments[a.segments.length - 1].to));
    out.push({ session: id.slice(0, 8), source: s.src || (s.product ? 'claude' : 'copilot'), name: main, project: s.meta?.cwd ? s.meta.cwd.split(/[\\/]/).filter(Boolean).pop() : '',
      branch: s.meta?.branch || '', live: !!s.alive, from, to, calls: actors.reduce((n, a) => n + a.calls, 0),
      prompts: (s.prompts || []).filter(p => p.t <= to).slice(-20), actors });
  }
  out.sort((x, y) => y.to - x.to);
  return { now, sessions: out.filter(x => x.live || now - x.to <= maxAgeMs).slice(0, limit) };
}
