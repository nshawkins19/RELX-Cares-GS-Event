"use strict";

/* ============================================================
   Badge 2 — Digital Game Design (Part 2)
   The girl scout draws a maze and codes the game's RULES using
   Badge-1-style drag-and-drop blocks.  Players navigate with
   arrow keys / on-screen D-pad — no coding needed to play.
   Reuses app.js globals: renderGrid, placeRobot, updateCarry,
   applyEvent, setMsg, isOpen, inBounds, parseMap, and the
   drag engine (makeDragSource, wireDropzone, justDragged).
   ============================================================ */

/* ---------------- localStorage (answers persist on this device) ---------------- */
const B2_NS = "gsBadge2.";
function b2Save(key, val) { try { localStorage.setItem(B2_NS + key, val); } catch (e) {} }
function b2Load(key, def = "") {
  try { const v = localStorage.getItem(B2_NS + key); return v === null ? def : v; }
  catch (e) { return def; }
}
function b2Autosave(el, key) {
  if (!el) return;
  const saved = b2Load(key, null);
  if (saved !== null) el.value = saved;
  el.addEventListener("input", () => b2Save(key, el.value));
}
function b2AutosaveCheck(el, key) {
  if (!el) return;
  el.checked = b2Load(key, "0") === "1";
  el.addEventListener("change", () => b2Save(key, el.checked ? "1" : "0"));
}

/* ---------------- Content data ---------------- */
/* real games & projects that did good — each links to a citable source */
const GAMES_FOR_GOOD = [
  {
    emoji: "🧬",
    title: "Foldit",
    tag: "Science puzzle",
    text: "Players folding proteins in this puzzle game figured out the shape of an AIDS-related virus enzyme in just three weeks — a problem scientists had been stuck on for 15 years. The gamers became co-authors of a real science paper!",
    source: "Scientific American",
    link: "https://www.scientificamerican.com/article/foldit-gamers-solve-riddle/",
  },
  {
    emoji: "🧠",
    title: "Sea Hero Quest",
    tag: "Brain research",
    text: "More than 4 million people played this boat-sailing adventure, and the way they found their way around gave scientists a huge set of data to help spot Alzheimer's disease earlier. Playing for fun became real brain research.",
    source: "Alzheimer's Research UK",
    link: "https://www.alzheimersresearchuk.org/research/for-researchers/resources-and-information/sea-hero-quest/",
  },
  {
    emoji: "💊",
    title: "Re-Mission",
    tag: "Health game",
    text: "In this game, young people with cancer pilot a tiny nanobot that blasts cancer cells. A study found that kids who played stuck to their treatment better and felt more confident about beating their illness.",
    source: "Wikipedia",
    link: "https://en.wikipedia.org/wiki/Re-Mission",
  },
  {
    emoji: "🏙️",
    title: "Block by Block",
    tag: "City design",
    text: "Communities use Minecraft to design real parks and public spaces in their own neighborhoods. The United Nations has used it in 55+ countries to help millions of people — including kids — shape where they live.",
    source: "UN-Habitat",
    link: "https://www.blockbyblock.org/",
  },
  {
    emoji: "👁️",
    title: "EyeWire",
    tag: "Citizen science",
    text: "EyeWire is a puzzle game where players trace and color in 3-D pictures of real brain cells. Working together, these 'citizen scientists' helped map the brain — and even discovered six brand-new kinds of brain cells in the eye!",
    source: "Princeton University",
    link: "https://www.princeton.edu/news/2018/05/17/princeton-researchers-crowdsource-brain-mapping-gamers-discover-six-new-neuron",
  },
  {
    emoji: "🦠",
    title: "EVE Online: Project Discovery",
    tag: "Disease research",
    text: "Players of a giant space game spent game time spotting patterns in real pictures of human blood cells, helping scientists study COVID-19. Together they did work that would have taken researchers more than 300 years!",
    source: "SciStarter",
    link: "https://scistarter.org/eve-online-project-discovery",
  },
];

/* maze-builder paint tools */
const B2_TOOLS = [
  { key: "wall",   label: "🧱 Wall" },
  { key: "path",   label: "⬜ Path" },
  { key: "cookie", label: "🍪 Cookie" },
  { key: "key",    label: "🔑 Key" },
  { key: "door",   label: "🚪 Door" },
  { key: "block",  label: "📦 Block" },
  { key: "robot",  label: "🤖 Robot start" },
  { key: "house",  label: "🏠 House" },
];
const B2_SIZES = [7, 9, 11, 13, 15];
const B2_DEFAULT_SIZE = 9;
/* Badge 2's game pod is full-width, so let its maze cells grow bigger than
   Badge 1's (which sits in a narrow column) to fill the space on wide screens */
const B2_MAX_CELL = 72;

/* ---------------- Themed icons ----------------
   The player (P), the collected item (C), and the goal (H) can be re-skinned
   with emoji that fit different themes (ocean cleanup, community garden, pet
   rescue, space station, helping-hands hospital) — and freely mixed. There's
   no theme picker; the kid just chooses each icon from a list. The game's
   mechanics are identical no matter which emoji is chosen. */
const B2_SKINS = {
  P: { label: "Player", options: ["🤖", "🤿", "👩‍🌾", "🧑‍🚀", "🧑‍⚕️", "🧑‍🚒"] },
  C: { label: "Item",   options: ["🍪", "🗑️", "🥕", "🐶", "📦", "💊"] },
  H: { label: "Goal",   options: ["🏠", "♻️", "🧺", "🐾", "🛰️", "🏥"] },
};
const B2_DEFAULT_SKIN = { P: "🤖", C: "🍪", H: "🏠" };
/* only ever accept icons from the allowed lists (also guards shared links) */
function b2CleanSkin(obj) {
  const s = { ...B2_DEFAULT_SKIN };
  if (obj) for (const k of Object.keys(B2_SKINS)) if (B2_SKINS[k].options.includes(obj[k])) s[k] = obj[k];
  return s;
}

/* default game text */
const B2_DEFAULTS = {
  title: "My Maze Game",
  intro: "Use the arrow keys or buttons to guide the robot 🤖 to the house 🏠 — collect every cookie 🍪 on the way!",
  win: "🎉 You did it! The robot reached the house!",
};

/* ============================================================
   SCRATCH-STYLE SCRIPT BLOCKS
   The girl scout codes the game by snapping blocks under event
   "hat" blocks — just like Scratch.  A script is a hat with a
   body of action / control blocks.  Every block is { id, type, … }:

     EVENTS (hats — hold a body):
       whenPlay              when ▶ Play is clicked
       whenKey  { dir }      when an arrow key is pressed
       whenTouch{ tile }     when the robot touches a piece
     MOTION:
       move     { dir }      step one cell in a direction
     ACTIONS:
       collect               pick up the cookie / key just touched
       openDoor              open the touched door (needs a key)
       push                  shove the touched block forward
       win                   the player wins
       say      { text }     show a message
     CONTROL (hold a body):
       ifKey                 if carrying a key
       ifCookies             if every cookie is collected
   ============================================================ */
const DIRS      = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const DIR_LIST  = ["up", "down", "left", "right"];
const DIR_LABEL = { up: "▲ up", down: "▼ down", left: "◀ left", right: "▶ right" };
const DIR_FACE  = { up: 0, right: 1, down: 2, left: 3 };
const DIR_OPTS  = DIR_LIST.map((k) => ({ key: k, label: DIR_LABEL[k] }));
const TOUCH_TILES = [
  { key: "C", label: "🍪 cookie" },
  { key: "K", label: "🔑 key" },
  { key: "D", label: "🚪 door" },
  { key: "B", label: "📦 block" },
  { key: "H", label: "🏠 house" },
];

/* palette is grouped into Scratch-like color-coded categories */
const B2_CATEGORIES = [
  { cls: "cat-events",  label: "Events",  hint: "when something happens", blocks: ["whenPlay", "whenKey", "whenTouch"] },
  { cls: "cat-motion",  label: "Motion",  hint: "move the robot",         blocks: ["move"] },
  { cls: "cat-actions", label: "Actions", hint: "make something happen",  blocks: ["collect", "openDoor", "push", "win", "say"] },
  { cls: "cat-control", label: "Control", hint: "only run if it's true",  blocks: ["ifKey", "ifCookies"] },
];

/* per-type definition — cat (for color), whether it holds a body, palette label */
const BLOCK_DEFS = {
  whenPlay:  { cat: "events",  hat: true,  body: true,  label: "when ▶ Play clicked",   title: "when ▶ Play clicked" },
  whenKey:   { cat: "events",  hat: true,  body: true,  label: "when 🔼 arrow pressed",  title: "when arrow pressed" },
  whenTouch: { cat: "events",  hat: true,  body: true,  label: "when robot touches…",    title: "when robot touches" },
  move:      { cat: "motion",  body: false, label: "move 🔼" },
  collect:   { cat: "actions", body: false, label: "pick it up 🎒" },
  openDoor:  { cat: "actions", body: false, label: "open the door 🔓" },
  push:      { cat: "actions", body: false, label: "push it 📦" },
  win:       { cat: "actions", body: false, label: "win the game 🏆" },
  say:       { cat: "actions", body: false, label: "show message 💬" },
  ifKey:     { cat: "control", body: true,  label: "if carrying a 🔑 key",  title: "if carrying a 🔑 key" },
  ifCookies: { cat: "control", body: true,  label: "if all 🍪 collected",   title: "if all 🍪 collected" },
};

let b2Uid = 1000;
function b2MakeBlock(type) {
  if (!BLOCK_DEFS[type]) return null;
  const block = { id: ++b2Uid, type };
  if (type === "whenKey" || type === "move") block.dir = "up";
  if (type === "whenTouch")                  block.tile = "C";
  if (type === "say")                        block.text = "Nice!";
  if (BLOCK_DEFS[type].body)                 block.body = [];
  return block;
}

/* a fresh build starts with a blank script canvas — the kid drags in
   every block themselves (the empty-state hint explains how to begin). */
function B2_DEFAULT_SCRIPTS() {
  return [];
}

/* find a block by id anywhere in the script tree → { arr, index, cmd } */
function b2FindBlock(arr, id) {
  for (let i = 0; i < arr.length; i++) {
    const b = arr[i];
    if (b.id === id) return { arr, index: i, cmd: b };
    if (Array.isArray(b.body)) {
      const r = b2FindBlock(b.body, id);
      if (r) return r;
    }
  }
  return null;
}
/* every child-array owned by a block (so it can't be dropped inside itself) */
function b2OwnArrays(block, set = new Set()) {
  if (Array.isArray(block.body)) {
    set.add(block.body);
    block.body.forEach((b) => b2OwnArrays(b, set));
  }
  return set;
}

/* ---------------- Shared state ---------------- */
const B2 = {
  model: null,       // { cols, rows, grid:[[char]] }
  tool: "wall",
  settings: { ...B2_DEFAULTS },
  scripts: B2_DEFAULT_SCRIPTS(),
  skin: { ...B2_DEFAULT_SKIN },
  fromShared: false,
};

/* drives renderGrid / placeRobot / setMsg etc. (idx "b2" → ids grid-b2…) */
const b2game = {
  idx: "b2",
  program: [],
  playing: false,
  editable: false,
  maxCell: B2_MAX_CELL, // bigger cells than Badge 1 (shared fitGrid reads this)
  fitHeight: true,      // also cap cells by viewport height so the maze fits on screen
  level: { tools: [], start: { x: 1, y: 1, dir: 1 }, map: [] },
};

/* a "draggable list controller" the reused Badge 1 drag engine drives.
   - program (getter) → the array the engine reorders / drops into
   - makeItem(type)   → create a new block when a palette block is dropped
   - renderList()     → re-render after any drag
   - listEl           → the <ul> the dragged block lives in (for the "lift" dim)
   - findById/ownArrays → script-tree aware versions of app.js's helpers, so
     blocks nested inside event/control bodies can be moved and reordered */
const b2scripts = {
  idx: "scripts",
  playing: false,
  listEl: null,
  get program() { return B2.scripts; },
  makeItem: (type) => b2MakeBlock(type),
  renderList: () => b2RenderScripts(),
  findById: (arr, id) => b2FindBlock(arr, id),
  ownArrays: (block) => b2OwnArrays(block),
};

/* mutable player state during a play session */
const b2ps = { x: 1, y: 1, dir: 1, keys: 0, cookies: 0, totalCookies: 0, grid: null };

/* ============================================================
   Session persistence — survive a page refresh.
   Text answers (Discover/Explore/Plan, settings, checklist) already
   persist via b2Autosave; this adds the maze, the scripts, the
   stages the user has visited, and where they left off.  Nothing
   is saved while playing a shared link (that's not the user's work).
   ============================================================ */
const B2_SESSION = {
  saveModel() {
    if (B2.fromShared || !B2.model) return;
    b2Save("session.model", JSON.stringify({
      cols: B2.model.cols, rows: B2.model.rows,
      grid: B2.model.grid.map((r) => r.join("")),
    }));
  },
  loadModel() {
    try {
      const m = JSON.parse(b2Load("session.model", "") || "null");
      if (!m || !Array.isArray(m.grid) || !m.grid.length) return null;
      return { cols: m.cols, rows: m.rows, grid: m.grid.map((r) => r.split("")) };
    } catch (e) { return null; }
  },
  saveScripts() {
    if (B2.fromShared) return;
    try { b2Save("session.scripts", JSON.stringify(B2.scripts.map(b2StripBlock))); } catch (e) {}
  },
  loadScripts() {
    try {
      const arr = JSON.parse(b2Load("session.scripts", "") || "null");
      return Array.isArray(arr) ? arr.map(b2ReviveBlock).filter(Boolean) : null;
    } catch (e) { return null; }
  },
  saveSkin() {
    if (B2.fromShared) return;
    try { b2Save("session.skin", JSON.stringify(B2.skin)); } catch (e) {}
  },
  loadSkin() {
    try { return b2CleanSkin(JSON.parse(b2Load("session.skin", "") || "null")); }
    catch (e) { return { ...B2_DEFAULT_SKIN }; }
  },
  savePlace(panel) {
    if (B2.fromShared || !panel) return;
    b2Save("session.panel", panel);
    b2Save("session.badge", /^b2-/.test(panel) ? "2" : "1");
  },
  visited() {
    try { return JSON.parse(b2Load("session.visited", "[]")) || []; } catch (e) { return []; }
  },
  markVisited(panel) {
    if (!panel || !/^b2-/.test(panel)) return; // only Badge-2 stages get a progress check
    const set = new Set(B2_SESSION.visited());
    if (set.has(panel)) return;
    set.add(panel);
    b2Save("session.visited", JSON.stringify([...set]));
  },
};

/* put a ✓ on the Badge-2 tabs the user has already opened */
function b2MarkVisitedTabs() {
  const visited = new Set(B2_SESSION.visited());
  document.querySelectorAll('.tab[data-badge="2"]').forEach((tab) =>
    tab.classList.toggle("is-visited", visited.has(tab.dataset.target)));
}

/* ============================================================
   Grid model helpers
   ============================================================ */
function b2IsBorder(x, y, cols, rows) { return x === 0 || y === 0 || x === cols - 1 || y === rows - 1; }
function b2Blank(cols, rows) {
  const g = Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => (b2IsBorder(x, y, cols, rows) ? "#" : ".")));
  g[1][1] = "P";
  g[rows - 2][cols - 2] = "H";
  return g;
}
function b2GenMaze(cols, rows) {
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => "#"));
  const inB = (x, y) => x > 0 && y > 0 && x < cols - 1 && y < rows - 1;
  grid[1][1] = ".";
  const stack = [[1, 1]];
  const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]];
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const opts = [];
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (inB(nx, ny) && grid[ny][nx] === "#") opts.push([nx, ny, cx + dx / 2, cy + dy / 2]);
    }
    if (!opts.length) { stack.pop(); continue; }
    const [nx, ny, wx, wy] = opts[Math.floor(Math.random() * opts.length)];
    grid[wy][wx] = "."; grid[ny][nx] = "."; stack.push([nx, ny]);
  }
  grid[1][1] = "P";
  grid[rows - 2][cols - 2] = "H";
  return grid;
}
function b2FindChar(grid, ch) {
  for (let y = 0; y < grid.length; y++)
    for (let x = 0; x < grid[y].length; x++)
      if (grid[y][x] === ch) return { x, y };
  return null;
}
function b2CountChar(grid, ch) {
  let n = 0;
  for (const row of grid) for (const c of row) if (c === ch) n++;
  return n;
}
function b2CellVisual(ch) {
  switch (ch) {
    case "#": return { cls: "wall", txt: "" };
    case "H": return { cls: "open goal", txt: B2.skin.H };
    case "K": return { cls: "open key", txt: "🔑" };
    case "D": return { cls: "open door", txt: "🚪" };
    case "B": return { cls: "open block", txt: "📦" };
    case "C": return { cls: "open cookie", txt: B2.skin.C };
    case "P": return { cls: "open start", txt: B2.skin.P };
    default:  return { cls: "open", txt: "" };
  }
}

/* ---------------- Skin (themed icons) ---------------- */
/* push the current skin into the play renderer (b2game.emoji) and the
   robot icon (a CSS var the play robot reads) */
function b2ApplySkin() {
  b2game.emoji = { C: B2.skin.C, H: B2.skin.H };
  const g = document.getElementById("grid-b2");
  if (g) g.style.setProperty("--b2-player", `"${B2.skin.P}"`);
}
/* paint-tool buttons, with the themed icons for player / item / goal / key / door */
function b2ToolsHTML() {
  const skinLabel = { robot: `${B2.skin.P} Player`, cookie: `${B2.skin.C} Item`, house: `${B2.skin.H} Goal` };
  return B2_TOOLS.map((t) =>
    `<button class="maze-tool" data-b2tool="${t.key}">${skinLabel[t.key] || t.label}</button>`).join("");
}
function b2RenderTools() {
  const el = document.getElementById("b2-tools");
  if (el) el.innerHTML = b2ToolsHTML();
  document.querySelectorAll("#b2-tools [data-b2tool]").forEach((x) =>
    x.classList.toggle("is-active", x.dataset.b2tool === B2.tool));
}
function b2RenderLegend() {
  const el = document.getElementById("b2-legend");
  if (el) el.innerHTML =
    `${B2.skin.P} player &nbsp;•&nbsp; ${B2.skin.H} goal &nbsp;•&nbsp; ${B2.skin.C} item &nbsp;•&nbsp; 🔑 key &nbsp;•&nbsp; 🚪 door &nbsp;•&nbsp; 📦 block &nbsp;•&nbsp; dark = wall`;
}
/* "when robot touches …" options, with the themed icons */
function b2TouchTileOpts() {
  return [
    { key: "C", label: `${B2.skin.C} item` },
    { key: "K", label: "🔑 key" },
    { key: "D", label: "🚪 door" },
    { key: "B", label: "📦 block" },
    { key: "H", label: `${B2.skin.H} goal` },
  ];
}
/* fill the icon-picker dropdowns and keep them in sync with B2.skin */
function b2RenderSkinSelectors() {
  Object.keys(B2_SKINS).forEach((role) => {
    const sel = document.getElementById(`b2-skin-${role}`);
    if (!sel) return;
    sel.innerHTML = B2_SKINS[role].options
      .map((e) => `<option value="${e}"${e === B2.skin[role] ? " selected" : ""}>${e}</option>`).join("");
    sel.value = B2.skin[role];
  });
}
/* called after any icon change: refresh everything that shows an icon + save */
/* palette block label — the "if all … collected" block shows the item icon */
function b2PaletteLabel(type) {
  if (type === "ifCookies") return `if all ${B2.skin.C} collected`;
  return BLOCK_DEFS[type].label;
}
/* re-skin the (wired-once) palette block labels after an icon change */
function b2RefreshPaletteLabels() {
  document.querySelectorAll("#b2-scripts-palette [data-pal]").forEach((el) => {
    const span = el.querySelector(".b2-pal-text");
    if (span) span.textContent = b2PaletteLabel(el.dataset.pal);
  });
}
function b2OnSkinChange() {
  b2ApplySkin();
  b2RenderTools();
  b2RenderLegend();
  b2RenderSkinSelectors();
  b2RefreshPaletteLabels();
  if (!B2.fromShared) b2RenderEditor();
  b2RenderScripts();   // refresh the "when robot touches …" labels on placed blocks
  B2_SESSION.saveSkin();
}

/* ============================================================
   Maze designer
   ============================================================ */
function b2FitGrid() {
  const g = document.getElementById("grid-b2");
  if (!g || !B2.model) return;
  const wrap = g.parentElement;
  const gap = 3;
  const avail = wrap && wrap.clientWidth ? wrap.clientWidth : Math.min(window.innerWidth - 48, 520);
  let cell = Math.floor((avail - (B2.model.cols + 1) * gap) / B2.model.cols);
  // also cap by height so the whole "Your game" pod (minus the bottom message)
  // fits: viewport − chrome above the grid − room below it (legend + Play)
  const pod = g.closest(".box");
  let hBudget = window.innerHeight * 0.55;
  if (pod && g.offsetParent) {
    const head = document.querySelector(".tabs"); // sticky tab bar covers the top
    const headH = head && getComputedStyle(head).position === "sticky" ? head.offsetHeight : 0;
    const above = g.getBoundingClientRect().top - pod.getBoundingClientRect().top;
    hBudget = window.innerHeight - headH - above - 110;
  }
  const hCell = Math.floor((hBudget - (B2.model.rows + 1) * gap) / B2.model.rows);
  cell = Math.min(cell, hCell);
  cell = Math.max(16, Math.min(B2_MAX_CELL, cell));
  g.style.setProperty("--cell", `${cell}px`);
}

function b2RenderEditor() {
  const g = document.getElementById("grid-b2");
  if (!g || !B2.model) return;
  const { grid, cols, rows } = B2.model;
  g.style.gridTemplateColumns = `repeat(${cols}, var(--cell))`;
  g.innerHTML = "";
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ch = grid[y][x] || "#";
      const v = b2CellVisual(ch);
      const border = b2IsBorder(x, y, cols, rows);
      const cell = document.createElement("div");
      cell.className = "cell " + v.cls + (border ? "" : " editable-cell");
      cell.textContent = v.txt;
      if (!border) cell.addEventListener("click", () => b2Paint(x, y));
      g.appendChild(cell);
    }
  }
  b2FitGrid();
}

function b2Paint(x, y) {
  if (b2game.playing) return;
  const grid = B2.model.grid;
  const here = grid[y][x];
  switch (B2.tool) {
    case "wall":
      if (here === "P" || here === "H") { b2Msg("bad", "Move the 🤖 robot or 🏠 house before drawing a wall there."); return; }
      grid[y][x] = "#"; break;
    case "path": grid[y][x] = "."; break;
    case "cookie": case "key": case "door": case "block":
      if (here === "P" || here === "H") { b2Msg("bad", "That square has the 🤖 robot or 🏠 house on it."); return; }
      grid[y][x] = { cookie: "C", key: "K", door: "D", block: "B" }[B2.tool]; break;
    case "robot": {
      const old = b2FindChar(grid, "P"); if (old) grid[old.y][old.x] = ".";
      grid[y][x] = "P"; break;
    }
    case "house": {
      const old = b2FindChar(grid, "H"); if (old) grid[old.y][old.x] = ".";
      grid[y][x] = "H"; break;
    }
  }
  b2RenderEditor();
  B2_SESSION.saveModel();
  b2Msg("info", "Looking good! Set your rules on the left, then press ▶ Play to test.");
}

function b2SetSize(n) {
  B2.model = { cols: n, rows: n, grid: b2Blank(n, n) };
  b2RenderEditor();
  B2_SESSION.saveModel();
  b2Msg("info", `Maze is now ${n} × ${n}. Draw it, or press 🎲 Random.`);
}

function b2Msg(kind, text) { setMsg(b2game, kind, text); }

function b2SetDesignDisabled(disabled) {
  document.querySelectorAll("#b2-design .maze-tool, #b2-design select").forEach((el) => (el.disabled = disabled));
  const box = document.getElementById("b2-scripts-box");
  if (box) {
    box.classList.toggle("is-locked", disabled);
    box.querySelectorAll("select, button").forEach((el) => (el.disabled = disabled));
  }
}

/* ============================================================
   Sync level map from model (used by renderGrid)
   ============================================================ */
function b2SyncLevel() {
  const m = B2.model;
  const start = b2FindChar(m.grid, "P") || { x: 1, y: 1 };
  b2game.level.map = m.grid.map((row) =>
    row.map((ch) => (ch === "P" ? "." : ch === "H" ? "G" : ch)).join(""));
  b2game.level.start = { x: start.x, y: start.y, dir: 1 };
}

/* ============================================================
   Script engine — runs the player's event scripts.
   Drivers: a key press fires matching "when … pressed" hats; the
   move action fires "when robot touches …" hats for the tile it
   meets.  Door / block tiles are bumped (their touch script may
   clear them before the robot enters); cookie / key / house tiles
   are stepped onto first, then their touch script fires.
   ============================================================ */
let b2ctx = null;    // { tx, ty, dx, dy } — the touched cell, for actions
let b2depth = 0;     // guard against runaway recursion

function b2Hats(type, pred) {
  return B2.scripts.filter((s) => s.type === type && (!pred || pred(s)));
}

/* run a list of blocks in order; returns "win" if the game was won */
function b2RunBody(body) {
  if (!Array.isArray(body) || ++b2depth > 300) { b2depth--; return "ok"; }
  let out = "ok";
  for (const block of body) {
    if (b2RunBlock(block) === "win") { out = "win"; break; }
  }
  b2depth--;
  return out;
}

function b2RunBlock(block) {
  switch (block.type) {
    case "move":      return b2DoMove(block.dir);
    case "collect":   b2DoCollect();  return "ok";
    case "openDoor":  b2DoOpenDoor(); return "ok";
    case "push":      b2DoPush();     return "ok";
    case "say":       if (block.text) b2Msg("info", block.text); return "ok";
    case "win":       return "win";
    case "ifKey":     return b2ps.keys > 0 ? b2RunBody(block.body) : "ok";
    case "ifCookies": return b2ps.cookies >= b2ps.totalCookies ? b2RunBody(block.body) : "ok";
    default:          return "ok";
  }
}

/* MOTION — try to step one cell in a direction. */
function b2DoMove(dir) {
  const d = DIRS[dir];
  if (!d) return "ok";
  const nx = b2ps.x + d[0], ny = b2ps.y + d[1];
  b2ps.dir = DIR_FACE[dir];
  if (!inBounds(b2ps.grid, nx, ny)) { placeRobot(b2game, b2ps, false); return "ok"; }

  const tile = b2ps.grid[ny][nx];
  if (tile === "#") { placeRobot(b2game, b2ps, false); return "ok"; }

  // door / block: their touch script acts before we decide to enter
  if (tile === "D" || tile === "B") {
    b2RunTouch(tile, nx, ny, d[0], d[1]);
    if (b2ps.grid[ny][nx] === ".") { b2ps.x = nx; b2ps.y = ny; } // opened / pushed away
    placeRobot(b2game, b2ps, false);
    return "ok";
  }

  // open path / cookie / key / house: enter, then fire the touch script
  b2ps.x = nx; b2ps.y = ny;
  placeRobot(b2game, b2ps, false);
  if (tile === "C" || tile === "K" || tile === "H") return b2RunTouch(tile, nx, ny, d[0], d[1]);
  return "ok";
}

/* fire every "when robot touches <tile>" hat with the touched cell in context */
function b2RunTouch(tile, tx, ty, dx, dy) {
  const prev = b2ctx;
  b2ctx = { tx, ty, dx, dy };
  let out = "ok";
  for (const hat of b2Hats("whenTouch", (h) => h.tile === tile)) {
    if (b2RunBody(hat.body) === "win") { out = "win"; break; }
  }
  b2ctx = prev;
  return out;
}

function b2DoCollect() {
  if (!b2ctx) return;
  const { tx, ty } = b2ctx;
  const tile = b2ps.grid[ty][tx];
  if (tile === "C") {
    b2ps.grid[ty][tx] = ".";
    b2ps.cookies++;
    const cell = b2game.cells[`${tx},${ty}`];
    if (cell) { cell.classList.remove("cookie"); cell.textContent = ""; }
    b2UpdateHud();
  } else if (tile === "K") {
    b2ps.grid[ty][tx] = ".";
    b2ps.keys++;
    applyEvent(b2game, { type: "pickup", x: tx, y: ty });
    updateCarry(b2game, b2ps.keys);
  }
}

function b2DoOpenDoor() {
  if (!b2ctx) return;
  const { tx, ty } = b2ctx;
  if (b2ps.grid[ty][tx] !== "D" || b2ps.keys <= 0) return;
  b2ps.keys--;
  b2ps.grid[ty][tx] = ".";
  applyEvent(b2game, { type: "unlock", x: tx, y: ty });
  updateCarry(b2game, b2ps.keys);
}

function b2DoPush() {
  if (!b2ctx) return;
  const { tx, ty, dx, dy } = b2ctx;
  if (b2ps.grid[ty][tx] !== "B") return;
  const bx = tx + dx, by = ty + dy;
  if (inBounds(b2ps.grid, bx, by) && b2ps.grid[by][bx] === ".") {
    b2ps.grid[ty][tx] = ".";
    b2ps.grid[by][bx] = "B";
    applyEvent(b2game, { type: "push", from: { x: tx, y: ty }, to: { x: bx, y: by } });
  }
}

/* ============================================================
   Arrow-key / D-pad player
   ============================================================ */
function b2PlayerStart() {
  if (!b2FindChar(B2.model.grid, "P")) { b2Msg("bad", "Add a 🤖 robot start — pick the Robot tool and place one!"); return; }
  if (!b2FindChar(B2.model.grid, "H")) { b2Msg("bad", "Add a 🏠 house — pick the House tool and place one!"); return; }

  B2.settings = b2ReadSettings();
  b2SyncLevel();

  b2ps.grid = B2.model.grid.map((r) => r.slice());
  const start = b2FindChar(B2.model.grid, "P") || { x: 1, y: 1 };
  b2ps.x = start.x; b2ps.y = start.y; b2ps.dir = 1;
  b2ps.keys = 0; b2ps.cookies = 0;
  b2ps.totalCookies = b2CountChar(B2.model.grid, "C");

  renderGrid(b2game);
  updateCarry(b2game, 0);
  placeRobot(b2game, b2ps, false);
  b2UpdateHud();

  b2game.playing = true;
  b2scripts.playing = true;
  b2SetDesignDisabled(true);
  b2SetPlayButtons(true);

  // pick the input that fits the device: on-screen arrows for touch-only
  // devices, the keyboard for anything with a mouse/trackpad (the same
  // "when arrow pressed" scripts drive both — no extra programming needed)
  const dpad = document.getElementById("b2-dpad");
  if (dpad) dpad.hidden = !b2UsesTouch();
  b2Msg("info", "");
}

/* Best-effort "is this a touch-only device?" — a coarse pointer (finger)
   with no fine pointer (mouse/trackpad) attached.  Not a guarantee (hybrids
   exist), so play also reveals the arrow pad if the screen is touched. */
function b2UsesTouch() {
  if (!window.matchMedia) return (navigator.maxTouchPoints || 0) > 0;
  const anyCoarse = window.matchMedia("(any-pointer: coarse)").matches;
  const anyFine   = window.matchMedia("(any-pointer: fine)").matches;
  return anyCoarse && !anyFine;
}

function b2PlayerStop() {
  b2game.playing = false;
  b2scripts.playing = false;
  b2SetDesignDisabled(false);
  b2SetPlayButtons(false);
  const dpad = document.getElementById("b2-dpad");
  if (dpad) dpad.hidden = true;
  if (!B2.fromShared) b2RenderEditor();
  else { b2SyncLevel(); renderGrid(b2game); }
  b2UpdateHud();
  updateCarry(b2game, 0);
}

function b2EndPlay() {
  b2game.playing = false;
  b2scripts.playing = false;
  b2SetPlayButtons(false);
  b2SetDesignDisabled(false);
  const dpad = document.getElementById("b2-dpad");
  if (dpad) dpad.hidden = true;
}

/* a key press (arrow key or D-pad) fires the matching "when … pressed" hats */
function b2FireKey(dir) {
  if (!b2game.playing || !DIRS[dir]) return;
  for (const hat of b2Hats("whenKey", (h) => h.dir === dir)) {
    if (b2RunBody(hat.body) === "win") { b2WinGame(); return; }
  }
}

function b2WinGame() {
  b2EndPlay();
  b2Msg("ok", "🎉 You solved it!");
  b2ShowModal({
    emoji: "🏆", title: "You win!",
    msg: B2.settings.win || B2_DEFAULTS.win,
    actions: B2.fromShared
      ? [{ label: "↻ Play again", onClick: () => { b2HideModal(); b2PlayerStart(); } },
         { label: "Make your own →", primary: true, onClick: () => { b2HideModal(); b2ExitShared(); } }]
      : [{ label: "Keep building", onClick: () => { b2HideModal(); b2PlayerStop(); } },
         { label: "🔗 Share it", primary: true, onClick: () => { b2HideModal(); b2PlayerStop(); showPanel("b2-share"); } }],
  });
}

function b2SetPlayButtons(playing) {
  const playBtn = document.getElementById("b2-play");
  const stopBtn = document.getElementById("b2-stop");
  if (playBtn) playBtn.disabled = playing;
  if (stopBtn) stopBtn.disabled = !playing;
}

function b2UpdateHud() {
  const hud = document.getElementById("b2-hud");
  if (!hud) return;
  if (!b2game.playing) { hud.hidden = true; return; }
  const parts = [];
  if (b2ps.totalCookies > 0) parts.push(`${B2.skin.C} ${b2ps.cookies} / ${b2ps.totalCookies}`);
  if (b2ps.keys > 0) parts.push(`🔑 ×${b2ps.keys}`);
  if (parts.length) { hud.hidden = false; hud.innerHTML = parts.map((p) => `<span>${p}</span>`).join(""); }
  else hud.hidden = true;
}

/* ============================================================
   Script editor — Scratch-style drag-and-drop blocks
   ============================================================ */
function b2RenderScripts() {
  // categorized palette (wired once)
  const palette = document.getElementById("b2-scripts-palette");
  if (palette && !palette._wired) {
    B2_CATEGORIES.forEach((cat) => {
      const group = document.createElement("div");
      group.className = `b2-cat ${cat.cls}`;
      const label = document.createElement("div");
      label.className = "b2-cat-label";
      label.innerHTML = cat.label + (cat.hint ? ` <span class="b2-cat-hint">· ${cat.hint}</span>` : "");
      group.appendChild(label);
      cat.blocks.forEach((type) => {
        const def = BLOCK_DEFS[type];
        const item = document.createElement("div");
        item.className = `cmd-btn b2-pal ${cat.cls}`;
        item.dataset.pal = type;
        item.innerHTML = `<span class="b2-pal-text">${b2PaletteLabel(type)}</span><span class="grip">⠿</span>`;
        makeDragSource(item, () => ({ kind: "new", tool: type, game: b2scripts, label: b2PaletteLabel(type) }));
        item.addEventListener("click", () => {
          if (b2scripts.playing || justDragged) return;
          B2.scripts.push(b2MakeBlock(type));
          b2RenderScripts();
        });
        group.appendChild(item);
      });
      palette.appendChild(group);
    });
    palette._wired = true;
  }

  const list = document.getElementById("scripts-b2");
  if (!list) return;
  b2scripts.listEl = list;
  list.innerHTML = "";
  wireDropzone(b2scripts, list, B2.scripts);

  if (B2.scripts.length === 0) {
    const empty = document.createElement("div");
    empty.className = "program-empty";
    empty.textContent = "No blocks yet — drag an Event block here to start. (With no blocks, the arrow keys and arrow pad do nothing.)";
    list.appendChild(empty);
    return;
  }
  B2.scripts.forEach((block, i) => list.appendChild(b2RenderBlock(block, B2.scripts, i)));
  B2_SESSION.saveScripts();
}

/* recursively render one block (hats / control hold a nested body) */
function b2RenderBlock(block, parentArr, index) {
  const def = BLOCK_DEFS[block.type];
  if (!def) return document.createElement("li");

  if (def.body) {
    const li = document.createElement("li");
    li.className = `block prog-item b2-block cat-${def.cat} is-${block.type}` + (def.hat ? " b2-hat" : "");
    li.dataset.id = block.id;
    const head = document.createElement("div");
    head.className = "block-head";
    const grip = document.createElement("span");
    grip.className = "grip";
    grip.textContent = "⠿";
    head.appendChild(grip);
    makeDragSource(grip, () => ({ kind: "move", id: block.id, game: b2scripts, label: def.title || def.label }));
    b2BlockFace(block, head);
    head.appendChild(b2RemoveBtn(block));
    li.appendChild(head);
    li.appendChild(b2RenderBodyRegion(block.body, def.hat ? "do this" : "then do this"));
    return li;
  }

  // leaf action chip
  const li = document.createElement("li");
  li.className = `cmd-chip prog-item b2-chip cat-${def.cat} is-${block.type}`;
  li.dataset.id = block.id;
  const grip = document.createElement("span");
  grip.className = "grip";
  grip.textContent = "⠿";
  li.appendChild(grip);
  makeDragSource(grip, () => ({ kind: "move", id: block.id, game: b2scripts, label: def.label }));
  b2BlockFace(block, li);
  li.appendChild(b2RemoveBtn(block));
  return li;
}

function b2RenderBodyRegion(arr, label) {
  const region = document.createElement("div");
  region.className = "block-body dropzone b2-body";
  const lab = document.createElement("div");
  lab.className = "block-body-label";
  lab.textContent = label;
  region.appendChild(lab);
  if (!arr.length) {
    const e = document.createElement("div");
    e.className = "program-empty";
    e.textContent = "Drag blocks here.";
    region.appendChild(e);
  } else {
    arr.forEach((b, i) => region.appendChild(b2RenderBlock(b, arr, i)));
  }
  wireDropzone(b2scripts, region, arr);
  return region;
}

function b2RemoveBtn(block) {
  const rm = document.createElement("button");
  rm.className = "remove";
  rm.textContent = "✕";
  rm.title = "Remove block";
  rm.setAttribute("draggable", "false");
  rm.addEventListener("pointerdown", (e) => e.stopPropagation());
  rm.addEventListener("click", (e) => {
    e.stopPropagation();
    const found = b2FindBlock(B2.scripts, block.id);
    if (found) found.arr.splice(found.index, 1);
    b2RenderScripts();
  });
  return rm;
}

/* append a block's human-readable label + any inline dropdowns/inputs */
function b2BlockFace(block, container) {
  const txt = (s) => container.appendChild(document.createTextNode(" " + s + " "));
  const sel = (opts, val, onChange) => {
    const s = document.createElement("select");
    s.className = "cond-select b2-select";
    s.innerHTML = opts.map((o) => `<option value="${o.key}"${o.key === val ? " selected" : ""}>${o.label}</option>`).join("");
    s.value = val;
    s.addEventListener("pointerdown", (e) => e.stopPropagation());
    s.addEventListener("change", () => { onChange(s.value); B2_SESSION.saveScripts(); });
    container.appendChild(s);
  };
  switch (block.type) {
    case "whenPlay":  txt("when ▶ Play is clicked"); break;
    case "whenKey":   txt("when"); sel(DIR_OPTS, block.dir, (v) => (block.dir = v)); txt("arrow pressed (key or arrow pad)"); break;
    case "whenTouch": txt("when the robot touches a"); sel(b2TouchTileOpts(), block.tile, (v) => (block.tile = v)); break;
    case "move":      txt("move"); sel(DIR_OPTS, block.dir, (v) => (block.dir = v)); break;
    case "collect":   txt("pick it up 🎒"); break;
    case "openDoor":  txt("open the door 🔓"); break;
    case "push":      txt("push it forward 📦"); break;
    case "win":       txt("the player wins! 🏆"); break;
    case "say": {
      txt("show message");
      const inp = document.createElement("input");
      inp.type = "text";
      inp.className = "b2-say-input";
      inp.maxLength = 60;
      inp.value = block.text || "";
      inp.addEventListener("pointerdown", (e) => e.stopPropagation());
      inp.addEventListener("input", () => { block.text = inp.value; B2_SESSION.saveScripts(); });
      container.appendChild(inp);
      break;
    }
    case "ifKey":     txt("if carrying a 🔑 key"); break;
    case "ifCookies": txt(`if every ${B2.skin.C} is collected`); break;
  }
}

/* ============================================================
   Game settings + share link
   ============================================================ */
function b2ReadSettings() {
  const v = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
  return {
    title: v("b2-title") || B2_DEFAULTS.title,
    intro: v("b2-intro") || B2_DEFAULTS.intro,
    win:   v("b2-win")   || B2_DEFAULTS.win,
  };
}

function b2EncodeGame() {
  const s = b2ReadSettings();
  const data = {
    v: 5,
    t: s.title, i: s.intro, w: s.win,
    c: B2.model.cols, r: B2.model.rows,
    g: B2.model.grid.map((row) => row.join("")),
    s: B2.scripts.map(b2StripBlock),
    k: B2.skin,
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}
/* shrink a block to just its data for the URL (ids are regenerated on load) */
function b2StripBlock(b) {
  const o = { type: b.type };
  if (b.dir)  o.dir = b.dir;
  if (b.tile) o.tile = b.tile;
  if (typeof b.text === "string") o.text = b.text;
  if (Array.isArray(b.body)) o.body = b.body.map(b2StripBlock);
  return o;
}
function b2ReviveBlock(o) {
  if (!o || !BLOCK_DEFS[o.type]) return null;
  const b = b2MakeBlock(o.type);
  if (o.dir)  b.dir = o.dir;
  if (o.tile) b.tile = o.tile;
  if (typeof o.text === "string") b.text = o.text;
  if (Array.isArray(o.body)) b.body = o.body.map(b2ReviveBlock).filter(Boolean);
  return b;
}
/* convert old v:4 rule links into scripts so existing links still work */
function b2RulesToScripts(rules) {
  const out = DIR_LIST.map((dir) => {
    const hat = b2MakeBlock("whenKey"); hat.dir = dir;
    const mv = b2MakeBlock("move");     mv.dir = dir;
    hat.body = [mv];
    return hat;
  });
  const touch = (tile, body) => { const h = b2MakeBlock("whenTouch"); h.tile = tile; h.body = body; out.push(h); };
  (rules || []).forEach((r) => {
    if (r.type === "collect")   touch(r.tile === "K" ? "K" : "C", [b2MakeBlock("collect")]);
    else if (r.type === "door") { const i = b2MakeBlock("ifKey"); i.body = [b2MakeBlock("openDoor")]; touch("D", [i]); }
    else if (r.type === "push") touch("B", [b2MakeBlock("push")]);
    else if (r.type === "win") {
      if (r.when === "always") touch("H", [b2MakeBlock("win")]);
      else { const i = b2MakeBlock("ifCookies"); i.body = [b2MakeBlock("win")]; touch("H", [i]); }
    }
  });
  return out;
}
function b2DecodeGame(code) {
  const data = JSON.parse(decodeURIComponent(escape(atob(code))));
  let scripts;
  if (Array.isArray(data.s) && data.s.length) scripts = data.s.map(b2ReviveBlock).filter(Boolean);
  else if (Array.isArray(data.rules))         scripts = b2RulesToScripts(data.rules); // v:4 link
  if (!scripts || !scripts.length)            scripts = B2_DEFAULT_SCRIPTS();
  return {
    model:    { cols: data.c, rows: data.r, grid: data.g.map((r) => r.split("")) },
    settings: { title: data.t, intro: data.i, win: data.w },
    scripts,
    skin: b2CleanSkin(data.k),
  };
}

function b2MakeShareLink() {
  if (!b2FindChar(B2.model.grid, "P") || !b2FindChar(B2.model.grid, "H")) {
    b2Msg("bad", "Add a 🤖 robot and a 🏠 house in Step 4 before sharing!");
    showPanel("b2-build");
    return;
  }
  const url = `${location.origin}${location.pathname}#play=${b2EncodeGame()}`;
  document.getElementById("b2-share-link").value = url;
  document.getElementById("b2-share-result").hidden = false;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(
      () => b2ShareNote("✅ Link copied! Send it to a friend — they'll play your maze with arrow keys."),
      () => b2ShareNote("Select the link above and copy it to share your game."));
  } else {
    b2ShareNote("Select the link above and copy it to share your game.");
  }
}
function b2ShareNote(text) { const el = document.getElementById("b2-share-note"); if (el) el.textContent = text; }

function b2OpenShared(code) {
  let decoded;
  try { decoded = b2DecodeGame(code); } catch (e) { return false; }
  B2.fromShared = true;
  B2.model    = decoded.model;
  B2.settings = decoded.settings;
  B2.scripts  = decoded.scripts;
  B2.skin     = decoded.skin;
  b2SwitchBadge(2);
  showPanel("b2-build");
  b2ApplySharedMode(true);
  b2ApplySkin();
  b2RenderLegend();
  b2SyncLevel();
  renderGrid(b2game);
  b2UpdateHud();
  b2Msg("info", "Use the arrow keys or buttons to solve this maze!");
  b2ShowModal({
    emoji: "🎮",
    title: decoded.settings.title || B2_DEFAULTS.title,
    msg:   decoded.settings.intro || B2_DEFAULTS.intro,
    actions: [{ label: "▶ Play", primary: true, onClick: () => { b2HideModal(); b2PlayerStart(); } }],
  });
  return true;
}
function b2ApplySharedMode(on) {
  ["b2-design-box", "b2-settings", "b2-scripts-box"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = on ? "none" : "";
  });
  const banner = document.getElementById("b2-shared-hint");
  if (banner) banner.hidden = !on;
}
function b2ExitShared() {
  B2.fromShared = false;
  B2.scripts = B2_DEFAULT_SCRIPTS();
  B2.skin = B2_SESSION.loadSkin();
  b2ApplySharedMode(false);
  b2ApplySkin();
  b2RenderTools();
  b2RenderLegend();
  b2RenderSkinSelectors();
  b2RenderScripts();
  if (location.hash.startsWith("#play=")) history.replaceState(null, "", location.pathname);
  b2SetSize(B2_DEFAULT_SIZE);
  b2Msg("info", "Your turn — design a maze and code the rules!");
}

/* ============================================================
   Modal (title / win cards)
   ============================================================ */
function b2ShowModal({ emoji, title, msg, actions }) {
  const overlay = document.getElementById("b2-modal");
  overlay.querySelector(".b2-modal-emoji").textContent = emoji || "🎮";
  overlay.querySelector("h2").textContent = title || "";
  overlay.querySelector("p").textContent  = msg   || "";
  const wrap = overlay.querySelector(".b2-modal-actions");
  wrap.innerHTML = "";
  (actions || []).forEach((a) => {
    const b = document.createElement("button");
    b.className = "btn" + (a.primary ? " btn-primary" : "");
    b.textContent = a.label;
    b.addEventListener("click", a.onClick);
    wrap.appendChild(b);
  });
  overlay.hidden = false;
}
function b2HideModal() { const o = document.getElementById("b2-modal"); if (o) o.hidden = true; }

/* ============================================================
   Panel content
   ============================================================ */
function b2BuildWelcome() {
  return `
    <div class="welcome-card">
      <h2>Badge 2 — Digital Game Design 🎮</h2>
      <p>What makes your favorite video game fun? Game creators use <strong>rules and events</strong> to tell the computer what to do. Now it's your turn — <strong>design a maze game, code how it works, and share it with friends!</strong></p>
      <ol class="steps-list">
        <li><strong>Discover</strong> how game design can help people.</li>
        <li><strong>Explore</strong> the ideas — sequence, loops, and conditionals.</li>
        <li><strong>Plan</strong> your maze game.</li>
        <li><strong>Build &amp; test</strong> it — draw a maze, drag rule blocks, then play it with arrow keys.</li>
        <li><strong>Share &amp; improve</strong> it with others.</li>
      </ol>
      <p class="welcome-note">When you finish, you'll know how games are <strong>designed</strong> — rules, mechanics, playtesting, and all!</p>
      <button class="btn btn-primary btn-big" data-b2goto="b2-discover">Start Step 1 →</button>
    </div>`;
}

function b2BuildDiscover() {
  const cards = GAMES_FOR_GOOD.map((c) => `
    <div class="pioneer">
      <a class="pioneer-photo" href="${c.link}" target="_blank" rel="noopener"><div class="face">${c.emoji}</div></a>
      <h3><a href="${c.link}" target="_blank" rel="noopener">${c.title}</a></h3>
      <div class="years">${c.tag}</div>
      <p>${c.text}</p>
      <a class="b2-source" href="${c.link}" target="_blank" rel="noopener">Source: ${c.source} →</a>
    </div>`).join("");
  return `
    <div class="level-head"><h2>Step 1 — Discover</h2><span class="difficulty easy">Game design for good</span></div>
    <div class="b2-intro-card b2-prose">
      <p>You've learned how computers helped astronauts land on the Moon 🚀. Did you know <strong>real video games</strong> have helped people too — solving science mysteries, fighting disease, and even designing neighborhoods?</p>
      <p>Here are real games and projects that did good in the world. <strong>Tap any game's name or picture</strong> to read more about it!</p>
      <div class="card-grid">${cards}</div>
      <p class="credit">Real-world examples and facts come from the sources linked on each card — including <a href="https://www.scientificamerican.com/article/foldit-gamers-solve-riddle/" target="_blank" rel="noopener">Scientific American</a>, <a href="https://www.alzheimersresearchuk.org/research/for-researchers/resources-and-information/sea-hero-quest/" target="_blank" rel="noopener">Alzheimer's Research UK</a>, <a href="https://en.wikipedia.org/wiki/Re-Mission" target="_blank" rel="noopener">Wikipedia</a>, <a href="https://www.blockbyblock.org/" target="_blank" rel="noopener">UN-Habitat's Block by Block</a>, <a href="https://www.princeton.edu/news/2018/05/17/princeton-researchers-crowdsource-brain-mapping-gamers-discover-six-new-neuron" target="_blank" rel="noopener">Princeton University</a>, and <a href="https://scistarter.org/eve-online-project-discovery" target="_blank" rel="noopener">SciStarter</a>. Tap a game to learn more.</p>
      <div class="b2-reflect">
        <label for="b2-r-discover">✏️ What kind of game could <strong>you</strong> create to teach someone a new skill, or to help solve a problem?</label>
        <textarea id="b2-r-discover" rows="3" placeholder="My game could help people…"></textarea>
        <p class="b2-saved-note">Your answer is saved on this device automatically. 💾</p>
      </div>
      <button class="btn btn-primary" data-b2goto="b2-explore">Next: Explore the ideas →</button>
    </div>`;
}

function b2BuildExplore() {
  return `
    <div class="level-head"><h2>Step 2 — Explore</h2><span class="difficulty easy">How games think</span></div>
    <div class="b2-intro-card b2-prose">
      <p>Making a video game uses the same three big ideas you learned in <strong>Badge 1</strong>: <strong>sequence</strong>, <strong>loops</strong>, and <strong>conditionals</strong>. Here's how each one shows up in a game:</p>
      <p>📋 <strong>Sequence</strong> means doing things in the right order. A game runs your steps one after another, exactly as you set them up — just like putting the robot's commands in order in Badge 1.</p>
      <p>🔁 <strong>Loops</strong> repeat things again and again. Games are full of loops: an enemy patrols back and forth, a timer counts down, and the player keeps trying until they win — just like the <em>Repeat</em> block in Badge 1.</p>
      <p>❓ <strong>Conditionals</strong> let the game make choices with <em>IF</em>. <em>IF the robot has a key, THEN the door opens. IF every cookie is collected, THEN the player wins.</em> Without conditionals, every situation would be the same — pretty boring!</p>
      <div class="b2-callout">You'll build your game with these same three ideas from Badge 1 — <strong>sequence, loops, and conditionals</strong> — by snapping blocks together. Then a friend uses the <strong>arrow keys</strong> to play. That's exactly how real game design works!</div>
      <div class="b2-reflect">
        <label for="b2-r-game">✏️ What is your favorite video game?</label>
        <textarea id="b2-r-game" rows="1" placeholder="My favorite game is…"></textarea>

        <label for="b2-r-seq" style="margin-top:10px;">Where is a <strong>sequence</strong> in it (steps that happen in order)?</label>
        <p class="b2-eg">Example: in a racing game, you press start → the lights count down → then the cars go.</p>
        <textarea id="b2-r-seq" rows="2" placeholder="A sequence in my game is…"></textarea>

        <label for="b2-r-loop" style="margin-top:10px;">Where is a <strong>loop</strong> in it (something that repeats)?</label>
        <p class="b2-eg">Example: in Pac-Man, the ghosts move back and forth again and again.</p>
        <textarea id="b2-r-loop" rows="2" placeholder="A loop in my game is…"></textarea>

        <label for="b2-r-cond" style="margin-top:10px;">Where is a <strong>conditional</strong> in it (a choice, or an <em>IF</em>)?</label>
        <p class="b2-eg">Example: in Mario, IF you touch a mushroom, THEN you grow bigger.</p>
        <textarea id="b2-r-cond" rows="2" placeholder="A conditional in my game is…"></textarea>
      </div>
      <button class="btn btn-primary" data-b2goto="b2-plan">Next: Plan your game →</button>
    </div>`;
}

function b2BuildPlan() {
  return `
    <div class="level-head"><h2>Step 3 — Plan</h2><span class="difficulty medium">Plan your maze game</span></div>
    <div class="b2-intro-card b2-prose">
      <p>Game makers <strong>plan</strong> before they build. That's part of the <em>game design process</em>: plan → build → test → improve → share. Fill in your plan — you'll use it in the next step!</p>
      <form class="b2-form" onsubmit="return false">
        <div class="field"><label for="b2-p-title">🎮 What's your game called?</label><input type="text" id="b2-p-title" placeholder="The Cookie Quest" /></div>
        <div class="field"><label for="b2-p-problem">💡 How does your game help, teach, or solve a problem ("for good")?</label><textarea id="b2-p-problem" rows="2" placeholder="My game teaches…"></textarea></div>
        <div class="field"><label for="b2-p-goal">🏁 What is the player trying to do?</label><textarea id="b2-p-goal" rows="2" placeholder="The player has to…"></textarea></div>
        <div class="field"><label>🧩 What challenges will you add? (check the ones you'll use)</label>
          <ul class="b2-checklist">
            <li><input type="checkbox" id="b2-p-c1"><label for="b2-p-c1">🧱 Walls and a tricky path</label></li>
            <li><input type="checkbox" id="b2-p-c2"><label for="b2-p-c2">🔑 Keys and 🚪 locked doors</label></li>
            <li><input type="checkbox" id="b2-p-c3"><label for="b2-p-c3">🍪 Cookies to collect</label></li>
            <li><input type="checkbox" id="b2-p-c5"><label for="b2-p-c5">📦 Pushable blocks</label></li>
          </ul>
        </div>
        <div class="field"><label for="b2-p-rule">⚙️ Write one rule you'll code: <em>WHEN … → THEN …</em></label><textarea id="b2-p-rule" rows="2" placeholder="WHEN the robot reaches a 🍪 cookie → pick it up"></textarea></div>
      </form>
      <button class="btn btn-primary" data-b2goto="b2-build">Next: Build it! →</button>
    </div>`;
}

function b2BuildBuild() {
  const sizes = B2_SIZES.map((n) => `<option value="${n}"${n === B2_DEFAULT_SIZE ? " selected" : ""}>${n} × ${n}</option>`).join("");
  return `
    <div class="level-head"><h2>Step 4 — Build &amp; Test</h2><span class="difficulty medium">Make it real</span></div>
    <ol class="b2-quickstart">
      <li><span class="b2-qs-num">1</span><div><b>Draw your maze</b> with the paint tools.</div></li>
      <li><span class="b2-qs-num">2</span><div><b>Snap an Event block</b>, then drop an action under it.</div></li>
      <li><span class="b2-qs-num">3</span><div><b>Press ▶ Play</b> to test — then tweak and improve!</div></li>
    </ol>

    <details class="b2-guide">
      <summary>❓ How it all works — tap if you get stuck</summary>
      <div class="b2-guide-body">
        <div class="b2-guide-col">
          <h4>🧩 Maze pieces</h4>
          <ul>
            <li><span class="b2-guide-ico">🤖</span><div><b>Robot</b> — the player. Moves with the arrow keys.</div></li>
            <li><span class="b2-guide-ico">🏠</span><div><b>House</b> — the goal. A <b>when robot touches 🏠</b> script decides when reaching it wins.</div></li>
            <li><span class="b2-guide-ico">🍪</span><div><b>Cookie</b> — a <b>when robot touches 🍪 → pick it up</b> script collects it.</div></li>
            <li><span class="b2-guide-ico">🔑</span><div><b>Key</b> — collect it so the robot can open doors.</div></li>
            <li><span class="b2-guide-ico">🚪</span><div><b>Door</b> — an <b>open the door</b> script opens it when the robot has a key.</div></li>
            <li><span class="b2-guide-ico">📦</span><div><b>Block</b> — a <b>push it</b> script lets the robot shove it (if the space behind is empty).</div></li>
            <li><span class="b2-guide-ico">🧱</span><div><b>Wall</b> — always solid, no script needed.</div></li>
          </ul>
        </div>
        <div class="b2-guide-col">
          <h4>🧩 How code blocks work</h4>
          <p style="font-size:0.9rem; margin:0 0 8px;">Snap blocks under an <b>event</b> "hat" — when the event happens, the blocks underneath run in order:</p>
          <ul>
            <li><span class="b2-guide-ico">🟡</span><div><b>Events</b> — <i>when ▶ Play clicked</i>, <i>when an arrow is pressed</i> (keyboard or the arrow pad), <i>when the robot touches</i> a piece.</div></li>
            <li><span class="b2-guide-ico">🔵</span><div><b>Motion</b> — <i>move up / down / left / right</i>.</div></li>
            <li><span class="b2-guide-ico">🟣</span><div><b>Actions</b> — <i>pick it up</i>, <i>open the door</i>, <i>push it</i>, <i>win the game</i>, <i>show message</i>.</div></li>
            <li><span class="b2-guide-ico">🟠</span><div><b>Control</b> — <i>if carrying a key</i>, <i>if all cookies collected</i> — put blocks inside to run them only when it's true.</div></li>
          </ul>
          <p style="font-size:0.85rem; color:#6b5d7d; margin-top:6px;">Your script area starts empty — drag an <b>Event</b> block in first, then snap actions underneath it. No script for a piece? Then a 🚪 door or 📦 block stays solid like a wall. Remove a block with ✕.</p>
        </div>
      </div>
    </details>

    <div id="b2-shared-hint" hidden>
      <div class="b2-callout">🎁 You're playing a friend's game! Use the arrow keys or buttons to solve their maze.</div>
    </div>

    <div class="b2-build-workspace">
      <div class="box" id="b2-settings">
        <h3>Game settings</h3>
        <div class="b2-form b2-settings-grid">
          <div class="field"><label for="b2-title">Title</label><input type="text" id="b2-title" placeholder="${B2_DEFAULTS.title}" /></div>
          <div class="field"><label for="b2-intro">Start message</label><textarea id="b2-intro" rows="2" placeholder="${B2_DEFAULTS.intro}"></textarea></div>
          <div class="field"><label for="b2-win">Win message</label><textarea id="b2-win" rows="2" placeholder="${B2_DEFAULTS.win}"></textarea></div>
        </div>
      </div>

      <div class="box b2-game-box">
        <h3>Your game</h3>
        <div id="b2-design-box">
          <div id="b2-design">
            <div class="maze-size">
              <span class="size-label">Size:</span>
              <select class="cond-select" id="b2-size">${sizes}</select>
              <button class="maze-tool random" id="b2-random">🎲 Random</button>
              <button class="maze-tool alt" id="b2-clear-maze">✖ Clear</button>
            </div>
            <div class="maze-tools" id="b2-tools">${b2ToolsHTML()}</div>
            <div class="b2-skins" id="b2-skins">
              <span class="size-label">Icons:</span>
              <label>Player <select class="cond-select" id="b2-skin-P"></select></label>
              <label>Item <select class="cond-select" id="b2-skin-C"></select></label>
              <label>Goal <select class="cond-select" id="b2-skin-H"></select></label>
            </div>
          </div>
        </div>
        <div class="b2-hud" id="b2-hud" hidden></div>
        <div class="stage-wrap"><div class="grid" id="grid-b2"></div></div>
        <p class="legend" id="b2-legend"></p>
        <div class="controls" style="margin-top:10px;">
          <button class="btn btn-run" id="b2-play">▶ Play</button>
          <button class="btn" id="b2-stop" disabled>⏹ Stop</button>
        </div>
        <div class="run-msg info" id="msg-b2">Draw a maze, set your rules, then press ▶ Play!</div>
        <div class="b2-dpad-wrap">
          <div class="b2-dpad" id="b2-dpad" hidden tabindex="0">
            <button class="dpad-btn dpad-up"    data-b2dir="0,-1">▲</button>
            <div class="dpad-middle">
              <button class="dpad-btn dpad-left"  data-b2dir="-1,0">◀</button>
              <div class="dpad-center"></div>
              <button class="dpad-btn dpad-right" data-b2dir="1,0">▶</button>
            </div>
            <button class="dpad-btn dpad-down"  data-b2dir="0,1">▼</button>
          </div>
        </div>
      </div>

      <div class="box palette b2-scripts-box" id="b2-scripts-box">
        <div class="b2-code-cols">
          <div class="b2-code-palette">
            <h3>🧩 Code Blocks</h3>
            <p class="palette-hint">Snap blocks under an <b>event</b> to say what happens — just like Scratch! Drag a block from the palette into <b>Your Scripts</b>.</p>
            <div class="b2-scripts-palette" id="b2-scripts-palette"></div>
          </div>
          <div class="b2-code-scripts">
            <div class="builder-target b2-scripts-head">
              <span>Your Scripts — drop blocks into the area below ↓</span>
              <button class="maze-tool alt" id="b2-clear-scripts" type="button">✖ Clear blocks</button>
            </div>
            <ul class="program-list dropzone b2-scripts-list" id="scripts-b2"></ul>
          </div>
        </div>
      </div>
    </div>
    <button class="btn btn-primary" data-b2goto="b2-share" style="margin-top:18px;">Next: Share &amp; improve →</button>`;
}

function b2BuildShare() {
  return `
    <div class="level-head"><h2>Step 5 — Share &amp; Improve</h2><span class="difficulty medium">Iterate!</span></div>
    <div class="b2-intro-card b2-prose">
      <p>The best part of a big project is <strong>sharing</strong> it. When people play your game, you see what they enjoy — and get ideas to make it better. Even after a game comes out, makers keep improving it. That's <em>iteration</em>!</p>

      <h3 style="color:var(--purple);">🔗 Share your game</h3>
      <p>Make a link your friend can open to play your maze with arrow keys — your rules come along for the ride.</p>
      <button class="btn btn-primary" id="b2-make-link">🔗 Create share link</button>
      <div id="b2-share-result" hidden>
        <div class="b2-share-box">
          <input type="text" id="b2-share-link" readonly />
          <button class="btn" id="b2-copy-link">📋 Copy</button>
        </div>
        <p class="b2-saved-note" id="b2-share-note"></p>
      </div>

      <h3 style="color:var(--purple); margin-top:22px;">🧪 Playtest checklist</h3>
      <p>Ask a friend or family member to play. Check off what's true:</p>
      <ul class="b2-checklist">
        <li><input type="checkbox" id="b2-t1"><label for="b2-t1">A new player could solve the maze with the arrow keys.</label></li>
        <li><input type="checkbox" id="b2-t2"><label for="b2-t2">It's not too easy <em>and</em> not too hard.</label></li>
        <li><input type="checkbox" id="b2-t3"><label for="b2-t3">The start and win messages make sense.</label></li>
        <li><input type="checkbox" id="b2-t4"><label for="b2-t4">My game teaches or helps with something.</label></li>
        <li><input type="checkbox" id="b2-t5"><label for="b2-t5">A friend played it and had fun!</label></li>
      </ul>

      <div class="b2-reflect">
        <label for="b2-improve">✏️ What will you change to make your game better next time? (your <em>next iteration</em>)</label>
        <textarea id="b2-improve" rows="3" placeholder="Next, I will…"></textarea>
      </div>

      <div class="b2-tip"><h3>Keep going! 💪</h3>
        <p>Making something new takes <strong>perseverance</strong>. Every great game maker tries again and again. If at first you don't succeed: try, try again!</p></div>

      <h3 style="color:var(--purple);">🎉 You earned it!</h3>
      <p>Now you know how games are <strong>planned, built, tested, and improved</strong>. Give service by teaching a friend the game design process, or by sharing games that help science and health research.</p>
    </div>`;
}

/* ============================================================
   Wiring & init
   ============================================================ */
const B2_TABS = [
  { target: "b2-welcome",  num: "▶", label: "Start",   build: b2BuildWelcome  },
  { target: "b2-discover", num: "1",  label: "Discover", build: b2BuildDiscover },
  { target: "b2-explore",  num: "2",  label: "Explore",  build: b2BuildExplore  },
  { target: "b2-plan",     num: "3",  label: "Plan",     build: b2BuildPlan     },
  { target: "b2-build",    num: "4",  label: "Build",    build: b2BuildBuild    },
  { target: "b2-share",    num: "5",  label: "Share",    build: b2BuildShare    },
];

function b2WireBuild() {
  // delegated tool-pick handler (survives re-rendering the tools on icon change)
  const toolsEl = document.getElementById("b2-tools");
  toolsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-b2tool]");
    if (!b || b2game.playing) return;
    B2.tool = b.dataset.b2tool;
    toolsEl.querySelectorAll("[data-b2tool]").forEach((x) =>
      x.classList.toggle("is-active", x.dataset.b2tool === B2.tool));
    if (!B2.fromShared) b2RenderEditor();
  });
  toolsEl.querySelectorAll("[data-b2tool]").forEach((x) =>
    x.classList.toggle("is-active", x.dataset.b2tool === B2.tool));

  // icon pickers (player / item / goal / key / door)
  Object.keys(B2_SKINS).forEach((role) => {
    const sel = document.getElementById(`b2-skin-${role}`);
    if (sel) sel.addEventListener("change", () => {
      if (b2game.playing) return;
      if (B2_SKINS[role].options.includes(sel.value)) B2.skin[role] = sel.value;
      b2OnSkinChange();
    });
  });
  b2RenderSkinSelectors();
  b2ApplySkin();
  b2RenderTools();
  b2RenderLegend();
  document.getElementById("b2-size").addEventListener("change", (e) => {
    if (!b2game.playing) b2SetSize(parseInt(e.target.value, 10));
  });
  document.getElementById("b2-random").addEventListener("click", () => {
    if (b2game.playing) return;
    const n = B2.model.cols;
    B2.model = { cols: n, rows: n, grid: b2GenMaze(n, n) };
    b2RenderEditor();
    B2_SESSION.saveModel();
    b2Msg("info", "A random maze! Add items, set the rules, then press ▶ Play.");
  });
  document.getElementById("b2-clear-maze").addEventListener("click", () => {
    if (!b2game.playing) b2SetSize(B2.model.cols);
  });
  document.getElementById("b2-clear-scripts").addEventListener("click", () => {
    if (b2scripts.playing || !B2.scripts.length) return;
    B2.scripts = [];
    b2RenderScripts(); // re-renders the empty state and saves the cleared session
  });

  document.getElementById("b2-play").addEventListener("click", b2PlayerStart);
  document.getElementById("b2-stop").addEventListener("click", () => { if (b2game.playing) b2PlayerStop(); });

  ["b2-title", "b2-intro", "b2-win"].forEach((id) => b2Autosave(document.getElementById(id), `game.${id}`));
  const titleEl = document.getElementById("b2-title");
  if (titleEl && !titleEl.value) {
    const planTitle = b2Load("plan.b2-p-title", "");
    if (planTitle) { titleEl.value = planTitle; b2Save("game.b2-title", planTitle); }
  }

  document.querySelectorAll("[data-b2dir]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [dx, dy] = btn.dataset.b2dir.split(",").map(Number);
      b2FireKey(dy < 0 ? "up" : dy > 0 ? "down" : dx < 0 ? "left" : "right");
    });
    btn.addEventListener("mousedown", (e) => e.preventDefault());
  });

  document.addEventListener("keydown", (e) => {
    if (!b2game.playing) return;
    const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    if (map[e.key]) { e.preventDefault(); b2FireKey(map[e.key]); }
  });

  // safety net: if we guessed "keyboard" but the player touches the screen
  // mid-game, reveal the arrow pad so a touch device is never stuck
  document.addEventListener("pointerdown", (e) => {
    if (!b2game.playing || e.pointerType !== "touch") return;
    const dpad = document.getElementById("b2-dpad");
    if (dpad && dpad.hidden) dpad.hidden = false;
  }, { passive: true });

  b2RenderScripts();
}

function b2WireShare() {
  document.getElementById("b2-make-link").addEventListener("click", b2MakeShareLink);
  document.getElementById("b2-copy-link").addEventListener("click", () => {
    const input = document.getElementById("b2-share-link");
    input.select();
    if (navigator.clipboard) navigator.clipboard.writeText(input.value);
    b2ShareNote("✅ Copied! Paste it to a friend.");
  });
  ["b2-t1", "b2-t2", "b2-t3", "b2-t4", "b2-t5"].forEach((id) =>
    b2AutosaveCheck(document.getElementById(id), `share.${id}`));
  b2Autosave(document.getElementById("b2-improve"), "share.improve");
}

function b2WireReflections() {
  ["b2-r-discover", "b2-r-game", "b2-r-seq", "b2-r-loop", "b2-r-cond"].forEach((id) =>
    b2Autosave(document.getElementById(id), `reflect.${id}`));
  ["b2-p-title", "b2-p-problem", "b2-p-goal", "b2-p-rule"].forEach((id) =>
    b2Autosave(document.getElementById(id), `plan.${id}`));
  ["b2-p-c1", "b2-p-c2", "b2-p-c3", "b2-p-c5"].forEach((id) =>
    b2AutosaveCheck(document.getElementById(id), `plan.${id}`));
}

function b2SwitchBadge(n) {
  document.body.classList.toggle("view-badge-2", n === 2);
  document.body.classList.toggle("view-badge-1", n !== 2);
  document.querySelectorAll(".badge-switch button").forEach((b) =>
    b.classList.toggle("is-active", Number(b.dataset.badge) === n));
  const footer = document.querySelector(".site-footer p");
  if (footer) {
    footer.innerHTML = n === 2
      ? 'Built for the Girl Scouts <em>Junior Coding for Good</em> — Badge 2: Game Design.'
      : 'Built for the Girl Scouts <em>Junior Coding for Good</em> — Badge 1: Coding Basics.';
  }
  showPanel(n === 2 ? "b2-welcome" : "welcome");
}

function b2Init() {
  const tabsNav = document.getElementById("tabs");
  const main    = document.querySelector("main");
  if (!tabsNav || !main) return;

  if (typeof window.showPanel === "function" && !window.showPanel._b2wrapped) {
    const orig = window.showPanel;
    window.showPanel = function (id) {
      orig(id);
      if (id === "b2-build") requestAnimationFrame(b2FitGrid);
      B2_SESSION.savePlace(id);
      B2_SESSION.markVisited(id);
      b2MarkVisitedTabs();
    };
    window.showPanel._b2wrapped = true;
  }

  tabsNav.querySelectorAll(".tab").forEach((t) => { if (!t.dataset.badge) t.dataset.badge = "1"; });

  const switcher = document.createElement("div");
  switcher.className = "badge-switch";
  switcher.innerHTML = `
    <button data-badge="1" class="is-active"><span class="badge-emoji">🤖</span>Badge 1: Coding Basics</button>
    <button data-badge="2"><span class="badge-emoji">🎮</span>Badge 2: Game Design</button>`;
  tabsNav.parentNode.insertBefore(switcher, tabsNav);
  switcher.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => b2SwitchBadge(Number(b.dataset.badge))));

  B2_TABS.forEach((t) => {
    const tab = document.createElement("button");
    tab.className = "tab";
    tab.dataset.target = t.target;
    tab.dataset.badge  = "2";
    tab.innerHTML = `<span class="tab-num">${t.num}</span> ${t.label}`;
    tab.addEventListener("click", () => showPanel(t.target));
    tabsNav.appendChild(tab);

    const section = document.createElement("section");
    section.id        = t.target;
    section.className = "panel";
    section.innerHTML = t.build();
    main.appendChild(section);
  });

  const modal = document.createElement("div");
  modal.id        = "b2-modal";
  modal.className = "b2-modal";
  modal.hidden    = true;
  modal.innerHTML = `<div class="b2-modal-box"><div class="b2-modal-emoji">🎮</div><h2></h2><p></p><div class="b2-modal-actions"></div></div>`;
  document.body.appendChild(modal);

  document.querySelectorAll("[data-b2goto]").forEach((btn) =>
    btn.addEventListener("click", () => showPanel(btn.dataset.b2goto)));

  // restore a saved session (maze + scripts), else start fresh
  B2.model = B2_SESSION.loadModel() || { cols: B2_DEFAULT_SIZE, rows: B2_DEFAULT_SIZE, grid: b2Blank(B2_DEFAULT_SIZE, B2_DEFAULT_SIZE) };
  const savedScripts = B2_SESSION.loadScripts();
  if (savedScripts) B2.scripts = savedScripts;
  B2.skin = B2_SESSION.loadSkin();

  b2WireBuild();
  b2WireShare();
  b2WireReflections();
  b2RenderEditor();
  const sizeSel = document.getElementById("b2-size");
  if (sizeSel) sizeSel.value = String(B2.model.cols);

  window.addEventListener("resize", () => { if (B2.model && !b2game.playing) b2FitGrid(); });
  document.body.classList.add("view-badge-1");
  b2MarkVisitedTabs();

  if (location.hash.startsWith("#play=")) {
    b2OpenShared(location.hash.slice("#play=".length));
  } else {
    // return the user to where they left off
    const savedPanel = b2Load("session.panel", "");
    if (b2Load("session.badge", "1") === "2") b2SwitchBadge(2);
    if (savedPanel && document.getElementById(savedPanel)) showPanel(savedPanel);
  }
}

document.addEventListener("DOMContentLoaded", b2Init);
