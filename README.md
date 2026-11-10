# 🐾 pawsee

Cute animated paws that show what your **GitHub Copilot CLI**, **Claude Code**, **Codex CLI** and **Gemini CLI** agents are doing.
One card per agent: a paw that acts out the work (browsing, coding, exploring, running commands…),
what it's doing right now, and what it just did.

![pawsee showing a grid of agents: a crowned main agent asking a question, working paws with thought bubbles and a finished one](docs/screenshot.jpg)
*The `?demo` page: sample agents in every state.*

pawsee only **reads** the session logs they already write: `~/.copilot/session-state` for Copilot CLI, `~/.claude/projects` for Claude Code,
`~/.codex/sessions` for Codex CLI and `~/.gemini/tmp` for Gemini CLI. Each tool gets its own toes: round beans for Copilot, claws for Claude Code,
blocky square toes for Codex and little sparkles for Gemini. (Point pawsee elsewhere with `--dir`, `--claude-dir`, `--codex-dir` and `--gemini-dir`.)

> **Gemini CLI support is experimental.** It was written from other tools' notes on the log format, not from a live Gemini session, and it
> doesn't read sub-agent files or the older single-file `session-*.json` logs. If your logs differ, pawsee shows its "can't make sense of some
> logs" banner. Please [open an issue](https://github.com/henskjold73/pawsee/issues) with what you see. Codex support was built against real logs.
> Codex and Gemini have no process registry, so a session counts as live while its log is being written, and the card can't jump to its terminal.
The page is served on `localhost` only, and none of your session data leaves your machine.
The one network request pawsee makes is a plain check of GitHub's "latest release" at start-up and every 6 hours, to show a small "update available" note (it sends nothing but a User-Agent of `pawsee-update-check`). Turn it off with `--no-update-check` or `PAWSEE_NO_UPDATE_CHECK=1`.

## Install

**macOS / Linux** — no Node needed:

```sh
curl -fsSL https://raw.githubusercontent.com/henskjold73/pawsee/main/install.sh | sh
```

**Windows** (PowerShell) — no Node needed:

```powershell
irm https://raw.githubusercontent.com/henskjold73/pawsee/main/install.ps1 | iex
```

Then run `pawsee`. It opens <http://localhost:4747> in your browser. Leave it open next to your terminal
and start a Copilot CLI session. The installers fetch the latest [release](https://github.com/henskjold73/pawsee/releases),
check its SHA-256 checksum, and put `pawsee` in `~/.local/bin` (macOS/Linux) or `%LOCALAPPDATA%\pawsee` (Windows).

**With Node 18+** (any OS) you can skip the download:

```sh
npx @horrible73/pawsee
# or install once (the command is still just `pawsee`):
npm install -g @horrible73/pawsee
```

(`npx github:henskjold73/pawsee` and `npm install -g github:henskjold73/pawsee` also work, straight from this repository.)

**Manual download:** grab the file for your system from the [releases page](https://github.com/henskjold73/pawsee/releases).
The binaries aren't code-signed, so a browser download will be flagged: on macOS run
`xattr -d com.apple.quarantine pawsee` once; on Windows choose *More info → Run anyway* in SmartScreen.
(The one-line installers above don't trigger either warning.)

### "pawsee" is not recognized / command not found

- **Windows, after the PowerShell installer:** the PATH change only reaches *new* terminals, and the latest installer also updates the
  window you ran it in. If you installed with an older copy, open a new PowerShell window, or run it by its full path:
  `& "$env:LOCALAPPDATA\pawsee\pawsee.exe"`. `where.exe pawsee` shows whether Windows can find it.
- **Windows, after `npm install -g`:** the folder printed by `npm prefix -g` (usually `%APPDATA%\npm`) has to be on your PATH. If it
  already is, the terminal you're in probably started before that was true (Node installed or PATH edited after it opened). Refresh
  this window from the registry instead of restarting it:
  `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`
- **No restart at all on Windows:** the PowerShell installer above updates the window it runs in, and `npx -y @horrible73/pawsee`
  never needs PATH.
- **macOS / Linux:** the installer puts `pawsee` in `~/.local/bin`, which isn't on PATH by default. Add
  `export PATH="$HOME/.local/bin:$PATH"` to `~/.zshrc` (or `~/.bashrc`) and open a new terminal, or run `~/.local/bin/pawsee` directly.

### Options

| Flag | Meaning |
|---|---|
| `-p, --port <n>` | port to serve on (default `4747`, or `$PORT`) |
| `--dir <path>` | Copilot `session-state` folder (default `~/.copilot/session-state`) |
| `--claude-dir <path>` | Claude Code `projects` folder (default `~/.claude/projects`, or `$CLAUDE_CONFIG_DIR/projects`) |
| `--no-open` | don't open the browser |
| `--no-update-check` | don't ask GitHub whether a newer version exists |

## What you'll see

| Paw | Meaning |
|---|---|
| needs you (amber) | the main agent asked you a question, or an agent is waiting for your approval |
| working, with a badge | an agent is running; the badge shows what kind of work |
| napping | an agent finished its turn and is waiting for a new message |
| done | finished; done and napping cards fade away after ~4 minutes (`PAWSEE_FADE_SECONDS`) |
| failed | the agent errored |
| grey | its session ended while it was still running |

Paws have moods too: sleepy-eyed just after napping off and deeply asleep (slow breathing, extra z's) after two minutes, and dizzy (spiral eyes, circling stars) after lots of failed attempts in a row.
When an agent that was running finishes, its paw does a happy hop with confetti; when it fails, it flops over.
Sounds are off by default: click the "Sound off" button next to the version to switch on a soft chime when something needs you and another when the last working agent finishes (made in the browser, no audio files). They are off again every time you refresh the page.
While the tab is in the background, the tab icon gets an amber count when something needs you (and the title flashes), or a green tick when work finished while you were away.

Claude Code agents get claws on their toes, so you can tell them from Copilot CLI's paws at a glance.

Each card also shows the AI credits (AIC) that agent has used, and the header shows the session total (Copilot CLI only: Claude Code doesn't log credits).
Claude Code has no approval prompts in its logs, so "needs you" appears there for `AskUserQuestion` only.
Agents left over from before your latest prompt in a session are hidden, so the page only shows the current task.
Add `?demo` to the URL to preview every state with sample data.

## Your own skill images

pawsee creates a folder at `~/.pawsee/logos` (change it with `--logos <path>` or `$PAWSEE_LOGOS`). Drop an image in it named after a skill,
for example `nx.png`, `my-deploy-skill.svg` or `ado.webp` (png, jpg, webp, gif or svg). When an agent uses that skill, the image appears in
its thought bubble. Names are matched case-insensitively with dashes for anything else, and `plugin:skill` also matches `skill`.
The same name also matches an MCP tool prefix (`github-…`) or a command (`terraform`), and your image wins over the built-in logos.
New files are picked up without restarting. Square images with a transparent or white background look best.

## Development

```bash
npm test   # unit tests plus end-to-end tests that run the server against fake Copilot and Claude Code logs
```

## Notes

- If a log format changes under it, pawsee shows a red notice at the top ("can't make sense of some logs") instead of quietly showing fewer agents. It appears when a session has lines that won't parse, or a long session where nothing was recognised. Please [open an issue](https://github.com/henskjold73/pawsee/issues) with the CLI version you use.
- It relies on the internal log formats of Copilot CLI (tested with 1.0.105) and Claude Code (tested with 2.1.309), which could change in an update.
- Built for macOS, Windows and Linux by CI; only macOS has been tried by hand so far — issues welcome.

## Credits

The tool logos in the "thinking" bubble are the real ones, taken from [simple-icons](https://simpleicons.org) (CC0-1.0:
Git, GitHub, Nx, npm, .NET, Docker, SonarQube Cloud, Node.js, TypeScript, Python, Vitest, ESLint, Prettier, Firebase, Vercel, Netlify, Supabase, Prisma, Expo, Next.js, Vite, Tailwind CSS, Storybook, Cloudflare, Turborepo, Angular, React, Vue, Svelte, Astro, Bun, Deno) and
[devicon](https://devicon.dev) (MIT: Azure DevOps, Azure, Visual Studio Code, Playwright). The marks remain trademarks of their respective owners and are shown only to identify the tool an agent is using.

## License

MIT
