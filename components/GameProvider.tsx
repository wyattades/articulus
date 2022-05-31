import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAsync } from 'react-use';

import type Game from 'src/Game';

const GameCtx = createContext<Game | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const container = useRef();
  const canvas = useRef();

  const [gameVal, setGame] = useState<Game | null>(null);

  const Game = useAsync(() => import('src/Game'), []).value?.default || null;

  useEffect(() => {
    if (!Game) return;

    const game = new Game(canvas.current, container.current);

    setGame(game);

    return () => {
      game.destroy();
    };
  }, [Game]);

  return (
    <GameCtx.Provider value={gameVal}>
      <div id="game-container" ref={container}>
        <canvas ref={canvas} />
      </div>

      {gameVal ? (
        children
      ) : (
        <p className="ui-text text-xl absolute top-1/2 left-1/2 -translate-1/2">
          Loading...
        </p>
      )}
    </GameCtx.Provider>
  );
};

export const useGame = () => {
  const game = useContext(GameCtx);
  if (!game) throw new Error('Missing GameProvider');
  return game;
};
