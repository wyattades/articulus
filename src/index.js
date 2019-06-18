// import './styles/style.scss';
import Game from './Game';

require.context('./static', true);

const $container = document.createElement('div');
document.body.appendChild($container);
const $canvas = document.createElement('canvas');
$container.appendChild($canvas);

let game = new Game($canvas, $container);

if (module.hot) {
  module.hot.accept('./Game.js', () => {
    game.destroy();
    game = new Game($canvas, $container);
  });
}