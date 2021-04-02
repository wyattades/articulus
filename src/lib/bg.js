import TextureTintPipeline from 'ph/renderer/webgl/pipelines/TextureTintPipeline';

import fragShader from './bg.glsl';

export default class BG extends TextureTintPipeline {
  constructor(game) {
    super({
      game,
      renderer: game.renderer,
      fragShader,
    });
  }
}
