import Phaser from 'phaser';

import { constrain } from '.';

const shifts = [0, 8, 16];
export const adjustBrightness = (color: number, n: number) =>
  shifts.reduce(
    (r, i) => r + (constrain(((color & (255 << i)) >> i) + n, 0, 255) << i),
    0,
  );

export const colorIntToHex = (num: number) =>
  `#${`00000${num.toString(16)}`.slice(-6)}`;

export const colorInverse = (num: number): number => {
  const { red, green, blue } = Phaser.Display.Color.IntegerToColor(num);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 186 ? 0x000000 : 0xffffff;
};
