const GRID_SIZE = 4;

function createEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

function randomEmptyCell(grid) {
  const openCells = [];

  for (let x = 0; x < GRID_SIZE; x += 1) {
    for (let y = 0; y < GRID_SIZE; y += 1) {
      if (!grid[x][y]) openCells.push({ x, y });
    }
  }

  if (!openCells.length) return null;
  return openCells[Math.floor(Math.random() * openCells.length)];
}

function addRandomTile(grid, nextId) {
  const cell = randomEmptyCell(grid);
  if (!cell) return { grid, nextId, tile: null };

  const tile = {
    id: nextId,
    x: cell.x,
    y: cell.y,
    value: Math.random() < 0.9 ? 2 : 4,
    previousPosition: null,
    mergedFrom: null,
    isNew: true,
  };

  const newGrid = grid.map((column) => column.slice());
  newGrid[cell.x][cell.y] = tile;

  return { grid: newGrid, nextId: nextId + 1, tile };
}

function buildTraversals(vector) {
  const traversals = {
    x: [0, 1, 2, 3],
    y: [0, 1, 2, 3],
  };

  // We move from the edge in the movement direction so each tile settles once.
  if (vector.x === 1) traversals.x.reverse();
  if (vector.y === 1) traversals.y.reverse();

  return traversals;
}

function getVector(direction) {
  return (
    {
      0: { x: 0, y: -1 }, // Up
      1: { x: 1, y: 0 }, // Right
      2: { x: 0, y: 1 }, // Down
      3: { x: -1, y: 0 }, // Left
    }[direction] || null
  );
}

function withinBounds(cell) {
  return (
    cell.x >= 0 && cell.x < GRID_SIZE && cell.y >= 0 && cell.y < GRID_SIZE
  );
}

function findFarthestPosition(start, vector, grid) {
  let previous;
  let cell = { ...start };

  do {
    previous = cell;
    cell = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (withinBounds(cell) && !grid[cell.x][cell.y]);

  return { farthest: previous, next: cell };
}

function flattenGrid(grid) {
  const tiles = [];

  for (let x = 0; x < GRID_SIZE; x += 1) {
    for (let y = 0; y < GRID_SIZE; y += 1) {
      if (grid[x][y]) tiles.push(grid[x][y]);
    }
  }

  return tiles;
}

function tileMatchesAvailable(grid) {
  for (let x = 0; x < GRID_SIZE; x += 1) {
    for (let y = 0; y < GRID_SIZE; y += 1) {
      const tile = grid[x][y];
      if (!tile) continue;

      const neighbors = [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 },
      ];

      for (const neighbor of neighbors) {
        if (!withinBounds(neighbor)) continue;
        const other = grid[neighbor.x][neighbor.y];
        if (other && other.value === tile.value) return true;
      }
    }
  }

  return false;
}

function movesAvailable(grid) {
  return !!randomEmptyCell(grid) || tileMatchesAvailable(grid);
}

function serializableState(state) {
  return {
    score: state.score,
    over: state.over,
    won: state.won,
    keepPlaying: state.keepPlaying,
    nextId: state.nextId,
    tiles: state.tiles.map((tile) => ({
      id: tile.id,
      x: tile.x,
      y: tile.y,
      value: tile.value,
    })),
  };
}

function hydrateTiles(tiles) {
  return tiles.map((tile) => ({
    ...tile,
    previousPosition: null,
    mergedFrom: null,
    isNew: false,
  }));
}

export function createNewGame() {
  let nextId = 1;
  let grid = createEmptyGrid();

  // Start with two random tiles, same as the original game.
  const first = addRandomTile(grid, nextId);
  grid = first.grid;
  nextId = first.nextId;

  const second = addRandomTile(grid, nextId);
  grid = second.grid;
  nextId = second.nextId;

  return {
    size: GRID_SIZE,
    score: 0,
    over: false,
    won: false,
    keepPlaying: false,
    nextId,
    scoreAddition: 0,
    tiles: flattenGrid(grid),
  };
}

export function loadGame(savedState) {
  if (!savedState || !Array.isArray(savedState.tiles)) return createNewGame();

  const nextId = Number(savedState.nextId || savedState.tiles.length + 1);
  return {
    size: GRID_SIZE,
    score: Number(savedState.score || 0),
    over: Boolean(savedState.over),
    won: Boolean(savedState.won),
    keepPlaying: Boolean(savedState.keepPlaying),
    nextId,
    scoreAddition: 0,
    tiles: hydrateTiles(savedState.tiles),
  };
}

export function getSerializableGameState(state) {
  return serializableState(state);
}

export function isTerminated(state) {
  return state.over || (state.won && !state.keepPlaying);
}

export function continueAfterWin(state) {
  return { ...state, keepPlaying: true };
}

export function moveGame(state, direction) {
  if (isTerminated(state)) return state;

  const vector = getVector(direction);
  if (!vector) return state;

  const grid = createEmptyGrid();
  for (const tile of state.tiles) {
    grid[tile.x][tile.y] = {
      ...tile,
      previousPosition: { x: tile.x, y: tile.y },
      mergedFrom: null,
      isNew: false,
    };
  }

  const traversals = buildTraversals(vector);
  let moved = false;
  let scoreDelta = 0;
  let wonNow = false;
  let nextId = state.nextId;

  for (const x of traversals.x) {
    for (const y of traversals.y) {
      const tile = grid[x][y];
      if (!tile) continue;

      const positions = findFarthestPosition({ x, y }, vector, grid);
      const nextCell = positions.next;
      const next = withinBounds(nextCell) ? grid[nextCell.x][nextCell.y] : null;

      if (next && next.value === tile.value && !next.mergedFrom) {
        const merged = {
          id: nextId,
          x: nextCell.x,
          y: nextCell.y,
          value: tile.value * 2,
          previousPosition: { x, y },
          mergedFrom: [tile.id, next.id],
          isNew: false,
        };

        nextId += 1;
        grid[x][y] = null;
        grid[nextCell.x][nextCell.y] = merged;
        scoreDelta += merged.value;
        if (merged.value === 2048) wonNow = true;
        moved = true;
      } else {
        const farthest = positions.farthest;

        if (farthest.x !== x || farthest.y !== y) {
          grid[x][y] = null;
          tile.x = farthest.x;
          tile.y = farthest.y;
          grid[farthest.x][farthest.y] = tile;
          moved = true;
        }
      }
    }
  }

  if (!moved) {
    // No-op moves should not create new tiles or mutate score.
    return { ...state, scoreAddition: 0 };
  }

  const withRandom = addRandomTile(grid, nextId);
  const finalGrid = withRandom.grid;
  nextId = withRandom.nextId;

  const nextState = {
    ...state,
    tiles: flattenGrid(finalGrid),
    nextId,
    score: state.score + scoreDelta,
    scoreAddition: scoreDelta,
    won: state.won || wonNow,
    over: !movesAvailable(finalGrid),
  };

  return nextState;
}
