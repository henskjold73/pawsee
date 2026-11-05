// Did pawsee understand what it read? Both Copilot CLI and Claude Code log in internal formats that can change,
// and without a check pawsee would just quietly show fewer agents.
export const MIN_LINES = 60; // a session this long that produced nothing we understood...
export const MAX_BAD = 5;    // ...or this many lines that would not even parse, is suspicious

/** why a session looks unreadable, or null. `s` carries the counters lines / events / bad. */
export function sessionProblem(s) {
  if ((s.bad || 0) >= MAX_BAD) return 'unreadable';
  if ((s.lines || 0) >= MIN_LINES && !(s.events || 0)) return 'unrecognised';
  return null;
}

/** one entry per source and reason: [{ source: 'Claude Code', reason: 'unrecognised', sessions: 2 }] */
export function problemsOf(sessions) {
  const found = new Map();
  for (const s of sessions) {
    const reason = sessionProblem(s);
    if (!reason) continue;
    const source = s.product || 'Copilot CLI', key = `${source}|${reason}`;
    const p = found.get(key) || { source, reason, sessions: 0 };
    p.sessions++;
    found.set(key, p);
  }
  return [...found.values()];
}
