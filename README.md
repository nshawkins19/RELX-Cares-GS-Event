# 🤖 Coding for Good

An interactive activity site that helps Girl Scout Juniors earn two **Coding for Good** badges. A switcher at the top of the page toggles between them:

- **Badge 1: Coding Basics** — program a robot to solve mazes.
- **Badge 2: Digital Game Design** — design, build, and share your own maze game.

## Badge 1 — Coding Basics

Players guide a helpful robot through a maze to deliver a box of Girl Scout cookies to a customer's house, learning the three core ideas of programming along the way:

1. **Sequence** — put commands in the right order
2. **Loops** — use a `Repeat` block to do more with less
3. **Conditionals** — use `IF / ELSE` so the robot can make decisions

Each step has **two mazes** that get progressively harder — an easier intro maze and a tougher ★ maze (a long zig-zag, a staircase loop, and a full clockwise spiral). Programs are built by **dragging** command blocks into place, reordering them, and nesting them inside loops and conditionals.

It includes a **Coding Pioneers** section celebrating women who shaped computer science (Ada Lovelace, Grace Hopper, Raye Montague, Margaret Hamilton), and ends with a **Build Your Own Maze** sandbox where kids draw their own maze — walls, paths, the robot's start, and the house — then write a program to solve it.

## Badge 2 — Digital Game Design

Instead of *solving* a maze, kids **design their own maze game** and share it with a friend. It follows the game design process across five guided steps (plus a celebration Finish stage):

1. **Discover** — explore real "games for good" for inspiration.
2. **Explore** — look at the tools and ideas (loops, conditionals) used to make digital games, and reflect on favorites.
3. **Plan** — decide the goal, characters, and challenges of your game.
4. **Build** — draw the maze *and* code its rules, then playtest it.
5. **Share** — send your game to a friend and use their feedback to improve it.
6. **🏆 Finish** — play your finished game and generate a printable certificate.

**The creator** draws the maze (walls, player start, goal, items, keys, doors, push blocks) and codes how it behaves using the same drag-and-drop block engine as Badge 1 — organized into **Events** (when Play clicked, when an arrow is pressed, when the robot touches something), **Motion** (move), **Actions** (pick it up, open the door, win the game, show message), and **Control** (if carrying a key, if all items collected).

**The player** — for example, a friend who opens a share link — navigates the finished maze with the **arrow keys or an on-screen D-pad**; no coding is needed to play. Player-chosen **icons** re-skin the player, item, and goal (e.g. a diver collecting cans, an astronaut reaching a satellite).

Games are self-contained: the work autosaves to `localStorage`, and a game is shared as a `#play=<base64>` link that encodes the whole maze and rule set — no server required. The Finish stage renders a full-page certificate (title, "by the numbers" stats, maze snapshot, and reflections) that can be **saved as a PDF**.

## Run it locally

It's a plain static site — no build step, no dependencies. Just open `index.html` in a browser, or serve the folder:

```bash
# from the project folder
python -m http.server 8000
# then visit http://localhost:8000
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure and content for both badges |
| `styles.css` | Shared styling (Badge 1 + maze grid) |
| `app.js` | Maze game, program builder, and interpreter (Badge 1); shared drag/grid engine |
| `badge2.js` | Badge 2 — the 5-step Digital Game Design flow, rule engine, sharing, and certificate/PDF |
| `badge2.css` | Badge 2 styling (steps, code palette, certificate) |
| `.nojekyll` | Serve files without Jekyll processing |

Badge 2 is kept modular in `badge2.js` / `badge2.css`; it reuses `app.js`'s drag-and-drop and grid rendering through additive, behavior-neutral hooks, so Badge 1 is unaffected.

## How the activity maps to the badges

### Badge 1: Coding Basics

| Badge step | In the app |
|------------|-----------|
| 1. Create algorithms that follow a sequence | Level 1 — build a sequence of move/turn commands |
| 2. Use loops to improve your algorithm | Level 2 — `Repeat … times` block |
| 3. Keep your code interesting with conditionals | Level 3 — `IF / ELSE` block |
| 4. Create your own set of commands that use conditionals | Level 3 — nest commands inside loops and conditionals |
| 5. Learn about women in computer science | Coding Pioneers section |
| Bonus — design & test your own | Build Your Own Maze sandbox |

### Badge 2: Digital Game Design

Steps quoted from the Junior Coding for Good booklet (Badge 2, p. 10).

| Badge step | In the app |
|------------|-----------|
| 1. Discover how game design can be used "for good" | Discover — real "games for good" examples for inspiration |
| 2. Explore tools used to develop digital games | Explore — look at the tools and ideas (loops, conditionals) behind digital games |
| 3. Plan a maze game | Plan — decide the goal, characters, and challenges of your maze game |
| 4. Build and test your maze game | Build — draw the maze, code its rules, and playtest it |
| 5. Share and improve your maze game | Share — send a link, gather feedback, and iterate |
| _(app bonus)_ | Finish — play your finished game and save a certificate |

> **Badge purpose:** "When I've earned this badge, I'll know how video games are developed and how to plan, build, and improve a game by iteration."
