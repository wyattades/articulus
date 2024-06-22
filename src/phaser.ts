/* eslint-disable @typescript-eslint/no-require-imports, global-require */
/**
 * This custom Phaser build reduces the bundle size from
 * ~1.2MB to ~800kb
 */

const CONST = require('ph/const');
const Extend = require('ph/utils/object/Extend');

const GameObjects = {
  Events: require('ph/gameobjects/events'),

  DisplayList: require('ph/gameobjects/DisplayList'),
  GameObjectCreator: require('ph/gameobjects/GameObjectCreator'),
  GameObjectFactory: require('ph/gameobjects/GameObjectFactory'),
  UpdateList: require('ph/gameobjects/UpdateList'),

  Components: require('ph/gameobjects/components'),
  // GetCalcMatrix: require('ph/gameobjects/GetCalcMatrix'),

  BuildGameObject: require('ph/gameobjects/BuildGameObject'),
  // BuildGameObjectAnimation: require('ph/gameobjects/BuildGameObjectAnimation'),
  GameObject: require('ph/gameobjects/GameObject'),
  // BitmapText: require('ph/gameobjects/bitmaptext/static/BitmapText'),
  // Blitter: require('ph/gameobjects/blitter/Blitter'),
  // Bob: require('ph/gameobjects/blitter/Bob'),
  Container: require('ph/gameobjects/container/Container'),
  // DOMElement: require('ph/gameobjects/domelement/DOMElement'),
  DynamicBitmapText: require('ph/gameobjects/bitmaptext/dynamic/DynamicBitmapText'),
  Extern: require('ph/gameobjects/extern/Extern.js'),
  Graphics: require('ph/gameobjects/graphics/Graphics.js'),
  Group: require('ph/gameobjects/group/Group'),
  Image: require('ph/gameobjects/image/Image'),
  // Layer: require('ph/gameobjects/layer/Layer'),
  Particles: require('ph/gameobjects/particles'),
  // PathFollower: require('ph/gameobjects/pathfollower/PathFollower'),
  RenderTexture: require('ph/gameobjects/rendertexture/RenderTexture'),
  // RetroFont: require('ph/gameobjects/bitmaptext/RetroFont'),
  // Rope: require('ph/gameobjects/rope/Rope'),
  Sprite: require('ph/gameobjects/sprite/Sprite'),

  // Text: require('ph/gameobjects/text/Text'),
  // GetTextSize: require('ph/gameobjects/text/GetTextSize'),
  // MeasureText: require('ph/gameobjects/text/MeasureText'),
  // TextStyle: require('ph/gameobjects/text/TextStyle'),

  // TileSprite: require('ph/gameobjects/tilesprite/TileSprite'),
  // Zone: require('ph/gameobjects/zone/Zone'),
  // Video: require('ph/gameobjects/video/Video'),

  //  Shapes

  Shape: require('ph/gameobjects/shape/Shape'),
  Arc: require('ph/gameobjects/shape/arc/Arc'),
  Curve: require('ph/gameobjects/shape/curve/Curve'),
  Ellipse: require('ph/gameobjects/shape/ellipse/Ellipse'),
  Grid: require('ph/gameobjects/shape/grid/Grid'),
  // IsoBox: require('ph/gameobjects/shape/isobox/IsoBox'),
  // IsoTriangle: require('ph/gameobjects/shape/isotriangle/IsoTriangle'),
  Line: require('ph/gameobjects/shape/line/Line'),
  Polygon: require('ph/gameobjects/shape/polygon/Polygon'),
  Rectangle: require('ph/gameobjects/shape/rectangle/Rectangle'),
  // Star: require('ph/gameobjects/shape/star/Star'),
  // Triangle: require('ph/gameobjects/shape/triangle/Triangle'),

  //  Game Object Factories

  Factories: {
    // Blitter: require('ph/gameobjects/blitter/BlitterFactory'),
    Container: require('ph/gameobjects/container/ContainerFactory'),
    // DOMElement: require('ph/gameobjects/domelement/DOMElementFactory'),
    // DynamicBitmapText: require('ph/gameobjects/bitmaptext/dynamic/DynamicBitmapTextFactory'),
    Extern: require('ph/gameobjects/extern/ExternFactory'),
    Graphics: require('ph/gameobjects/graphics/GraphicsFactory'),
    Group: require('ph/gameobjects/group/GroupFactory'),
    Image: require('ph/gameobjects/image/ImageFactory'),
    // Layer: require('ph/gameobjects/layer/LayerFactory'),
    Particles: require('ph/gameobjects/particles/ParticleManagerFactory'),
    // PathFollower: require('ph/gameobjects/pathfollower/PathFollowerFactory'),
    RenderTexture: require('ph/gameobjects/rendertexture/RenderTextureFactory'),
    // Rope: require('ph/gameobjects/rope/RopeFactory'),
    Sprite: require('ph/gameobjects/sprite/SpriteFactory'),
    // StaticBitmapText: require('ph/gameobjects/bitmaptext/static/BitmapTextFactory'),
    // Text: require('ph/gameobjects/text/TextFactory'),
    // TileSprite: require('ph/gameobjects/tilesprite/TileSpriteFactory'),
    // Zone: require('ph/gameobjects/zone/ZoneFactory'),
    // Video: require('ph/gameobjects/video/VideoFactory'),

    //  Shapes
    Arc: require('ph/gameobjects/shape/arc/ArcFactory'),
    Curve: require('ph/gameobjects/shape/curve/CurveFactory'),
    Ellipse: require('ph/gameobjects/shape/ellipse/EllipseFactory'),
    Grid: require('ph/gameobjects/shape/grid/GridFactory'),
    // IsoBox: require('ph/gameobjects/shape/isobox/IsoBoxFactory'),
    // IsoTriangle: require('ph/gameobjects/shape/isotriangle/IsoTriangleFactory'),
    Line: require('ph/gameobjects/shape/line/LineFactory'),
    Polygon: require('ph/gameobjects/shape/polygon/PolygonFactory'),
    Rectangle: require('ph/gameobjects/shape/rectangle/RectangleFactory'),
    // Star: require('ph/gameobjects/shape/star/StarFactory'),
    // Triangle: require('ph/gameobjects/shape/triangle/TriangleFactory'),
  },

  Creators: {
    // Blitter: require('ph/gameobjects/blitter/BlitterCreator'),
    Container: require('ph/gameobjects/container/ContainerCreator'),
    DynamicBitmapText: require('ph/gameobjects/bitmaptext/dynamic/DynamicBitmapTextCreator'),
    Graphics: require('ph/gameobjects/graphics/GraphicsCreator'),
    Group: require('ph/gameobjects/group/GroupCreator'),
    Image: require('ph/gameobjects/image/ImageCreator'),
    // Layer: require('ph/gameobjects/layer/LayerCreator'),
    Particles: require('ph/gameobjects/particles/ParticleManagerCreator'),
    RenderTexture: require('ph/gameobjects/rendertexture/RenderTextureCreator'),
    // Rope: require('ph/gameobjects/rope/RopeCreator'),
    Sprite: require('ph/gameobjects/sprite/SpriteCreator'),
    // StaticBitmapText: require('ph/gameobjects/bitmaptext/static/BitmapTextCreator'),
    // Text: require('ph/gameobjects/text/TextCreator'),
    // TileSprite: require('ph/gameobjects/tilesprite/TileSpriteCreator'),
    // Zone: require('ph/gameobjects/zone/ZoneCreator'),
    // Video: require('ph/gameobjects/video/VideoCreator'),
  },
};

//  WebGL only Game Objects
// if (typeof WEBGL_RENDERER) {
//   GameObjects.Shader = require('ph/gameobjects/shader/Shader');
//   GameObjects.Mesh = require('ph/gameobjects/mesh/Mesh');
//   GameObjects.PointLight = require('ph/gameobjects/pointlight/PointLight');

//   GameObjects.Factories.Shader = require('ph/gameobjects/shader/ShaderFactory');
//   GameObjects.Factories.Mesh = require('ph/gameobjects/mesh/MeshFactory');
//   GameObjects.Factories.PointLight = require('ph/gameobjects/pointlight/PointLightFactory');

//   GameObjects.Creators.Shader = require('ph/gameobjects/shader/ShaderCreator');
//   GameObjects.Creators.Mesh = require('ph/gameobjects/mesh/MeshCreator');
//   GameObjects.Creators.PointLight = require('ph/gameobjects/pointlight/PointLightCreator');

//   GameObjects.Light = require('ph/gameobjects/lights/Light');
//   GameObjects.LightsManager = require('ph/gameobjects/lights/LightsManager');
//   GameObjects.LightsPlugin = require('ph/gameobjects/lights/LightsPlugin');
// }

const Phaser = {
  // Actions: require('ph/actions'),
  // Animations: require('ph/animations'),
  // BlendModes: require('ph/renderer/BlendModes'),
  // Cache: require('ph/cache'),
  Cameras: require('ph/cameras'),
  Core: require('ph/core'),
  Class: require('ph/utils/Class'),
  Create: require('ph/create'),
  // Curves: require('ph/curves'),
  // Data: require('ph/data'),
  Display: require('ph/display'),
  // DOM: require('ph/dom'),
  Events: require('ph/events'),
  Game: require('ph/core/Game'),
  GameObjects,
  Geom: require('ph/geom'),
  Input: require('ph/input'),
  // Loader: require('ph/loader'),
  Math: require('ph/math'),
  Physics: {
    // Arcade: require('ph/physics/arcade'),
    Matter: require('ph/physics/matter-js'),
  },
  // Plugins: require('ph/plugins'),
  Renderer: require('ph/renderer'),
  Scale: require('ph/scale'),
  // ScaleModes: require('ph/renderer/ScaleModes'),
  Scene: require('ph/scene/Scene'),
  Scenes: require('ph/scene'),
  // Structs: require('ph/structs'),
  // Textures: require('ph/textures'),
  // Tilemaps: require('ph/tilemaps'),
  Time: require('ph/time'),
  // Tweens: require('ph/tweens'),
  Utils: require('ph/utils'),
};

//  Merge in the optional plugins and WebGL only features

// if (typeof FEATURE_SOUND) {
//   Phaser.Sound = require('./sound');
// }

// if (typeof PLUGIN_CAMERA3D) {
//   Phaser.Cameras.Sprite3D = require('../plugins/camera3d/src');
//   Phaser.GameObjects.Sprite3D = require('../plugins/camera3d/src/sprite3d/Sprite3D');
//   Phaser.GameObjects.Factories.Sprite3D = require('../plugins/camera3d/src/sprite3d/Sprite3DFactory');
//   Phaser.GameObjects.Creators.Sprite3D = require('../plugins/camera3d/src/sprite3d/Sprite3DCreator');
// }

// if (typeof PLUGIN_FBINSTANT) {
//   Phaser.FacebookInstantGamesPlugin = require('../plugins/fbinstant/src/FacebookInstantGamesPlugin');
// }

//   Merge in the consts

console.log('Load custom phaser');

export default Extend(false, Phaser, CONST);
