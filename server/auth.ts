import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';

import { db } from 'server/db';

import { authConfig } from './authConfig';

export const { auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
});
