import { createNextApiHandler } from '@trpc/server/adapters/next';

import { appRouter } from 'server/routers';
import { createContext } from 'server/routers/utils';

// export API handler
// @see https://trpc.io/docs/api-handler
export default createNextApiHandler({
  router: appRouter,
  createContext,
});
