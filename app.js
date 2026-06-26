"use strict";

/* ============================================================
   Coding for Good — interactive coding activity
   Badge 1: Coding Basics (sequence, loops, conditionals)
   Commands are built with drag-and-drop.
   ============================================================ */

/* Directions: 0 = North(up), 1 = East(right), 2 = South(down), 3 = West(left) */
const DELTA = [
  { x: 0, y: -1 }, // N
  { x: 1, y: 0 },  // E
  { x: 0, y: 1 },  // S
  { x: -1, y: 0 }, // W
];
/* Robot sprite points East (▶) at 0deg; rotate to match direction. */
const DIR_DEG = [-90, 0, 90, 180];

/* ------------------------------------------------------------
   Level definitions.
   map: array of strings. '#'=wall, '.'=open, 'G'=goal (open + target).
   start: {x, y, dir}
   tools: which palette commands are available.
   ------------------------------------------------------------ */
const LEVELS = [
  /* ---------------- Step 1: Sequence ---------------- */
  {
    step: 1,
    tab: "Sequence",
    title: "Step 1 — Sequence",
    concept: "Sequence",
    difficulty: "easy",
    mission:
      "A computer does exactly what you say, in exactly the order you say it. " +
      "<span class='concept'>Drag</span> command blocks into your program, then press Run to deliver the cookies 🍪 to the house 🏠. " +
      "The <span class='concept'>order matters</span> — that order is called a sequence!",
    map: [
      "#####",
      "#R..#",
      "###.#",
      "#G..#",
      "#####",
    ],
    start: { x: 1, y: 1, dir: 1 },
    tools: ["forward", "left", "right"],
  },
  {
    step: 1,
    tab: "Sequence ★",
    title: "Step 1 — Sequence (Zig-Zag)",
    concept: "Sequence",
    difficulty: "medium",
    mission:
      "Same idea, longer journey! This snake-shaped path needs a longer sequence with both " +
      "<em>left</em> and <em>right</em> turns. Plan each step carefully — one wrong turn and the robot hits a wall!",
    map: [
      "#######",
      "#R....#",
      "#####.#",
      "#.....#",
      "#.#####",
      "#....G#",
      "#######",
    ],
    start: { x: 1, y: 1, dir: 1 },
    tools: ["forward", "left", "right"],
  },

  /* ---------------- Step 2: Loops ---------------- */
  {
    step: 2,
    tab: "Loops",
    title: "Step 2 — Loops",
    concept: "Loop",
    difficulty: "easy",
    mission:
      "This path is long! Instead of dragging Move Forward over and over, drop a " +
      "<span class='concept'>Repeat</span> loop in and drag commands <em>inside</em> it. A loop repeats a set of " +
      "instructions, so your program is shorter and easier to read. Set how many times it should repeat!",
    map: [
      "#######",
      "#R....#",
      "#####.#",
      "#....G#",
      "#######",
    ],
    start: { x: 1, y: 1, dir: 1 },
    tools: ["forward", "left", "right", "repeat"],
  },
  {
    step: 2,
    tab: "Loops ★",
    title: "Step 2 — Loops (Staircase)",
    concept: "Loop",
    difficulty: "medium",
    mission:
      "Look for the pattern! The robot climbs a staircase by repeating the <em>same four moves</em> " +
      "again and again: forward, turn right, forward, turn left. Put those moves <em>inside</em> a Repeat loop " +
      "so you don't have to drag them over and over — then add one last step to reach the house 🏠.",
    map: [
      "#######",
      "#RR####",
      "##..###",
      "###..##",
      "####.G#",
      "#######",
    ],
    start: { x: 1, y: 1, dir: 1 },
    tools: ["forward", "left", "right", "repeat"],
  },

  /* ---------------- Step 3: Conditionals ---------------- */
  {
    step: 3,
    tab: "Conditionals",
    title: "Step 3 — Conditionals",
    concept: "Conditional (IF / ELSE)",
    difficulty: "medium",
    mission:
      "Now the robot must make decisions! A <span class='concept'>conditional</span> says: " +
      "<em>IF</em> something is true, do this — <em>ELSE</em> do that. " +
      "Try a Repeat loop with an IF inside: <em>IF the path ahead is clear, Move Forward, ELSE Turn Right.</em> " +
      "The same little program can solve the whole maze!",
    map: [
      "######",
      "#R...#",
      "####.#",
      "#...G#",
      "######",
    ],
    start: { x: 1, y: 1, dir: 1 },
    tools: ["forward", "left", "right", "repeat", "if"],
  },
  {
    step: 3,
    tab: "Conditionals ★",
    title: "Step 3 — Conditionals (The Spiral)",
    concept: "Conditional (IF / ELSE)",
    difficulty: "hard",
    mission:
      "The ultimate test! This whole spiral can be solved by ONE smart rule, repeated many times: " +
      "<em>IF the path ahead is clear, Move Forward, ELSE Turn Right.</em> The robot will wind its way to the " +
      "center all by itself — but the spiral is long, so you'll need a <strong>big repeat number</strong> (try 25 or more)!",
    map: [
      "#######",
      "#R....#",
      "#####.#",
      "#..G#.#",
      "#.###.#",
      "#.....#",
      "#######",
    ],
    start: { x: 1, y: 1, dir: 1 },
    tools: ["forward", "left", "right", "repeat", "if"],
  },
];

const PIONEERS = [
  {
    face: "✍️",
    name: "Ada Lovelace",
    years: "1815 – 1852",
    text: "Ada wrote the very first computer program when she was only 17, creating code for Charles Babbage's early mechanical computer.",
  },
  {
    face: "💾",
    name: "Grace Hopper",
    years: "1906 – 1992",
    text: "Grace and her team built some of the first electronic computers, like the room-sized Mark 1. She predicted we'd one day hold powerful computers in our hands.",
  },
  {
    face: "🚢",
    name: "Raye Montague",
    years: "1935 – 2018",
    text: "In the 1970s, Raye was the first person to figure out how to design a ship using a computer — then she designed one in less than 24 hours!",
  },
  {
    face: "🚀",
    name: "Margaret Hamilton",
    years: "born 1936",
    text: "Margaret wrote the Apollo 11 code that helped astronauts land on the Moon. Her 'in case of emergency' program saved the mission — and she coined the term 'software'.",
  },
];

/* ============================================================
   Command model
   {id, type:'forward'|'left'|'right'}
   {id, type:'repeat', count:Number, body:[]}
   {id, type:'if', cond:'pathAhead', then:[], else:[]}
   ============================================================ */
const MAX_REPEAT = 50;
let UID = 1;
function makeCommand(tool) {
  const id = UID++;
  if (tool === "repeat") return { id, type: "repeat", count: 4, body: [] };
  if (tool === "if") return { id, type: "if", cond: "pathAhead", then: [], else: [] };
  return { id, type: tool };
}

/* return every child-array that belongs to a command (used to block illegal drops) */
function ownArrays(cmd, set = new Set()) {
  if (cmd.type === "repeat") {
    set.add(cmd.body);
    cmd.body.forEach((c) => ownArrays(c, set));
  } else if (cmd.type === "if") {
    set.add(cmd.then);
    set.add(cmd.else);
    cmd.then.forEach((c) => ownArrays(c, set));
    cmd.else.forEach((c) => ownArrays(c, set));
  }
  return set;
}

/* find a command by id anywhere in the tree → {arr, index, cmd} */
function findById(arr, id) {
  for (let i = 0; i < arr.length; i++) {
    const c = arr[i];
    if (c.id === id) return { arr, index: i, cmd: c };
    if (c.type === "repeat") {
      const r = findById(c.body, id);
      if (r) return r;
    } else if (c.type === "if") {
      const r = findById(c.then, id) || findById(c.else, id);
      if (r) return r;
    }
  }
  return null;
}

/* ---------------- Simulation / interpreter ---------------- */
function parseMap(level) {
  const grid = level.map.map((row) => row.split(""));
  let goal = null;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === "G") goal = { x, y };
    }
  }
  return { grid, goal };
}

function isOpen(grid, x, y) {
  if (y < 0 || y >= grid.length) return false;
  if (x < 0 || x >= grid[y].length) return false;
  return grid[y][x] !== "#";
}

function simulate(level, program) {
  const { grid, goal } = parseMap(level);
  const state = { x: level.start.x, y: level.start.y, dir: level.start.dir };
  const frames = [{ ...state, crashed: false }];
  const result = { frames, success: false, crashed: false, message: "" };

  let stop = false;
  let steps = 0;
  const MAX_STEPS = 1000;

  function pathAhead() {
    const d = DELTA[state.dir];
    return isOpen(grid, state.x + d.x, state.y + d.y);
  }
  function record(crashed) {
    frames.push({ x: state.x, y: state.y, dir: state.dir, crashed });
  }
  function reachedGoal() {
    return goal && state.x === goal.x && state.y === goal.y;
  }

  function run(cmds) {
    for (const c of cmds) {
      if (stop) return;
      if (++steps > MAX_STEPS) {
        result.crashed = true;
        result.message = "Whoa — that looks like an endless loop! Try fewer repeats.";
        stop = true;
        return;
      }
      switch (c.type) {
        case "forward": {
          const d = DELTA[state.dir];
          const nx = state.x + d.x;
          const ny = state.y + d.y;
          if (!isOpen(grid, nx, ny)) {
            result.crashed = true;
            result.message = "Bonk! The robot hit a wall. Check your sequence and try again.";
            record(true);
            stop = true;
            return;
          }
          state.x = nx;
          state.y = ny;
          record(false);
          if (reachedGoal()) {
            result.success = true;
            stop = true;
            return;
          }
          break;
        }
        case "left":
          state.dir = (state.dir + 3) % 4;
          record(false);
          break;
        case "right":
          state.dir = (state.dir + 1) % 4;
          record(false);
          break;
        case "repeat": {
          const n = Math.max(0, Math.min(MAX_REPEAT, c.count | 0));
          for (let i = 0; i < n; i++) {
            run(c.body);
            if (stop) return;
          }
          break;
        }
        case "if": {
          const truthy = c.cond === "pathAhead" ? pathAhead() : false;
          run(truthy ? c.then : c.else);
          break;
        }
      }
    }
  }

  run(program);
  if (!result.success && !result.crashed) {
    result.message = "The program finished, but the robot didn't reach the house 🏠. Add more steps!";
  }
  return result;
}

/* ============================================================
   UI building
   ============================================================ */
const TOOL_INFO = {
  forward: { label: "Move Forward", ico: "⬆️", cls: "cmd-move" },
  left: { label: "Turn Left", ico: "↪️", cls: "cmd-left" },
  right: { label: "Turn Right", ico: "↩️", cls: "cmd-right" },
  repeat: { label: "Repeat …", ico: "🔁", cls: "cmd-repeat" },
  if: { label: "IF / ELSE …", ico: "❓", cls: "cmd-if" },
};

const games = [];

function buildLevelPanel(idx) {
  const level = LEVELS[idx];
  const panel = document.getElementById(`level-${idx}`);
  const diffLabel = { easy: "Easy", medium: "Medium", hard: "Hard" }[level.difficulty] || "";

  panel.innerHTML = `
    <div class="level-head">
      <h2>${level.title}</h2>
      <span class="difficulty ${level.difficulty}">${diffLabel}</span>
    </div>
    <div class="level-mission">${level.mission}</div>
    <div class="workspace">
      <div class="box palette">
        <h3>Commands</h3>
        <div id="palette-${idx}"></div>
        <p class="palette-hint">Drag a command into your program. Drag the ⠿ handle to move blocks.</p>
      </div>

      <div class="box">
        <h3>Your Program</h3>
        <div class="builder-target" id="target-${idx}">Drag commands into the area below ↓</div>
        <ul class="program-list dropzone" id="program-${idx}"></ul>
        <div class="controls">
          <button class="btn btn-run" id="run-${idx}">▶ Run</button>
          <button class="btn" id="reset-${idx}">⟲ Reset robot</button>
          <button class="btn" id="clear-${idx}">🗑 Clear</button>
        </div>
        <div class="run-msg info" id="msg-${idx}">Build a program, then press Run!</div>
      </div>

      <div class="box">
        <h3>Maze</h3>
        <div class="stage-wrap"><div class="grid" id="grid-${idx}"></div></div>
        <p class="legend">🤖 robot with cookies 🍪 &nbsp;•&nbsp; 🏠 deliver here &nbsp;•&nbsp; dark = wall</p>
      </div>
    </div>
  `;

  const game = { idx, level, program: [], playing: false };
  games[idx] = game;

  buildPalette(game);
  renderGrid(game);
  renderProgram(game);
  wireControls(game);
}

function buildPalette(game) {
  const wrap = document.getElementById(`palette-${game.idx}`);
  wrap.innerHTML = "";
  game.level.tools.forEach((tool) => {
    const info = TOOL_INFO[tool];
    const item = document.createElement("div");
    item.className = `cmd-btn ${info.cls}`;
    item.innerHTML = `<span class="ico">${info.ico}</span> ${info.label} <span class="grip">⠿</span>`;
    // pointer drag (mouse + touch); click = fallback that appends to the main program
    makeDragSource(item, () => ({ kind: "new", tool, game, label: info.label }));
    item.addEventListener("click", () => {
      if (game.playing || justDragged) return;
      game.program.push(makeCommand(tool));
      renderProgram(game);
    });
    wrap.appendChild(item);
  });
}

/* ---------------- Program rendering ---------------- */
function renderProgram(game) {
  const list = document.getElementById(`program-${game.idx}`);
  list.innerHTML = "";
  wireDropzone(game, list, game.program);

  if (game.program.length === 0) {
    list.appendChild(emptyHint("Drag commands here to build your program."));
  } else {
    game.program.forEach((cmd, i) => list.appendChild(renderCommand(game, cmd, game.program, i)));
  }
  justAddedId = null; // consume: only animate the freshly placed card once
}

function emptyHint(text) {
  const empty = document.createElement("div");
  empty.className = "program-empty";
  empty.textContent = text;
  return empty;
}

function renderCommand(game, cmd, parentArr, index) {
  if (cmd.type === "forward" || cmd.type === "left" || cmd.type === "right") {
    const info = TOOL_INFO[cmd.type];
    const li = document.createElement("li");
    li.className = "cmd-chip prog-item " + (cmd.type === "forward" ? "is-move" : "is-turn");
    li.dataset.id = cmd.id;
    if (cmd.id === justAddedId) li.classList.add("just-added");
    li.innerHTML = `<span class="grip">⠿</span><span class="ico">${info.ico}</span> ${info.label}`;
    makeDragSource(li.querySelector(".grip"), () => ({ kind: "move", id: cmd.id, game, label: info.label }));
    li.appendChild(removeBtn(game, parentArr, index));
    return li;
  }

  if (cmd.type === "repeat") {
    const li = document.createElement("li");
    li.className = "block is-repeat prog-item";
    li.dataset.id = cmd.id;
    if (cmd.id === justAddedId) li.classList.add("just-added");
    const head = document.createElement("div");
    head.className = "block-head";
    head.innerHTML = `<span class="grip">⠿</span>🔁 Repeat`;
    makeDragSource(head.querySelector(".grip"), () => ({ kind: "move", id: cmd.id, game, label: "Repeat" }));
    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.max = String(MAX_REPEAT);
    input.value = cmd.count;
    input.className = "count-input";
    input.addEventListener("change", () => {
      cmd.count = Math.max(1, Math.min(MAX_REPEAT, parseInt(input.value || "1", 10)));
      input.value = cmd.count;
    });
    head.appendChild(input);
    const times = document.createElement("span");
    times.textContent = "times";
    head.appendChild(times);
    head.appendChild(removeBtn(game, parentArr, index));
    li.appendChild(head);
    li.appendChild(renderBodyRegion(game, cmd.body, "do this"));
    return li;
  }

  if (cmd.type === "if") {
    const li = document.createElement("li");
    li.className = "block is-if prog-item";
    li.dataset.id = cmd.id;
    if (cmd.id === justAddedId) li.classList.add("just-added");
    const head = document.createElement("div");
    head.className = "block-head";
    head.innerHTML = `<span class="grip">⠿</span>❓ IF `;
    makeDragSource(head.querySelector(".grip"), () => ({ kind: "move", id: cmd.id, game, label: "IF / ELSE" }));
    const sel = document.createElement("select");
    sel.className = "cond-select";
    sel.innerHTML = `<option value="pathAhead">the path ahead is clear</option>`;
    sel.value = cmd.cond;
    sel.addEventListener("change", () => (cmd.cond = sel.value));
    head.appendChild(sel);
    head.appendChild(removeBtn(game, parentArr, index));
    li.appendChild(head);
    li.appendChild(renderBodyRegion(game, cmd.then, "THEN do this"));
    li.appendChild(renderBodyRegion(game, cmd.else, "ELSE do this"));
    return li;
  }
  return document.createElement("li");
}

function renderBodyRegion(game, arr, label) {
  const region = document.createElement("div");
  region.className = "block-body dropzone";
  const lab = document.createElement("div");
  lab.className = "block-body-label";
  lab.textContent = label;
  region.appendChild(lab);

  if (arr.length === 0) {
    region.appendChild(emptyHint("Drag commands here."));
  } else {
    arr.forEach((c, i) => region.appendChild(renderCommand(game, c, arr, i)));
  }
  wireDropzone(game, region, arr);
  return region;
}

function removeBtn(game, parentArr, index) {
  const btn = document.createElement("button");
  btn.className = "remove";
  btn.textContent = "✕";
  btn.title = "Remove";
  btn.setAttribute("draggable", "false");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    parentArr.splice(index, 1);
    renderProgram(game);
  });
  return btn;
}

/* ---------------- Pointer-based drag-and-drop (mouse + touch) ---------------- */
/* A dropzone simply remembers which command array and game it represents. */
function wireDropzone(game, el, arr) {
  el._arr = arr;
  el._game = game;
}

function dropIndex(container, clientY) {
  const items = [...container.querySelectorAll(":scope > .prog-item")];
  for (let i = 0; i < items.length; i++) {
    const r = items[i].getBoundingClientRect();
    if (clientY < r.top + r.height / 2) return i;
  }
  return items.length;
}

function clearDropHighlights() {
  document.querySelectorAll(".dropzone.drop-active").forEach((d) => d.classList.remove("drop-active"));
}

let pendingDrag = null; // {payloadFn, x, y}
let activeDrag = null; // {kind, tool?, id?, game, ghost}
let justDragged = false; // suppress the click that may follow a drag
let justAddedId = null; // command id to animate (pop-in) on the next render
let dropIndicatorEl = null; // the insertion line shown while dragging
const DRAG_THRESHOLD = 6;

function makeDragSource(el, payloadFn) {
  if (!el) return;
  el.style.touchAction = "none"; // let us handle the gesture instead of scrolling
  el.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    const payload = payloadFn();
    if (payload.game && payload.game.playing) return;
    pendingDrag = { payload, x: e.clientX, y: e.clientY };
  });
}

function beginDrag(e) {
  const { payload } = pendingDrag;
  pendingDrag = null;
  activeDrag = { ...payload };

  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  ghost.textContent = payload.label || "block";
  document.body.appendChild(ghost);
  activeDrag.ghost = ghost;
  moveGhost(e);
  document.body.classList.add("dragging");

  // dim the card being moved so it reads as "lifted"
  if (activeDrag.kind === "move") {
    const el = document.querySelector(`#program-${cssId(activeDrag.game.idx)} .prog-item[data-id="${activeDrag.id}"]`);
    if (el) el.classList.add("is-dragging");
  }
}

function cssId(idx) {
  return idx; // idx is already a safe string/number used in element ids
}

function moveGhost(e) {
  if (!activeDrag) return;
  activeDrag.ghost.style.left = `${e.clientX}px`;
  activeDrag.ghost.style.top = `${e.clientY}px`;
}

function zoneUnderPointer(e) {
  const ghost = activeDrag.ghost;
  ghost.style.display = "none";
  const elBelow = document.elementFromPoint(e.clientX, e.clientY);
  ghost.style.display = "";
  if (!elBelow) return null;
  const zone = elBelow.closest(".dropzone");
  if (!zone || zone._game !== activeDrag.game) return null;
  if (activeDrag.kind === "move") {
    const found = findById(activeDrag.game.program, activeDrag.id);
    if (found && ownArrays(found.cmd).has(zone._arr)) return null;
  }
  return zone;
}

/* show a line at the exact spot the command will be inserted (above/below) */
function showDropIndicator(zone, idx) {
  clearDropIndicator();
  const items = [...zone.querySelectorAll(":scope > .prog-item")];
  dropIndicatorEl = document.createElement("div");
  dropIndicatorEl.className = "drop-indicator";
  if (idx < items.length) zone.insertBefore(dropIndicatorEl, items[idx]);
  else zone.appendChild(dropIndicatorEl);
}

function clearDropIndicator() {
  if (dropIndicatorEl) {
    dropIndicatorEl.remove();
    dropIndicatorEl = null;
  }
}

function onPointerMove(e) {
  if (activeDrag) {
    moveGhost(e);
    clearDropHighlights();
    clearDropIndicator(); // measure against clean layout (no indicator)
    const zone = zoneUnderPointer(e);
    if (zone) {
      zone.classList.add("drop-active");
      showDropIndicator(zone, dropIndex(zone, e.clientY));
    }
    e.preventDefault();
  } else if (pendingDrag) {
    const dx = e.clientX - pendingDrag.x;
    const dy = e.clientY - pendingDrag.y;
    if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) beginDrag(e);
  }
}

function onPointerUp(e) {
  if (!activeDrag) {
    pendingDrag = null;
    return;
  }
  clearDropIndicator();
  const zone = zoneUnderPointer(e);
  if (zone) {
    const game = activeDrag.game;
    const arr = zone._arr;
    const idx = dropIndex(zone, e.clientY);
    if (activeDrag.kind === "new") {
      const cmd = makeCommand(activeDrag.tool);
      arr.splice(idx, 0, cmd);
      justAddedId = cmd.id;
    } else {
      const found = findById(game.program, activeDrag.id);
      if (found && !ownArrays(found.cmd).has(arr)) {
        let target = idx;
        const wasSameArr = found.arr === arr;
        found.arr.splice(found.index, 1);
        if (wasSameArr && found.index < target) target--;
        arr.splice(target, 0, found.cmd);
        justAddedId = found.cmd.id;
      }
    }
    renderProgram(game);
  }
  endDrag();
}

function endDrag() {
  if (activeDrag && activeDrag.ghost) activeDrag.ghost.remove();
  clearDropHighlights();
  clearDropIndicator();
  document.body.classList.remove("dragging");
  document.querySelectorAll(".prog-item.is-dragging").forEach((el) => el.classList.remove("is-dragging"));
  activeDrag = null;
  justDragged = true;
  setTimeout(() => (justDragged = false), 0);
}

function initDragEngine() {
  document.addEventListener("pointermove", onPointerMove, { passive: false });
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", () => {
    if (activeDrag) {
      const game = activeDrag.game;
      endDrag();
      if (game) renderProgram(game); // restore the dimmed card
    }
    pendingDrag = null;
  });
}

/* ---------------- Grid rendering ---------------- */
function renderGrid(game) {
  const { grid, goal } = parseMap(game.level);
  const gridEl = document.getElementById(`grid-${game.idx}`);
  const cols = Math.max(...grid.map((r) => r.length));
  game.cols = cols;
  game.rows = grid.length;
  gridEl.style.gridTemplateColumns = `repeat(${cols}, var(--cell))`;
  gridEl.innerHTML = "";

  game.cells = {};
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < cols; x++) {
      const ch = grid[y][x] || "#";
      const cell = document.createElement("div");
      cell.className = "cell " + (ch === "#" ? "wall" : "open");
      if (ch === "G") {
        cell.classList.add("goal");
        cell.textContent = "🏠";
      }
      if (x === game.level.start.x && y === game.level.start.y) cell.classList.add("start");
      if (game.editable) {
        cell.classList.add("editable-cell");
        cell.addEventListener("click", () => paintCell(game, x, y));
      }
      game.cells[`${x},${y}`] = cell;
      gridEl.appendChild(cell);
    }
  }

  const robot = document.createElement("div");
  robot.className = "robot";
  robot.id = `robot-${game.idx}`;
  robot.innerHTML = `<div class="body"></div>`;
  gridEl.appendChild(robot);
  game.robotEl = robot;
  game.goal = goal;
  fitGrid(game);
}

/* size the cells so the maze fits the visible width (responsive + touch friendly) */
function fitGrid(game) {
  const gridEl = document.getElementById(`grid-${game.idx}`);
  if (!gridEl || !game.cols) return;
  const wrap = gridEl.parentElement; // .stage-wrap
  const gap = 3;
  // available width: the stage wrapper when visible, else a viewport-based guess
  const avail = wrap && wrap.clientWidth ? wrap.clientWidth : Math.min(window.innerWidth - 48, 520);
  let cell = Math.floor((avail - (game.cols + 1) * gap) / game.cols);
  cell = Math.max(16, Math.min(48, cell));
  gridEl.style.setProperty("--cell", `${cell}px`);
  if (!game.playing) placeRobot(game, game.level.start, false);
}

function placeRobot(game, st, crashed) {
  const cell = game.cells[`${st.x},${st.y}`];
  if (cell) {
    game.robotEl.style.width = `${cell.offsetWidth}px`;
    game.robotEl.style.height = `${cell.offsetHeight}px`;
    game.robotEl.style.left = `${cell.offsetLeft}px`;
    game.robotEl.style.top = `${cell.offsetTop}px`;
  }
  const body = game.robotEl.querySelector(".body");
  const rot = `rotate(${DIR_DEG[st.dir]}deg)`;
  body.style.setProperty("--rot", rot);
  body.style.transform = rot;
  game.robotEl.classList.toggle("crashed", !!crashed);
}

/* ---------------- Controls & playback ---------------- */
function wireControls(game) {
  document.getElementById(`run-${game.idx}`).addEventListener("click", () => runProgram(game));
  document.getElementById(`reset-${game.idx}`).addEventListener("click", () => {
    if (game.playing) return;
    placeRobot(game, game.level.start, false);
    setMsg(game, "info", "Robot reset. Press Run when ready!");
  });
  document.getElementById(`clear-${game.idx}`).addEventListener("click", () => {
    if (game.playing) return;
    game.program.length = 0;
    placeRobot(game, game.level.start, false);
    renderProgram(game);
    setMsg(game, "info", "Program cleared.");
  });
}

function setMsg(game, kind, text) {
  const el = document.getElementById(`msg-${game.idx}`);
  el.className = `run-msg ${kind}`;
  el.textContent = text;
}

function flattenCount(program) {
  let n = 0;
  for (const c of program) {
    n++;
    if (c.type === "repeat") n += flattenCount(c.body);
    if (c.type === "if") n += flattenCount(c.then) + flattenCount(c.else);
  }
  return n;
}

function runProgram(game) {
  if (game.playing) return;
  if (flattenCount(game.program) === 0) {
    setMsg(game, "bad", "Your program is empty — drag in some commands first!");
    return;
  }
  const result = simulate(game.level, game.program);
  game.playing = true;
  setButtonsDisabled(game, true);
  setMsg(game, "info", "Running… 🤖");

  let i = 0;
  placeRobot(game, result.frames[0], false);
  const timer = setInterval(() => {
    i++;
    if (i >= result.frames.length) {
      clearInterval(timer);
      finishRun(game, result);
      return;
    }
    placeRobot(game, result.frames[i], result.frames[i].crashed);
  }, 360);
}

function finishRun(game, result) {
  game.playing = false;
  setButtonsDisabled(game, false);
  if (result.success) {
    if (game.isSandbox) {
      setMsg(game, "ok", "🎉 It works! The robot delivered the cookies to the house! 🍪🏠");
      return;
    }
    setMsg(game, "ok", "🎉 Cookies delivered! Great algorithm!");
    markTabDone(game.idx);
    showCelebrate(game.idx);
  } else {
    setMsg(game, "bad", result.message);
  }
}

function setButtonsDisabled(game, disabled) {
  ["run", "reset", "clear"].forEach((k) => {
    const el = document.getElementById(`${k}-${game.idx}`);
    if (el) el.disabled = disabled;
  });
  document.querySelectorAll(`#palette-${game.idx} .cmd-btn`).forEach((b) => {
    b.style.opacity = disabled ? "0.5" : "";
    b.style.pointerEvents = disabled ? "none" : "";
  });
  if (game.isSandbox) {
    document.querySelectorAll("#maze-tools-sandbox .maze-tool").forEach((b) => (b.disabled = disabled));
  }
}

/* ============================================================
   Tabs / navigation / celebration / pioneers
   ============================================================ */
function showPanel(id) {
  document.querySelectorAll(".panel").forEach((p) => p.classList.remove("is-active"));
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
  const panel = document.getElementById(id);
  if (panel) panel.classList.add("is-active");
  const tab = document.querySelector(`.tab[data-target="${id}"]`);
  if (tab) tab.classList.add("is-active");
  window.scrollTo({ top: 0, behavior: "smooth" });

  // re-fit the grid now the panel is visible (cell offsets are only valid when shown)
  let g = null;
  if (id.startsWith("level-")) g = games[Number(id.slice(6))];
  else if (id === "sandbox") g = sandboxGame;
  activeGame = g;
  if (g && !g.playing && g.cols) fitGrid(g);
}

let activeGame = null;
let resizeTimer = null;
function onWindowResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (activeGame && !activeGame.playing && activeGame.cols) fitGrid(activeGame);
  }, 120);
}

function markTabDone(idx) {
  const tab = document.querySelector(`.tab[data-target="level-${idx}"]`);
  if (tab) tab.classList.add("is-done");
}

/* next panel id after finishing level idx */
function nextPanelId(idx) {
  return idx + 1 < LEVELS.length ? `level-${idx + 1}` : "pioneers";
}

const CONCEPT_BLURB = {
  Sequence: "The robot followed your commands in order — that's an algorithm with a sequence.",
  Loop: "Nice! A Repeat loop let you do more with fewer commands.",
  "Conditional (IF / ELSE)": "Amazing! Your IF/ELSE let the robot make its own decisions.",
};

function showCelebrate(idx) {
  const overlay = document.getElementById("celebrate");
  const nextBtn = document.getElementById("celebrate-next");
  const level = LEVELS[idx];
  const nextId = nextPanelId(idx);

  document.getElementById("celebrate-title").textContent =
    level.difficulty === "hard" ? "Wow — you cracked the hard one! 🏆" : "Cookies delivered! 🍪";
  document.getElementById("celebrate-msg").textContent = CONCEPT_BLURB[level.concept] || "";
  nextBtn.textContent = nextId === "pioneers" ? "Meet the pioneers ★" : "Next maze →";
  nextBtn.onclick = () => {
    overlay.hidden = true;
    showPanel(nextId);
  };
  overlay.hidden = false;
}

function buildPioneers() {
  const wrap = document.getElementById("pioneer-cards");
  wrap.innerHTML = "";
  PIONEERS.forEach((p) => {
    const card = document.createElement("div");
    card.className = "pioneer";
    card.innerHTML = `
      <div class="face">${p.face}</div>
      <h3>${p.name}</h3>
      <div class="years">${p.years}</div>
      <p>${p.text}</p>`;
    wrap.appendChild(card);
  });
}

/* build a level tab + empty panel for each level, inserted before Pioneers */
function buildLevelShells() {
  const tabsNav = document.getElementById("tabs");
  const pioneersTab = tabsNav.querySelector('.tab[data-target="pioneers"]');
  const pioneersPanel = document.getElementById("pioneers");
  const main = pioneersPanel.parentNode;

  LEVELS.forEach((level, idx) => {
    const tab = document.createElement("button");
    tab.className = "tab";
    tab.dataset.target = `level-${idx}`;
    tab.innerHTML = `<span class="tab-num">${level.step}</span> ${level.tab}`;
    tabsNav.insertBefore(tab, pioneersTab);

    const panel = document.createElement("section");
    panel.id = `level-${idx}`;
    panel.className = "panel level-panel";
    main.insertBefore(panel, pioneersPanel);
  });
}

/* ============================================================
   Build Your Own Maze (sandbox)
   ============================================================ */
let sandboxGame = null;
const SANDBOX_SIZES = [7, 9, 11, 13, 15];
const DEFAULT_SANDBOX_SIZE = 9;

const MAZE_TOOLS = [
  { key: "wall", label: "🧱 Wall" },
  { key: "path", label: "⬜ Path" },
  { key: "start", label: "🤖 Robot" },
  { key: "house", label: "🏠 House" },
];

function isBorder(x, y, cols, rows) {
  return x === 0 || y === 0 || x === cols - 1 || y === rows - 1;
}

function blankGrid(cols, rows) {
  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => (isBorder(x, y, cols, rows) ? "#" : "."))
  );
}

/* a fresh sandbox model: blank maze, robot top-left, house bottom-right */
function makeSandboxModel(cols, rows) {
  return {
    grid: blankGrid(cols, rows),
    cols,
    rows,
    start: { x: 1, y: 1, dir: 1 },
    goal: { x: cols - 2, y: rows - 2 },
  };
}

function setSandboxSize(game, n) {
  game.sb = makeSandboxModel(n, n);
  syncSandboxMap(game);
  renderGrid(game);
  setMsg(game, "info", `Maze is now ${n} × ${n}. Draw your own, or press 🎲 Random Maze!`);
}

/* recursive-backtracker maze generator — always fully connected (solvable) */
function generateMaze(game) {
  const { cols, rows } = game.sb;
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => "#"));
  const inBounds = (x, y) => x > 0 && y > 0 && x < cols - 1 && y < rows - 1;

  grid[1][1] = ".";
  const stack = [[1, 1]];
  const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]];

  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const options = [];
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (inBounds(nx, ny) && grid[ny][nx] === "#") options.push([nx, ny, cx + dx / 2, cy + dy / 2]);
    }
    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const [nx, ny, wx, wy] = options[Math.floor(Math.random() * options.length)];
    grid[wy][wx] = ".";
    grid[ny][nx] = ".";
    stack.push([nx, ny]);
  }

  game.sb.grid = grid;
  game.sb.start = { x: 1, y: 1, dir: 1 };
  game.sb.goal = { x: cols - 2, y: rows - 2 };
  grid[rows - 2][cols - 2] = "."; // make sure the house sits on a path
  syncSandboxMap(game);
  renderGrid(game);
  setMsg(game, "info", "Here's a random maze! Can you write a program to reach the 🏠?");
}

/* rebuild level.map (strings, with 'G' at the goal) from the editable grid model */
function syncSandboxMap(game) {
  const sb = game.sb;
  game.level.map = sb.grid.map((row, y) =>
    row.map((ch, x) => (x === sb.goal.x && y === sb.goal.y ? "G" : ch)).join("")
  );
  game.level.start = { x: sb.start.x, y: sb.start.y, dir: sb.start.dir };
}

function paintCell(game, x, y) {
  if (game.playing) return;
  const sb = game.sb;
  if (isBorder(x, y, sb.cols, sb.rows)) return; // outer ring stays walls so the robot can't leave

  switch (game.tool) {
    case "wall":
      if ((x === sb.start.x && y === sb.start.y) || (x === sb.goal.x && y === sb.goal.y)) {
        setMsg(game, "bad", "Move the 🤖 or 🏠 before drawing a wall there.");
        return;
      }
      sb.grid[y][x] = "#";
      break;
    case "path":
      sb.grid[y][x] = ".";
      break;
    case "start":
      if (x === sb.goal.x && y === sb.goal.y) {
        setMsg(game, "bad", "The robot and house can't share a square.");
        return;
      }
      sb.grid[y][x] = ".";
      sb.start.x = x;
      sb.start.y = y;
      break;
    case "house":
      if (x === sb.start.x && y === sb.start.y) {
        setMsg(game, "bad", "The robot and house can't share a square.");
        return;
      }
      sb.grid[y][x] = ".";
      sb.goal = { x, y };
      break;
  }
  syncSandboxMap(game);
  renderGrid(game); // also re-places the robot
}

function clearSandboxMaze(game) {
  const sb = game.sb;
  for (let y = 1; y < sb.rows - 1; y++) {
    for (let x = 1; x < sb.cols - 1; x++) sb.grid[y][x] = ".";
  }
  syncSandboxMap(game);
  renderGrid(game);
  setMsg(game, "info", "Maze cleared — start drawing!");
}

/* size selector + random maze button (above the paint tools) */
function buildMazeSize(game) {
  const wrap = document.getElementById("maze-size-sandbox");
  wrap.innerHTML = "";

  const label = document.createElement("span");
  label.className = "size-label";
  label.textContent = "Maze size:";
  wrap.appendChild(label);

  const sel = document.createElement("select");
  sel.className = "cond-select";
  sel.id = "size-select-sandbox";
  SANDBOX_SIZES.forEach((n) => {
    const opt = document.createElement("option");
    opt.value = String(n);
    opt.textContent = `${n} × ${n}`;
    if (n === game.sb.cols) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener("change", () => {
    if (game.playing) return;
    setSandboxSize(game, parseInt(sel.value, 10));
  });
  wrap.appendChild(sel);

  const rnd = document.createElement("button");
  rnd.className = "maze-tool random";
  rnd.textContent = "🎲 Random Maze";
  rnd.addEventListener("click", () => {
    if (game.playing) return;
    generateMaze(game);
  });
  wrap.appendChild(rnd);
}

function buildMazeTools(game) {
  const wrap = document.getElementById("maze-tools-sandbox");
  wrap.innerHTML = "";

  MAZE_TOOLS.forEach((t) => {
    const b = document.createElement("button");
    b.className = "maze-tool" + (game.tool === t.key ? " is-active" : "");
    b.textContent = t.label;
    b.dataset.tool = t.key;
    b.addEventListener("click", () => {
      if (game.playing) return;
      game.tool = t.key;
      wrap.querySelectorAll(".maze-tool[data-tool]").forEach((x) =>
        x.classList.toggle("is-active", x.dataset.tool === game.tool)
      );
    });
    wrap.appendChild(b);
  });

  const turn = document.createElement("button");
  turn.className = "maze-tool alt";
  turn.textContent = "↻ Turn robot";
  turn.addEventListener("click", () => {
    if (game.playing) return;
    game.sb.start.dir = (game.sb.start.dir + 1) % 4;
    syncSandboxMap(game);
    placeRobot(game, game.level.start, false);
  });
  wrap.appendChild(turn);

  const clr = document.createElement("button");
  clr.className = "maze-tool alt";
  clr.textContent = "✖ Clear maze";
  clr.addEventListener("click", () => {
    if (game.playing) return;
    clearSandboxMaze(game);
  });
  wrap.appendChild(clr);
}

function buildSandbox() {
  const panel = document.getElementById("sandbox");
  panel.innerHTML = `
    <div class="level-head">
      <h2>Build Your Own Maze</h2>
      <span class="difficulty easy">Sandbox</span>
    </div>
    <div class="level-mission">
      Now <span class="concept">you're</span> the maze maker! Choose a <em>size</em>, then pick a tool and click (or tap)
      squares to draw <em>walls</em> and <em>paths</em>. Place the robot 🤖 where it starts and the house 🏠 where the
      cookies go — or press <strong>🎲 Random Maze</strong> to make one instantly. Then build a program on the left and
      press <strong>Run</strong> to test it!
    </div>
    <div class="workspace">
      <div class="box palette">
        <h3>Commands</h3>
        <div id="palette-sandbox"></div>
        <p class="palette-hint">Drag a command into your program. Drag the ⠿ handle to move blocks.</p>
      </div>

      <div class="box">
        <h3>Your Program</h3>
        <div class="builder-target" id="target-sandbox">Drag commands into the area below ↓</div>
        <ul class="program-list dropzone" id="program-sandbox"></ul>
        <div class="controls">
          <button class="btn btn-run" id="run-sandbox">▶ Run</button>
          <button class="btn" id="reset-sandbox">⟲ Reset robot</button>
          <button class="btn" id="clear-sandbox">🗑 Clear program</button>
        </div>
        <div class="run-msg info" id="msg-sandbox">Draw a maze, build a program, then press Run!</div>
      </div>

      <div class="box">
        <h3>Maze Designer</h3>
        <div class="maze-size" id="maze-size-sandbox"></div>
        <div class="maze-tools" id="maze-tools-sandbox"></div>
        <div class="stage-wrap"><div class="grid" id="grid-sandbox"></div></div>
        <p class="legend">Pick a tool, then click (or tap) a square to draw it.</p>
      </div>
    </div>
  `;

  const game = {
    idx: "sandbox",
    isSandbox: true,
    editable: true,
    playing: false,
    program: [],
    tool: "wall",
    sb: makeSandboxModel(DEFAULT_SANDBOX_SIZE, DEFAULT_SANDBOX_SIZE),
    level: { tools: ["forward", "left", "right", "repeat", "if"], start: { x: 1, y: 1, dir: 1 }, map: [] },
  };
  sandboxGame = game;

  buildMazeSize(game);
  buildMazeTools(game);
  buildPalette(game);
  syncSandboxMap(game);
  renderGrid(game);
  renderProgram(game);
  wireControls(game);
}

/* ---------------- Init ---------------- */
function init() {
  initDragEngine();
  buildLevelShells();
  LEVELS.forEach((_, idx) => buildLevelPanel(idx));
  buildPioneers();
  buildSandbox();

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => showPanel(tab.dataset.target));
  });
  document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => showPanel(btn.dataset.goto));
  });
  document.getElementById("celebrate-stay").addEventListener("click", () => {
    document.getElementById("celebrate").hidden = true;
  });
  window.addEventListener("resize", onWindowResize);
}

document.addEventListener("DOMContentLoaded", init);
