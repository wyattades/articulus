// Global typescript helpers:

type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type Override<T, R> = Omit<T, keyof R> & R;

// physics:

declare module FC {
  // TODO: how to do this?
  // import Phaser from 'phaser';
  // import Matter from 'matter-js';
  type Phaser = typeof import('phaser');
  type Matter = typeof import('matter-js');

  export type Body = Matter.Body & {
    id: number;
    collisionFilter: {
      id?: number;
      noCollide?: boolean;
      joints: Record<number, Joint>;
    };
  };

  export type CollisionFilter = Body['collisionFilter'];

  export type GameObject = Override<
    Phaser.GameObjects.GameObject,
    {
      body: Body;
    }
  >;

  export type Joint = {
    id: number;
    bodies: Record<number, Body>;
    constraints: Matter.Constraint[];
  };

  export type Anchor = {
    x: number;
    y: number;
    id: number;
  };

  export type AnchorJoint = Anchor &
    (
      | {
          obj: GameObject;
        }
      | {
          joint: Joint;
        }
    );
}
