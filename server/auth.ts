import { PrismaAdapter } from '@auth/prisma-adapter';
import type { DefaultSession } from 'next-auth';
import NextAuth from 'next-auth';

import { db } from 'server/db';

import { authConfig } from './authConfig';

export type AuthSession = DefaultSession & {
  user: {
    id: string;
  };
};

export const { auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
});
