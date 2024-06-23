import { createClient, type Room, type User } from '@liveblocks/client';

import { deterministicColor } from 'lib/utils/color';
import type Game from 'src/Game';
import type Editor from 'src/scenes/Editor';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Liveblocks {
    // Each user's Presence, for room.getPresence, room.subscribe("others"), etc.
    Presence: {
      cursor: {
        x: number;
        y: number;
      } | null;
      user: {
        name: string;
        color: number;
        image: string | null;
      };
    };
  }
}

const liveClient = createClient({
  throttle: 16,
  publicApiKey:
    'pk_prod_fUx4RJZvRPWgRPEevZw90j79y_RQL2jgpMv6ss4qa1boW7nMSfJ-hPDwz26Va1Gm',
});

async function generateCursorTexture(
  scene: Phaser.Scene,
  size: number,
  color: number,
  imageUrl: string,
) {
  const texture = scene.textures.createCanvas(
    `t-${Math.random()}`,
    size,
    size,
  )!;

  const ctx = texture.context;

  const img = new Image();
  img.crossOrigin = 'anonymous'; // Required for 'tainted canvas' error
  await new Promise<void>((resolve, reject) => {
    img.onerror = () => reject(new Error(`Failed to load image`));
    img.onload = () => resolve();
    img.src = imageUrl;
  });

  const padding = size / 16;
  const imageSize = size - padding * 2;

  // draw a `color` circle diameter of `size`
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
  ctx.fill();

  // draw a square in the top-left corner
  ctx.rect(0, 0, size / 2, size / 2);
  ctx.fill();

  // draw the image in the center, cropped to a circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, imageSize / 2, 0, 2 * Math.PI);
  ctx.clip();
  ctx.drawImage(img, padding, padding, imageSize, imageSize);

  texture.update();

  return texture;
}

export class LiveCursorPlugin extends Phaser.Plugins.ScenePlugin {
  room?: Room;

  boot() {
    const scene = this.scene! as Editor;
    if (!scene.mapKey) return;

    const authUser = (this.game as Game).authUser;

    const roomId = `editor:${scene.mapKey}`;

    const { room, leave: _leave } = liveClient.enterRoom(roomId, {
      initialPresence: {
        cursor: null,
        user: {
          color: deterministicColor(authUser?.id || Math.random().toString()),
          name: authUser?.name ?? 'Anon',
          image: authUser?.image || null,
        },
      },
    });

    this.room = room;

    // room.subscribe('my-presence', (presence) => {
    //   const cursor = presence?.cursor ?? null;

    //   text.innerHTML = cursor
    //     ? `${cursor.x} × ${cursor.y}`
    //     : 'Move your cursor to broadcast its position to other people in the room.';
    // });

    /**
     * Subscribe to every others presence updates.
     * The callback will be called if you or someone else enters or leaves the room
     * or when someone presence is updated
     */
    room.subscribe('others', (others, event) => {
      switch (event.type) {
        case 'reset': {
          // Clear all cursors: TODO

          for (const user of others) {
            this.updateCursor(user);
          }
          break;
        }
        case 'leave': {
          this.deleteCursor(event.user);
          break;
        }
        case 'enter':
        case 'update': {
          this.updateCursor(event.user);
          break;
        }
        default:
      }
    });

    scene.input.on('pointermove', (evt: typeof scene.input.activePointer) => {
      room.updatePresence({
        cursor: { x: evt.worldX, y: evt.worldY },
      });
    });

    scene.input.on('pointerleave', () => {
      room.updatePresence({ cursor: null });
    });

    // the plugin manager only calls destroy if the Game is destroyed
    scene.events.on('shutdown', () => this.destroy());
  }

  private cursorMap = new Map<
    User['connectionId'],
    Phaser.GameObjects.Sprite
  >();

  private updateCursor(user: User) {
    const { cursor: pos, user: userInfo } = user.presence;
    if (!pos) return;

    const scene = this.scene!;

    const mapKey = user.connectionId;

    let cursorObj = this.cursorMap.get(mapKey);
    if (!cursorObj) {
      generateCursorTexture(
        scene,
        32 * 2,
        userInfo.color,
        // TODO: better fallback
        userInfo.image || 'https://i.imgur.com/lNc6Yz6.jpeg',
      )
        .then((texture) => {
          cursorObj?.setTexture(texture.key);
        })
        .catch(console.error);

      cursorObj = scene.add.sprite(pos.x, pos.y, '__placeholder__');
      cursorObj.setDepth(1000);

      this.cursorMap.set(mapKey, cursorObj);
    }

    cursorObj.setPosition(pos.x, pos.y);
  }

  private deleteCursor(user: User) {
    const mapKey = user.connectionId;
    const cursorObj = this.cursorMap.get(mapKey);
    if (cursorObj) {
      cursorObj.destroy();
      this.cursorMap.delete(mapKey);
    }
  }

  destroy() {
    this.room?.disconnect();
    this.room = undefined;
  }
}
