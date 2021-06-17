import React, { useEffect, useRef } from 'react';

import Game from 'src/Game';

const GameCanvas = () => {
  const container = useRef();
  const canvas = useRef();

  useEffect(() => {
    const game = new Game(canvas.current, container.current);

    return () => {
      game.destroy();
    };
  }, []);

  return (
    <div style={{ height: '100%' }} ref={container}>
      <canvas ref={canvas} />
    </div>
  );
};

export default GameCanvas;
