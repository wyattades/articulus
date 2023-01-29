import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { createNextApiHandler } from '@trpc/server/adapters/next';

import { appRouter } from 'server/routers';
import { createContext } from 'server/routers/utils';

// export API handler
// @see https://trpc.io/docs/api-handler
export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error }) {
    console.error('TRPC caught error:', error);

    // convert Prisma error codes to equivalent TRPC error
    const cause = error?.cause;
    if (cause instanceof PrismaClientKnownRequestError) {
      if (cause.name === 'NotFoundError') {
        // @ts-expect-error change the error code
        error.code = 'NOT_FOUND';
      }
    }
  },
});
