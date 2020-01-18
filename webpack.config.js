const { resolve } = require('path');

const config = (module.exports = require('webpack-boiler')({
  pages: [
    {
      title: 'Fantastic Contraption',
      template: './src/template.pug',
    },
  ],
  env: {
    CANVAS_RENDERER: true,
    WEBGL_RENDERER: true,
  },
  basename: 'fantastic_contraption',
}));

config.module.rules.push({
  test: [/\.vert$/, /\.frag$/],
  use: 'raw-loader',
});

config.resolve.alias = {
  ph: resolve(__dirname, 'node_modules/phaser/src'),
  phaser: resolve(__dirname, 'src/phaser.js'),
};

// module.exports.devtool = 'eval-source-map';
