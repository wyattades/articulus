import { router } from './utils';
import gameMaps from './gameMaps';
import gameBuilds from './gameBuilds';

export const appRouter = router({
  gameMaps,
  gameBuilds,
});

// export type definition of API
export type AppRouter = typeof appRouter;
