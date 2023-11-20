import NextAuth from 'next-auth';

import { authConfig } from 'server/authConfig';

export const {
  handlers: { GET, POST },
} = NextAuth(authConfig);

export const runtime = 'edge';
