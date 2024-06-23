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

// a bunch of bright primary colors
const COLORS = [
  0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8800,
  0x88ff00, 0x0088ff, 0x8800ff, 0xff0088, 0x00ff88,
];
export const deterministicColor = (str: string, colors = COLORS) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash &= hash;
  }

  return colors[Math.abs(hash) % colors.length];
};
