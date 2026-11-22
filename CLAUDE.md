# pawsee

A localhost dashboard of animated characters showing what Copilot CLI, Claude Code, Codex CLI and Gemini CLI agents are doing. It only reads their session logs. Plain Node ESM (`.mjs`), no framework, no lint config. Node 18+ (CI uses 22).

## Layout
- `server.mjs`: HTTP server plus log scanning. `claude.mjs`, `codex.mjs`, `gemini.mjs` translate each tool's logs into events.
- `title.mjs`, `health.mjs`, `focus.mjs`, `history.mjs`, `meter.mjs`, `update.mjs`: pure helper modules.
- `public/`: browser side (faces, styles, meter, mood). New source files must also be added to `files` in package.json, or they won't ship.

## Running and testing
- `npm run dev` serves on port 4748 with watch mode (it's the `dev` entry in `.claude/launch.json`). Port 4747 is kept free for a normal `pawsee` run.
- `npm test` runs `node --test` over `tests/*.test.mjs`. A focused run is `node --test tests/<name>.test.mjs`.
- Server tests use `tests/harness.mjs` `start()`. It spawns `server.mjs` on a free 127.0.0.1 port and writes temp dirs under the OS tmpdir, then `stop()` cleans them up. This is safe to run without asking.
- `npm run mutate` runs Stryker on the pure modules. It's slow and writes `reports/mutation.html`. Run it only when asked. Its test command lists specific test files, so a new test file covering a mutated module must be added there too.

## Workflow
- Work on a branch and open a PR against `main`. CI (`.github/workflows/test.yml`) runs `npm test` on Ubuntu, macOS and Windows.
- Releases come from `v*` tags (`release.yml` builds the single-file binaries via `scripts/build-binary.mjs`).
