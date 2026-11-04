# 🐾 pawsee

Cute animated paws that show what your **GitHub Copilot CLI** and **Claude Code** background agents are doing.
One card per agent: a paw that acts out the work (browsing, coding, exploring, running commands…),
what it's doing right now, and what it just did.

pawsee only **reads** the session logs they already write: `~/.copilot/session-state` for Copilot CLI and `~/.claude/projects` for Claude Code.
Nothing leaves your machine — the page is served on `localhost` only.

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
npx github:henskjold73/pawsee
# or install once:
npm install -g github:henskjold73/pawsee
```

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
- **No restart at all on Windows:** the PowerShell installer above updates the window it runs in, and `npx -y github:henskjold73/pawsee`
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

## What you'll see

| Paw | Meaning |
|---|---|
| needs you (amber) | the main agent asked you a question, or an agent is waiting for your approval |
| working, with a badge | an agent is running; the badge shows what kind of work |
| napping | an agent finished its turn and is waiting for a new message |
| done | finished; done and napping cards fade away after ~4 minutes (`PAWSEE_FADE_SECONDS`) |
| failed | the agent errored |
| grey | its session ended while it was still running |

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

## Notes

- It relies on the internal log formats of Copilot CLI (tested with 1.0.105) and Claude Code (tested with 2.1.309), which could change in an update.
- Built for macOS, Windows and Linux by CI; only macOS has been tried by hand so far — issues welcome.

## Credits

The tool logos in the "thinking" bubble are the real ones, taken from [simple-icons](https://simpleicons.org) (CC0-1.0:
Git, GitHub, Nx, npm, .NET, Docker, SonarQube Cloud, Node.js, TypeScript, Python, Vitest, ESLint, Prettier) and
[devicon](https://devicon.dev) (MIT: Azure DevOps, Azure, Visual Studio Code, Playwright). The marks remain trademarks of their respective owners and are shown only to identify the tool an agent is using.

## License

MIT
