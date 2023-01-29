import NextAuth, { DefaultSession, NextAuthOptions } from 'next-auth';
import DiscordProvider, { DiscordProfile } from 'next-auth/providers/discord';
import { PrismaAdapter } from '@next-auth/prisma-adapter';

import { db } from 'server/db';

export type AuthSession = DefaultSession & {
  user: {
    id: string;
  };
};

export const authOptions = {
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
  adapter: PrismaAdapter(db),
  callbacks: {
    jwt: async ({ token, account }) => {
      // Persist the OAuth access_token right after signin
      if (account?.access_token) token.accessToken = account.access_token;

      token.id ??= token.sub; // for clarity, make sure token.id is defined

      return token;
    },
    session: async ({ session, user, token }) => {
      const userId = user?.id ?? token?.id;
      if (session.user && userId) {
        (session as AuthSession).user.id = userId;
      }

      return session as AuthSession;
    },
  },
} satisfies NextAuthOptions;

export default NextAuth(authOptions);
