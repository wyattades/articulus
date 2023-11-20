import type { inferAsyncReturnType } from '@trpc/server';
import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';

import { auth } from 'server/auth';

export const createContext = async ({ req, res }: CreateNextContextOptions) => {
  const session = await auth(req, res);

  const user = session?.user
    ? {
        id: session.user.id,
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
    if (!ctx.user?.id) {
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
