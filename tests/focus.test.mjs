import test, { before, after } from 'node:test';
import http from 'node:http';
import assert from 'node:assert/strict';
import { hostOf, planFocus, focusSession } from '../focus.mjs';
import { start, copilotSession } from './harness.mjs';

// a fake process table: pid -> { ppid, tty, command }
const table = {
  500: { ppid: 400, tty: 'ttys009', command: '/usr/local/bin/copilot --resume=x' },
  400: { ppid: 300, tty: 'ttys009', command: '/bin/zsh --login' },
  300: { ppid: 1, tty: '??', command: '/Applications/Hyper.app/Contents/MacOS/Hyper' },
  600: { ppid: 700, tty: 'ttys003', command: 'claude' },
  700: { ppid: 1, tty: '??', command: '/System/Applications/Utilities/Terminal.app/Contents/MacOS/Terminal' },
  610: { ppid: 710, tty: '??', command: '/Users/me/Library/Application Support/Claude/claude-code/2/claude.app/Contents/MacOS/claude' }, // claude's own binary is a claude.app too
  710: { ppid: 1, tty: '??', command: '/Applications/Claude.app/Contents/MacOS/Claude' },
  620: { ppid: 720, tty: 'ttys004', command: 'claude' },
  720: { ppid: 1, tty: '??', command: '/Applications/Visual Studio Code.app/Contents/MacOS/Electron' },
  630: { ppid: 99, tty: 'ttys005', command: 'claude' },
  99: { ppid: 1, tty: 'ttys005', command: '-zsh' },
};
const info = pid => table[pid] || null;

test('hostOf: walks up to the app that owns the process and remembers the tty', () => {
  assert.deepEqual(hostOf(500, info), { app: 'Hyper', bundle: '/Applications/Hyper.app', tty: 'ttys009' });
  assert.deepEqual(hostOf(610, info), { app: 'Claude', bundle: '/Applications/Claude.app', tty: null }); // the desktop app has no tty
  assert.equal(hostOf(630, info), null); // no app above it (e.g. ssh or tmux server)
  assert.equal(hostOf(12345, info), null); // not running
});

test('hostOf: a loop in the process table does not hang', () => {
  assert.equal(hostOf(1, () => ({ ppid: 2, tty: '??', command: 'x' })), null);
  assert.equal(hostOf(5, () => ({ ppid: 5, tty: '??', command: 'x' })), null);
});

test('planFocus: Terminal and iTerm pick their tab by tty, everything else just comes forward', () => {
  const t = planFocus(hostOf(600, info));
  assert.equal(t.cmd, 'osascript');
  assert.match(t.args[1], /"\/dev\/ttys003"/);
  assert.match(planFocus({ app: 'iTerm2', bundle: '/Applications/iTerm.app', tty: 'ttys008' }).args[1], /"\/dev\/ttys008"/);
  assert.deepEqual(planFocus(hostOf(500, info)), { cmd: 'open', args: ['-a', '/Applications/Hyper.app'], how: 'app' });
  assert.equal(planFocus(null), null);
});

test('planFocus: an editor is opened on the session folder so the right window comes forward', () => {
  const p = planFocus(hostOf(620, info), process.cwd());
  assert.deepEqual(p.args, ['-a', '/Applications/Visual Studio Code.app', process.cwd()]);
  assert.deepEqual(planFocus(hostOf(620, info), '/does/not/exist').args, ['-a', '/Applications/Visual Studio Code.app']);
});

test('focusSession: reports what happened, and why not', () => {
  const ran = [];
  const run = (cmd, args) => { ran.push([cmd, args[0]]); return 'tab'; };
  assert.deepEqual(focusSession(600, '', { info, run, platform: 'darwin' }), { ok: true, app: 'Terminal', how: 'tab' });
  assert.deepEqual(ran, [['osascript', '-e']]);
  assert.deepEqual(focusSession(500, '', { info, run, platform: 'darwin' }), { ok: true, app: 'Hyper', how: 'app' });
  assert.equal(focusSession(600, '', { info, run: () => 'none', platform: 'darwin' }).how, 'app'); // tab not found: the app still came forward
  assert.match(focusSession(500, '', { info, run, platform: 'linux' }).reason, /macOS/);
  assert.match(focusSession(0, '', { info, run, platform: 'darwin' }).reason, /No running process/);
  assert.match(focusSession(630, '', { info, run, platform: 'darwin' }).reason, /Could not find the app/);
  const denied = () => { throw Object.assign(new Error('x'), { stderr: 'execution error: Not authorized to send Apple events (-1743)' }); };
  assert.match(focusSession(600, '', { info, run: denied, platform: 'darwin' }).reason, /Automation/);
});

let h;
before(async () => { h = await start({ PAWSEE_FOCUS_DRYRUN: '1' }); });
after(() => h.stop());

const post = (headers = {}, body = { session: 'ffffffff' }) => fetch(`http://127.0.0.1:${h.port}/focus`,
  { method: 'POST', headers: { 'content-type': 'application/json', 'x-pawsee': '1', ...headers }, body: JSON.stringify(body) });

test('POST /focus: a running session is found by its id, an unknown or ended one is not', async () => {
  copilotSession(h, 'ffffffff-0001').prompt('hello');
  await h.until(a => a.some(x => x.session === 'ffffffff'), 'card');
  const r = await post();
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true, dry: true, pid: process.pid });
  assert.equal((await post({}, { session: 'abcdef12' })).status, 404);
  assert.equal((await post({}, { session: '../etc' })).status, 404);
  assert.equal((await post({}, 'not an object')).status, 404);
});

test('POST /focus: other websites cannot call it (wrong method, header, origin or host)', async () => {
  assert.equal((await fetch(`http://127.0.0.1:${h.port}/focus`)).status, 405);
  assert.equal((await post({ 'x-pawsee': '' })).status, 403);
  assert.equal((await post({ origin: 'https://evil.example' })).status, 403);
  assert.equal((await post({ origin: `http://127.0.0.1:${h.port}` })).status, 200);
  const rebound = await new Promise(res => { // fetch won't let us lie about Host, so speak HTTP directly (a DNS-rebinding page arrives with its own hostname)
    const q = http.request({ host: '127.0.0.1', port: h.port, path: '/focus', method: 'POST', headers: { host: 'evil.example', 'x-pawsee': '1' } }, r => { r.resume(); res(r.statusCode); });
    q.end('{"session":"ffffffff"}');
  });
  assert.equal(rebound, 403);
});
