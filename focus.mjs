// "jump to its terminal": from the process a session runs in, find the app window it lives in and bring it to the front.
// macOS only for now. Nothing here comes from the browser except which session was clicked: pids, paths and ttys are read from the machine.
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';

const APP = /^(.*?([^/]+)\.app)\/Contents\/MacOS\//;

/** { ppid, tty, command } of a process, or null when it is gone */
export function psInfo(pid) {
  try {
    const out = execFileSync('ps', ['-o', 'ppid=,tty=,command=', '-p', String(pid)], { encoding: 'utf8', timeout: 3000 }).trim();
    const m = out.match(/^(\d+)\s+(\S+)\s+(.*)$/);
    return m ? { ppid: Number(m[1]), tty: m[2], command: m[3] } : null;
  } catch { return null; }
}

/** walk up from the session's process: the tty it runs on and the app (…/Hyper.app) that owns it.
 *  The outermost app wins: Claude Code's own binary is a tiny claude.app, but it runs inside Claude.app. */
export function hostOf(pid, info = psInfo) {
  let tty = null, app = null;
  for (let p = Number(pid), i = 0; p > 1 && i < 16; i++) {
    const r = info(p);
    if (!r) return null;
    if (!tty && /^ttys\d+$/.test(r.tty)) tty = r.tty;
    const m = r.command.match(APP);
    if (m) app = { app: m[2], bundle: m[1] };
    p = r.ppid;
  }
  return app && { ...app, tty };
}

const isDir = p => { try { return statSync(p).isDirectory(); } catch { return false; } };

/** what to run to focus that host: an osascript for Terminal/iTerm (it can pick the right tab by tty), otherwise `open` on the app */
export function planFocus(host, cwd = '') {
  if (!host) return null;
  const { app, bundle, tty } = host;
  if (tty && app === 'Terminal') {
    return { cmd: 'osascript', args: ['-e', `tell application "Terminal"
  activate
  repeat with w in windows
    repeat with t in tabs of w
      if tty of t is "/dev/${tty}" then
        set selected of t to true
        set index of w to 1
        return "tab"
      end if
    end repeat
  end repeat
end tell`], how: 'tab' };
  }
  if (tty && /^iTerm2?$/.test(app)) {
    return { cmd: 'osascript', args: ['-e', `tell application "${app}"
  activate
  repeat with w in windows
    repeat with t in tabs of w
      repeat with s in sessions of t
        if tty of s is "/dev/${tty}" then
          select w
          select t
          select s
          return "tab"
        end if
      end repeat
    end repeat
  end repeat
end tell`], how: 'tab' };
  }
  // editors: opening the folder brings forward the window that already has it
  const editor = /^(Visual Studio Code|Cursor|Windsurf|VSCodium)/.test(app);
  return { cmd: 'open', args: editor && cwd && isDir(cwd) ? ['-a', bundle, cwd] : ['-a', bundle], how: 'app' };
}

/** focus the window of a session; { ok, app, how } or { ok: false, reason } */
export function focusSession(pid, cwd, { info = psInfo, run = execFileSync, platform = process.platform } = {}) {
  if (platform !== 'darwin') return { ok: false, reason: 'Jumping to the terminal only works on macOS so far.' };
  if (!Number.isInteger(pid) || pid < 2) return { ok: false, reason: 'No running process is known for this session.' };
  const host = hostOf(pid, info);
  const plan = planFocus(host, cwd);
  if (!plan) return { ok: false, reason: 'Could not find the app this session runs in.' };
  try {
    const out = String(run(plan.cmd, plan.args, { encoding: 'utf8', timeout: 5000 }) || '').trim();
    // a tab we could not find still brought the app forward
    return { ok: true, app: host.app, how: plan.how === 'tab' && out !== 'tab' ? 'app' : plan.how };
  } catch (e) {
    return { ok: false, reason: `macOS refused to bring ${host.app} forward${/not allowed|-1743|-1728/.test(String(e.stderr || e.message)) ? ' (allow pawsee to control it in System Settings → Privacy → Automation)' : ''}.` };
  }
}
