import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import type { GameMapData } from 'lib/saver';
import { base48 } from 'lib/utils';
import { db } from 'server/db';

import { protectedProcedure, publicProcedure, router } from './utils';

export default router({
  allMetas: publicProcedure.query(async ({ ctx: { user } }) => {
    const userId = user?.id;

    const myLevels = userId
      ? await db.gameMap.findMany({
          where: {
            userId,
          },
          select: {
            id: true,
            slug: true,
            name: true,
            isPublic: true,
            userId: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
      : [];

    const publicLevels = await db.gameMap.findMany({
      where: {
        isPublic: true,
        NOT: {
          userId,
        },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        isPublic: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      skip: 0,
      take: 20,
      orderBy: {
        // TODO: add popularity huristics/sorting
        updatedAt: 'desc',
      },
    });

    return [
      ...myLevels.map((l) => ({
        id: l.id,
        slug: l.slug,
        name: l.name,
        isPublic: l.isPublic,
        mine: true,
        user: null,
      })),
      ...publicLevels.map((l) => ({
        id: l.id,
        slug: l.slug,
        name: l.name,
        isPublic: l.isPublic,
        mine: false,
        user: {
          id: l.user.id,
          username: l.user.username,
        },
      })),
    ];
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().optional().nullable(),
        name: z.string().optional(),
        isPublic: z.boolean().optional(),
        data: z
          .object({
            objects: z.array(z.any()),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx: { user }, input }) => {
      const data = {
        name: input.name,
        isPublic: input.isPublic,
        data: input.data,
      };

      let map;
      if (input.id) {
        map = await db.gameMap.update({
          where: {
            userId: user.id,
            id: input.id,
          },
          data,
          select: {
            id: true,
            name: true,
            isPublic: true,
            data: true,
            userId: true,
            slug: true,
          },
        });
      } else {
        map = await db.gameMap.create({
          data: {
            userId: user.id,
            slug: base48(8), // TODO: there's a chance of collision here
            ...data,
            data: data.data || {
              objects: [],
            },
          },
          select: {
            id: true,
            name: true,
            isPublic: true,
            data: true,
            userId: true,
            slug: true,
          },
        });
      }

      return { ...map, mine: true, user: null };
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx: { user }, input }) => {
      await db.gameMap.delete({
        where: {
          userId: user.id,
          id: input.id,
        },
      });
    }),

  get: publicProcedure
    .input(
      z.object({
        id: z.string().optional(),
        slug: z.string().optional(),
      }),
    )
    .query(async ({ ctx: { user }, input: { id, slug } }) => {
      if (!id && !slug) {
        throw new TRPCError({
          message: 'Either id or slug must be specified',
          code: 'BAD_REQUEST',
        });
      }

      const map = await db.gameMap.findFirstOrThrow({
        where: {
          ...(id
            ? {
                id,
              }
            : {
                slug,
              }),
          OR: [{ isPublic: true }, { userId: user?.id }],
        },
        select: {
          id: true,
          name: true,
          isPublic: true,
          data: true,
          userId: true,
          slug: true,
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      const mine = !!user && map.user.id === user?.id;

      return {
        ...map,
        data: map.data as GameMapData,
        user: mine ? null : map.user,
        mine,
      };
    }),
});
