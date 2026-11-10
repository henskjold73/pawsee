// Starts a real pawsee server against throwaway log folders, so tests can write log lines and read the cards back.
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, appendFileSync, rmSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';

const freePort = () => new Promise(res => { const s = createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
export const sleep = ms => new Promise(r => setTimeout(r, ms));
const server = join(import.meta.dirname, '..', 'server.mjs');

export async function start(extraEnv = {}) {
  const root = mkdtempSync(join(tmpdir(), 'pawsee-test-'));
  const copilot = join(root, 'copilot'), claude = join(root, 'claude'), logos = join(root, 'logos'), codex = join(root, 'codex'), gemini = join(root, 'gemini');
  for (const d of [copilot, claude, logos, codex, gemini]) mkdirSync(d);
  const port = await freePort();
  const proc = spawn(process.execPath, [server, '--no-open', '-p', String(port), '--dir', copilot, '--claude-dir', claude, '--codex-dir', codex, '--gemini-dir', gemini, '--logos', logos],
    { stdio: 'ignore', env: { ...process.env, CLAUDE_CONFIG_DIR: join(root, 'claude-home'), PAWSEE_NO_UPDATE_CHECK: '1', ...extraEnv } }); // never ask GitHub from a test
  const api = async () => (await fetch(`http://127.0.0.1:${port}/api/agents`)).json();
  for (let i = 0; i < 50; i++) { try { await api(); break; } catch { await sleep(100); } }
  const h = {
    root, copilot, claude, codex, gemini, logos, port, api,
    // wait until the cards satisfy `ok`, polling (the server rescans every second)
    async until(ok, what = 'cards', ms = 6000) {
      const end = Date.now() + ms; let snap;
      while (Date.now() < end) { snap = await api(); const r = ok(snap.agents, snap); if (r) return r === true ? snap.agents : r; await sleep(150); }
      throw new Error(`timed out waiting for ${what}; cards: ${JSON.stringify(snap.agents.map(a => [a.id, a.type, a.status, a.fails]))}`);
    },
    stop() { proc.kill(); rmSync(root, { recursive: true, force: true }); },
  };
  return h;
}

let clock = Date.now() - 60e3;
export const ts = () => new Date(clock += 100).toISOString(); // strictly increasing, in the recent past

// ---- Copilot CLI: <root>/<session>/events.jsonl, alive while a lock file holds a running pid ----
export function copilotSession(h, id) {
  const dir = join(h.copilot, id); mkdirSync(dir);
  writeFileSync(join(dir, `inuse.${process.pid}.lock`), '');
  const file = join(dir, 'events.jsonl'); writeFileSync(file, '');
  const put = (type, data = {}, agentId) => appendFileSync(file, JSON.stringify({ type, data, ...(agentId ? { agentId } : {}), timestamp: ts() }) + '\n');
  return { put,
    prompt: text => put('user.message', { content: text }),
    tool: (name, args = {}, callId = 'c' + Math.random(), agentId) => { put('tool.execution_start', { toolCallId: callId, toolName: name, arguments: args }, agentId); return callId; },
    result: (callId, success = true, agentId) => put('tool.execution_complete', { toolCallId: callId, success, ...(success ? {} : { error: { message: 'it broke' } }) }, agentId),
    say: (content, toolRequests = [], agentId) => put('assistant.message', { content, toolRequests }, agentId),
    endTurn: agentId => put('assistant.turn_end', {}, agentId) };
}

// ---- Claude Code: <root>/<project>/<session>.jsonl (+ <session>/subagents/agent-<id>.jsonl); alive while recently written ----
export function claudeSession(h, id, project = 'proj') {
  const dir = join(h.claude, project); mkdirSync(dir, { recursive: true });
  const file = join(dir, `${id}.jsonl`); writeFileSync(file, '');
  const line = (f, o) => appendFileSync(f, JSON.stringify({ timestamp: ts(), cwd: '/work/demo', sessionId: id, ...o }) + '\n');
  const sub = agentId => { // a sub-agent's own file
    const sd = join(dir, id, 'subagents'); mkdirSync(sd, { recursive: true });
    return { sd, file: join(sd, `agent-${agentId}.jsonl`) };
  };
  return {
    prompt: text => line(file, { type: 'user', message: { role: 'user', content: text } }),
    tool: (name, input = {}, callId = 'toolu_' + Math.random()) => { line(file, { type: 'assistant', message: { role: 'assistant', stop_reason: 'tool_use', content: [{ type: 'tool_use', id: callId, name, input }] } }); return callId; },
    result: (callId, isError = false) => line(file, { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: callId, is_error: isError, content: isError ? 'boom' : 'ok' }] } }),
    say: (text, stop = 'end_turn') => line(file, { type: 'assistant', message: { role: 'assistant', stop_reason: stop, content: [{ type: 'text', text }] } }),
    interrupt: () => line(file, { type: 'user', message: { role: 'user', content: [{ type: 'text', text: '[Request interrupted by user]' }] } }),
    touch: () => utimesSync(file, new Date(), new Date()),
    agent(agentId, { type = 'explore', description = 'look around' } = {}) {
      const { sd, file: f } = sub(agentId);
      writeFileSync(join(sd, `agent-${agentId}.meta.json`), JSON.stringify({ agentType: type, description }));
      writeFileSync(f, '');
      return {
        prompt: text => line(f, { type: 'user', agentId, isSidechain: true, message: { role: 'user', content: text } }),
        tool: (name, input = {}) => line(f, { type: 'assistant', agentId, message: { role: 'assistant', stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 'toolu_' + Math.random(), name, input }] } }),
        handBack: message => line(f, { type: 'assistant', agentId, message: { role: 'assistant', stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 'toolu_h', name: 'SubagentHandback', input: { message } }] } }),
      };
    },
  };
}

// ---- Codex CLI: <root>/YYYY/MM/DD/rollout-<time>-<uuid>.jsonl; alive while the file is being written ----
export function codexSession(h, tail = 'a1b2c3d4e5f6') {
  const day = new Date().toISOString().slice(0, 10).split('-');
  const dir = join(h.codex, ...day); mkdirSync(dir, { recursive: true });
  const file = join(dir, `rollout-${day.join('-')}T10-00-00-019e0000-0000-7000-8000-${tail}.jsonl`); writeFileSync(file, '');
  const put = (type, payload) => appendFileSync(file, JSON.stringify({ timestamp: ts(), type, payload }) + '\n');
  return { file, key: 'cx' + tail.slice(-6), put,
    meta: (cwd = '/work/demo', branch = 'main') => put('session_meta', { id: 'x', cwd, git: { branch } }),
    prompt: text => put('event_msg', { type: 'user_message', message: text }),
    exec: (cmd, callId = 'call_' + Math.random()) => { put('response_item', { type: 'function_call', name: 'exec_command', arguments: JSON.stringify({ cmd }), call_id: callId }); return callId; },
    out: (callId, output = 'Process exited with code 0\nOutput:\nok') => put('response_item', { type: 'function_call_output', call_id: callId, output }),
    say: message => put('event_msg', { type: 'agent_message', message, phase: 'commentary' }),
    done: last => put('event_msg', { type: 'task_complete', last_agent_message: last }),
    tokens: (input, cached, output, total) => put('event_msg', { type: 'token_count', info: { last_token_usage: { input_tokens: input, cached_input_tokens: cached, output_tokens: output }, total_token_usage: { total_tokens: total } } }),
    touch: () => utimesSync(file, new Date(), new Date()) };
}

// ---- Gemini CLI: <root>/<project>/chats/session-<time>-<id8>.jsonl (+ <project>/.project_root) ----
export function geminiSession(h, id8 = '0a1b2c3d', project = 'demo') {
  const dir = join(h.gemini, project, 'chats'); mkdirSync(dir, { recursive: true });
  writeFileSync(join(h.gemini, project, '.project_root'), '/work/demo');
  const file = join(dir, `session-2026-09-05T09-00-${id8}.jsonl`);
  writeFileSync(file, JSON.stringify({ sessionId: `${id8}-0000-4000-8000-000000000001`, projectHash: 'abc', startTime: new Date().toISOString(), kind: 'main' }) + '\n');
  const put = o => appendFileSync(file, JSON.stringify({ timestamp: ts(), ...o }) + '\n');
  return { file, key: 'gm' + id8.slice(0, 6), put,
    prompt: (text, id = 'u' + Math.random()) => put({ id, type: 'user', content: [{ text }] }),
    reply: (id, content, extra = {}) => put({ id, type: 'gemini', content, model: 'gemini-2.5-pro', ...extra }),
    touch: () => utimesSync(file, new Date(), new Date()) };
}
