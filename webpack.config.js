require('dotenv').config();
const { resolve } = require('path');

const config = (module.exports = require('webpack-boiler')({
  pages: [
    {
      title: 'Articulus',
      template: './src/template.pug',
    },
  ],
  env: {
    CANVAS_RENDERER: false,
    WEBGL_RENDERER: true,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
  },
}));

config.module.rules.push({
  test: [/\.vert$/, /\.frag$/],
  use: 'raw-loader',
});

config.resolve.alias = {
  src: resolve(__dirname, 'src'),
  lib: resolve(__dirname, 'src/lib'),
  ph: resolve(__dirname, 'node_modules/phaser/src'),
  phaser: resolve(__dirname, 'src/phaser.js'),
};

// module.exports.devtool = 'eval-source-map';
