import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    HOST_URL: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000',
  },

  /** @param {import('webpack').Configuration} config */
  webpack(config) {
    // TODO: this doesn't work :(
    config.resolve.alias.ph = path.resolve(
      process.cwd(),
      'node_modules/phaser/src',
    );
    config.resolve.alias.phaser = path.resolve(process.cwd(), 'src/phaser.js');

    return config;
  },
};

export default nextConfig;
