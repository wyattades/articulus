import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLatest } from 'react-use';

import type Game from 'src/Game';

const GameCtx = createContext<Game | null>(null);

// const clearCanvas = (canvas: HTMLCanvasElement) => {
//   const ctx = canvas.getContext('webgl2');
//   TODO
// };

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  const [game, setGame] = useState<Game | null>(null);
  const latestGame = useLatest(game);

  const initGame = async () => {
    if (latestGame.current) {
      setGame(null);
      await latestGame.current.destroy();
    }

    const Game = (await import('src/Game')).default;
    console.log('Loaded Game class');
    if (!canvas.current || !container.current)
      throw new Error('Missing game DOM container');
    setGame(new Game(canvas.current, container.current));
  };

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    // @ts-expect-error bad ImportMeta
    if (process.env.NODE_ENV === 'development' && import.meta.webpackHot) {
      let mounted = true;
      // @ts-expect-error bad ImportMeta
      import.meta.webpackHot.accept('src/Game', async () => {
        if (!mounted) return;
        console.log('Accepting the updated "src/Game" module');
        initGame();
      });
      return () => {
        mounted = false;
      };
    }
  }, [latestGame]);

  useEffect(() => {
    return () => {
      const endGame = latestGame.current;
      if (endGame) {
        console.log('Unmount game:', endGame.id);
        if (!endGame.destroyed) endGame.destroy();
      }
    };
  }, []);

  return (
    <GameCtx.Provider value={game}>
      <div id="game-container" ref={container}>
        <canvas ref={canvas} />
      </div>

      {game ? (
        children
      ) : (
        <p className="ui-markup text-xl absolute top-1/2 left-1/2 -translate-1/2">
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
