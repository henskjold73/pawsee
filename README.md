# 🐾 pawsee

Cute animated paws that show what your **GitHub Copilot CLI** background agents are doing.
One card per agent: a paw that acts out the work (browsing, coding, exploring, running commands…),
what it's doing right now, and what it just did.

pawsee only **reads** the session logs Copilot CLI already writes to `~/.copilot/session-state`.
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

### Options

| Flag | Meaning |
|---|---|
| `-p, --port <n>` | port to serve on (default `4747`, or `$PORT`) |
| `--dir <path>` | Copilot `session-state` folder (default `~/.copilot/session-state`) |
| `--no-open` | don't open the browser |

## What you'll see

| Paw | Meaning |
|---|---|
| needs you (amber) | the main agent asked you a question, or an agent is waiting for your approval |
| working, with a badge | an agent is running; the badge shows what kind of work |
| napping | an agent finished its turn and is waiting for a new message |
| done | finished; done and napping cards fade away after ~4 minutes (`PAWSEE_FADE_SECONDS`) |
| failed | the agent errored |
| grey | its Copilot session ended while it was still running |

Each card also shows the AI credits (AIC) that agent has used, and the header shows the session total.
Agents left over from before your latest prompt in a session are hidden, so the page only shows the current task.
Add `?demo` to the URL to preview every state with sample data.

## Notes

- It relies on Copilot CLI's internal log format (tested with 1.0.105), which could change in an update.
- Built for macOS, Windows and Linux by CI; only macOS has been tried by hand so far — issues welcome.

## License

MIT
