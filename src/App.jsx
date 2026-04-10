import { useEffect, useMemo, useRef, useState } from "react";
import {
  continueAfterWin,
  createNewGame,
  getSerializableGameState,
  isTerminated,
  loadGame,
  moveGame,
} from "./game";

const BEST_SCORE_KEY = "bestScore";
const GAME_STATE_KEY = "gameState";

const KEY_TO_DIRECTION = {
  ArrowUp: 0,
  ArrowRight: 1,
  ArrowDown: 2,
  ArrowLeft: 3,
  w: 0,
  d: 1,
  s: 2,
  a: 3,
  k: 0,
  l: 1,
  j: 2,
  h: 3,
};

function loadFromStorage() {
  try {
    const saved = window.localStorage.getItem(GAME_STATE_KEY);
    return saved ? loadGame(JSON.parse(saved)) : createNewGame();
  } catch {
    return createNewGame();
  }
}

function readBestScore() {
  try {
    return Number(window.localStorage.getItem(BEST_SCORE_KEY) || 0);
  } catch {
    return 0;
  }
}

function getPositionClass(tile) {
  return `tile-position-${tile.x + 1}-${tile.y + 1}`;
}

function getMessage(state) {
  if (!isTerminated(state)) return null;
  if (state.over) return { className: "game-over", text: "Game over!" };
  if (state.won) return { className: "game-won", text: "You win!" };
  return null;
}

export default function App() {
  // Game state contains tiles, score, and win/lose flags.
  const [game, setGame] = useState(() => loadFromStorage());
  const [bestScore, setBestScore] = useState(() => readBestScore());
  const touchStartRef = useRef(null);

  const message = useMemo(() => getMessage(game), [game]);

  // Persist game + best score after every valid change.
  useEffect(() => {
    try {
      if (bestScore < game.score) {
        setBestScore(game.score);
        window.localStorage.setItem(BEST_SCORE_KEY, String(game.score));
      } else {
        window.localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
      }

      if (game.over) {
        window.localStorage.removeItem(GAME_STATE_KEY);
      } else {
        window.localStorage.setItem(
          GAME_STATE_KEY,
          JSON.stringify(getSerializableGameState(game))
        );
      }
    } catch {
      // Ignore storage failures (private mode / restricted storage).
    }
  }, [game, bestScore]);

  useEffect(() => {
    function handleKeyDown(event) {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const direction = KEY_TO_DIRECTION[key];
      const modifiers =
        event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

      if (modifiers) return;

      if (typeof direction === "number") {
        event.preventDefault();
        setGame((current) => moveGame(current, direction));
        return;
      }

      if (key === "r") {
        event.preventDefault();
        setGame(createNewGame());
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Basic swipe handling to keep mobile controls equivalent to the old project.
  function onTouchStart(event) {
    if (event.touches.length > 1) return;
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event) {
    const start = touchStartRef.current;
    if (!start || event.changedTouches.length === 0) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) <= 10) return;
    const direction = absDx > absDy ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0;
    setGame((current) => moveGame(current, direction));
  }

  return (
    <div className="container">
      <div className="heading">
        <h1 className="title">2048</h1>
        <div className="scores-container">
          <div className="score-container">
            {game.score}
            {game.scoreAddition > 0 ? (
              <div className="score-addition">+{game.scoreAddition}</div>
            ) : null}
          </div>
          <div className="best-container">{Math.max(bestScore, game.score)}</div>
        </div>
      </div>

      <div className="above-game">
        <p className="game-intro">
          Join the numbers and get to the <strong>2048 tile!</strong>
        </p>
        <a
          className="restart-button"
          role="button"
          tabIndex={0}
          onClick={() => setGame(createNewGame())}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setGame(createNewGame());
            }
          }}
        >
          New Game
        </a>
      </div>

      <div
        className="game-container"
        onTouchStart={onTouchStart}
        onTouchMove={(event) => event.preventDefault()}
        onTouchEnd={onTouchEnd}
      >
        <div className={`game-message ${message ? message.className : ""}`}>
          <p>{message ? message.text : ""}</p>
          <div className="lower">
            <a
              className="keep-playing-button"
              role="button"
              tabIndex={0}
              onClick={() => setGame((current) => continueAfterWin(current))}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setGame((current) => continueAfterWin(current));
                }
              }}
            >
              Keep going
            </a>
            <a
              className="retry-button"
              role="button"
              tabIndex={0}
              onClick={() => setGame(createNewGame())}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setGame(createNewGame());
                }
              }}
            >
              Try again
            </a>
          </div>
        </div>

        <div className="grid-container">
          {[0, 1, 2, 3].map((row) => (
            <div className="grid-row" key={row}>
              {[0, 1, 2, 3].map((cell) => (
                <div className="grid-cell" key={cell} />
              ))}
            </div>
          ))}
        </div>

        <div className="tile-container">
          {game.tiles.map((tile) => {
            const classes = [
              "tile",
              `tile-${tile.value}`,
              getPositionClass(tile),
              tile.value > 2048 ? "tile-super" : "",
              tile.mergedFrom ? "tile-merged" : "",
              tile.isNew ? "tile-new" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div className={classes} key={tile.id}>
                <div className="tile-inner">{tile.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="game-explanation">
        <strong className="important">How to play:</strong> Use your{" "}
        <strong>arrow keys</strong> (or swipe). When two tiles with the same
        number touch, they <strong>merge into one!</strong>
      </p>
    </div>
  );
}
