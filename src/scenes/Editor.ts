import Phaser from 'phaser';

import { MapSaver, settingsSaver } from 'lib/saver';
import {
  fitCameraToObjs,
  groupByIntersection,
  mergeGeoms,
} from 'lib/utils/phaser';
import { config } from 'src/const';
import { LiveCursorPlugin } from 'src/lib/live';
import type { Part } from 'src/objects';
import { Polygon } from 'src/objects/Polygon';
import { EDITOR_TOOL_TYPES } from 'src/tools';
import ToolManager from 'src/tools/ToolManager';
import type { ObjectsGroup } from './Scene';
import { BaseScene } from './Scene';

export default class Editor extends BaseScene {
  mapSaver!: MapSaver;
  mapKey?: string;

  tm!: ToolManager;

  constructor() {
    super({
      key: 'Editor',

      // disable physics
      physics: {
        matter: {
          enabled: false,
        },
      },
    });
  }

  init(data: { mapKey?: string }) {
    this.mapKey = data.mapKey;

    this.mapSaver = new MapSaver({ slug: this.mapKey });

    this.selected = [];
  }

  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  createListeners() {
    this.cursors = this.keyboard.createCursorKeys();

    this.modifierKey = this.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SHIFT,
    );

    this.keyboard.on('keydown-T', () => {
      this.game.setScene('Play', {
        mapKey: this.mapKey,
      });
    });
  }

  iGridSize = 10 * config.gameScale;
  gridSize: number | null = null;

  duplicateSelected() {
    if (!this.selected) return;

    const offset = 10;
    const newObjs = this.selected.map((obj) => {
      const newObj = obj.clone();
      newObj.setPosition(obj.x + offset, obj.y + offset);
      this.parts.add(newObj);

      return newObj;
    });

    this.events.emit('setSelected', newObjs);
  }

  mergeSelected() {
    if (!this.selected) return;

    const groups = groupByIntersection(this.selected);

    let someMerged = false;

    const resultObjs = groups.map((g) => {
      if (g.length === 1) return g[0];

      const mergedPolygon = mergeGeoms(g.map((obj) => obj.geom));

      const part = new Polygon(this, 0, 0, mergedPolygon);
      part.localizePoints();

      for (const obj of g) obj.destroy();

      this.parts.add(part);

      someMerged = true;

      return part;
    });

    if (!someMerged) this.showFlash('Objects must be touching!');

    this.events.emit('setSelected', resultObjs);
  }

  gridObj!: Phaser.GameObjects.Grid;

  enableSnapping(enabled: boolean) {
    settingsSaver.set('snapping', enabled);

    this.events.emit('setGridSnapping', enabled);

    this.gridObj.setVisible(enabled).setActive(enabled);

    this.gridSize = enabled ? this.iGridSize : null;
  }

  get snappingEnabled() {
    return !!this.gridSize !== this.modifierKey.isDown;
  }
  snapToGrid(obj: Part) {
    if (this.snappingEnabled) {
      const gridSize = this.iGridSize;
      const offsetX = obj.originX != null ? obj.originX * obj.width : 0;
      const offsetY = obj.originY != null ? obj.originY * obj.height : 0;
      obj.x = gridSize * Math.floor((obj.x - offsetX) / gridSize) + offsetX;
      obj.y = gridSize * Math.floor((obj.y - offsetY) / gridSize) + offsetY;
      return true;
    }
    return false;
  }

  async saveLevel(force = false) {
    // this.parts.isDirty();
    if (force) {
      await this.mapSaver.save(this.parts);
    } else {
      void this.mapSaver.queueSave(this.parts);
    }
  }

  create() {
    this.createListeners();

    this.worldBounds = new Phaser.Geom.Rectangle(
      (-this.iGridSize * 300) / 2,
      (-this.iGridSize * 300) / 2,
      this.iGridSize * 300,
      this.iGridSize * 300,
    );

    this.add
      .rectangle(
        this.worldBounds.centerX,
        this.worldBounds.centerY,
        this.worldBounds.width,
        this.worldBounds.height,
      )
      .setStrokeStyle(4, 0xffffff);

    this.gridObj = this.add.grid(
      this.worldBounds.centerX,
      this.worldBounds.centerY,
      this.worldBounds.width,
      this.worldBounds.height,
      this.iGridSize,
      this.iGridSize,
      0x000000,
      1,
      0x444444,
    );
    this.enableSnapping(!!settingsSaver.get('snapping'));

    this.parts = this.add.group() as unknown as ObjectsGroup<Part>;

    this.mapSaver
      .load()
      .then((mapData) => {
        if (!this.scene.isActive()) return;

        if (mapData) {
          MapSaver.loadEditorParts(mapData, this.parts);

          fitCameraToObjs(this.cameras.main, this.parts.getChildren());
        }

        this.events.emit('mapLoaded');
      })
      .catch((err) => {
        console.error('map load error:', err);
      });

    this.tm = new ToolManager(this, EDITOR_TOOL_TYPES[0], ['nav']);

    this.input.on('pointerup', () => this.saveLevel());
    this.keyboard.on('keyup', () => this.saveLevel());

    this.plugins.installScenePlugin(
      'LiveCursorPlugin',
      LiveCursorPlugin,
      'liveCursor',
      this,
    );
  }

  update(_t: number, delta: number) {
    this.stats?.update();

    const CAMERA_SPEED = (0.4 * delta) / this.cameras.main.zoom;
    const { left, right, up, down } = this.cursors;
    if (left.isDown && !right.isDown) {
      this.cameras.main.scrollX -= CAMERA_SPEED;
    } else if (right.isDown && !left.isDown) {
      this.cameras.main.scrollX += CAMERA_SPEED;
    }
    if (up.isDown && !down.isDown) {
      this.cameras.main.scrollY -= CAMERA_SPEED;
    } else if (down.isDown && !up.isDown) {
      this.cameras.main.scrollY += CAMERA_SPEED;
    }
  }

  shutdown() {
    this.tm?.destroy();
    // @ts-expect-error shutdown type
    this.tm = null;
  }
}
