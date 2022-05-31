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

const EditUI: React.FC<{ mapKey?: string }> = ({ mapKey }) => {
  const game = useGame();
  const editScene = useScene<EditorScene>();

  const activeToolType = useSubscribe(
    editScene.events,
    'setTool',
    () => editScene.tm.activeToolType,
  );

  const selectedItems = useSubscribe(
    editScene.events,
    'setSelected',
    () => editScene.selected,
  );

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
      <div className="absolute left-0 top-0 p-4 space-y-2 flex flex-col">
        {EDITOR_TOOL_TYPES.map((toolType) => {
          const t = TOOLS[toolType];
          return (
            <button
              key={toolType}
              className={clsx(
                'ui-tool-button',
                activeToolType === toolType && 'ui-tool-button--active',
              )}
              style={{
                background: colorIntToHex(t.color),
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
          onClick={() => {
            editScene.enableSnapping(!settingsSaver.get('snapping'));
          }}
        >
          Grid Snapping?
        </button>
      </div>

      {selectedItems?.length ? (
        <div className="absolute left-0 bottom-0 p-4 space-y-2 flex flex-col">
          <button
            className="ui-tool-button"
            onClick={() => editScene.duplicateSelected()}
          >
            Duplicate {selectedItems.length} selected
          </button>
          <button
            className="ui-tool-button"
            onClick={() => editScene.deleteSelected()}
          >
            Delete {selectedItems.length} selected
          </button>
        </div>
      ) : null}

      <PointerPos />
    </div>
  );
};

export default EditUI;