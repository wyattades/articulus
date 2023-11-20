import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

import { AuthMenu } from 'components/Auth';
import { FlashText } from 'components/FlashText';
import { useGame } from 'components/GameProvider';
import { PointerPos } from 'components/PointerPos';
import { useScene } from 'components/game/Scene';
import { useOnClickOutside } from 'hooks/useOnClickOutside';
import { useSubscribe } from 'hooks/useSubscribe';
import { UNSAVED_MAP_SLUG, settingsSaver } from 'lib/saver';
import { colorIntToHex, colorInverse } from 'lib/utils/color';
import { Polygon } from 'src/objects/Polygon';
import type EditorScene from 'src/scenes/Editor';
import { EDITOR_TOOL_TYPES, TOOLS } from 'src/tools';

const NameInput: React.FC<{
  value: string;
  disabled?: boolean;
  onUpdate: (newName: string) => void;
}> = ({ value, disabled, onUpdate }) => {
  const editNameRef = useRef<HTMLInputElement>(null);
  useOnClickOutside(editNameRef, async () => {
    editNameRef.current?.blur();
  });

  useEffect(() => {
    if (editNameRef.current) editNameRef.current.value = value;
  }, [value]);

  return (
    <input
      ref={editNameRef}
      type="text"
      disabled={disabled}
      className="font-mono border-2 border-gray-600 font-semibold px-2 py-1 h-10 bg-white text-black block"
      defaultValue={value ?? 'Untitled'}
      onBlur={(e) => {
        onUpdate(e.target.value);
      }}
    />
  );
};

const EditUI: React.FC<{ mapKey?: string }> = () => {
  const game = useGame();
  const editScene = useScene<EditorScene>();

  const authenticated = !!useSession().data?.user;

  const gridSnapping = useSubscribe(
    editScene.events,
    'setGridSnapping',
    () => !!settingsSaver.get('snapping'),
  );

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
  const firstSelectedItem = selectedItems?.[0];

  const pendingPolygon = useSubscribe(
    editScene.events,
    ['polygon:start', 'polygon:end'],
    () => !!editScene.tm.getTool('polygon_shape')?.pending,
    true,
  );

  // this makes sure NameInput is updated when the map is loaded
  useSubscribe(editScene.events, 'mapLoaded');

  const editingPolygon = activeToolType === 'edit_points';

  const saveLevel = async () => {
    // let mapName = editScene.mapSaver.name;
    // if (!mapName) {
    //   mapName = window.prompt('Enter a map name:', '');
    //   if (mapName) editScene.mapSaver.setName(mapName, false);
    //   else return editScene.mapSaver.id;
    // }
    // TODO: prompt for map name
    await editScene.saveLevel(true);

    if (authenticated) return editScene.mapSaver.slug;
    else return UNSAVED_MAP_SLUG;
  };

  return (
    <div className="ui-wrap">
      <FlashText />

      <div className="pointerevents-pass absolute left-0 top-0 p-4 space-y-2 flex flex-col">
        {EDITOR_TOOL_TYPES.map((toolType) => {
          const t = TOOLS[toolType];
          return (
            <button
              type="button"
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

      <div className="pointerevents-pass absolute right-0 top-0 p-4 space-y-2 flex flex-col items-stretch">
        <AuthMenu />
        <button
          type="button"
          className="ui-tool-button"
          onClick={async () => {
            await saveLevel();
            game.setScene('Menu');
          }}
        >
          Menu
        </button>
        <button
          type="button"
          className="ui-tool-button ui-tool-button--success"
          onClick={async () => {
            const savedKey = await saveLevel();
            game.setScene('Play', { mapKey: savedKey });
          }}
        >
          Play
        </button>
        <button
          type="button"
          className="ui-tool-button"
          aria-pressed={gridSnapping}
          onClick={() => {
            editScene.enableSnapping(!gridSnapping);
          }}
        >
          Grid Snapping?
        </button>

        <NameInput
          disabled={!editScene.mapSaver.meta?.mine}
          value={editScene.mapSaver.meta?.name || ''}
          onUpdate={async (newName) => {
            await editScene.mapSaver.setName(newName);
          }}
        />
      </div>

      {selectedItems?.length ? (
        <div className="pointerevents-pass absolute left-0 bottom-0 p-4 space-y-2 flex flex-col">
          {selectedItems.length === 1 &&
          firstSelectedItem instanceof Polygon ? (
            <button
              type="button"
              className="ui-tool-button"
              onClick={() =>
                editScene.tm.setTool('edit_points', firstSelectedItem)
              }
            >
              Edit points
            </button>
          ) : null}
          {selectedItems.length >= 2 ? (
            <button
              type="button"
              className="ui-tool-button"
              onClick={() => editScene.mergeSelected()}
            >
              Merge {selectedItems.length} selected
            </button>
          ) : null}
          <button
            type="button"
            className="ui-tool-button"
            onClick={() => editScene.duplicateSelected()}
          >
            Duplicate {selectedItems.length} selected
          </button>
          <button
            type="button"
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
