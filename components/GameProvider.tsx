import { createContext, useContext, useEffect, useRef } from 'react';
import { useAsync } from 'react-use';

import type Game from 'src/Game';

const GameCtx = createContext<Game | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const container = useRef();
  const canvas = useRef();

  const Game = useAsync(() => import('src/Game'), []).value?.default || null;

  const game =
    useAsync(async () => {
      if (!Game) return null;

      // this is called twice after hot-reload :(
      console.log('Mount game');

      return new Game(canvas.current, container.current);
    }, [Game]).value || null;

  useEffect(() => {
    if (game) return () => game.destroy();
  }, [game]);

  return (
    <GameCtx.Provider value={game}>
      <div id="game-container" ref={container}>
        <canvas ref={canvas} />
      </div>

      {game ? (
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
