import './styles/index.scss';
import Game from './Game';

// require.context('./static', true);

const $container = document.getElementById('game_container');
const $canvas = document.getElementById('game');

let game = new Game($canvas, $container);

if (process.env.NODE_ENV === 'development') {
  window.GAME = game;
  window.SCENES = game.scene.scenes;

  if (module.hot) {
    module.hot.accept('./Game.js', () => {
      game.destroy();
      game = new Game($canvas, $container);
    });
  }
}
// import api from './lib/api';
