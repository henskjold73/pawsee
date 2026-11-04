// Small pure helpers for the paw's moods, its one-off reactions and the tab alerts. Loaded by the page as a plain script; the tests run it the same way.
const PawMood = (() => {
  const SLEEPY_MS = 25e3, DEEP_MS = 120e3;

  // a longer-lasting face: dizzy after lots of failures, sleepy just after napping off, deeply asleep after a while
  function moodOf(a, now) {
    if (a.status === 'running' && (a.worry || 0) >= 2 && (a.fails || 0) >= 5 && now - (a.worryAt || 0) < 15e3) return 'dizzy';
    if (a.status === 'idle' && a.label !== 'waiting on agents') {
      const idleFor = now - (a.endedAt ?? a.activityAt ?? now);
      if (idleFor < SLEEPY_MS) return 'sleepy';
      if (idleFor >= DEEP_MS) return 'deep';
    }
    return null;
  }

  // a one-off reaction when an agent that was running changes state: cheer for finishing, flop for failing
  function reactionOf(prevStatus, a) {
    if (prevStatus !== 'running') return null;
    if (a.status === 'done') return 'cheer';
    if (a.status === 'idle' && a.label !== 'waiting on agents') return 'cheer';
    if (a.status === 'failed') return 'flop';
    return null;
  }

  // tab icon: the paws, with an amber count when something needs you, or a green tick when work finished while you were away
  function faviconFor(waiting, finished) {
    let badge = '';
    if (waiting > 0) badge = `<circle cx='72' cy='72' r='28' fill='#f5a524'/><text x='72' y='85' font-size='38' font-weight='700' text-anchor='middle' fill='#3b2f2f' font-family='sans-serif'>${waiting > 9 ? '9+' : waiting}</text>`;
    else if (finished) badge = `<circle cx='72' cy='72' r='28' fill='#3fb37f'/><path d='M60 73l9 9 16-19' stroke='#fff' stroke-width='8' stroke-linecap='round' stroke-linejoin='round' fill='none'/>`;
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐾</text>${badge}</svg>`)}`;
  }

  // tab title; `flash` alternates the text while the tab is in the background, so it catches the eye
  function titleFor(waiting, finished, flash = false) {
    if (waiting > 0) return flash ? `🐾 ${waiting} needs you!` : `(${waiting}) needs you · pawsee`;
    return finished ? '✓ done · pawsee' : 'pawsee';
  }

  return { moodOf, reactionOf, faviconFor, titleFor, SLEEPY_MS, DEEP_MS };
})();
