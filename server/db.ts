import { PrismaClient } from '@prisma/client';

export const db = (global._prisma ||= new PrismaClient());

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var _prisma: PrismaClient;
}
