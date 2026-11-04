# 🐾 pawsee

Cute animated paws that show what your **GitHub Copilot CLI** background agents are doing.
One card per agent: a paw that acts out the work (browsing, coding, exploring, running commands…),
what it's doing right now, and what it just did.

pawsee only **reads** the session logs Copilot CLI already writes to `~/.copilot/session-state`.
Nothing leaves your machine — the page is served on `localhost` only.

## Install

You need [Node.js](https://nodejs.org) 18 or newer. Then, on **macOS, Windows or Linux**:

```sh
npx github:henskjold73/pawsee
```

Or install it once and run `pawsee` any time:

```sh
npm install -g github:henskjold73/pawsee
pawsee
```

It opens <http://localhost:4747> in your browser. Leave it open next to your terminal and start
a Copilot CLI session.

### Options

| Flag | Meaning |
|---|---|
| `-p, --port <n>` | port to serve on (default `4747`, or `$PORT`) |
| `--dir <path>` | Copilot `session-state` folder (default `~/.copilot/session-state`) |
| `--no-open` | don't open the browser |

## What you'll see

| Paw | Meaning |
|---|---|
| working, with a badge | an agent is running; the badge shows what kind of work |
| napping | a background agent finished its turn and is waiting |
| done | finished; fades away after ~4 minutes (`PAWSEE_FADE_SECONDS`) |
| failed | the agent errored |
| grey | its Copilot session ended while it was still running |

Agents left over from before your latest prompt in a session are hidden, so the page only shows the current task.
Add `?demo` to the URL to preview every state with sample data.

## Notes

- It relies on Copilot CLI's internal log format (tested with 1.0.105), which could change in an update.
- Not yet tested on Windows or Linux — issues welcome.

## License

MIT
