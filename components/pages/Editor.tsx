import React from 'react';
import clsx from 'clsx';

import { useGame } from 'components/GameProvider';
import { colorInverse, colorIntToHex } from 'src/lib/utils';
import { EDITOR_TOOL_TYPES, TOOLS } from 'src/tools';
import { useScene } from 'components/game/Scene';
import { useSubscribe } from 'hooks/useSubscribe';
import { PointerPos } from 'components/PointerPos';
import { settingsSaver } from 'src/lib/saver';
import EditorScene from 'src/scenes/Editor';
import { FlashText } from 'components/FlashText';
import type PenTool from 'src/tools/PenTool';
import { Polygon } from 'src/objects/Polygon';

const EditUI: React.FC<{ mapKey?: string }> = () => {
  const game = useGame();
  const editScene = useScene<EditorScene>();

  const gridSnapping = useSubscribe(
    editScene.events,
    'setGridSnapping',
    () => !!settingsSaver.get('snapping'),
  );

  const activeToolType: string = useSubscribe(
    editScene.events,
    'setTool',
    () => editScene.tm.activeToolType,
  );

  const selectedItems = useSubscribe(
    editScene.events,
    'setSelected',
    () => editScene.selected,
  );

  const pendingPolygon = useSubscribe(
    editScene.events,
    ['polygon:start', 'polygon:end'],
    () => !!(editScene.tm.getTool('polygon_shape') as PenTool | null)?.pending,
    true,
  );

  const editingPolygon = activeToolType === 'edit_points';

  const saveLevel = async () => {
    let mapName = editScene.mapSaver.name;
    if (!mapName) {
      mapName = window.prompt('Enter a map name:', '');
      if (mapName) editScene.mapSaver.setName(mapName);
      else return editScene.mapSaver.id;
    }
    await editScene.saveLevel(true);
    return editScene.mapSaver.id;
  };

  return (
    <div className="ui-wrap">
      <FlashText />

      <div className="absolute left-0 top-0 p-4 space-y-2 flex flex-col">
        {EDITOR_TOOL_TYPES.map((toolType) => {
          const t = TOOLS[toolType];
          return (
            <button
              key={toolType}
              className="ui-tool-button"
              aria-pressed={activeToolType === toolType}
              style={{
                backgroundColor: colorIntToHex(t.color),
                color: colorIntToHex(colorInverse(t.color)),
              }}
              onClick={() => editScene.tm.setTool(toolType)}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="absolute right-0 top-0 p-4 space-y-2 flex flex-col">
        <button
          className="ui-tool-button"
          onClick={async () => {
            await saveLevel();
            game.setScene('Menu');
          }}
        >
          Menu
        </button>
        <button
          className="ui-tool-button"
          onClick={async () => {
            const savedKey = await saveLevel();
            game.setScene('Play', { mapKey: savedKey });
          }}
        >
          Play
        </button>
        <button
          className="ui-tool-button"
          aria-pressed={gridSnapping}
          onClick={() => {
            editScene.enableSnapping(!gridSnapping);
          }}
        >
          Grid Snapping?
        </button>
      </div>

      {selectedItems?.length ? (
        <div className="absolute left-0 bottom-0 p-4 space-y-2 flex flex-col">
          {selectedItems.length === 1 && selectedItems[0] instanceof Polygon ? (
            <button
              className="ui-tool-button"
              onClick={() =>
                editScene.tm.setTool('edit_points', selectedItems[0])
              }
            >
              Edit points
            </button>
          ) : null}
          {selectedItems.length >= 2 ? (
            <button
              className="ui-tool-button"
              onClick={() => editScene.mergeSelected()}
            >
              Merge {selectedItems.length} selected
            </button>
          ) : null}
          <button
            className="ui-tool-button"
            onClick={() => editScene.duplicateSelected()}
          >
            Duplicate {selectedItems.length} selected
          </button>
          <button
            className="ui-tool-button ui-tool-button--danger"
            onClick={() => editScene.deleteSelected()}
          >
            Delete {selectedItems.length} selected
          </button>
        </div>
      ) : null}

      {editingPolygon ? (
        <p className="ui-text p-4 absolute left-1/2 bottom-4 -translate-x-1/2 text-center pointer-events-none">
          Right-click to add points.
          <br />
          Press ENTER to save changes,
          <br />
          or ESC to cancel
        </p>
      ) : pendingPolygon ? (
        <p className="ui-text p-4 absolute left-1/2 bottom-4 -translate-x-1/2 text-center pointer-events-none">
          Press ENTER to create polygon,
          <br />
          or ESC to cancel
        </p>
      ) : null}

      <PointerPos />
    </div>
  );
};

export default EditUI;
