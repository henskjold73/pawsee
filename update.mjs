// Is there a newer pawsee release? One small request to GitHub, which can be switched off (--no-update-check).

// "v0.1.10" / "0.2.0" -> [0, 1, 10]; anything that is not plain numbers (a pre-release, garbage) -> null
const parse = v => {
  const m = String(v ?? '').trim().replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)$/);
  return m ? m.slice(1).map(Number) : null;
};

export function isNewer(latest, current) {
  const a = parse(latest), b = parse(current);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

/** The newest published release as { version, url }, or null when it cannot be read (offline, rate-limited, odd answer). */
export async function latestRelease(url, { fetchFn = fetch, timeoutMs = 5000 } = {}) {
  try {
    const res = await fetchFn(url, { headers: { accept: 'application/vnd.github+json', 'user-agent': 'pawsee-update-check' }, signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    const j = await res.json();
    if (!parse(j.tag_name) || j.draft || j.prerelease) return null;
    const link = typeof j.html_url === 'string' && /^https:\/\//.test(j.html_url) ? j.html_url : null;
    return { version: String(j.tag_name).replace(/^v/i, ''), url: link };
  } catch { return null; }
}
