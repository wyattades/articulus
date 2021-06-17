const { resolve } = require('path');

/** @type {import('next/dist/next-server/server/config').NextConfig} */
module.exports = {
  env: {
    HOST_URL: process.env.VERCEL_URL
      ? 'https://articulus.vercel.app'
      : 'http://localhost:3000',
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    return [
      {
        source: '/:any*',
        destination: '/',
      },
    ];
  },

  webpack(config) {
    Object.assign(config.resolve.alias, {
      ph: resolve(__dirname, 'node_modules/phaser/src'),
      phaser: resolve(__dirname, 'src/phaser.js'),
    });

    return config;
  },
};