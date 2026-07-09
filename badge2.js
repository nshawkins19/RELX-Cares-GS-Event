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
    text: "Players folding proteins in this puzzle game cracked the shape of an AIDS-virus enzyme in just 3 weeks — a puzzle that stumped scientists for 15 years. The gamers even became co-authors of a real science paper!",
    source: "Scientific American",
    link: "https://www.scientificamerican.com/article/foldit-gamers-solve-riddle/",
  },
  {
    emoji: "🧠",
    title: "Sea Hero Quest",
    tag: "Brain research",
    text: "Over 4 million people played this boat-sailing adventure, and the way they found their way around gave scientists a huge set of data to help spot Alzheimer's disease earlier. Playing for fun became real brain research!",
    source: "Alzheimer's Research UK",
    link: "https://www.alzheimersresearchuk.org/research/for-researchers/resources-and-information/sea-hero-quest/",
  },
  {
    emoji: "💊",
    title: "Re-Mission",
    tag: "Health game",
    text: "In this game, young people with cancer pilot a tiny nanobot that blasts cancer cells. A study found kids who played stuck to their treatment better and felt more confident about beating their illness.",
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
    text: "Players trace and color in 3-D pictures of real brain cells. Working together, these 'citizen scientists' helped map the brain — and even discovered six brand-new kinds of brain cells in the eye!",
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
  { key: "cookie", label: "🍪 Cookie" },
  { key: "key",    label: "🔑 Key" },
  { key: "door",   label: "🚪 Door" },
  { key: "robot",  label: "🤖 Robot start" },
  { key: "house",  label: "🏠 House" },
];
const B2_SIZES = [7, 9, 11, 13, 15];
const B2_DEFAULT_SIZE = 9;
/* Badge 2's game pod is full-width, so let its maze cells grow bigger than
   Badge 1's (which sits in a narrow column) to fill the space on wide screens */
const B2_MAX_CELL = 84;

/* ---------------- Themed icons ----------------
   The player (P), the collected item (C), and the goal (H) can be re-skinned
   with emoji that fit different themes (ocean cleanup, community garden, pet
   rescue, space station, helping-hands hospital) — and freely mixed. There's
   no theme picker; the kid just chooses each icon from a list. The game's
   mechanics are identical no matter which emoji is chosen. */
const B2_SKINS = {
  P: { label: "Player", options: ["🤖", "🤿", "👩‍🌾", "🧑‍🚀", "🧑‍⚕️", "🧑‍🚒"] },
  C: { label: "Item",   options: ["🍪", "🥫", "🥕", "🐶", "💊"] },
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
  { key: "H", label: "🏠 house" },
];

/* palette is grouped into Scratch-like color-coded categories */
const B2_CATEGORIES = [
  { cls: "cat-events",  label: "Events",  hint: "when something happens", blocks: ["whenKey", "whenTouch"] },
  { cls: "cat-motion",  label: "Motion",  hint: "move the robot",         blocks: ["move"] },
  { cls: "cat-actions", label: "Actions", hint: "make something happen",  blocks: ["collect", "openDoor", "win", "say"] },
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
    b2ScheduleEmbedRefresh();
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
    b2ScheduleEmbedRefresh();
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
    b2ScheduleEmbedRefresh();
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
  document.querySelectorAll("#b2-design [data-b2tool]").forEach((x) =>
    x.classList.toggle("is-active", x.dataset.b2tool === B2.tool));
}
function b2RenderLegend() {
  const el = document.getElementById("b2-legend");
  if (el) el.innerHTML =
    `${B2.skin.P} player &nbsp;•&nbsp; ${B2.skin.H} goal &nbsp;•&nbsp; ${B2.skin.C} item &nbsp;•&nbsp; 🔑 key &nbsp;•&nbsp; 🚪 door &nbsp;•&nbsp; 🧱 = wall`;
}
/* "when robot touches …" options, with the themed icons */
function b2TouchTileOpts() {
  return [
    { key: "C", label: `${B2.skin.C} item` },
    { key: "K", label: "🔑 key" },
    { key: "D", label: "🚪 door" },
    { key: "H", label: `${B2.skin.H} goal` },
  ];
}
/* fill the icon-picker dropdowns and keep them in sync with B2.skin */
const B2_SKIN_NAMES = {
  "🤖": "Robot", "🤿": "Diver", "👩‍🌾": "Farmer", "🧑‍🚀": "Astronaut", "🧑‍⚕️": "Doctor", "🧑‍🚒": "Firefighter",
  "🏠": "House", "♻️": "Recycle", "🧺": "Laundry", "🐾": "Paw", "🛰️": "Satellite", "🏥": "Hospital",
  "🍪": "Cookie", "🥫": "Soda can", "🥕": "Carrot", "🐶": "Puppy", "💊": "Pill",
};
function b2RenderSkinSelectors() {
  Object.keys(B2_SKINS).forEach((role) => {
    const sel = document.getElementById(`b2-skin-${role}`);
    if (!sel) return;
    sel.innerHTML = B2_SKINS[role].options
      .map((e) => `<option value="${e}" title="${B2_SKIN_NAMES[e] || e}"${e === B2.skin[role] ? " selected" : ""}>${e}</option>`).join("");
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
    const podR = pod.getBoundingClientRect();
    const above = wrap.getBoundingClientRect().top - podR.top;
    const below = document.body.classList.contains("b2-embed")
      ? podR.bottom - wrap.getBoundingClientRect().bottom + 6
      : 110;
    hBudget = window.innerHeight - headH - above - below;
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
    case "erase": grid[y][x] = "."; break;
    case "cookie": case "key": case "door":
      if (here === "P" || here === "H") { b2Msg("bad", "That square has the 🤖 robot or 🏠 house on it."); return; }
      grid[y][x] = { cookie: "C", key: "K", door: "D" }[B2.tool]; break;
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

/* "show message" action: pop the text briefly ON TOP of the maze (a toast),
   instead of in the bar under it. Auto-fades after a short moment. */
let _b2SayTimer = null;
function b2SayToast(text) {
  const grid = document.getElementById("grid-b2");
  const wrap = grid && grid.closest(".stage-wrap");
  if (!wrap) { b2Msg("info", text); return; }
  let toast = wrap.querySelector(".b2-say-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "b2-say-toast";
    wrap.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.remove("show");
  void toast.offsetWidth; // restart the fade-in even for back-to-back messages
  toast.classList.add("show");
  clearTimeout(_b2SayTimer);
  _b2SayTimer = setTimeout(() => toast.classList.remove("show"), 1900);
}

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
   meets.  Door tiles are bumped (their touch script may
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
    case "say":       if (block.text) b2SayToast(block.text); return "ok";
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

  // door: its touch script acts before we decide to enter
  if (tile === "D") {
    b2RunTouch(tile, nx, ny, d[0], d[1]);
    if (b2ps.grid[ny][nx] === ".") { b2ps.x = nx; b2ps.y = ny; } // opened
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

/* ============================================================
   Arrow-key / D-pad player
   ============================================================ */
function b2PlayerStart() {
  if (!b2FindChar(B2.model.grid, "P")) { b2Msg("bad", "Add a 🤖 robot start — pick the Robot tool and place one!"); return; }
  if (!b2FindChar(B2.model.grid, "H")) { b2Msg("bad", "Add a 🏠 house — pick the House tool and place one!"); return; }

  if (!B2.fromShared) B2.settings = b2ReadSettings(); // shared/embed keeps the creator's title/text
  b2SyncLevel();

  b2ps.grid = B2.model.grid.map((r) => r.slice());
  const start = b2FindChar(B2.model.grid, "P") || { x: 1, y: 1 };
  b2ps.x = start.x; b2ps.y = start.y; b2ps.dir = 1;
  b2ps.keys = 0; b2ps.cookies = 0;
  b2ps.totalCookies = b2CountChar(B2.model.grid, "C");

  b2game.playing = true;
  b2scripts.playing = true;
  b2SetDesignDisabled(true);
  b2SetPlayButtons(true);

  // show the right input (on-screen arrows for touch, keyboard otherwise) and
  // the HUD *before* sizing, so the maze fits with them visible — no scrolling.
  const dpad = document.getElementById("b2-dpad");
  if (dpad) dpad.hidden = !b2UsesTouch();
  b2UpdateHud();

  renderGrid(b2game); // builds the grid and sizes it to fit
  updateCarry(b2game, 0);
  placeRobot(b2game, b2ps, false);
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
  // for a shared/embedded game, Stop returns to the title + description card
  if (B2.fromShared) b2SharedWelcome();
}

/* true when this page is running inside the Share-stage embed iframe */
function b2IsEmbed() { return document.body.classList.contains("b2-embed"); }

/* the embedded/shared game's start card: title + description + Play */
function b2SharedWelcome() {
  b2ShowModal({
    emoji: "🎮",
    title: B2.settings.title || B2_DEFAULTS.title,
    msg: B2.settings.intro || B2_DEFAULTS.intro,
    actions: [{ label: "▶ Play", primary: true, onClick: () => { b2HideModal(); b2PlayerStart(); } }],
  });
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
      ? (b2IsEmbed()
          ? [{ label: "↻ Play again", primary: true, onClick: () => { b2HideModal(); b2PlayerStart(); } }]
          : [{ label: "↻ Play again", onClick: () => { b2HideModal(); b2PlayerStart(); } },
             { label: "Make your own →", primary: true, onClick: () => { b2HideModal(); b2ExitShared(); } }])
      : [{ label: "Got it! 🎉", primary: true, onClick: () => { b2HideModal(); b2PlayerStop(); } }],
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
    B2_SESSION.saveScripts(); // persist the empty state too, so a clear survives a refresh
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

/* embed the user's built game (board + the code they wrote) as a playable
   mini-app: a same-origin iframe that loads this page in "embed" mode with
   the game encoded in the hash, reusing the whole engine + shared-play flow */
/* refresh a play-embed iframe (Share and Finish each have one). Loads the
   game the first time, then pushes updates via postMessage without reloading.
   The per-frame "loaded once" flag lives on the element (frame._b2Ready). */
function b2RefreshEmbedFrame(frameId, emptyId) {
  const frame = document.getElementById(frameId);
  const empty = emptyId ? document.getElementById(emptyId) : null;
  if (!frame || !B2.model) return;
  const ready = !!(b2FindChar(B2.model.grid, "P") && b2FindChar(B2.model.grid, "H"));
  frame.hidden = !ready;
  if (empty) empty.hidden = ready;
  if (!ready) {
    frame.src = "about:blank";
    frame._b2Ready = false;
    return;
  }
  const code = b2EncodeGame();
  if (frame._b2Ready) {
    frame.contentWindow.postMessage({ type: "b2update", code }, location.origin);
  } else {
    frame.src = `${location.pathname}?embed=1#play=${code}`;
    frame.onload = () => { frame._b2Ready = true; };
  }
}
function b2RefreshEmbed()  { b2RefreshEmbedFrame("b2-embed-frame",  "b2-embed-empty"); }
function b2RefreshFinish() { b2RefreshEmbedFrame("b2-finish-frame", "b2-finish-empty"); }

let _b2EmbedTimer = null;
function b2ScheduleEmbedRefresh() {
  if (B2.fromShared) return;
  // refresh whichever play frames are currently rendered
  if (!document.getElementById("b2-embed-frame") && !document.getElementById("b2-finish-frame")) return;
  clearTimeout(_b2EmbedTimer);
  _b2EmbedTimer = setTimeout(() => { b2RefreshEmbed(); b2RefreshFinish(); }, 600);
}

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
  b2Msg("info", "");
  b2SharedWelcome(); // title + description + Play
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
    <div class="pioneer flip-card" tabindex="0" role="button" aria-label="Flip the ${c.title} card to read more">
      <div class="flip-inner">
        <div class="flip-front">
          <div class="face">${c.emoji}</div>
          <h3>${c.title}</h3>
          <span class="flip-hint">Tap to flip →</span>
        </div>
        <div class="flip-back">
          <h3><a href="${c.link}" target="_blank" rel="noopener">${c.title}</a></h3>
          <p>${c.text}</p>
          <a class="b2-source" href="${c.link}" target="_blank" rel="noopener">Source: ${c.source} →</a>
          <span class="flip-hint">↩ Tap to flip back</span>
        </div>
      </div>
    </div>`).join("");
  return `
    <div class="level-head"><h2>Step 1 — Discover</h2></div>
    <div class="b2-intro-card b2-prose">
      <p>You've learned how computers helped astronauts land on the Moon 🚀. Did you know <strong>real video games</strong> have helped people too — solving science mysteries, fighting disease, and even designing neighborhoods?</p>
      <p>Here are real games and projects that did good in the world. <strong>Tap any card</strong> to flip it over and read more about it!</p>
      <div class="card-grid">${cards}</div>
      <p class="credit">Real-world examples and facts come from the sources linked on each card — including <a href="https://www.scientificamerican.com/article/foldit-gamers-solve-riddle/" target="_blank" rel="noopener">Scientific American</a>, <a href="https://www.alzheimersresearchuk.org/research/for-researchers/resources-and-information/sea-hero-quest/" target="_blank" rel="noopener">Alzheimer's Research UK</a>, <a href="https://en.wikipedia.org/wiki/Re-Mission" target="_blank" rel="noopener">Wikipedia</a>, <a href="https://www.blockbyblock.org/" target="_blank" rel="noopener">UN-Habitat's Block by Block</a>, <a href="https://www.princeton.edu/news/2018/05/17/princeton-researchers-crowdsource-brain-mapping-gamers-discover-six-new-neuron" target="_blank" rel="noopener">Princeton University</a>, and <a href="https://scistarter.org/eve-online-project-discovery" target="_blank" rel="noopener">SciStarter</a>. Tap a card to learn more.</p>
      <div class="b2-reflect">
        <label for="b2-r-discover">✏️ What kind of game could <strong>you</strong> create to teach someone a new skill, or to help solve a problem?</label>
        <textarea id="b2-r-discover" rows="3" placeholder="My game could help people…"></textarea>
      </div>
      <button class="btn btn-primary" data-b2goto="b2-explore">Next: Explore the ideas →</button>
    </div>`;
}

function b2BuildExplore() {
  return `
    <div class="level-head"><h2>Step 2 — Explore</h2></div>
    <div class="b2-intro-card b2-prose">
      <p>Making a video game uses the same three big ideas you learned in <strong>Badge 1</strong>: <strong>sequence</strong>, <strong>loops</strong>, and <strong>conditionals</strong>. Here's how each one shows up in a game:</p>
      <p style="margin-top:16px;">📋 <strong>Sequence</strong> means doing things in the right order. A game runs your steps one after another, exactly as you set them up — just like putting the robot's commands in order in Badge 1.</p>
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

/* Plan step "peek" reference — plain text/emoji, generated from the real
   skin options / block labels / direction & touch lists so it can't drift
   out of sync with Build, without reusing Build's actual UI widgets. */
function b2PlanPeekPiecesHTML() {
  const row = (icon, name, desc, role) => {
    const skins = role
      ? `<div class="b2-peek-skins"><span class="b2-peek-skins-label">Looks:</span>${
          B2_SKINS[role].options.map((e) => `<span class="b2-peek-skin">${e}</span>`).join("")}</div>`
      : "";
    return `<li class="b2-peek-piece">
      <span class="b2-peek-emoji">${icon}</span>
      <div class="b2-peek-piece-body"><b>${name}</b> — ${desc}${skins}</div>
    </li>`;
  };
  return [
    row(B2.skin.P, "Player", "moves with the arrow keys or on-screen pad", "P"),
    row(B2.skin.H, "Goal", "where the player is trying to reach", "H"),
    row(B2.skin.C, "Item", "something to collect along the way", "C"),
    row("🔑", "Key", "collect it so the player can open doors"),
    row("🚪", "Door", "locked until the player is carrying a key"),
    row("🧱", "Wall", "always solid, forms the maze paths"),
  ].join("");
}
function b2PlanPeekBlocksHTML() {
  const dirArrows  = DIR_LIST.map((d) => DIR_LABEL[d].split(" ")[0]).join(" ");   // ▲ ▼ ◀ ▶
  const touchIcons = TOUCH_TILES.map((t) => t.label.split(" ")[0]).join(" ");     // 🍪 🔑 🚪 🏠
  const group = (cls, dot, label, chips) => `
    <div class="b2-peek-group ${cls}">
      <div class="b2-peek-group-head">${dot} ${label}</div>
      <div class="b2-peek-chips">${chips.map((c) => `<span class="b2-peek-chip">${c}</span>`).join("")}</div>
    </div>`;
  const events  = [`when arrow pressed ${dirArrows}`, `when robot touches ${touchIcons}`];
  const motion  = DIR_LIST.map((d) => `move ${DIR_LABEL[d]}`);
  const actions = B2_CATEGORIES.find((c) => c.cls === "cat-actions").blocks.map((t) => BLOCK_DEFS[t].label);
  const control = B2_CATEGORIES.find((c) => c.cls === "cat-control").blocks.map((t) => b2PaletteLabel(t));
  return group("cat-events",  "🟡", "Events",  events)
       + group("cat-motion",  "🔵", "Motion",  motion)
       + group("cat-actions", "🟣", "Actions", actions)
       + group("cat-control", "🟠", "Control", control);
}

function b2BuildPlan() {
  return `
    <div class="level-head"><h2>Step 3 — Plan</h2></div>
    <div class="b2-intro-card b2-prose">
      <p>Before you build, take a minute to <strong>plan</strong> — real game designers always do! Just jot down your ideas below. You'll use them in the next step.</p>

      <details class="b2-guide b2-plan-peek">
        <summary>👀 Peek at what you'll build — tap to open</summary>
        <div class="b2-plan-peek-body b2-plan-peek-simple">
          <p>You're going to make a <strong>maze game</strong>: a player moves through a maze to reach a goal, and a friend plays it using just the arrow keys.</p>
          <hr class="b2-plan-sep">
          <p class="b2-plan-steps-intro">In the next step, here's what you'll do:</p>
          <ol class="b2-plan-steps">
            <li>🧱 Draw the walls, then add 🍪 items, 🔑 keys, and 🚪 doors.</li>
            <li>🎨 Pick your own emoji for the player, item, and goal.</li>
            <li>🧩 Snap blocks together to make rules — like <em>when the robot touches 🍪 → pick it up</em>.</li>
          </ol>
        </div>
      </details>

      <details class="b2-guide b2-plan-peek">
        <summary>🤔 How is this different from Badge 1? — tap to open</summary>
        <div class="b2-plan-peek-body b2-plan-peek-simple">
          <p>In Badge 1 you programmed the robot's <em>moves</em> — telling it exactly what to do, step by step (move forward → turn right → …), to get through the maze. This time <em>you're the game designer</em>: instead of the moves, you program the <em>rules and controls</em> — what the pieces do and what happens as someone plays — so a player can explore your maze with the arrow keys.</p>
        </div>
      </details>

      <form class="b2-form" onsubmit="return false">
        <div class="field"><label for="b2-p-title">🎮 What's your game called?</label><input type="text" id="b2-p-title" placeholder="The Cookie Quest" /></div>
        <div class="field"><label for="b2-p-goal">🏁 What is the player trying to do to win?</label><textarea id="b2-p-goal" rows="2" placeholder="The player has to reach the goal after collecting all the items…"></textarea></div>
        <div class="field">
          <label>🧩 What will make your maze interesting or tricky? (pick any that fit your idea)</label>
          <p class="b2-field-hint">Don't worry about the exact pieces yet — just think about the experience you want the player to have.</p>
          <ul class="b2-checklist">
            <li><input type="checkbox" id="b2-p-c1"><label for="b2-p-c1">🧱 A winding or confusing path</label></li>
            <li><input type="checkbox" id="b2-p-c3"><label for="b2-p-c3">🍪 Something to collect before reaching the goal</label></li>
            <li><input type="checkbox" id="b2-p-c2"><label for="b2-p-c2">🔑 A key to find and a 🚪 locked door to open</label></li>
            <li><input type="checkbox" id="b2-p-c6"><label for="b2-p-c6">💬 A message that pops up at the start or when something happens</label></li>
          </ul>
        </div>
        <div class="field">
          <label for="b2-p-rule">⚙️ Describe one rule your game will follow: <em>WHEN [something happens] → THEN [what occurs]</em></label>
          <p class="b2-field-hint">In the Build step you'll turn this into a real code block. Example: <em>WHEN the player reaches the 🏠 goal → win the game</em></p>
          <textarea id="b2-p-rule" rows="2" placeholder="WHEN the player touches a 🍪 item → pick it up"></textarea>
        </div>
      </form>
      <button class="btn btn-primary" data-b2goto="b2-build">Next: Build it! →</button>
    </div>`;
}

function b2BuildBuild() {
  const sizes = B2_SIZES.map((n) => `<option value="${n}"${n === B2_DEFAULT_SIZE ? " selected" : ""}>${n} × ${n}</option>`).join("");
  return `
    <div class="level-head"><h2>Step 4 — Build &amp; Test</h2></div>

    <div class="b2-rotate-gate">
      <span class="b2-rotate-gate-emoji">🔄📱</span>
      <p><strong>Turn your device sideways!</strong><br>The maze and the code blocks need a bit more room to sit side by side — rotate to landscape to build your game.</p>
    </div>

    <div class="b2-build-body">
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
            <li><span class="b2-guide-ico">🧱</span><div><b>Wall</b> — always solid, no script needed.</div></li>
          </ul>
        </div>
        <div class="b2-guide-col">
          <h4>🧩 How code blocks work</h4>
          <p style="font-size:0.9rem; margin:0 0 8px;">Snap blocks under an <b>event</b> "hat" — when the event happens, the blocks underneath run in order:</p>
          <ul>
            <li><span class="b2-guide-ico">🟡</span><div><b>Events</b> — <i>when ▶ Play clicked</i>, <i>when an arrow is pressed</i> (keyboard or the arrow pad), <i>when the robot touches</i> a piece.</div></li>
            <li><span class="b2-guide-ico">🔵</span><div><b>Motion</b> — <i>move up / down / left / right</i>.</div></li>
            <li><span class="b2-guide-ico">🟣</span><div><b>Actions</b> — <i>pick it up</i>, <i>open the door</i>, <i>win the game</i>, <i>show message</i>.</div></li>
            <li><span class="b2-guide-ico">🟠</span><div><b>Control</b> — <i>if carrying a key</i>, <i>if all cookies collected</i> — put blocks inside to run them only when it's true.</div></li>
          </ul>
          <p style="font-size:0.85rem; color:#6b5d7d; margin-top:6px;">Your script area starts empty — drag an <b>Event</b> block in first, then snap actions underneath it. No script for a piece? Then a 🚪 door stays solid like a wall. Remove a block with the eraser.</p>
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
              <button class="maze-tool alt" id="b2-clear-maze">✖ Clear Maze</button>
              <button class="maze-tool" data-b2tool="erase">🧽 Erase</button>
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
            <p class="palette-hint">Snap blocks under an <b>event</b> to say what happens! Drag a block from the palette into <b>Your Scripts</b>.</p>
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
    <button class="btn btn-primary" data-b2goto="b2-share">Next: Share &amp; improve →</button>
    </div>`;
}

function b2BuildShare() {
  return `
    <div class="level-head"><h2>Step 5 — Share &amp; Improve</h2></div>
    <div class="b2-intro-card b2-prose">
      <p>Real game makers make their games better by <strong>playtesting</strong> — watching someone else play and listening to their ideas. Then they improve, and test again. That's <em>iteration</em>!</p>

      <details class="b2-guide b2-share-how" open>
        <summary>🔁 How playtesting works — read this first!</summary>
        <div class="b2-guide-body">
          <ol class="b2-share-steps">
            <li><span class="b2-qs-num">1</span><div><b>Hand your device to another Girl Scout.</b> She is your <b>playtester</b>.</div></li>
            <li><span class="b2-qs-num">2</span><div>She <b>plays your game</b> below, then fills out the <b>playtester feedback</b> — the checklist and the two questions.</div></li>
            <li><span class="b2-qs-num">3</span><div>She <b>hands the device back to you.</b></div></li>
            <li><span class="b2-qs-num">4</span><div>You read her feedback and go <b>back to Build</b> to improve your maze.</div></li>
            <li><span class="b2-qs-num">5</span><div>Test again with a new player. Keep going until you love it — then head to <b>Finish</b>! 🏆</div></li>
          </ol>
        </div>
      </details>

      <h3 style="color:var(--purple);">🎮 Play the game</h3>
      <p><b>Playtester:</b> play the game here with the arrow keys or the on-screen buttons.</p>
      <div class="b2-embed-wrap">
        <iframe id="b2-embed-frame" class="b2-embed-frame" title="Play the game here"></iframe>
      </div>
      <p class="b2-embed-empty" id="b2-embed-empty" hidden>Add a 🤖 player start and a 🏠 goal in the <strong>Build</strong> step, then come back to play the game here.</p>

      <div class="b2-tester-panel">
        <h3>👋 Playtester feedback</h3>
        <p class="b2-tester-note">This part is for the friend who tested the game. Be honest and kind — your ideas help make the game even better!</p>

        <p style="font-weight:700; margin:10px 0 6px;">🧪 Check off what's true:</p>
        <ul class="b2-checklist">
          <li><input type="checkbox" id="b2-t1"><label for="b2-t1">I could solve the maze with the arrow keys.</label></li>
          <li><input type="checkbox" id="b2-t2"><label for="b2-t2">It wasn't too easy <em>and</em> not too hard.</label></li>
          <li><input type="checkbox" id="b2-t3"><label for="b2-t3">The start and win messages made sense.</label></li>
          <li><input type="checkbox" id="b2-t4"><label for="b2-t4">The game teaches or helps with something.</label></li>
          <li><input type="checkbox" id="b2-t5"><label for="b2-t5">I had fun playing it!</label></li>
        </ul>

        <div class="b2-reflect">
          <label for="b2-liked">⭐ What did you like <em>most</em> about this game?</label>
          <textarea id="b2-liked" rows="2" placeholder="The part I liked best was…"></textarea>

          <label for="b2-improve" style="margin-top:12px;">🔧 What is <em>one thing</em> that could be even better?</label>
          <textarea id="b2-improve" rows="2" placeholder="One idea to make it better…"></textarea>
        </div>
        <button class="maze-tool alt b2-clear-feedback" id="b2-clear-feedback" type="button">🧹 Clear feedback for a new tester</button>
      </div>

      <div class="b2-callout">🎨 <b>Game maker:</b> read your playtester's feedback, then use it to make your maze better!</div>

      <div class="b2-share-actions">
        <button class="btn" data-b2goto="b2-build">← Back to Build &amp; improve</button>
        <button class="btn btn-primary" data-b2goto="b2-finish">I love my game — Finish 🏆 →</button>
      </div>

      <div class="b2-tip"><h3>Keep going! 💪</h3>
        <p>Making something new takes <strong>perseverance</strong>. Every great game maker tests and improves again and again. If at first you don't succeed: try, try again!</p></div>
    </div>`;
}

function b2BuildFinish() {
  return `
    <div class="level-head"><h2>🏆 Finish — You did it!</h2><span class="difficulty easy">Badge earned</span></div>
    <div class="b2-intro-card b2-prose">
      <div class="b2-finish-hero">
        <div class="b2-finish-emoji">🎉🏅🎮</div>
        <h2>Congratulations, Game Designer!</h2>
        <p>You planned, built, tested, and shared your very own maze game. That's the whole <strong>game design process</strong> — you've earned your <strong>Digital Game Design</strong> badge! 🌟</p>
      </div>

      <div class="field b2-finish-name">
        <label for="b2-cert-name-input">✏️ Your name (for your certificate)</label>
        <input type="text" id="b2-cert-name-input" placeholder="Type your name here" />
      </div>

      <hr class="b2-finish-divider" />
      <h3 style="color:var(--purple);">🎮 Play your finished game</h3>
      <p>Take a victory lap — play the game you made! (It updates from your latest work in the Build step.)</p>
      <div class="b2-embed-wrap">
        <iframe id="b2-finish-frame" class="b2-embed-frame" scrolling="no" title="Your finished game — play it here"></iframe>
      </div>
      <p class="b2-embed-empty" id="b2-finish-empty" hidden>Add a 🤖 player start and a 🏠 goal in the <strong>Build</strong> step, then come back to play your game here.</p>

      <hr class="b2-finish-divider" />
      <h3 style="color:var(--purple);">📜 Your certificate</h3>
      <p>Here's a summary of everything you learned and made. Save it as a PDF or send it to a grown-up's email!</p>

      <div class="b2-cert" id="b2-cert"><!-- filled by b2RenderCertificate() --></div>

      <div class="b2-cert-actions">
        <button class="btn btn-primary" id="b2-cert-download">⬇ Save my certificate as a PDF</button>
      </div>
      <p class="b2-cert-status" id="b2-cert-status" role="status" aria-live="polite"></p>
      <p class="b2-saved-note">Tip: you can print or email the saved PDF to a grown-up or your troop leader. 💾</p>

      <div class="b2-tip"><h3>Keep creating! 💪</h3>
        <p>Every game maker started with a first game. Teach a friend the game design process, or dream up your next game — the world needs more games for good!</p></div>
    </div>`;
}

/* ============================================================
   Wiring & init
   ============================================================ */
const B2_TABS = [
  { target: "b2-welcome",  num: "▶", label: "Start",   build: b2BuildWelcome  },
  { target: "b2-discover", num: "1",  label: "Discover", build: b2BuildDiscover, mins: 8  },
  { target: "b2-explore",  num: "2",  label: "Explore",  build: b2BuildExplore,  mins: 8  },
  { target: "b2-plan",     num: "3",  label: "Plan",     build: b2BuildPlan,     mins: 10 },
  { target: "b2-build",    num: "4",  label: "Build",    build: b2BuildBuild,    mins: 15 },
  { target: "b2-share",    num: "5",  label: "Share",    build: b2BuildShare,    mins: 8  },
  { target: "b2-finish",   num: "🏆", label: "Finish",   build: b2BuildFinish   },
];

function b2WireBuild() {
  // delegated tool-pick handler on #b2-design (survives re-rendering the tools
  // on icon change, and covers the Erase button that now lives in the size row)
  const designEl = document.getElementById("b2-design");
  const syncToolActive = () => designEl.querySelectorAll("[data-b2tool]").forEach((x) =>
    x.classList.toggle("is-active", x.dataset.b2tool === B2.tool));
  designEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-b2tool]");
    if (!b || b2game.playing) return;
    B2.tool = b.dataset.b2tool;
    syncToolActive();
    if (!B2.fromShared) b2RenderEditor();
  });
  syncToolActive();

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

  // Auto-expand textareas when content grows, keeping all message textareas the same height
  const syncSettingsTextareas = () => {
    const intro = document.getElementById("b2-intro");
    const win = document.getElementById("b2-win");
    if (!intro || !win) return;
    const maxHeight = Math.max(Math.max(100, intro.scrollHeight), Math.max(100, win.scrollHeight));
    intro.style.height = maxHeight + "px";
    win.style.height = maxHeight + "px";
  };

  ["b2-intro", "b2-win"].forEach((id) => {
    const el = document.getElementById(id);
    b2Autosave(el, `game.${id}`);
    if (el) {
      el.addEventListener("input", () => {
        syncSettingsTextareas();
        b2ScheduleEmbedRefresh();
      });
    }
  });
  // Initial sync
  syncSettingsTextareas();

  // Title field (text input, not textarea)
  const titleEl = document.getElementById("b2-title");
  b2Autosave(titleEl, "game.b2-title");
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
  ["b2-t1", "b2-t2", "b2-t3", "b2-t4", "b2-t5"].forEach((id) =>
    b2AutosaveCheck(document.getElementById(id), `share.${id}`));
  b2Autosave(document.getElementById("b2-liked"), "share.liked");
  b2Autosave(document.getElementById("b2-improve"), "share.improve");
  const clearBtn = document.getElementById("b2-clear-feedback");
  if (clearBtn) clearBtn.addEventListener("click", b2ClearTesterFeedback);
}

/* wipe the last tester's feedback so a new tester can start fresh after the
   game maker has improved the maze */
function b2ClearTesterFeedback() {
  ["b2-t1", "b2-t2", "b2-t3", "b2-t4", "b2-t5"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
    b2Save(`share.${id}`, "0");
  });
  ["b2-liked", "b2-improve"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  b2Save("share.liked", "");
  b2Save("share.improve", "");
}

/* ============================================================
   Finish stage — certificate, PDF, and email
   ============================================================ */
function b2Esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
/* count every block in the script tree (for the certificate stats) */
function b2CountBlocks(list) {
  return (list || []).reduce((n, b) => n + 1 + b2CountBlocks(b.body), 0);
}
/* gather everything the certificate shows from live state + saved answers */
/* describe one code block as a short phrase for the certificate */
function b2BlockPhrase(b) {
  switch (b.type) {
    case "whenPlay":  return "when ▶ Play is pressed";
    case "whenKey":   return "when an arrow key is pressed";
    case "whenTouch": {
      const t = { C: `${B2.skin.C} item`, K: "🔑 key", D: "🚪 door", H: `${B2.skin.H} goal`, P: "start" }[b.tile] || "something";
      return `when the robot touches the ${t}`;
    }
    case "move":      return "move";
    case "collect":   return "pick it up 🎒";
    case "openDoor":  return "open the door 🔓";
    case "win":       return "win the game 🏆";
    case "say":       return "show a message 💬";
    case "ifKey":     return "if carrying a 🔑 key";
    case "ifCookies": return `if all ${B2.skin.C} collected`;
    default:          return "";
  }
}
/* a short sentence for one top-level rule (its event + what it does) */
function b2RuleText(hat) {
  const acts = [];
  (hat.body || []).forEach((b) => {
    if (b.type === "ifKey" || b.type === "ifCookies") {
      const inner = (b.body || []).map(b2BlockPhrase).filter(Boolean);
      acts.push(b2BlockPhrase(b) + (inner.length ? " " + inner.join(", ") : ""));
    } else {
      const p = b2BlockPhrase(b);
      if (p) acts.push(p);
    }
  });
  return b2BlockPhrase(hat) + (acts.length ? " → " + acts.join(", ") : "");
}
/* does the script tree contain a block of this type anywhere? */
function b2HasScriptType(list, type) {
  return (list || []).some((b) => b.type === type || b2HasScriptType(b.body, type));
}
function b2CertData() {
  const s = b2ReadSettings();
  const g = B2.model.grid;
  const tally = (ch) => g.reduce((n, row) => n + row.filter((c) => c === ch).length, 0);
  // challenges reflect what's actually in the built maze (not the plan checkboxes)
  const challenges = [];
  if (tally("C") > 0) challenges.push("🍪 Things to collect");
  if (tally("K") > 0 || tally("D") > 0) challenges.push("🔑 Key & 🚪 locked door");
  if (tally("B") > 0) challenges.push("📦 Blocks to push");
  if (b2HasScriptType(B2.scripts, "say")) challenges.push("💬 A pop-up message");
  // "a rule I coded" comes from the first real rule in the script canvas
  const ruleHat = (B2.scripts || []).find((b) => Array.isArray(b.body) && b.body.length);
  const codedRule = ruleHat ? b2RuleText(ruleHat) : "";
  let checks = 0;
  for (let i = 1; i <= 5; i++) if (b2Load(`share.b2-t${i}`, "0") === "1") checks++;
  return {
    name: (b2Load("finish.name", "") || "").trim(),
    title: s.title, intro: s.intro, win: s.win,
    cols: B2.model.cols, rows: B2.model.rows,
    cookies: tally("C"), keys: tally("K"), doors: tally("D"),
    blocks: b2CountBlocks(B2.scripts),
    goal: b2Load("plan.b2-p-goal", ""),
    rule: codedRule,
    challenges,
    fav: b2Load("reflect.b2-r-game", ""),
    discover: b2Load("reflect.b2-r-discover", ""),
    liked: b2Load("share.liked", ""),
    improve: b2Load("share.improve", ""),
    checks,
  };
}
/* a static snapshot of the current maze (emoji cells) for the certificate */
const B2_CERT_CELL_MIN = 16, B2_CERT_CELL_MAX = 58;
function b2CertCellSize(cols) {
  return Math.max(B2_CERT_CELL_MIN, Math.min(B2_CERT_CELL_MAX, Math.floor(560 / cols)));
}
function b2CertBoardHTML() {
  const { grid, cols, rows } = B2.model;
  const cell = b2CertCellSize(cols); // fallback; refined by b2FitCertBoard() once laid out
  let cells = "";
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const v = b2CellVisual(grid[y][x]);
      cells += `<div class="b2-cert-cell ${v.cls}">${v.txt}</div>`;
    }
  return `<div class="b2-cert-grid" id="b2-cert-grid" data-cols="${cols}" data-rows="${rows}" style="grid-template-columns:repeat(${cols},${cell}px);font-size:${Math.round(cell * 0.62)}px">${cells}</div>`;
}
/* grow the certificate maze to fill the width left over beside the facts column
   (measured once the board's column is laid out; keeps square px cells so the
   PDF rasterizer renders it crisply). Falls back to b2CertCellSize when hidden. */
function b2FitCertBoard() {
  const grid = document.getElementById("b2-cert-grid");
  if (!grid) return;
  const wrap = grid.parentElement; // .b2-cert-board-wrap — the flexible column
  const avail = wrap ? wrap.clientWidth : 0;
  const cols = +grid.dataset.cols;
  if (!avail || !cols) return; // panel hidden / not laid out yet → keep fallback
  const cell = Math.max(B2_CERT_CELL_MIN, Math.min(B2_CERT_CELL_MAX, Math.floor((avail - (cols - 1) - 4) / cols)));
  grid.style.gridTemplateColumns = `repeat(${cols}, ${cell}px)`;
  grid.style.fontSize = Math.round(cell * 0.62) + "px";
}
/* Size the maze so the whole certificate is as tall as `targetPx` (the page's
   printable height), filling the space left over by the text — bounded by the
   width beside the facts column. Longer, multi-line answers leave less room, so
   the maze shrinks to keep everything on one page. Used only for the PDF. */
function b2FitCertBoardToHeight(targetPx) {
  const cert = document.getElementById("b2-cert");
  const grid = document.getElementById("b2-cert-grid");
  if (!cert || !grid) return;
  const cols = +grid.dataset.cols, rows = +grid.dataset.rows || cols;
  const wrap = grid.parentElement; // .b2-cert-board-wrap column
  const setCell = (cell) => {
    grid.style.gridTemplateColumns = `repeat(${cols}, ${cell}px)`;
    grid.style.fontSize = Math.round(cell * 0.62) + "px";
  };
  setCell(B2_CERT_CELL_MIN); // measure the board column width with a small board
  const availW = wrap ? wrap.clientWidth : 0;
  const capW = availW ? Math.floor((availW - (cols - 1) - 4) / cols) : 200;
  let lo = B2_CERT_CELL_MIN, hi = Math.max(B2_CERT_CELL_MIN, Math.min(200, capW));
  const rowsCap = Math.floor((targetPx) / rows); // never taller than the target on its own
  hi = Math.max(B2_CERT_CELL_MIN, Math.min(hi, rowsCap));
  setCell(hi);
  if (cert.getBoundingClientRect().height <= targetPx) return; // fits at the widest allowed
  for (let i = 0; i < 16; i++) {
    const mid = Math.round((lo + hi) / 2);
    setCell(mid);
    if (cert.getBoundingClientRect().height <= targetPx) lo = mid; else hi = mid;
  }
  setCell(Math.max(B2_CERT_CELL_MIN, lo));
}
function b2RenderCertificate() {
  const host = document.getElementById("b2-cert");
  if (!host || !B2.model) return;
  const d = b2CertData();
  const who = d.name || "a Game Designer";
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const answer = (label, val) =>
    `<div class="b2-cert-answer"><b>${label}</b><span>${val ? b2Esc(val) : "—"}</span></div>`;
  host.innerHTML = `
    <div class="b2-cert-ribbon">🏆 Certificate of Achievement 🏆</div>
    <p class="b2-cert-badge">Girl Scouts · Junior Coding For Good · Digital Game Design</p>
    <p class="b2-cert-who">This certifies that<br><b id="b2-cert-name">${b2Esc(who)}</b><br>
      designed and built an original maze game!</p>

    <div class="b2-cert-cols">
      <div class="b2-cert-board-wrap">
        <h4>🎮 “${b2Esc(d.title)}”</h4>
        ${b2CertBoardHTML()}
      </div>
      <div class="b2-cert-facts">
        <h4>My game by the numbers</h4>
        <ul>
          <li>📐 Maze size: <b>${d.cols} × ${d.rows}</b></li>
          <li>🍪 Items to collect: <b>${d.cookies}</b></li>
          <li>🔑 Keys: <b>${d.keys}</b> · 🚪 Doors: <b>${d.doors}</b></li>
          <li>🧩 Code blocks I snapped: <b>${d.blocks}</b></li>
          <li>🧪 Playtest checks passed: <b>${d.checks} of 5</b></li>
        </ul>
      </div>
    </div>
    <div class="b2-cert-msgs">
      <p><b>Start message:</b> ${b2Esc(d.intro)}</p>
      <p><b>Win message:</b> ${b2Esc(d.win)}</p>
    </div>

    <div class="b2-cert-section">
      <h4>📝 What I planned & learned</h4>
      <div class="b2-cert-answers">
        ${answer("🏁 Goal of my game:", d.goal)}
        ${answer("⚙️ A rule I coded:", d.rule)}
        ${answer("🧩 Challenges I added:", d.challenges.join(" · "))}
        ${answer("🎮 A game I explored:", d.fav)}
        ${answer("🌍 A game-for-good that inspired me:", d.discover)}
        ${answer("⭐ A playtester's favorite part:", d.liked)}
        ${answer("🔧 Feedback I used to improve:", d.improve)}
      </div>
    </div>

    <div class="b2-cert-skills">
      <h4>⭐ Skills I practiced</h4>
      <div class="b2-cert-skill-chips">
        <span>📋 Sequence</span><span>🔁 Loops</span><span>❓ Conditionals</span>
        <span>🗺️ Maze design</span><span>🧩 Event scripting</span>
        <span>🔄 Plan → Build → Test → Improve → Share</span>
      </div>
    </div>

    <p class="b2-cert-foot">🤖 Coding for Good · ${b2Esc(date)}</p>`;
  b2FitCertBoard();
}
/* ---- PDF generation (libraries loaded on demand from a CDN) ---- */
const B2_H2C_URL   = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
const B2_JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
function b2LoadScript(src) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some((s) => s.src === src)) return resolve();
    const el = document.createElement("script");
    el.src = src;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(el);
  });
}
/* rasterize the certificate card and wrap it in a one-page PDF.
   Reads current state each call, so the maze/messages are always up to date. */
const B2_CERT_PDF_WIDTH = 877; // fixed layout width (css px) for the PDF render — smaller = bigger content
                               // (paired with the margin below so content size stays constant)
const B2_CERT_H2C_SCALE = 1.6; // html2canvas rasterization scale (crisp but small file)
async function b2BuildCertPdf() {
  b2RenderCertificate(); // ensure it reflects the latest maze + answers
  const cert = document.getElementById("b2-cert");
  await b2LoadScript(B2_H2C_URL);
  await b2LoadScript(B2_JSPDF_URL);
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
  const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
  const margin = 32; // pt (~0.44 in) — slightly slimmer border
  const availW = pw - margin * 2, availH = ph - margin * 2;
  // Render the card at a FIXED width so text/icons come out a consistent, large
  // size, and size the maze to fill the vertical space that's left. Longer,
  // multi-line answers use more room, so the maze shrinks to keep it on one page.
  const prevWidth = cert.style.width;
  const prevBg = cert.style.background;
  const scale = availW / B2_CERT_PDF_WIDTH; // css px -> pt when drawn at full printable width
  const targetPx = availH / scale;          // printable page height, in css px
  cert.style.width = B2_CERT_PDF_WIDTH + "px";
  cert.style.background = "#ffffff"; // white background in the PDF (on-screen keeps its tint)
  b2FitCertBoardToHeight(targetPx);
  let canvas;
  try {
    canvas = await window.html2canvas(cert, { scale: B2_CERT_H2C_SCALE, backgroundColor: "#ffffff", useCORS: true });
  } finally {
    cert.style.width = prevWidth; // restore the responsive on-screen preview
    cert.style.background = prevBg;
    b2FitCertBoard();
  }
  const img = canvas.toDataURL("image/jpeg", 0.9);
  const cardHpx = canvas.height / B2_CERT_H2C_SCALE; // rendered card height in css px
  let drawW = availW, drawH = cardHpx * scale;
  if (drawH > availH) { // extremely long content: scale the whole card down to fit one page
    const r = availH / drawH; drawW *= r; drawH = availH;
  }
  pdf.addImage(img, "JPEG", (pw - drawW) / 2, margin + (availH - drawH) / 2, drawW, drawH);
  return { blob: pdf.output("blob"), base64: pdf.output("datauristring").split(",")[1] };
}
function b2CertFileName() {
  const d = b2CertData();
  const who = (d.name || "my").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "my";
  return `${who}-game-design-certificate.pdf`;
}
function b2CertStatus(msg, kind) {
  const el = document.getElementById("b2-cert-status");
  if (!el) return;
  el.textContent = msg || "";
  el.className = "b2-cert-status" + (kind ? " is-" + kind : "");
}
async function b2DownloadCertificatePdf() {
  b2CertStatus("Building your certificate PDF…", "working");
  try {
    const { blob } = await b2BuildCertPdf();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = b2CertFileName();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    b2CertStatus("Saved! Check your downloads for your certificate. 🎉", "ok");
  } catch (e) {
    b2CertStatus("Sorry — couldn't build the PDF. Check your internet and try again.", "bad");
  }
}
function b2WireFinish() {
  const nameEl = document.getElementById("b2-cert-name-input");
  b2Autosave(nameEl, "finish.name");
  if (nameEl) nameEl.addEventListener("input", () => {
    const t = document.getElementById("b2-cert-name");
    if (t) t.textContent = nameEl.value.trim() || "a Game Designer";
  });
  const dl = document.getElementById("b2-cert-download");
  if (dl) dl.addEventListener("click", b2DownloadCertificatePdf);
  window.addEventListener("resize", () => { if (document.getElementById("b2-cert-grid")) b2FitCertBoard(); });
  b2RenderCertificate();
}

/* Discover step: flip the "games for good" cards on click / Enter / Space.
   Clicks on a link inside a card fall through so the source opens normally. */
function b2WireDiscover() {
  const grid = document.querySelector("#b2-discover .card-grid");
  if (!grid) return;
  const toggle = (target) => {
    const card = target.closest(".flip-card");
    if (card) card.classList.toggle("is-flipped");
  };
  grid.addEventListener("click", (e) => {
    if (e.target.closest("a")) return; // let source / title links work
    toggle(e.target);
  });
  grid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (e.target.closest("a")) return;
    e.preventDefault();
    toggle(e.target);
  });
}

function b2WireReflections() {
  ["b2-r-discover", "b2-r-game", "b2-r-seq", "b2-r-loop", "b2-r-cond"].forEach((id) =>
    b2Autosave(document.getElementById(id), `reflect.${id}`));
  ["b2-p-title", "b2-p-goal", "b2-p-rule"].forEach((id) =>
    b2Autosave(document.getElementById(id), `plan.${id}`));
  ["b2-p-c1", "b2-p-c2", "b2-p-c3", "b2-p-c6"].forEach((id) =>
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
  const tagline = document.querySelector(".site-header .tagline");
  if (tagline) {
    tagline.innerHTML = n === 2
      ? 'Design your own maze game 🎮 — using <strong>sequence</strong>, <strong>loops</strong>, and <strong>conditionals</strong>!'
      : 'Help the robot deliver Girl Scout cookies 🍪 — using <strong>sequence</strong>, <strong>loops</strong>, and <strong>conditionals</strong>!';
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
      if (id === "b2-share") b2RefreshEmbed();
      if (id === "b2-finish") { b2RefreshFinish(); b2RenderCertificate(); }
      B2_SESSION.savePlace(id);
      B2_SESSION.markVisited(id);
      b2MarkVisitedTabs();
    };
    window.showPanel._b2wrapped = true;
  }

  // "embed" mode: this page is loaded inside the Share-stage iframe — strip the
  // chrome down to just the game, and never write to the shared localStorage
  if (new URLSearchParams(location.search).has("embed")) {
    document.body.classList.add("b2-embed");
    B2.fromShared = true;
    // Listen for in-place game updates from the parent page so changes in the
    // Build step are reflected without a full iframe reload
    window.addEventListener("message", (e) => {
      if (e.origin !== location.origin || e.data?.type !== "b2update") return;
      b2game.playing = false;
      b2scripts.playing = false;
      b2OpenShared(e.data.code);
    });
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
    tab.innerHTML = `<span class="tab-num">${t.num}</span> ${t.label}` +
      (t.mins ? ` <span class="tab-time">~${t.mins}m</span>` : "");
    tab.addEventListener("click", () => showPanel(t.target));
    tabsNav.appendChild(tab);

    const section = document.createElement("section");
    section.id        = t.target;
    section.className = "panel";
    section.innerHTML = t.build();
    // time-box each step: show a suggested duration in its header
    if (t.mins) {
      const head = section.querySelector(".level-head");
      if (head) head.insertAdjacentHTML("beforeend",
        `<div class="b2-time-box">⏱ about ${t.mins} min</div>`);
    }
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
  b2WireDiscover();
  b2WireFinish();
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
