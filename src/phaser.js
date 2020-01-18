/**
 * This custom Phaser build reduces the bundle size from
 * ~1.2MB to ~800kb
 */

require('ph/polyfills');

const CONST = require('ph/const');
const Extend = require('ph/utils/object/Extend');

let Phaser = {
  // Actions: require('ph/actions'),
  // Animations: require('ph/animations'),
  // Cache: require('ph/cache'),
  Cameras: require('ph/cameras'),
  Core: require('ph/core'),
  Class: require('ph/utils/Class'),
  Create: require('ph/create'),
  // Curves: require('ph/curves'),
  // Data: require('ph/data'),
  Display: require('ph/display'),
  DOM: require('ph/dom'),
  Events: require('ph/events'),
  Game: require('ph/core/Game'),
  GameObjects: require('ph/gameobjects'),
  // GameObjects: {
  //   GameObject: require('ph/gameobjects/GameObject'),
  //   Rectangle: require('ph/gameobjects/shape/rectangle/Rectangle'),
  //   Graphics: require('ph/gameobjects/graphics/Graphics'),
  //   DOMElement: require('ph/gameobjects/domelement/DOMElement'),
  //   Sprite: require('ph/gameobjects/sprite/Sprite'),
  //   Group: require('ph/gameobjects/group/Group'),
  //   Container: require('ph/gameobjects/container/Container'),
  // },
  Geom: require('ph/geom'),
  Input: require('ph/input'),
  // Loader: require('ph/loader'),
  Math: require('ph/math'),
  Physics: {
    Matter: require('ph/physics/matter-js'),
  },
  // Plugins: require('ph/plugins'),
  Scale: require('ph/scale'),
  Scene: require('ph/scene/Scene'),
  Scenes: require('ph/scene'),
  // Structs: require('ph/structs'),
  // Textures: require('ph/textures'),
  // Tilemaps: require('ph/tilemaps'),
  // Time: require('ph/time'),
  // Tweens: require('ph/tweens'),
  Utils: require('ph/utils'),
  // Sound: require('ph/sound'),
};

//   Merge in the consts

Phaser = Extend(false, Phaser, CONST);

// global.Phaser = Phaser;

export default Phaser;
