// import './styles/style.scss';
import Game from './game';

// require.context('./static', true);

const $canvas = document.createElement('canvas');
document.body.appendChild($canvas);

let game = new Game($canvas);

if (module.hot) {
  module.hot.accept('./game.js', () => {
    game.destroy();
    game = new Game($canvas);
  });
}