import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { start, copilotSession, claudeSession } from './harness.mjs';

let h;
before(async () => { h = await start(); });
after(() => h.stop());

const card = (agents, session, id) => agents.find(a => a.session === session.slice(0, 8) && a.id === id);
const main = (agents, session) => card(agents, session, 'main');

test('Copilot: a prompt starts the main agent, a finished turn makes it idle', async () => {
  const s = copilotSession(h, 'aaaaaaaa-1111');
  s.prompt('Add dark mode to the settings page');
  let m = (await h.until(a => main(a, 'aaaaaaaa-1111') && a, 'main card')).find(a => a.id === 'main' && a.session === 'aaaaaaaa');
  assert.equal(m.status, 'running');
  assert.equal(m.type, 'main agent');
  assert.equal(m.name, 'Add dark mode to the settings page');
  assert.equal(m.source, 'copilot');
  s.tool('bash', { command: 'git status' });
  m = await h.until(a => { const c = main(a, 'aaaaaaaa-1111'); return c?.kind === 'shell' && c; }, 'shell kind');
  assert.equal(m.brand, 'git'); // git is a known logo
  s.say('All done.', []);
  s.endTurn();
  m = await h.until(a => { const c = main(a, 'aaaaaaaa-1111'); return c?.status === 'idle' && c; }, 'idle after turn end');
  assert.equal(m.said, 'All done.');
});

test('Copilot: failed tool calls pile up crosses, a success calms down, a new prompt clears them', async () => {
  const s = copilotSession(h, 'bbbbbbbb-2222');
  s.prompt('Run the tests');
  for (let i = 0; i < 2; i++) s.result(s.tool('bash', { command: 'npm test' }), false);
  let m = await h.until(a => main(a, 'bbbbbbbb-2222')?.fails === 2 && main(a, 'bbbbbbbb-2222'), 'two failures');
  assert.equal(m.worry, 2);
  assert.match(m.lastError, /it broke/);
  s.result(s.tool('bash', { command: 'npm test' }), true);
  m = await h.until(a => main(a, 'bbbbbbbb-2222')?.worry === 0 && main(a, 'bbbbbbbb-2222'), 'calmed down');
  assert.equal(m.fails, 2); // the crosses stay for the task
  s.prompt('Try again with the other config');
  m = await h.until(a => main(a, 'bbbbbbbb-2222')?.fails === 0 && main(a, 'bbbbbbbb-2222'), 'cleared by new prompt');
  assert.equal(m.worry, 0);
});

test('Copilot: task_complete makes the main agent idle', async () => {
  const s = copilotSession(h, 'cccccccc-3333');
  s.prompt('Ship it');
  s.tool('bash', { command: 'ls' });
  s.put('session.task_complete', { summary: 'Shipped.' });
  const m = await h.until(a => main(a, 'cccccccc-3333')?.status === 'idle' && main(a, 'cccccccc-3333'), 'idle');
  assert.equal(m.said, 'Shipped.');
});

test('Copilot: a sub-agent runs, is done when completed, and wakes up when resumed', async () => {
  const s = copilotSession(h, 'dddddddd-4444');
  s.prompt('Explore the repo');
  s.put('subagent.started', { agentName: 'explore', agentDisplayName: 'repo-scan', agentDescription: 'Look around', toolCallId: 'x1' }, 'sub1');
  s.tool('rg', { pattern: 'TODO' }, 'c1', 'sub1');
  let a = await h.until(x => card(x, 'dddddddd-4444', 'sub1') && card(x, 'dddddddd-4444', 'sub1'), 'sub-agent');
  assert.deepEqual([a.status, a.kind, a.name], ['running', 'explore', 'repo-scan']);
  s.put('subagent.completed', { totalToolCalls: 3, totalTokens: 900 }, 'sub1');
  a = await h.until(x => card(x, 'dddddddd-4444', 'sub1')?.status === 'done' && card(x, 'dddddddd-4444', 'sub1'), 'done');
  assert.equal(a.tools, 3);
  s.put('user.message', { content: 'also check the docs' }, 'sub1'); // write_agent resumes it
  a = await h.until(x => card(x, 'dddddddd-4444', 'sub1')?.status === 'running' && card(x, 'dddddddd-4444', 'sub1'), 'running again');
  assert.match(a.activity, /also check the docs/);
});

test('Copilot: sub-agents from before the latest prompt are hidden', async () => {
  const s = copilotSession(h, 'eeeeeeee-5555');
  s.prompt('first task');
  s.put('subagent.started', { agentName: 'task', agentDisplayName: 'old-one' }, 'old');
  s.put('subagent.completed', {}, 'old');
  await h.until(x => card(x, 'eeeeeeee-5555', 'old'), 'old sub-agent visible during its task');
  s.prompt('a brand new task');
  await h.until(x => main(x, 'eeeeeeee-5555') && !card(x, 'eeeeeeee-5555', 'old'), 'old sub-agent hidden');
});

test('Copilot: a question for the person makes a "needs you" card until it is answered', async () => {
  const s = copilotSession(h, 'ffffffff-6666');
  s.prompt('Set things up');
  s.tool('ask_user', { message: 'Public or private?' }, 'ask1');
  let m = await h.until(a => main(a, 'ffffffff-6666')?.status === 'waiting' && main(a, 'ffffffff-6666'), 'waiting');
  assert.match(m.activity, /Public or private\?/);
  s.result('ask1', true);
  m = await h.until(a => main(a, 'ffffffff-6666')?.status !== 'waiting' && main(a, 'ffffffff-6666'), 'answered');
});

test('Copilot: a session whose process is gone shows its running agents as lost', async () => {
  const s = copilotSession(h, '99999999-7777');
  s.prompt('x');
  s.put('subagent.started', { agentName: 'task', agentDisplayName: 'orphan' }, 'o1');
  await h.until(x => card(x, '99999999-7777', 'o1')?.status === 'running', 'running');
  const { unlinkSync } = await import('node:fs');
  unlinkSync(join(h.copilot, '99999999-7777', `inuse.${process.pid}.lock`));
  await h.until(x => card(x, '99999999-7777', 'o1')?.status === 'lost', 'lost');
});

test('Claude Code: prompt, tool, finished turn', async () => {
  const s = claudeSession(h, '11111111-aaaa');
  s.prompt('Can we add a settings page?');
  let m = await h.until(a => main(a, '11111111-aaaa') && main(a, '11111111-aaaa'), 'main card');
  assert.equal(m.status, 'running');
  assert.equal(m.name, 'Can we add a settings page?');
  assert.equal(m.project, 'demo');
  assert.equal(m.source, 'claude'); // drawn with claws
  const call = s.tool('Bash', { command: 'git log', description: 'History' });
  m = await h.until(a => main(a, '11111111-aaaa')?.kind === 'shell' && main(a, '11111111-aaaa'), 'shell');
  assert.equal(m.brand, 'git');
  s.result(call);
  s.say('Here you go.');
  m = await h.until(a => main(a, '11111111-aaaa')?.status === 'idle' && main(a, '11111111-aaaa'), 'idle after end_turn');
  assert.equal(m.said, 'Here you go.');
});

test('Claude Code: Esc leaves the main agent idle, not working', async () => {
  const s = claudeSession(h, '22222222-bbbb');
  s.prompt('Do a long thing');
  s.tool('Bash', { command: 'sleep 100' });
  await h.until(a => main(a, '22222222-bbbb')?.status === 'running', 'running');
  s.interrupt();
  await h.until(a => main(a, '22222222-bbbb')?.status === 'idle', 'idle after interrupt');
});

test('Claude Code: command output and notifications do not start a task', async () => {
  const s = claudeSession(h, '33333333-cccc');
  s.prompt('real prompt');
  s.say('ok');
  await h.until(a => main(a, '33333333-cccc')?.status === 'idle', 'idle');
  s.prompt('<task-notification>build finished</task-notification>');
  s.prompt('<ci-monitor-event>checks passed</ci-monitor-event>');
  await new Promise(r => setTimeout(r, 2500));
  s.touch();
  assert.equal(main((await h.api()).agents, '33333333-cccc').status, 'idle');
});

test('Claude Code: failures count up and a new prompt clears them', async () => {
  const s = claudeSession(h, '44444444-dddd');
  s.prompt('Build it');
  s.result(s.tool('Bash', { command: 'make' }), true);
  s.result(s.tool('Bash', { command: 'make' }), true);
  await h.until(a => main(a, '44444444-dddd')?.fails === 2, 'two failures');
  s.prompt('ok, try something else');
  await h.until(a => main(a, '44444444-dddd')?.fails === 0, 'cleared');
});

test('Claude Code: a sub-agent is running until its hand-back, then done', async () => {
  const s = claudeSession(h, '55555555-eeee');
  s.prompt('Research this');
  s.tool('Agent', { description: 'research', prompt: 'go' });
  const sub = s.agent('abc123', { type: 'web-fetch', description: 'Read the docs' });
  sub.prompt('Fetch https://example.com');
  sub.tool('WebFetch', { url: 'https://example.com/page' });
  let a = await h.until(x => card(x, '55555555-eeee', 'abc123') && card(x, '55555555-eeee', 'abc123'), 'sub-agent');
  assert.deepEqual([a.status, a.kind, a.type, a.description], ['running', 'web', 'web-fetch', 'Read the docs']);
  assert.match(a.activity, /example\.com\/page/);
  sub.handBack('Found it: the answer is 42.');
  a = await h.until(x => card(x, '55555555-eeee', 'abc123')?.status === 'done' && card(x, '55555555-eeee', 'abc123'), 'done after hand-back');
  assert.match(a.said, /answer is 42/);
});

test('your own skill images show up for the skill, the same name as a built-in wins', async () => {
  writeFileSync(join(h.logos, 'my-deploy.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  writeFileSync(join(h.logos, 'git.png'), 'not really a png');
  writeFileSync(join(h.logos, 'notes.txt'), 'ignored');
  const s = claudeSession(h, '66666666-ffff');
  s.prompt('Deploy');
  s.tool('Skill', { skill: 'my-deploy' });
  let m = await h.until(a => main(a, '66666666-ffff')?.brand && main(a, '66666666-ffff'), 'brand');
  assert.equal(m.brand, 'custom:my-deploy');
  const snap = await h.api();
  assert.match(snap.logos['my-deploy'], /^\/logos\/my-deploy\.svg/);
  assert.equal(snap.logos.notes, undefined);
  s.tool('Skill', { skill: 'some-plugin:my-deploy' }); // plugin:skill also matches
  s.tool('Bash', { command: 'cd x && git status' });
  m = await h.until(a => main(a, '66666666-ffff')?.brand === 'custom:git' && main(a, '66666666-ffff'), 'custom image beats the built-in git logo');
  const res = await fetch(`http://127.0.0.1:${h.port}${snap.logos['my-deploy']}`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'image/svg+xml');
  assert.equal((await fetch(`http://127.0.0.1:${h.port}/logos/notes.txt`)).status, 404);
  assert.equal((await fetch(`http://127.0.0.1:${h.port}/logos/..%2Fserver.mjs`)).status, 404);
});

test('an agent lists the icons it used, in order of first use, once per icon, and a new task starts a fresh list', async () => {
  const s = copilotSession(h, '77777777-9999');
  s.prompt('Check the repo');
  s.tool('bash', { command: 'docker ps' });
  s.tool('bash', { command: 'ls' });
  s.tool('bash', { command: 'docker logs x' });
  s.tool('skill', { skill: 'nx-workspace' });
  s.tool('skill', { skill: 'my-own-skill' });
  s.tool('view', { path: '/tmp/a' });
  let m = await h.until(a => main(a, '77777777-9999')?.tools >= 6 && main(a, '77777777-9999'), 'icons used');
  assert.deepEqual(m.used, ['docker', 'shell', 'nx', 'skill', 'explore']);
  s.endTurn();
  s.prompt('Something else');
  m = await h.until(a => main(a, '77777777-9999')?.used?.length === 0 && main(a, '77777777-9999'), 'fresh list');
  assert.deepEqual(m.used, []);
});

test('npx / dlx / exec commands show the logo of the tool they run', async () => {
  const s = copilotSession(h, '0a1b2c3d-5e6f');
  const cases = [['npx firebase deploy --only hosting', 'firebase'], ['npx -y firebase-tools@latest login', 'firebase'], ['pnpm dlx vercel --prod', 'vercel'],
    ['npx @angular/cli@17 new app', 'angular'], ['bunx supabase start', 'supabase'], ['npx some-unknown-cli --help', 'npm'], ['firebase emulators:start', 'firebase']];
  s.prompt('use some clis');
  await h.until(a => main(a, '0a1b2c3d-5e6f') && a, 'main card');
  for (const [command, brand] of cases) {
    s.tool('bash', { command });
    await h.until(a => main(a, '0a1b2c3d-5e6f')?.brand === brand && a, `${command} -> ${brand}`);
  }
});
