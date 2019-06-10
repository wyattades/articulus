// import './styles/style.scss';
import Game from './Game';

require.context('./static', true);

const $canvas = document.createElement('canvas');
document.body.appendChild($canvas);

let game = new Game($canvas);

if (module.hot) {
  module.hot.accept('./Game.js', () => {
    game.destroy();
    game = new Game($canvas);
  });
}