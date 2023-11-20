import NextAuth from 'next-auth';

import DiscordProvider, {
  type DiscordProfile,
} from '@auth/core/providers/discord';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { DefaultSession } from 'next-auth';

import { db } from 'server/db';

export type AuthSession = DefaultSession & {
  user: {
    id: string;
  };
};

export const {
  auth,
  handlers: { GET, POST },
} = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
  },
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      profile(profile: DiscordProfile) {
        let image;
        if (!profile.avatar) {
          const defaultAvatarNumber = parseInt(profile.discriminator) % 5;
          image = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
        } else {
          const format = profile.avatar.startsWith('a_') ? 'gif' : 'png';
          image = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
        }
        return {
          id: profile.id,
          name: profile.username, // TODO: this is redundant
          username: profile.username + '#' + profile.discriminator, // must be unique in DB
          email: profile.email,
          image,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, account }) => {
      // persist the OAuth access_token right after signin
      // https://next-auth.js.org/configuration/callbacks#jwt-callback
      if (account?.access_token) token.accessToken = account.access_token;

      return token;
    },
    session: async ({ session, token }) => {
      const sess = session as AuthSession;

      const userId = token?.sub;
      if (sess.user && userId) {
        sess.user.id = userId;
      }

      return sess;
    },
  },
});
