# 🤖 Coding for Good

An interactive coding activity that helps kids earn the Girl Scouts **Junior Coding for Good — Badge 1: Coding Basics** badge.

Players guide a helpful robot through a maze to deliver a care package, learning the three core ideas of programming along the way:

1. **Sequence** — put commands in the right order
2. **Loops** — use a `Repeat` block to do more with less
3. **Conditionals** — use `IF / ELSE` so the robot can make decisions

Each step has **two mazes** that get progressively harder — an easier intro maze and a tougher ★ maze (a long zig-zag, a staircase loop, and a full clockwise spiral). Programs are built by **dragging** command blocks into place, reordering them, and nesting them inside loops and conditionals.

It finishes with a **Coding Pioneers** section celebrating women who shaped computer science (Ada Lovelace, Grace Hopper, Raye Montague, Margaret Hamilton).

## Run it locally

It's a plain static site — no build step, no dependencies. Just open `index.html` in a browser, or serve the folder:

```bash
# from the project folder
python -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

1. Create a new GitHub repository and push these files to it:

   ```bash
   cd "coding-for-good"
   git init
   git add .
   git commit -m "Coding for Good interactive activity"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. On GitHub, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Pick the **`main`** branch and the **`/ (root)`** folder, then **Save**.
5. Wait a minute, then visit `https://<your-username>.github.io/<your-repo>/`.

The included `.nojekyll` file tells GitHub Pages to serve the files as-is.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure and content |
| `styles.css` | All styling |
| `app.js` | Maze game, program builder, and interpreter |
| `.nojekyll` | Serve files without Jekyll processing |

## How the activity maps to the badge

| Badge step | In the app |
|------------|-----------|
| 1. Create algorithms that follow a sequence | Level 1 — build a sequence of move/turn commands |
| 2. Use loops to improve your algorithm | Level 2 — `Repeat … times` block |
| 3. Keep your code interesting with conditionals | Level 3 — `IF / ELSE` block |
| 4. Create your own set of commands that use conditionals | Level 3 — nest commands inside loops and conditionals |
| 5. Learn about women in computer science | Coding Pioneers section |
