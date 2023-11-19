import type EditorScene from './Editor';
import type PlayScene from './Play';
import type { BaseScene } from './Scene';

export type AnyScene = BaseScene | PlayScene | EditorScene;
