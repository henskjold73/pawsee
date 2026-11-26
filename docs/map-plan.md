# Map view: plan

In this view, agents walk around a map drawn in the current face style. Each **domain** of the codebase (an Nx lib, a .NET project, a React page or feature, a Python package) is a place on the map. Agents travel to the domain they're working in. The first style to get a map is **Tiki**: domains are islands, and the base is a central island.

A header button switches between **Map** and **Cards**. A style without a map uses the cards, so nothing breaks.

## What already exists

- Every translator (`claude.mjs`, `codex.mjs`, `gemini.mjs`, and Copilot's own logs) normalizes file tools to `arguments.path`, so the server sees one field for all four CLIs.
- `kindOf()` in `server.mjs` already sorts each tool call into `code`, `explore`, `web`, `shell`, `ask` or `think`. That's enough to decide where on the map an agent belongs.
- Cards already carry `project` (the base name of `cwd`), `branch`, `session`, `status` and `kind`.
- `agentSvg()` in `public/app.js` draws the animated paw (walk, run, squat and jump all come from CSS classes). The map reuses it at a smaller size.
- `public/history.js` already switches the Live and Recent views by showing or hiding `#grid`. The map is a third box next to `#grid`, used only in Live.

## Slice 1: domains on the server

**New file: `domain.mjs`**, a pure helper like `title.mjs`.

```js
// domainOf(file, root, fs) -> { eco, domain, building } | null
// fs = { exists(path), read(path) } so tests can pass a fake tree
```

How a domain is resolved: walk up from the file's folder toward `root` (the session's `cwd`), and the first marker found decides the ecosystem:

| Marker | eco | domain | building |
|---|---|---|---|
| `project.json` under an `nx.json` root | `nx` | `scope:<x>` tag in `project.json` if present, otherwise the first folder under `libs/` or `apps/` | the lib folder name (`data-access`, `feature-shell`, …) |
| `*.csproj` | `dotnet` | the project name with the shared solution prefix (the dotted segments shared with the `.sln` name or the other `.csproj` files) and a known layer suffix (`Api`, `Domain`, `Application`, `Infrastructure`, `Web`, `Tests`, `Contracts`) removed | the removed suffix, or `core` |
| `package.json` with `react` / `next` | `react` | the first folder under `src/pages`, `src/features`, `src/modules`, `src/routes`, `app/` or `pages/` | the next folder down, or the file's base name |
| `pyproject.toml` / `setup.py` / `apps.py` (Django) | `python` | the first package (a folder with `__init__.py`) under `src/` or the root. For Django, the app folder | the next package down |
| none found | `plain` | the first folder under `root` that isn't one of `src lib libs app apps packages` | the next folder |

Files directly in `root`, and paths outside it, return `null`, which means base.

Results are cached per folder in a `Map`, so each folder is checked on disk only once. The `.sln` and `.csproj` listing is cached per root too.

**Changes to `server.mjs`:**
- Where tool starts are handled (the two `noteCall` sites, around lines 383 and 393): if `d.arguments?.path` is set, store `a.where = domainOf(abs, s.meta.cwd, realFs)`. Turn relative paths into absolute ones against `cwd` first. Keep the value until the next file tool call, so an agent stays on its island while it runs shell commands there.
- `snapshot()`: add `where` to each card (main, sub-agent and waiting). That's all the server needs to do.

**Tests:**
- `tests/domain.test.mjs`: one fake tree per ecosystem (nx with and without tags, .NET prefix and suffix removal, React, Next `app/`, Python `src/` layout, Django), plus root-file → null, outside-root → null, and caching (count the `exists` calls).
- One case in `tests/server.test.mjs`: write a log whose tool call has a path into a temp `nx` tree, then check `where` on the card.
- Optional: add `domain.mjs` to the Stryker config and its test list (CLAUDE.md says to).

## Slice 2: the map engine and the toggle

**New file: `public/map.js`**, the engine. It knows nothing about any one style.

- **World model:** for each `project`, an island group (`eco` doesn't matter here). The domains seen so far stay in a `Map` and are stored in `localStorage` (`pawsee-map-<project>`), so places don't disappear when no agent is there. Each domain also remembers its buildings.
- **Layout:** the base is in the centre. Domains go into slots on growing rings around it. The slot index is found by hashing the domain name with `Faces.hash` and taking the next free slot, so "booking" lands in the same spot every time. A map is one repo's world, so it shows one repo at a time: the busiest one, unless you've picked another in the repo menu above the map (remembered). A note says how many agents are working in other repos; the cards always show every repo. The SVG `viewBox` grows to fit.
- **Where each agent stands:**
  - `status` waiting, idle or failed, or `kind` ask → **base** (the waiting ones queue up on the dock)
  - `kind` web → the kit's `sea` spot (a lighthouse or open water)
  - `kind` code, explore, shell or think with a `where` → that domain, next to its building. If no `where` is set yet, the base
  - `done` agents walk back to base and fade out, using the same `fadeMs` as the cards
- **Movement:** each agent is a `<g>` with a CSS `transform` transition. While moving it gets the existing `run` class (or `walk` if the trip is short) and loses it when it arrives (`transitionend`). Sub-agents are drawn smaller, as on the cards. The paw's mood classes are the same ones the cards set, so worry, sleepy and happy all work. Pull that class-setting code out of `render()` in `app.js` into a small `pawClasses(a)` function that both views use.
- **Labels:** hovering a paw shows its name and activity (`<title>`). Clicking it does what clicking a card does (`jumpTo(session)` when `canFocus`). Each domain has a text label with its name. Base and domains have no popovers yet.
- **When the face style changes:** listen where `facesSel.onchange` calls `Faces.use`, then redraw the map with the new kit, or fall back to cards.

**The toggle (`public/index.html`, `public/app.js`):**
- Add a header button `#mapbtn` next to the Sound and Notify buttons, using their `snd` class. It reads `🗺 Map` in card mode and `▦ Cards` in map mode. The choice is saved in `localStorage` (`pawsee-mode`).
- Add a `<section id="map" class="map" hidden>` next to `#grid`.
- In map mode, `render()` still runs the card code (it keeps sounds, notifications and tab alerts working) but `#grid` is hidden, and the snapshot also goes to `PawMap.render(snap)`.
- **Fallback:** if `Faces.style.map` is missing, map mode shows the cards. The button stays, but it's disabled with the title "No map for this style yet". The saved choice is kept, so switching to a style that has a map shows the map again.
- **Recent view:** `history.js` `show()` hides `#map` too (add it to the `live` list).
- **Demo mode** (`?demo`): the demo agents need `where` values so the map can be tried with no real sessions. Give each demo agent a fake domain.

**What a style provides (`public/faces.js`):** an optional `map` key, documented next to the others:

```
map: {
  backdrop(w, h)          -> SVG for the whole background (sea, forest floor…)
  base()                  -> SVG for the base, centred on 0,0, about 160 across
  place(name, seed, n)    -> SVG for one domain, centred on 0,0, about 120 across; n = how many buildings it has
  building(name, seed)    -> SVG for one building, about 30 across
  route(x1, y1, x2, y2)   -> SVG for a path between base and a domain (a canoe route, a trail)
  sea()                   -> SVG for the web spot
}
```

All of these return SVG strings and have no state, just like the face functions. `tests/faces.test.mjs` gets one more check: if `map` is present, each function returns a non-empty string that parses as SVG.

**Files to add or list:** `public/map.js` → a `<script>` tag in `index.html` after `app.js`, and the file map in `scripts/build-binary.mjs`. `package.json` `files` already ships `public/`.

## Slice 3: the Tiki map

In `public/faces/tiki.js`, add `map`:
- **backdrop:** deep lagoon blue with light wave dashes. Reuse the `tiki-grain` pattern for the wooden parts.
- **base:** a central island with a longhouse and a dock. Waiting agents stand on the dock.
- **place:** a small sand island with one or two palms. The seed varies its shape and the number of palms. **building:** a grass hut, one per building, set around the island.
- **route:** a dotted canoe line. Moving agents ride a small canoe (the canoe is drawn by the engine only while moving, from a kit `vehicle()`, or skip the canoe in v1).
- **sea:** an open-water spot with a lighthouse made of a tiki torch.

Check it visually with `npm run dev` (port 4748), using `?demo` and a live session working in a real multi-folder repo. Look at it in light and dark mode, and at phone width (the map is an SVG that scales to fit).

## Order and PRs

1. `domain.mjs` and its tests, plus `where` on cards. No UI change, so it's safe to merge alone.
2. `map.js`, the toggle and the fallback, with a temporary plain kit (circles and labels) to build against.
3. The Tiki kit, after which the plain kit can be removed or kept as the default.

Further styles follow one at a time in `public/faces/<style>.js`, the same way new face styles were added.

## Left out on purpose

- Popovers on domains (which files, who has been there): use the Recent view for now.
- Drawing the trail history on the map: later, from `/api/history`.
- A config file for domain overrides (`.pawsee.json`): add it only if the .NET heuristic guesses wrong in real repos.
- Zoom and pan: the SVG scales to fit. Add these only if repos with many domains make it too small.
