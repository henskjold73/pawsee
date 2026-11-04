#!/usr/bin/env node
// pawsee — tails Copilot CLI session logs and streams agent state to the browser.
import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync, openSync, readSync, closeSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { titleFromPrompt } from './title.mjs';
import { translate } from './claude.mjs';

// set when running as the single-file binary: assets are embedded instead of read from disk
const sea = (() => { try { const m = createRequire(import.meta.url)('node:sea'); return m.isSea() ? m : null; } catch { return null; } })();

const { values: opt } = parseArgs({
  options: {
    port: { type: 'string', short: 'p' },
    dir: { type: 'string' },
    'claude-dir': { type: 'string' },
    logos: { type: 'string' },
    'no-open': { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
  },
});
const pkg = JSON.parse(sea ? Buffer.from(sea.getAsset('package.json')).toString() : readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
if (opt.version) { console.log(pkg.version); process.exit(0); }
if (opt.help) {
  console.log(`pawsee ${pkg.version} — animated paws for your Copilot CLI and Claude Code agents

Usage: pawsee [options]
  -p, --port <n>   port to serve on (default 4747, or $PORT)
      --dir <path> Copilot session-state folder (default ~/.copilot/session-state)
      --claude-dir <path>  Claude Code projects folder (default ~/.claude/projects)
      --logos <path>       folder of your own skill images (default ~/.pawsee/logos)
      --no-open    don't open the browser
  -h, --help       show this help
  -v, --version    show the version`);
  process.exit(0);
}

const PORT = Number(opt.port || process.env.PORT || 4747);
const ROOT = opt.dir || process.env.COPILOT_STATE || join(homedir(), '.copilot', 'session-state');
const CLAUDE_HOME = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
const CLAUDE_ROOT = opt['claude-dir'] || join(CLAUDE_HOME, 'projects');
const LOGO_DIR = opt.logos || process.env.PAWSEE_LOGOS || join(homedir(), '.pawsee', 'logos');
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

// which skill / connector / CLI an agent is using, so its card can "think" about that logo
const BRAND_WORDS = [['nx', 'nx'], ['sonar', 'sonar'], ['playwright', 'playwright'], ['docker', 'docker'], ['dotnet', 'dotnet'],
  ['github', 'github'], ['gh', 'github'], ['devops', 'ado'], ['ado', 'ado'], ['azure', 'azure'], ['git', 'git'], ['npm', 'npm'], ['pnpm', 'npm'],
  ['yarn', 'npm'], ['typescript', 'typescript'], ['python', 'python'], ['node', 'node'], ['eslint', 'eslint'], ['prettier', 'prettier'], ['vitest', 'vitest']];
function brandFromWords(name = '') {
  const words = String(name).toLowerCase().split(/[^a-z0-9]+/);
  return BRAND_WORDS.find(([w]) => words.includes(w))?.[1] || null;
}
const CMD_BRAND = { git: 'git', gh: 'github', nx: 'nx', dotnet: 'dotnet', docker: 'docker', 'docker-compose': 'docker', playwright: 'playwright',
  node: 'node', python: 'python', python3: 'python', tsc: 'typescript', eslint: 'eslint', prettier: 'prettier', vitest: 'vitest' };
const RUNNERS = ['npm', 'npx', 'pnpm', 'yarn']; // "npx vitest" is about vitest, a bare "npm run" is about npm
function brandFromCommand(cmd = '') {
  for (const seg of String(cmd).split(/&&|\|\||;|\||\n/)) {
    const t = seg.trim().split(/\s+/).filter(w => !/^\w+=/.test(w) && !['sudo', 'time', 'env', 'command'].includes(w));
    if (!t.length) continue;
    if (t[0] === 'az') return t.some(w => ['devops', 'boards', 'repos', 'pipelines'].includes(w)) ? 'ado' : 'azure';
    if (CMD_BRAND[t[0]]) return CMD_BRAND[t[0]];
    if (RUNNERS.includes(t[0])) return t.slice(1).map(w => CMD_BRAND[w]).find(Boolean) || 'npm';
  }
  return null;
}
const HOST_BRAND = [[/(^|\.)github(usercontent)?\.com$/, 'github'], [/(^|\.)(dev\.azure|visualstudio)\.com$/, 'ado'], [/(^|\.)azure\.com$/, 'azure'],
  [/(^|\.)npmjs\.(org|com)$/, 'npm'], [/(^|\.)nodejs\.org$/, 'node'], [/(^|\.)(sonarcloud\.io|sonarsource\.com)$/, 'sonar'],
  [/(^|\.)(python|pypi)\.org$/, 'python'], [/(^|\.)typescriptlang\.org$/, 'typescript'], [/(^|\.)vitest\.dev$/, 'vitest'], [/(^|\.)eslint\.org$/, 'eslint'],
  [/(^|\.)prettier\.io$/, 'prettier'], [/(^|\.)docker\.com$/, 'docker'], [/(^|\.)nx\.dev$/, 'nx'], [/(^|\.)git-scm\.com$/, 'git'],
  [/(^|\.)playwright\.dev$/, 'playwright'], [/(^|\.)dotnet\.microsoft\.com$/, 'dotnet']];
// your own images: <logos>/<skill>.png|jpg|webp|gif|svg, shown in the bubble when an agent uses that skill (or tool / command of the same name)
const IMG_MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
let customLogos = new Map(); // slug -> { file, v }
function loadLogos() {
  const next = new Map();
  try {
    for (const f of readdirSync(LOGO_DIR).sort()) {
      const ext = extname(f).toLowerCase();
      if (!IMG_MIME[ext]) continue;
      const key = slug(basename(f, extname(f)));
      if (key && !next.has(key)) next.set(key, { file: f, v: Math.floor(statSync(join(LOGO_DIR, f)).mtimeMs) });
    }
  } catch {}
  customLogos = next;
}
function customBrand(d) {
  if (!customLogos.size) return null;
  const tool = d.toolName || '', a = d.arguments || {};
  const names = tool === 'skill' ? [a.skill, String(a.skill || '').split(':').pop()]
    : ['bash', 'read_bash', 'write_bash', 'powershell'].includes(tool) ? String(a.command || '').split(/&&|\|\||;|\||\n/).map(seg => seg.trim().split(/\s+/).filter(w => !/^\w+=/.test(w) && !['sudo', 'time', 'env', 'command'].includes(w))[0])
    : [tool.split('-')[0]];
  for (const n of names) { const k = slug(n); if (customLogos.has(k)) return 'custom:' + k; }
  return null;
}
function brandOf(d) {
  const custom = customBrand(d);
  if (custom) return custom;
  const tool = d.toolName || '', a = d.arguments || {};
  if (tool.startsWith('github-')) return 'github';
  if (tool.startsWith('ado-')) return 'ado';
  if (tool.startsWith('ide-')) return 'vscode';
  if (/sonar/i.test(tool)) return 'sonar';
  if (tool === 'skill') return brandFromWords(a.skill);
  if (['bash', 'read_bash', 'write_bash', 'powershell'].includes(tool)) return brandFromCommand(a.command);
  if (tool === 'web_fetch') {
    try { const h = new URL(a.url).hostname; return HOST_BRAND.find(([re]) => re.test(h))?.[1] || null; } catch { return null; }
  }
  return null;
}

function describeTool(d) {
  const a = d.arguments || {};
  const what =
    a.description || d.toolTitle || d.intentionSummary ||
    (a.command && `$ ${a.command}`) ||
    (a.path && `${d.toolName} ${basename(a.path)}`) ||
    (a.pattern && `${d.toolName} “${a.pattern}”`) ||
    (a.url && `${d.toolName} ${a.url.replace(/^https?:\/\//, '')}`) ||
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
    a = { id, name: 'agent', type: '', description: '', model: '', mode: 'sync', status: 'running', kind: 'think', aic: 0, worry: 0, worryAt: 0, lastError: '', fails: 0,
      startedAt: ts, endedAt: null, activity: 'starting up…', activityAt: ts, tools: 0, tokens: 0 };
    s.agents.set(id, a);
  }
  return a;
}

// the main (parent) agent of a session: same shape as a sub-agent, built lazily
const mainOf = s => (s.main ??= { status: 'idle', startedAt: 0, endedAt: null, activity: '', activityFull: '', activityAt: 0,
  kind: 'think', tools: 0, said: '', saidFull: '', lastMsgTools: 0, effort: null, worry: 0, worryAt: 0, lastError: '', fails: 0 });
function wakeMain(m, ts) {
  if (m.status === 'running') return;
  Object.assign(m, { status: 'running', startedAt: ts, endedAt: null, tools: 0, activityAt: ts });
}

// a tool call finished: failures make the agent "worried" (consecutive count), a success calms it down
function trackResult(s, who, success, msg = '', ts = Date.now()) {
  const t = who ? s.agents.get(who) : mainOf(s);
  if (!t) return;
  if (success) { t.worry = 0; return; }
  t.worry = (t.worry || 0) + 1; t.fails = (t.fails || 0) + 1; t.worryAt = ts; t.lastError = clip(msg, 200);
}

// a finished/napping agent that gets new work (write_agent) is running again
function wake(a, ts, why, newRun = false) {
  if (a.status === 'running') return;
  Object.assign(a, { status: 'running', endedAt: null, activityAt: ts });
  if (newRun) a.startedAt = ts;
  if (why) { a.activity = why; a.activityFull = why; }
}

// a tool call finished: answers ask_user, and records the success / failure of every call
function complete(s, toolCallId, success, msg, ts) {
  let changed = s.pending.delete(toolCallId);
  if (s.owner.has(toolCallId)) {
    const who = s.owner.get(toolCallId); s.owner.delete(toolCallId);
    if (typeof success === 'boolean') { trackResult(s, who, success, msg, ts); changed = true; }
  }
  return changed;
}

function handle(s, ev) {
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
    case 'subagent.configured': // the reasoning effort an agent was set up with
      if (d.reasoningEffort && ev.agentId) getAgent(s, ev.agentId, ts).effort = d.reasoningEffort;
      break;
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
        const a = s.agents.get(d.kind.agentId); // finished its turn, still resumable
        if (a.status === 'running' || a.status === 'done') { a.status = 'idle'; a.endedAt = ts; }
      }
      break;
    case 'user.message':
      if (!ev.agentId) { // the user's own prompt starts a new task, so old questions are moot
        s.lastUserAt = ts; s.pending.clear();
        const title = titleFromPrompt(d.content); // null for "yes", "now?" and the like: keep the previous title
        if (title) { s.promptTitle = title; s.promptFull = clip(d.content, 1500, true); }
        const m = mainOf(s);
        Object.assign(m, { status: 'running', startedAt: ts, endedAt: null, tools: 0, activityAt: ts, kind: 'think', worry: 0, worryAt: 0, lastError: '', fails: 0, // a new task starts with a clean slate
         
          activity: `reading your prompt: ${clip(d.content, 120)}`, activityFull: clip(d.content, 2000, true), said: '', saidFull: '' });
        break;
      }
      if (s.agents.has(ev.agentId)) { // instructions sent to a sub-agent (first task, or a resume)
        const a = s.agents.get(ev.agentId);
        const t = clip(d.content, 140);
        wake(a, ts, t ? `got a task: ${t}` : '', true);
      }
      break;
    case 'session.usage_record': { // AI credits: Copilot reports nano-AIU per model call
      const credits = (d.usage?.copilotUsage?.totalNanoAiu || 0) / 1e9;
      s.aic += credits;
      if (!ev.agentId) { s.mainAic += credits; if (d.usage?.reasoningEffort) mainOf(s).effort = d.usage.reasoningEffort; }
      else if (s.agents.has(ev.agentId)) {
        const a = s.agents.get(ev.agentId);
        a.aic += credits;
        if (d.usage?.reasoningEffort) a.effort = d.usage.reasoningEffort; // latest effort used for a call
      }
      break;
    }
    case 'permission.requested': { // waiting for the person to approve something
      const r = d.permissionRequest || {};
      const what = r.intention || `${r.kind || 'action'} permission`;
      const detail = [what, r.fullCommandText && `$ ${r.fullCommandText}`, r.url, r.path || r.fileName].filter(Boolean).join('\n');
      s.pending.set(d.requestId, { agentId: ev.agentId || null, ts, verb: 'approval', text: clip(what, 140), detail: clip(detail, 1500, true) });
      break;
    }
    case 'permission.completed':
      s.pending.delete(d.requestId);
      break;
    case 'tool.execution_start':
      s.owner.set(d.toolCallId, ev.agentId || null);
      if (d.toolName === 'ask_user') { // a question for the person
        const m = String(d.arguments?.message || 'has a question');
        const fields = Object.values(d.arguments?.requestedSchema?.properties || {}).map(p => `• ${p.title || ''}${p.description ? ': ' + p.description : ''}`);
        s.pending.set(d.toolCallId, { agentId: ev.agentId || null, ts, verb: 'question', text: clip(m, 140), detail: clip([m, ...fields].join('\n'), 2000, true) });
        break;
      }
      if (!ev.agentId) { // the main agent working
        const m = mainOf(s);
        wakeMain(m, ts);
        Object.assign(m, { activity: describeTool(d), activityFull: fullTool(d), activityAt: ts, kind: kindOf(d.toolName) });
        m.tools += 1;
        const b = brandOf(d); if (b) { m.brand = b; m.brandAt = ts; }
        break;
      }
      if (ev.agentId && s.agents.has(ev.agentId)) {
        const a = s.agents.get(ev.agentId);
        wake(a, ts);
        a.activity = describeTool(d); a.activityFull = fullTool(d); a.activityAt = ts; a.kind = kindOf(d.toolName); a.tools += 1;
        const b = brandOf(d); if (b) { a.brand = b; a.brandAt = ts; }
      }
      break;
    case 'session.task_complete': { // the agent declared its task done (its last message called task_complete, so turn_end alone can't tell)
      const summary = String(d.summary || '').trim();
      const t = !ev.agentId ? mainOf(s) : s.agents.get(ev.agentId);
      if (t && (t.startedAt || ev.agentId) && t.status === 'running') {
        t.status = 'idle'; t.endedAt = ts;
        if (summary) { t.said = clip(summary.replace(/[#*`>_]+/g, ''), 220); t.saidFull = clip(summary, 4000, true); }
      }
      break;
    }
    case 'assistant.turn_end': // a turn whose last message asked for no tools means the agent is done for now
      for (const [k, p] of s.pending) if (p.agentId === (ev.agentId || null)) s.pending.delete(k); // a finished turn can't still be waiting
      if (!ev.agentId) {
        const m = mainOf(s);
        if (m.status === 'running' && m.lastMsgTools === 0) { m.status = 'idle'; m.endedAt = ts; }
      } else if (s.agents.has(ev.agentId)) {
        const a = s.agents.get(ev.agentId);
        if (a.status === 'running' && a.lastMsgTools === 0) { a.status = 'idle'; a.endedAt = ts; }
      }
      break;
    case 'assistant.message':
      if (!ev.agentId) {
        const m = mainOf(s);
        wakeMain(m, ts);
        m.lastMsgTools = d.toolRequests?.length || 0;
        if (d.content?.trim()) { m.said = clip(d.content.replace(/[#*`>_]+/g, ''), 220); m.saidFull = clip(d.content, 4000, true); }
      } else if (s.agents.has(ev.agentId)) {
        const a = s.agents.get(ev.agentId);
        wake(a, ts);
        a.lastMsgTools = d.toolRequests?.length || 0;
        if (d.content?.trim()) {
          a.said = clip(d.content.replace(/[#*`>_]+/g, ''), 220); a.saidFull = clip(d.content, 4000, true); a.saidAt = ts;
        }
      }
      break;
  }
}

// read what was appended to a log since last time, as complete lines
function readNew(st, file) {
  const size = statSync(file).size;
  if (size < st.offset) { st.offset = 0; st.partial = ''; st.reset = true; }
  const lines = [];
  while (st.offset < size) {
    const len = Math.min(size - st.offset, 8 << 20);
    const buf = Buffer.alloc(len);
    const fd = openSync(file, 'r');
    readSync(fd, buf, 0, len, st.offset);
    closeSync(fd);
    st.offset += len;
    const parts = (st.partial + buf.toString('utf8')).split('\n');
    st.partial = parts.pop();
    lines.push(...parts);
  }
  return lines;
}

function pump(id, dir) {
  const file = join(dir, 'events.jsonl');
  let s = sessions.get(id);
  if (!s) {
    s = { offset: 0, partial: '', meta: readMeta(dir), agents: new Map(), calls: new Map(), alive: false, lastUserAt: 0, pending: new Map(), aic: 0, mainAic: 0, owner: new Map() };
    sessions.set(id, s);
  }
  const lines = readNew(s, file);
  if (s.reset) { s.reset = false; s.agents.clear(); }
  let changed = false;
  for (const line of lines) {
    // cheap prefilter: skip the huge reasoning/model snapshot lines
    if (line.startsWith('{"type":"tool.execution_complete"')) {
      const head = line.slice(0, 700), m = head.match(/"toolCallId":"([^"]+)"/);
      if (m) {
        const ok = head.match(/"success":(true|false)/);
        let msg, ts;
        if (ok?.[1] === 'false') try { const e = JSON.parse(line); msg = e.data?.error?.message; ts = Date.parse(e.timestamp) || undefined; } catch {}
        if (complete(s, m[1], ok ? ok[1] === 'true' : undefined, msg, ts)) changed = true;
      }
      continue;
    }
    if (!(line.startsWith('{"type":"subagent.') || line.startsWith('{"type":"user.message"') || line.startsWith('{"type":"system.notification"') ||
      line.startsWith('{"type":"permission.') || line.startsWith('{"type":"session.task_complete"') || line.startsWith('{"type":"session.usage_record"') || line.startsWith('{"type":"assistant.turn_end"') ||
      line.startsWith('{"type":"tool.execution_start"') || line.startsWith('{"type":"assistant.message"'))) continue;
    try { handle(s, JSON.parse(line)); changed = true; } catch {}
  }
  return changed;
}

// ---- Claude Code: <project>/<session>.jsonl, with sub-agents in <session>/subagents/agent-<id>.jsonl ----
function feedClaude(s, line, agentId, st) {
  let changed = false;
  let e;
  try { e = JSON.parse(line); } catch { return false; }
  if (e.cwd && !s.meta.cwd) s.meta.cwd = e.cwd;
  if (e.gitBranch && e.gitBranch !== 'HEAD') s.meta.branch = e.gitBranch;
  for (const ev of translate(e, agentId, st)) {
    if (ev.type === 'tool.execution_complete') {
      const d = ev.data;
      if (complete(s, d.toolCallId, d.success, d.error?.message, Date.parse(ev.timestamp) || undefined)) changed = true;
      continue;
    }
    try { handle(s, ev); changed = true; } catch {}
  }
  return changed;
}

function pumpClaude(id, file, subDir) {
  let s = sessions.get(id);
  if (!s) {
    s = { offset: 0, partial: '', meta: { name: '', cwd: '', branch: '' }, product: 'Claude Code', files: new Map(), agents: new Map(), calls: new Map(),
      alive: false, lastUserAt: 0, pending: new Map(), aic: 0, mainAic: 0, owner: new Map() };
    sessions.set(id, s);
  }
  let changed = false;
  const lines = readNew(s, file);
  if (s.reset) { s.reset = false; s.agents.clear(); s.files.clear(); }
  for (const l of lines) if (feedClaude(s, l, null, (s.cst ??= {}))) changed = true;
  let subs = [];
  try { subs = readdirSync(subDir).filter(f => /^agent-.+\.jsonl$/.test(f)); } catch {}
  for (const f of subs) {
    const agentId = f.slice(6, -6), sf = join(subDir, f);
    try {
      if (!s.files.has(agentId)) {
        if (Date.now() - statSync(sf).mtimeMs > MAX_AGE_MS) continue;
        let meta = {}; try { meta = JSON.parse(readFileSync(sf.replace(/\.jsonl$/, '.meta.json'), 'utf8')); } catch {}
        const first = readFileSync(sf, 'utf8').slice(0, 4000).match(/"timestamp":"([^"]+)"/)?.[1] || new Date().toISOString();
        s.files.set(agentId, { offset: 0, partial: '' });
        handle(s, { type: 'subagent.started', timestamp: first, agentId, data: { agentDisplayName: meta.agentType || 'agent', agentType: meta.agentType,
          agentDescription: meta.description || '', executionMode: meta.requestShape === 'background' ? 'background' : 'sync' } });
        changed = true;
      }
      const st = s.files.get(agentId);
      for (const l of readNew(st, sf)) if (feedClaude(s, l, agentId, st)) changed = true;
    } catch {}
  }
  return changed;
}

// Claude Code keeps a registry of its running sessions in ~/.claude/sessions/<pid>.json
function claudeLive() {
  const live = new Set();
  try {
    for (const f of readdirSync(join(CLAUDE_HOME, 'sessions'))) {
      if (!f.endsWith('.json')) continue;
      try {
        const r = JSON.parse(readFileSync(join(CLAUDE_HOME, 'sessions', f), 'utf8'));
        try { process.kill(r.pid, 0); live.add(r.sessionId); } catch (e) { if (e.code === 'EPERM') live.add(r.sessionId); }
      } catch {}
    }
  } catch {}
  return live;
}

function scanClaude(now) {
  let changed = false;
  let projects = [];
  try { projects = readdirSync(CLAUDE_ROOT); } catch { return false; }
  const live = claudeLive();
  for (const p of projects) {
    let files = [];
    try { files = readdirSync(join(CLAUDE_ROOT, p)).filter(f => f.endsWith('.jsonl')); } catch { continue; }
    for (const f of files) {
      const id = f.slice(0, -6), file = join(CLAUDE_ROOT, p, f);
      try {
        const st = statSync(file);
        if (now - st.mtimeMs > MAX_AGE_MS && !sessions.has(id)) continue;
        if (pumpClaude(id, file, join(CLAUDE_ROOT, p, id, 'subagents'))) changed = true;
        const s = sessions.get(id);
        const alive = live.has(id) || now - st.mtimeMs < 60e3;
        if (alive !== s.alive) { s.alive = alive; changed = true; }
      } catch {}
    }
  }
  return changed;
}

function scan() {
  let changed = false;
  loadLogos();
  let dirs = [];
  try { dirs = readdirSync(ROOT); } catch {}
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
  if (scanClaude(now)) changed = true;
  return changed;
}

function snapshot() {
  const now = Date.now();
  const agents = [];
  const usage = {};
  for (const [sid, s] of sessions) {
    const waits = s.alive ? [...s.pending.values()] : [];
    const waitCard = (id, name, type, items) => {
      const first = items[0];
      return { id, name, type, description: '', model: '', mode: 'sync', status: 'waiting', kind: 'ask', startedAt: first.ts, endedAt: null,
        activity: `${first.verb === 'question' ? 'asks:' : 'needs your approval:'} ${first.text}${items.length > 1 ? ` (+${items.length - 1} more)` : ''}`,
        activityFull: items.map(i => `${i.verb === 'question' ? 'Question' : 'Approval needed'}\n${i.detail}`).join('\n\n—\n\n'),
        activityAt: first.ts, tools: undefined, waitingSince: first.ts, aic: s.mainAic };
    };
    const mainWaits = waits.filter(p => !p.agentId);
    const m = s.main;
    const working = [...s.agents.values()].filter(a => a.status === 'running').length;
    const mainLive = s.alive && m && m.startedAt && (m.status === 'running' || working > 0 || now - (m.endedAt ?? m.activityAt) <= FADE_MS);
    if (mainLive || mainWaits.length) {
      const base = m || mainOf(s);
      const idle = base.status === 'idle';
      let card = { id: 'main', name: s.promptTitle || s.meta.name || s.product || 'Copilot', type: 'main agent', description: s.promptFull || '', model: '', mode: 'sync',
        status: base.status, kind: base.kind, startedAt: base.startedAt || now, endedAt: base.endedAt, activity: base.activity,
        activityFull: base.activityFull, said: base.said, saidFull: base.saidFull, activityAt: base.activityAt || now,
        tools: base.tools, aic: s.mainAic, effort: base.effort, brand: base.brand, brandAt: base.brandAt, worry: base.worry || 0, worryAt: base.worryAt || 0, lastError: base.lastError || '', fails: base.fails || 0,
        label: idle ? (working ? 'waiting on agents' : 'your turn') : undefined };
      if (s.promptFull && base.activityFull) card.activityFull = `${base.activityFull}\n\n— current prompt —\n${s.promptFull}`;
      if (idle && working) {
        card.activity = card.activityFull = `waiting on ${working} background agent${working > 1 ? 's' : ''} to finish`;
        card.said = card.saidFull = '';
      }
      if (mainWaits.length) card = { ...card, ...waitCard('main', card.name, 'main agent', mainWaits), tools: card.tools, effort: card.effort, label: undefined };
      agents.push({ ...card, session: sid.slice(0, 8), sessionName: s.meta.name, project: basename(s.meta.cwd || ''), branch: s.meta.branch });
    }
    for (const a of s.agents.values()) {
      const mine = waits.filter(p => p.agentId === a.id);
      if (mine.length) {
        agents.push({ ...a, ...waitCard(a.id, a.name, a.type, mine), description: a.description, model: a.model, mode: a.mode, tools: a.tools,
          session: sid.slice(0, 8), sessionName: s.meta.name, project: basename(s.meta.cwd || ''), branch: s.meta.branch });
        continue;
      }
      let status = a.status;
      if ((status === 'running' || status === 'idle') && !s.alive) status = 'lost';
      if (status !== 'running') {
        const end = a.endedAt ?? a.activityAt;
        if (end < s.lastUserAt) continue;                       // left over from a previous task
        if (now - end > FADE_MS) continue; // finished a while ago
      }
      agents.push({ ...a, status, asksParent: status === 'idle' && /\?\s*$/.test(a.saidFull || ''), session: sid.slice(0, 8), sessionName: s.meta.name,
        project: basename(s.meta.cwd || ''), branch: s.meta.branch });
    }
  }
  for (const a of agents) usage[a.session] ??= sessions.get([...sessions.keys()].find(k => k.startsWith(a.session))).aic;
  const rank = { waiting: 0, running: 1, idle: 2, failed: 3, done: 4, lost: 5 };
  // grouped by state, then in the order agents started, so cards only move when an agent changes state
  agents.sort((x, y) => rank[x.status] - rank[y.status] || x.startedAt - y.startedAt || (x.id < y.id ? -1 : 1));
  return { now, agents, logos: Object.fromEntries([...customLogos].map(([k, l]) => [k, `/logos/${encodeURIComponent(l.file)}?v=${l.v}`])), version: pkg.version, fadeMs: FADE_MS, aic: Object.values(usage).reduce((x, y) => x + y, 0), aicSessions: Object.keys(usage).length };
}

// ---- http ----
const clients = new Set();
const push = () => {
  const data = `data: ${JSON.stringify(snapshot())}\n\n`;
  for (const c of clients) c.write(data);
};

const asset = rel => {
  if (sea) { try { return Buffer.from(sea.getAsset(rel)); } catch { return null; } }
  const file = join(PUBLIC, rel);
  if (!file.startsWith(PUBLIC)) return null;
  try { return readFileSync(file); } catch { return null; }
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
  if (url.pathname.startsWith('/logos/')) {
    const f = decodeURIComponent(url.pathname.slice(7));
    if (![...customLogos.values()].some(l => l.file === f)) { res.writeHead(404); return res.end('not found'); }
    try { const img = readFileSync(join(LOGO_DIR, f)); res.writeHead(200, { 'content-type': IMG_MIME[extname(f).toLowerCase()], 'cache-control': 'max-age=60' }); return res.end(img); }
    catch { res.writeHead(404); return res.end('not found'); }
  }
  const body = asset(url.pathname === '/' ? 'index.html' : url.pathname.slice(1));
  if (!body) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[extname(url.pathname === '/' ? 'index.html' : url.pathname)] || 'application/octet-stream' });
  res.end(body);
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
try { mkdirSync(LOGO_DIR, { recursive: true }); } catch {}
server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}`;
  console.log(`🐾 pawsee watching ${ROOT}\n   and ${CLAUDE_ROOT}\n   your skill images: ${LOGO_DIR}\n   ${url}`);
  if (!existsSync(ROOT) && !existsSync(CLAUDE_ROOT)) console.log(`   (no Copilot CLI or Claude Code sessions found yet — start one and paws will appear)`);
  if (!opt['no-open']) openBrowser(url);
});

scan();
setInterval(() => { if (scan() || clients.size) push(); }, 1000);
