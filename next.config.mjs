/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    HOST_URL: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000',
  },

  /** @param {import('webpack').Configuration} config */
  webpack(config) {
    // TODO: fix phaser imports in `src/phaser.ts`
    // config.resolve.alias.ph = path.resolve(
    //   process.cwd(),
    //   'node_modules/phaser/src',
    // );
    // config.resolve.alias.phaser = path.resolve(process.cwd(), 'src/phaser.ts');

    return config;
  },
};

export default nextConfig;
