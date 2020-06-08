import './styles/index.scss';
import Game from './Game';

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
    game.destroy();
    game = new Game($canvas, $container);
  });
}
