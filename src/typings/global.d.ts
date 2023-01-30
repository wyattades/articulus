// Global typescript helpers:

type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type Override<T, R> = Omit<T, keyof R> & R;

type MaybeArray<T> = T | T[];
type MaybePromise<T> = T | Promise<T>;

type Point = { x: number; y: number };
type Vector2 = { x: number; y: number };
type LineSegment = { x1: number; x2: number; y1: number; y2: number };
type Box = { x: number; y: number; width: number; height: number };
type Circle = { x: number; y: number; radius: number };

// physics:

declare namespace FC {
  // TODO: how to do this properly?
  type Phaser = typeof import('phaser');
  type Matter = typeof import('matter-js');

  export type PhysicsShape = NonNullable<
    Phaser.Types.Physics.Matter.MatterBodyConfig['shape']
  > | null;

  export type Body = Matter.Body & {
    id: number;
    gameObject: Part;
    collisionFilter: {
      id?: number;
      noCollide?: boolean;
      joints: Record<number, Joint>;
    };
  };

  export type CollisionFilter = Body['collisionFilter'];

  // export type GameObject = Override<
  //   Phaser.GameObjects.GameObject,
  //   {
  //     body: Body;
  //   }
  // >;

  export type Joint = {
    id: number;
    bodies: Record<number, [anchorId: number, body: Body]>;
    constraints: Matter.ConstraintType[];
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
          joint?: never;
        }
      | {
          obj?: never;
          joint: Joint;
        }
    );
}
