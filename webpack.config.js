module.exports = require('webpack-boiler')({
  pages: [
    {
      title: 'Fantastic Contraption',
    },
  ],
  env: {
    CANVAS_RENDERER: true,
    WEBGL_RENDERER: true,
  },
  basename: 'fantastic_contraption',
});

module.exports.module.rules.push({
  test: [/\.vert$/, /\.frag$/],
  use: 'raw-loader',
});
// module.exports.devtool = 'eval-source-map';
