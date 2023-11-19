import { z } from 'zod';

import type { GameBuildData } from 'lib/saver';
import { db } from 'server/db';

import { protectedProcedure, router } from './utils';

export default router({
  allMetas: protectedProcedure.query(async ({ ctx: { user } }) => {
    const myBuilds = await db.gameBuild.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        userId: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return myBuilds.map((l) => ({
      id: l.id,
      name: l.name,
    }));
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().optional().nullable(),
        name: z.string().optional(),
        data: z
          .object({
            objects: z.array(z.any()),
            physics: z.any().optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx: { user }, input }) => {
      const data = {
        name: input.name,
        data: input.data,
      };

      let build;
      if (input.id) {
        build = await db.gameBuild.update({
          where: {
            userId: user.id,
            id: input.id,
          },
          data,
          select: {
            id: true,
            name: true,
            data: true,
          },
        });
      } else {
        build = await db.gameBuild.create({
          data: {
            userId: user.id,
            ...data,
            data: data.data || {
              objects: [],
            },
          },
          select: {
            id: true,
            name: true,
            data: true,
          },
        });
      }

      return build;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx: { user }, input }) => {
      await db.gameBuild.delete({
        where: {
          userId: user.id,
          id: input.id,
        },
      });
    }),

  get: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx: { user }, input: { id } }) => {
      const build = await db.gameBuild.findFirstOrThrow({
        where: {
          userId: user.id,
          id,
        },
        select: {
          id: true,
          name: true,
          data: true,
        },
      });

      return {
        ...build,
        data: build.data as GameBuildData,
      };
    }),
});
