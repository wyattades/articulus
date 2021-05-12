import Game from 'src/Game';

import 'src/styles/index.scss';

// require.context('./static', true);

const $container = document.getElementById('game_container');
const $canvas = document.getElementById('game');

let game = new Game($canvas, $container);

if (process.env.NODE_ENV === 'development') {
  Object.defineProperties(window, {
    PLAY: {
      get() {
        return game.scene.scenes[4];
      },
    },
  });

  module.hot?.accept('./Game.js', () => {
    console.log('HOT RELOAD');
    game.destroy();
    game = new Game($canvas, $container);
  });
}
