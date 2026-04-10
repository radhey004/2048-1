# 2048 (React + Vite)

Modern React + Vite implementation of the classic **2048** game, migrated from the original vanilla JavaScript structure while preserving the familiar gameplay and visual style.

## Overview

This version includes:

- React-based UI rendering
- Vite-based development and production build pipeline
- Keyboard + mobile swipe controls
- Persistent best score and in-progress game state via `localStorage`
- Modular game engine (`src/game.js`) with readable comments

## Why React For This Project?

Using plain HTML/CSS/JS works for small prototypes, but this game benefits from React as it grows:

- **State-driven UI is cleaner**  
  Game state (tiles, score, win/lose) lives in one predictable flow, and UI updates automatically from that state.

- **Less manual DOM manipulation**  
  Original-style imperative DOM updates are harder to reason about and easier to break. React removes most direct DOM bookkeeping.

- **Better maintainability**  
  UI (`App.jsx`) and game logic (`game.js`) are clearly separated, which makes changes safer and faster.

- **Easier feature expansion**  
  Adding things like animations, undo, board-size options, themes, or settings is more scalable with component-based structure.

- **Improved developer experience**  
  Vite + React gives fast refresh, modern module tooling, and easier long-term refactoring.

## Tech Stack

- **React 18**
- **Vite 5**
- Plain CSS (reusing original styles and fonts)

## Requirements

- Node.js 18+ recommended
- npm (comes with Node.js)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start local dev server:
   ```bash
   npm run dev
   ```
3. Open the URL shown in terminal (typically `http://localhost:5173`)

## Available Scripts

- `npm run dev`  
  Starts Vite in development mode with fast refresh.

- `npm run build`  
  Builds production-ready files into `dist/`.

- `npm run preview`  
  Serves the production build locally for validation.

## Project Structure

```txt
2048/
├─ src/
│  ├─ App.jsx        # React UI, controls wiring, persistence hooks
│  ├─ game.js        # Core 2048 engine (grid + movement + merge rules)
│  └─ main.jsx       # React entry point
├─ style/
│  ├─ main.css       # Original 2048 styling (reused)
│  └─ fonts/         # Clear Sans font assets
├─ meta/             # Apple touch icons/startup assets
├─ index.html        # Vite HTML entry
├─ vite.config.js    # Vite config
└─ package.json      # Scripts + dependencies
```

## Controls

- Arrow keys: move tiles
- `W`, `A`, `S`, `D`: move tiles
- `H`, `J`, `K`, `L`: Vim-style movement
- `R`: restart game
- Swipe (mobile/touch): move tiles

## Gameplay Rules (Implementation Notes)

- Grid size is fixed at `4 x 4`.
- New game starts with **two random tiles** (`2` most of the time, occasionally `4`).
- On each valid move:
  - Tiles slide in the chosen direction.
  - Equal adjacent tiles merge once per move.
  - Score increases by merged tile values.
  - One new random tile is spawned.
- Win condition is reaching tile `2048`.
- After winning, user may continue (`Keep going`) beyond 2048.
- Game over occurs when no empty cells and no merges are possible.

## Persistence

The app uses browser `localStorage`:

- `bestScore`: highest score achieved on this browser
- `gameState`: active game snapshot (cleared on game over)

If storage is unavailable/restricted, the game still runs without persistence.

## Build Output

Production output is generated in:

- `dist/`

You can deploy the `dist/` folder to any static host (Netlify, Vercel, GitHub Pages, etc.).

## Customization Tips

- Change gameplay internals in `src/game.js`:
  - board size constants
  - random tile spawn behavior
  - movement/merge logic
- Change UI/layout in `src/App.jsx`
- Change styling/theme in `style/main.css`

## Troubleshooting

- If dependencies fail:
  - delete `node_modules`
  - run `npm install` again
- If local state looks stuck:
  - clear browser local storage for this app origin
- If build fails unexpectedly:
  - run `npm run build` and inspect exact error line

## License

This project includes the original 2048 MIT license text in `LICENSE.txt`.
