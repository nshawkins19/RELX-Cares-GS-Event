# Handoff — Girl Scouts coding/game-design site

> Working notes for continuing this project in a new session. Not part of the shipped site.

## Project
Static (no-build) website teaching Girl Scouts coding + game design. Plain HTML/CSS/JS, no dependencies, no build step.
- **Location:** `C:\Users\sheehaj2\RELX-Cares-GS-Event`
- **Origin:** github.com/nshawkins19/RELX-Cares-GS-Event (cloned; `master` branch)
- **All work is local only — nothing has been committed or pushed.** `git status` shows modified `app.js`, `index.html`, `styles.css` and untracked `badge2.js`, `badge2.css`, `HANDOFF.md`. The Scratch-script refactor further modified `app.js` (2 drag-engine hooks), `badge2.js`, and `badge2.css`.

## File layout
| File | Role |
|---|---|
| `index.html` | Page shell. Only Badge 2 additions: a `<link>` to `badge2.css` and `<script src="badge2.js">`. |
| `app.js` | **Badge 1** engine (maze levels, Coding Pioneers, "Build Your Own" sandbox) + the shared drag-and-drop engine and grid renderer that Badge 2 reuses. |
| `styles.css` | Badge 1 styles + shared block/chip/cell styles. |
| `badge2.js` | **Badge 2** "Digital Game Design" — all of it (5-step activity, maze builder, **Scratch-style script editor**, arrow-key player, share links). |
| `badge2.css` | Badge 2-only styles, layered on top of `styles.css`. |

## How to run
From the repo: `python -m http.server 8765`, then open `http://localhost:8765/`. (Port 8000 is taken by another local service that redirects to HTTPS — use 8765.)

## How to test
jsdom smoke test at:
`C:\Users\sheehaj2\AppData\Local\Temp\claude\C--Users-sheehaj2\a999c9c2-7294-4ee9-8eb7-06a837dd4f09\scratchpad\domtest\smoke2.js`
Run with `node <that path>` (cd into the `domtest` folder first so `require("jsdom")` resolves). It loads `index.html`, exercises the new **Scratch script editor** (categorized palette, default scripts, nested blocks, add/remove, dropdown mutation), the **script-driven engine** (key→move, collect, door+key, push, win, win-gated-by-cookies, key reprogramming), **share v5 round-trip + v4 back-compat**, and checks Badge 1 is intact. **35 checks, all passing.** The only console noise is jsdom's unimplemented `window.scrollTo` (harmless — it fires during `showPanel`, which makes the script exit 1 even though every functional check passes). The older `smoke.js` is the pre-refactor rule-based test and no longer matches the code. Requires `jsdom@22` (newer jsdom hits an ESM/CJS error under this Node) — already installed in that `domtest` folder.

## Badge 1 — must stay behaviorally unchanged
The user reverted an earlier keys/doors expansion of Badge 1's sandbox; **Badge 1 must look/behave exactly like the original repo.** Its sandbox has no keys/doors. All Badge-2-supporting code added to `app.js`/`styles.css` is **additive and dormant for Badge 1** (Badge 1 maps/tools never trigger it). Behavior-equivalence is the bar (need not be byte-identical), but do not change how Badge 1 behaves.

## Badge 2 — current architecture (the important part)
**Design paradigm (current):** The **creator** (girl scout) draws a maze AND programs the game with **Scratch-style event scripts** (snapping blocks under event "hat" blocks). The **player** (e.g., a friend opening a share link) plays with **arrow keys / on-screen D-pad**. The arrow keys are themselves *wired by the creator's scripts* (`when ▲ pressed → move up`), so the kid really programs the behavior. This was the most recent pivot (see History #5).

**5 steps:** Discover, Explore, Plan, Build (Step 4 = the meat), Share. Answers persist in `localStorage`. Games share via `#play=<base64>` links (encode version `v:5`, maze + scripts; **`v:4` rule links are still decoded** via `b2RulesToScripts`).

**Session persistence (survives refresh):** the `B2_SESSION` object (in `badge2.js`) saves/restores under `gsBadge2.session.*` keys — `model` (maze grid+size), `scripts` (stripped block tree), `panel`/`badge` (where the user left off), and `visited` (Badge-2 stages they've opened → a green ✓ on the tab via `is-visited`). Saves fire on maze edits (`b2Paint`/`b2SetSize`/random), script edits (end of `b2RenderScripts` + the dropdown/text handlers in `b2BlockFace`), and navigation (the `showPanel` wrapper). Restore happens in `b2Init` (model+scripts before wiring; badge+panel at the end). **Never saves while `B2.fromShared`** (playing a friend's link isn't the user's own work), and restore is skipped when the URL is a `#play=` link. This also restores Badge-1 location on refresh (the only Badge-1-visible effect; mechanics unchanged).

**Block model** (`B2.scripts` = array of top-level hat blocks). Every block is `{ id, type, … }`; `BLOCK_DEFS` is the per-type table, `B2_CATEGORIES` is the color-coded palette grouping (Events/Motion/Actions/Control). Blocks with `body: []` nest children:
- Events (hats): `whenPlay`, `whenKey {dir}`, `whenTouch {tile:"C"|"K"|"D"|"H"}`
- Motion: `move {dir}`
- Actions (leaf): `collect`, `openDoor`, `win`, `say {text}`
- Control (body): `ifKey`, `ifCookies`
`b2MakeBlock(type)` creates one; `B2_DEFAULT_SCRIPTS()` returns `[]` (blank canvas). Rendered by `b2RenderScripts` / `b2RenderBlock` (recursive) / `b2RenderBodyRegion` / `b2BlockFace` (inline dropdowns/inputs).
- NOTE: the **pushable crate/block mechanic was removed** from Badge 2 (tile `B`, the `block` paint tool, the `push` action, and `b2DoPush`). The shared `app.js` push machinery (`renderGrid` B case, `applyEvent` push, `isOpen` treating `B` as solid, `usesBlocks`, `cmd-push`) is left intact for Badge 1 and simply unused by Badge 2.

**Script engine (interprets the scripts for the player):**
- Drivers: a key press calls `b2FireKey(dir)` → runs matching `whenKey` hats. `b2RunBody`/`b2RunBlock` execute blocks; `"win"` propagates up to `b2WinGame()`.
- `b2DoMove(dir)` is the motion primitive: walls block; **door tiles fire their `whenTouch` script first** (which may clear the tile via `openDoor`) then the robot enters if it became `"."`; **cookie/key/house tiles are stepped onto, then their `whenTouch` script fires** (`b2RunTouch` sets `b2ctx = {tx,ty,dx,dy}` so `collect`/`openDoor` act on the touched cell).
- `ifKey`/`ifCookies` gate their body on `b2ps.keys`/`b2ps.cookies`. Recursion guard: `b2depth` (max 300).
- No script for a piece → the door stays solid, item inert (same as the old "no rule" behavior).
- Player state in `b2ps` (x,y,dir,keys,cookies,totalCookies,grid). `b2PlayerStart` / `b2PlayerStop`. **`b2PlayerMove`/`b2CheckMoveInto`/`b2FireStepOnto` are gone** (replaced by the engine above); `b2Simulate` was removed even earlier.

**Reusing Badge 1's drag engine for the scripts (key implementation detail):**
- `badge2.js` defines controller `b2scripts = { idx:"scripts", playing, get program(){return B2.scripts}, makeItem, renderList, listEl, findById, ownArrays }` and drives app.js's `makeDragSource` / `wireDropzone`.
- This now uses **5 additive hooks** in app.js's drag engine, each defaulting to old behavior so Badge 1 is unchanged:
  1. `onPointerUp`: `game.makeItem ? game.makeItem(tool) : makeCommand(tool)`
  2. `onPointerUp` (and the `pointercancel` handler): `game.renderList ? game.renderList() : renderProgram(game)`
  3. `beginDrag`: `game.listEl || document.getElementById('program-'+idx)` for the drag-dim selector
  4. **`onPointerUp`: `game.findById || findById` and `game.ownArrays || ownArrays`** — so blocks nested in script bodies can move/reorder (Badge 1 doesn't set these → uses the globals)
  5. **`zoneUnderPointer`: same two fallbacks** — prevents dropping a block inside its own body
- `b2FindBlock` / `b2OwnArrays` are the script-tree-aware versions (they recurse into any `.body` array).
- Cross-script bare-name access works: `badge2.js` references app.js top-level `let`/`const` (e.g. `justDragged`, `makeCommand`, `DELTA`) and `function` globals (`renderGrid`, `placeRobot`, `updateCarry`, `applyEvent`, `setMsg`, `isOpen`, `inBounds`, `wireDropzone`, `makeDragSource`, `findById`, `ownArrays`) directly.

**Maze characters** (Badge 2 grids): `#` wall, `.` open, `P` robot start, `H` house/goal (mapped to `G` in the level map), `K` key, `D` door, `C` cookie. (`B` pushable block was removed — see block model note above.) Shared renderers in `app.js` (`renderGrid` draws K/D/C; `applyEvent` handles pickup/unlock; `isOpen` treats `D` as solid) — all neutral for Badge 1; the leftover `B`/push code paths in `app.js` are only exercised by Badge 1.

**Step 4 has a `<details class="b2-guide">` panel** ("how the pieces & code blocks work") explaining each maze piece and the four block categories.

**Build-step layout (Step 4):** the maze "stage" (`.b2-game-box`) and the code palette/scripts (`.b2-scripts-box`) now sit **side by side at all widths** (`.b2-build-workspace` is `flex-direction: row` unconditionally, no stacked mobile-first breakpoint), each capped to `calc(100vh - 90px)` with its own `overflow-y: auto` — like Scratch's stage/canvas panels, so once you scroll to the workspace both are visible together and each scrolls internally instead of the page. Narrow **portrait** phones (`max-width: 600px and orientation: portrait`) can't fit this usefully, so instead of stacking, everything below the Step-4 heading is wrapped in `.b2-build-body` and hidden in favor of a `.b2-rotate-gate` "turn your device sideways" card; landscape phones (and tablets, even in portrait) get the normal side-by-side layout untouched. `body.b2-embed` selectors were updated from `#b2-build > .b2-quickstart`/`.b2-guide` (direct-child) to descendant selectors since they're now nested one level deeper inside `.b2-build-body`.

## History / decisions (don't undo these)
1. Keys/doors were first added to the Badge 1 sandbox, then **reverted** — Badge 1 back to original.
2. Pushable blocks (`B` + Push) were added.
3. Badge 2 first had the **player solve the maze by writing a Badge-1 program** (`b2Simulate`). The user changed it so **the player uses arrow keys** and the **creator codes the rules**. (`b2Simulate` removed.)
4. The rule editor first used plain dropdown form-cards; the user found them un-Badge-1-like and the options confusing, so it was rebuilt as **full Badge-1 drag-and-drop blocks** with **simplified, concrete rule types**.
5. **The rule editor was then refactored into a Scratch-style event-script editor** (current state): color-coded categorized palette, event "hat" blocks with nested action/control bodies, and a script-driven engine. Movement keys are now programmable (`whenKey → move`). Share bumped to `v:5` with `v:4` back-compat. This added the 2 extra app.js drag-engine hooks (findById/ownArrays). The underlying maze/collision/collect/unlock/push/win mechanics were preserved, just re-expressed as scripts.
6. **The pushable crate/block mechanic was removed from Badge 2** across all stages (Plan peek/checklist, Build tool+guide, engine, share converter, legend). The 📦 emoji remains only as an optional *Item* skin (unrelated to the crate). Shared `app.js` push code left intact for Badge 1.
7. **Build-step layout changed from mobile-first-stacked to always-side-by-side** so the maze and code blocks are visible together without scrolling on laptop/tablet/landscape-phone; narrow portrait phones get a rotate-to-landscape prompt instead of a squeezed stack. See "Build-step layout" note above.

## User preferences
- **Scope-sensitive:** keep changes tightly targeted; don't expand into unrequested areas; keep Badge 1 untouched. Confirm scope before big changes.
- **Behavior over code purity:** fine if Badge 1 isn't byte-identical to the original as long as it *behaves* the same.
- Kid-facing copy: active voice, concise, kid-friendly (see `GAMES_FOR_GOOD` cards).

## Open / possible next items (none committed)
- User mentioned "some issues" with the refactor generally; the rules look + confusing options were addressed. If other bugs exist (movement, sizing, share links), they haven't been specified — ask what they saw.
- Earlier brainstorm (not built): difficulty levers for arrow-key play — **move limit** (recommended), countdown timer, energy/fuel, hazard tiles.
- Committing/pushing to GitHub has **not** been done — only if explicitly asked.
