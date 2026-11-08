// The kibble meter: tokens eaten become kibble, each agent has an appetite, and an agent that burns too fast or repeats itself gets the zoomies.
// Small pure helpers, loaded by the page as a plain script; the tests run it the same way.
const PawMeter = (() => {
  const TIERS = [ // [up to (tokens), icon, name]
    [20e3, '🥣', 'nibbling'], [100e3, '🍖', 'snacking'], [400e3, '🍗', 'feasting'], [Infinity, '🥱', 'food coma'],
  ];
  const BURN_FLOOR = 50e3;   // tokens a minute below which nobody gets the zoomies for eating fast
  const BURN_RATIO = 3;      // ...and it has to be this many times what the other busy agents eat
  const LOOP_AT = 5;         // the same call this many times in a row is a loop

  function fmt(n) {
    n = Math.max(0, Math.round(n || 0));
    if (n < 1000) return String(n);
    const k = Math.round(n / (n < 1e4 ? 100 : 1000)) / (n < 1e4 ? 10 : 1); // 1.2k below 10k, whole k above
    if (k < 1000) return k + 'k';
    return Math.round(n / (n < 1e7 ? 1e4 : 1e5)) / (n < 1e7 ? 100 : 10) + 'M'; // 1.23M below 10M, 12.3M above
  }

  function tierOf(tokens) {
    const [, icon, name] = TIERS.find(t => (tokens || 0) < t[0]);
    return { icon, name };
  }

  // 'loop' = the same call over and over, 'burn' = eating much faster than its friends, else null. `others` are the other running agents.
  function zoomiesOf(a, others = []) {
    if (a.status !== 'running') return null;
    if ((a.repeat || 0) >= LOOP_AT) return 'loop';
    const burn = a.burn || 0;
    if (burn < BURN_FLOOR) return null;
    const rest = others.filter(o => o.status === 'running').map(o => o.burn || 0).sort((x, y) => x - y);
    const median = rest.length ? rest[Math.floor(rest.length / 2)] : 0;
    return burn >= BURN_RATIO * median ? 'burn' : null;
  }

  return { fmt, tierOf, zoomiesOf, LOOP_AT, BURN_FLOOR };
})();
