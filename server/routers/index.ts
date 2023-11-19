import gameBuilds from './gameBuilds';
import gameMaps from './gameMaps';
import { router } from './utils';

export const appRouter = router({
  gameMaps,
  gameBuilds,
});

// export type definition of API
export type AppRouter = typeof appRouter;
