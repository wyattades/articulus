import './styles/index.scss';
import Game from './Game';

require.context('./static', true);

const $container = document.getElementById('game_container');
const $canvas = document.getElementById('game');

let game = new Game($canvas, $container);

if (module.hot) {
  module.hot.accept('./Game.js', () => {
    game.destroy();
    game = new Game($canvas, $container);
  });
}
