// Token meter bookkeeping: tokens eaten, how fast (per minute), and whether an agent keeps repeating the exact same call.
// Windows live in a WeakMap so they never end up in the JSON the page receives.

export const BURN_WINDOW_MS = 60e3;
const windows = new WeakMap(); // agent/main object -> [[ts, tokens], ...]

/** an agent ate `n` tokens at `ts` */
export function noteTokens(t, ts, n) {
  if (!(n > 0)) return;
  t.tokens = (t.tokens || 0) + n;
  const w = windows.get(t) || [];
  w.push([ts, n]);
  while (w.length && ts - w[0][0] > BURN_WINDOW_MS) w.shift();
  windows.set(t, w);
}

/** tokens eaten in the last minute (a rate in tokens/min) */
export function burnOf(t, now) {
  return (windows.get(t) || []).reduce((sum, [ts, n]) => now - ts <= BURN_WINDOW_MS ? sum + n : sum, 0);
}

/** the same call again and again is a loop in the making: counts the current streak on `t.repeat` */
export function noteCall(t, toolName, args) {
  let sig = toolName;
  try { sig += '|' + JSON.stringify(args ?? {}).slice(0, 400); } catch {}
  t.repeat = t.sig === sig ? (t.repeat || 1) + 1 : 1;
  t.sig = sig;
}
