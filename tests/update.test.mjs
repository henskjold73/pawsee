import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { isNewer, latestRelease } from '../update.mjs';
import { start, sleep } from './harness.mjs';

test('versions compare as numbers, not text', () => {
  assert.equal(isNewer('0.1.9', '0.1.8'), true);
  assert.equal(isNewer('0.1.10', '0.1.9'), true);   // not "0.1.10" < "0.1.9"
  assert.equal(isNewer('0.2.0', '0.1.99'), true);
  assert.equal(isNewer('1.0.0', '0.9.9'), true);
  assert.equal(isNewer('v0.1.9', '0.1.8'), true);
  assert.equal(isNewer('0.1.8', '0.1.8'), false);
  assert.equal(isNewer('0.1.7', '0.1.8'), false);
  assert.equal(isNewer('0.1.99', '0.2.0'), false);
  assert.equal(isNewer('0.9.9', '1.0.0'), false);
  assert.equal(isNewer('0.10.0', '0.9.0'), true);   // more than one digit in any part
  assert.equal(isNewer('10.0.0', '9.0.0'), true);
  assert.equal(isNewer('  v0.1.9 \n', '0.1.8'), true); // stray whitespace is fine
});

test('anything that is not a plain x.y.z is never "newer"', () => {
  for (const bad of ['', null, undefined, 'latest', '1.0', '1.0.0-beta.1', '1.2.3.4', 'v', '0.1.x']) {
    assert.equal(isNewer(bad, '0.0.1'), false, String(bad));
    assert.equal(isNewer('9.9.9', bad), false, String(bad));
  }
});

const answer = (body, ok = true) => async () => ({ ok, json: async () => body });

test('latestRelease reads the tag and link of a published release', async () => {
  const r = await latestRelease('x', { fetchFn: answer({ tag_name: 'v0.3.1', html_url: 'https://github.com/o/r/releases/tag/v0.3.1' }) });
  assert.deepEqual(r, { version: '0.3.1', url: 'https://github.com/o/r/releases/tag/v0.3.1' });
});

test('latestRelease ignores drafts, pre-releases, odd tags and unsafe links', async () => {
  assert.equal(await latestRelease('x', { fetchFn: answer({ tag_name: 'v1.0.0', draft: true }) }), null);
  assert.equal(await latestRelease('x', { fetchFn: answer({ tag_name: 'v1.0.0', prerelease: true }) }), null);
  assert.equal(await latestRelease('x', { fetchFn: answer({ tag_name: 'nightly' }) }), null);
  assert.equal(await latestRelease('x', { fetchFn: answer({}) }), null);
  const r = await latestRelease('x', { fetchFn: answer({ tag_name: 'v1.0.0', html_url: 'javascript:alert(1)' }) });
  assert.deepEqual(r, { version: '1.0.0', url: null }); // still an update, but no link to click
  assert.equal((await latestRelease('x', { fetchFn: answer({ tag_name: 'v1.0.0', html_url: 'http://insecure.example' }) })).url, null);
  assert.equal((await latestRelease('x', { fetchFn: answer({ tag_name: 'v1.0.0', html_url: 'javascript:alert("https://")' }) })).url, null); // https must be the very start
});

test('latestRelease gives null when the request fails in any way', async () => {
  assert.equal(await latestRelease('x', { fetchFn: answer({ tag_name: 'v1.0.0' }, false) }), null);   // HTTP error (rate limit, 404)
  assert.equal(await latestRelease('x', { fetchFn: async () => { throw new Error('offline'); } }), null);
  assert.equal(await latestRelease('x', { fetchFn: async () => ({ ok: true, json: async () => { throw new Error('not json'); } }) }), null);
});

test('latestRelease sends a plain request: GitHub accept header and a user agent, no cookies or ids', async () => {
  let seen;
  await latestRelease('https://example.test/latest', { fetchFn: async (url, init) => { seen = { url, init }; return { ok: true, json: async () => ({}) }; } });
  assert.equal(seen.url, 'https://example.test/latest');
  assert.deepEqual(seen.init.headers, { accept: 'application/vnd.github+json', 'user-agent': 'pawsee-update-check' });
  assert.ok(seen.init.signal instanceof AbortSignal);
});

// ---- the server end to end, against a fake "GitHub" ----
const fakeGithub = tag => new Promise(res => {
  const hits = { n: 0, ua: '' };
  const srv = createServer((req, rsp) => { hits.n++; hits.ua = req.headers['user-agent']; rsp.setHeader('content-type', 'application/json'); rsp.end(JSON.stringify({ tag_name: tag, html_url: `https://github.com/o/r/releases/tag/${tag}` })); })
    .listen(0, '127.0.0.1', () => res({ hits, url: `http://127.0.0.1:${srv.address().port}/latest`, close: () => srv.close() }));
});

test('the server reports a newer release in its snapshot', async () => {
  const gh = await fakeGithub('v99.0.0'), h = await start({ PAWSEE_NO_UPDATE_CHECK: '', PAWSEE_UPDATE_URL: gh.url });
  try {
    const snap = await h.until((_, s) => s.update && s, 'update info');
    assert.deepEqual(snap.update, { version: '99.0.0', url: 'https://github.com/o/r/releases/tag/v99.0.0' });
    assert.equal(gh.hits.ua, 'pawsee-update-check');
  } finally { h.stop(); gh.close(); }
});

test('the server says nothing when it is up to date', async () => {
  const gh = await fakeGithub('v0.0.1'), h = await start({ PAWSEE_NO_UPDATE_CHECK: '', PAWSEE_UPDATE_URL: gh.url });
  try {
    await h.until(() => gh.hits.n > 0, 'the check');
    await sleep(300);
    assert.equal((await h.api()).update, null);
  } finally { h.stop(); gh.close(); }
});

test('the check can be switched off, and then GitHub is never asked', async () => {
  const gh = await fakeGithub('v99.0.0'), h = await start({ PAWSEE_UPDATE_URL: gh.url }); // the harness default turns it off
  try {
    await sleep(1500);
    assert.equal(gh.hits.n, 0);
    assert.equal((await h.api()).update, null);
  } finally { h.stop(); gh.close(); }
});

test('an unreachable GitHub leaves the server running and quiet', async () => {
  const h = await start({ PAWSEE_NO_UPDATE_CHECK: '', PAWSEE_UPDATE_URL: 'http://127.0.0.1:1/nothing-here' });
  try {
    await sleep(800);
    const snap = await h.api();
    assert.equal(snap.update, null);
    assert.ok(snap.version);
  } finally { h.stop(); }
});
