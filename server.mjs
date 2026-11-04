#!/usr/bin/env node
// pawsee — tails Copilot CLI session logs and streams agent state to the browser.
import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync, openSync, readSync, closeSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';

const { values: opt } = parseArgs({
  options: {
    port: { type: 'string', short: 'p' },
    dir: { type: 'string' },
    'no-open': { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
  },
});
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
if (opt.version) { console.log(pkg.version); process.exit(0); }
if (opt.help) {
  console.log(`pawsee ${pkg.version} — animated paws for your Copilot CLI agents

Usage: pawsee [options]
  -p, --port <n>   port to serve on (default 4747, or $PORT)
      --dir <path> Copilot session-state folder (default ~/.copilot/session-state)
      --no-open    don't open the browser
  -h, --help       show this help
  -v, --version    show the version`);
  process.exit(0);
}

const PORT = Number(opt.port || process.env.PORT || 4747);
const ROOT = opt.dir || process.env.COPILOT_STATE || join(homedir(), '.copilot', 'session-state');
const MAX_AGE_MS = Number(process.env.PAWSEE_HOURS || 24) * 3600e3;
const FADE_MS = Number(process.env.PAWSEE_FADE_SECONDS || 240) * 1000; // finished agents leave after this
const PUBLIC = join(fileURLToPath(new URL('.', import.meta.url)), 'public');

/** sessionId -> { offset, partial, meta, agents: Map<agentId, Agent>, calls: Map<toolCallId, agentId> } */
const sessions = new Map();

const clip = (s, n = 140, keepLines = false) => {
  s = String(s ?? '');
  s = (keepLines ? s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n') : s.replace(/\s+/g, ' ')).trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
};

// untrimmed version for the expanded card view
function fullTool(d) {
  const a = d.arguments || {};
  const parts = [a.description || d.toolTitle || d.intentionSummary, a.command && `$ ${a.command}`, a.path,
    a.pattern && `“${a.pattern}”`, a.skill && `skill ${a.skill}`].filter(Boolean);
  return clip(parts.length ? parts.join('\n') : d.toolName, 1500, true);
}

function describeTool(d) {
  const a = d.arguments || {};
  const what =
    a.description || d.toolTitle || d.intentionSummary ||
    (a.command && `$ ${a.command}`) ||
    (a.path && `${d.toolName} ${basename(a.path)}`) ||
    (a.pattern && `${d.toolName} “${a.pattern}”`) ||
    (a.skill && `skill ${a.skill}`) ||
    d.toolName;
  return clip(what);
}

// what kind of work a tool call is, so the paw can act it out
const KINDS = {
  web: ['web_fetch', 'web_search', 'fetch_copilot_cli_documentation'],
  code: ['apply_patch', 'edit', 'create', 'str_replace_editor'],
  explore: ['view', 'rg', 'grep', 'glob'],
  shell: ['bash', 'read_bash', 'write_bash', 'stop_bash'],
  sql: ['sql', 'session_store_sql'],
  ask: ['ask_user', 'exit_plan_mode'],
};
const kindOf = (tool = '') =>
  Object.keys(KINDS).find(k => KINDS[k].includes(tool)) ||
  (/^(ado|ide)-/.test(tool) ? 'work' : 'think');

function readMeta(dir) {
  const meta = { name: '', cwd: '', branch: '' };
  try {
    const y = readFileSync(join(dir, 'workspace.yaml'), 'utf8');
    for (const k of ['name', 'cwd', 'branch']) {
      const m = y.match(new RegExp(`^${k}: (.*)$`, 'm'));
      if (m) meta[k] = m[1].trim();
    }
  } catch {}
  return meta;
}

function sessionAlive(dir) {
  try {
    for (const f of readdirSync(dir)) {
      const m = f.match(/^inuse\.(\d+)\.lock$/);
      if (!m) continue;
      try { process.kill(Number(m[1]), 0); return true; } catch (e) { if (e.code === 'EPERM') return true; }
    }
  } catch {}
  return false;
}

function getAgent(s, id, ts) {
  let a = s.agents.get(id);
  if (!a) {
    a = { id, name: 'agent', type: '', description: '', model: '', mode: 'sync', status: 'running', kind: 'think',
      startedAt: ts, endedAt: null, activity: 'starting up…', activityAt: ts, tools: 0, tokens: 0 };
    s.agents.set(id, a);
  }
  return a;
}

function handle(s, line) {
  const ev = JSON.parse(line);
  const d = ev.data || {};
  const ts = Date.parse(ev.timestamp) || Date.now();
  switch (ev.type) {
    case 'subagent.started': {
      const a = getAgent(s, ev.agentId, ts);
      Object.assign(a, {
        name: d.agentDisplayName || d.agentName, type: d.agentType || d.agentName,
        description: d.agentDescription || '', model: d.model || '',
        mode: d.executionMode || 'sync', status: 'running', startedAt: ts, endedAt: null,
      });
      if (d.toolCallId) s.calls.set(d.toolCallId, ev.agentId);
      break;
    }
    case 'subagent.completed': {
      const a = getAgent(s, ev.agentId, ts);
      Object.assign(a, { status: 'done', endedAt: ts, tools: d.totalToolCalls ?? a.tools,
        tokens: d.totalTokens ?? a.tokens, model: d.model || a.model });
      a.durationMs = d.durationMs;
      break;
    }
    case 'subagent.failed': {
      const a = getAgent(s, ev.agentId, ts);
      Object.assign(a, { status: 'failed', endedAt: ts, activity: clip(d.error, 200), activityFull: clip(d.error, 2000, true), activityAt: ts });
      break;
    }
    case 'system.notification':
      if (d.kind?.type === 'agent_idle' && s.agents.has(d.kind.agentId)) {
        const a = s.agents.get(d.kind.agentId);
        if (a.status === 'running') { a.status = 'idle'; a.endedAt = ts; }
      }
      break;
    case 'user.message': // the user's own prompt (not a sub-agent's) starts a new task
      if (!ev.agentId) s.lastUserAt = ts;
      break;
    case 'tool.execution_start':
      if (ev.agentId && s.agents.has(ev.agentId)) {
        const a = s.agents.get(ev.agentId);
        a.activity = describeTool(d); a.activityFull = fullTool(d); a.activityAt = ts; a.kind = kindOf(d.toolName); a.tools = Math.max(a.tools, 0) + 1;
        if (a.status === 'idle') { a.status = 'running'; a.endedAt = null; } // woken by a new message
      }
      break;
    case 'assistant.message':
      if (ev.agentId && s.agents.has(ev.agentId) && d.content?.trim()) {
        const a = s.agents.get(ev.agentId);
        a.said = clip(d.content.replace(/[#*`>_]+/g, ''), 220); a.saidFull = clip(d.content, 4000, true); a.saidAt = ts;
      }
      break;
  }
}

function pump(id, dir) {
  const file = join(dir, 'events.jsonl');
  let s = sessions.get(id);
  if (!s) {
    s = { offset: 0, partial: '', meta: readMeta(dir), agents: new Map(), calls: new Map(), alive: false, lastUserAt: 0 };
    sessions.set(id, s);
  }
  const size = statSync(file).size;
  if (size < s.offset) { s.offset = 0; s.partial = ''; s.agents.clear(); }
  let changed = false;
  while (s.offset < size) {
    const len = Math.min(size - s.offset, 8 << 20);
    const buf = Buffer.alloc(len);
    const fd = openSync(file, 'r');
    readSync(fd, buf, 0, len, s.offset);
    closeSync(fd);
    s.offset += len;
    const text = s.partial + buf.toString('utf8');
    const lines = text.split('\n');
    s.partial = lines.pop();
    for (const line of lines) {
      // cheap prefilter: skip the huge reasoning/model snapshot lines
      if (!(line.startsWith('{"type":"subagent.') || line.startsWith('{"type":"user.message"') || line.startsWith('{"type":"system.notification"') ||
        ((line.startsWith('{"type":"tool.execution_start"') || line.startsWith('{"type":"assistant.message"')) &&
          line.includes('"agentId":"')))) continue;
      try { handle(s, line); changed = true; } catch {}
    }
  }
  return changed;
}

function scan() {
  let changed = false;
  let dirs = [];
  try { dirs = readdirSync(ROOT); } catch { return false; }
  const now = Date.now();
  for (const id of dirs) {
    const dir = join(ROOT, id);
    const file = join(dir, 'events.jsonl');
    try {
      if (!existsSync(file)) continue;
      const st = statSync(file);
      if (now - st.mtimeMs > MAX_AGE_MS && !sessions.has(id)) continue;
      if (pump(id, dir)) changed = true;
      const s = sessions.get(id);
      const alive = sessionAlive(dir);
      if (alive !== s.alive) { s.alive = alive; changed = true; }
    } catch {}
  }
  return changed;
}

function snapshot() {
  const now = Date.now();
  const agents = [];
  for (const [sid, s] of sessions) {
    for (const a of s.agents.values()) {
      let status = a.status;
      if ((status === 'running' || status === 'idle') && !s.alive) status = 'lost';
      if (status !== 'running') {
        const end = a.endedAt ?? a.activityAt;
        if (end < s.lastUserAt) continue;                       // left over from a previous task
        if (status !== 'idle' && now - end > FADE_MS) continue; // finished a while ago
      }
      agents.push({ ...a, status, session: sid.slice(0, 8), sessionName: s.meta.name,
        project: basename(s.meta.cwd || ''), branch: s.meta.branch });
    }
  }
  const rank = { running: 0, idle: 1, failed: 2, done: 3, lost: 4 };
  agents.sort((x, y) => rank[x.status] - rank[y.status] || (y.endedAt ?? y.activityAt) - (x.endedAt ?? x.activityAt));
  return { now, agents, fadeMs: FADE_MS };
}

// ---- http ----
const clients = new Set();
const push = () => {
  const data = `data: ${JSON.stringify(snapshot())}\n\n`;
  for (const c of clients) c.write(data);
};

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/events') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
    res.write(`data: ${JSON.stringify(snapshot())}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  if (url.pathname === '/api/agents') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(snapshot()));
  }
  const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const file = join(PUBLIC, rel);
  if (!file.startsWith(PUBLIC) || !existsSync(file)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});

function openBrowser(url) {
  const [cmd, args] = process.platform === 'darwin' ? ['open', [url]]
    : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  try { spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref(); } catch {}
}

server.on('error', e => {
  console.error(e.code === 'EADDRINUSE'
    ? `Port ${PORT} is already in use — pawsee may already be running. Try: pawsee --port ${PORT + 1}`
    : e.message);
  process.exit(1);
});
server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}`;
  console.log(`🐾 pawsee watching ${ROOT}\n   ${url}`);
  if (!existsSync(ROOT)) console.log(`   (no Copilot sessions found at that path yet — start Copilot CLI and paws will appear)`);
  if (!opt['no-open']) openBrowser(url);
});

scan();
setInterval(() => { if (scan() || clients.size) push(); }, 1000);
