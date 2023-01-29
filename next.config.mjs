import { resolve } from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    HOST_URL: process.env.VERCEL_URL
      ? 'https://articulus.vercel.app'
      : 'http://localhost:3000',
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  /** @param {import('webpack').Configuration} config */
  webpack(config) {
    // TODO: this doesn't work :(
    config.resolve.alias.ph = resolve(process.cwd(), 'node_modules/phaser/src');
    config.resolve.alias.phaser = resolve(process.cwd(), 'src/phaser.js');

    return config;
  },
};

export default nextConfig;
