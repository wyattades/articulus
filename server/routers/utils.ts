import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth';
import { inferAsyncReturnType, initTRPC, TRPCError } from '@trpc/server';

import { authOptions } from 'pages/api/auth/[...nextauth]';

export const createContext = async ({ req, res }: CreateNextContextOptions) => {
  const session = await getServerSession(req, res, authOptions);

  const user = session?.user
    ? {
        id: session.user.id as string,
      }
    : null;

  return {
    user,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(
  t.middleware(async ({ next, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
      ctx: {
        ...ctx,
        // separate user from ctx so typescript knows it's not null
        user: ctx.user,
      },
    });
  }),
);
