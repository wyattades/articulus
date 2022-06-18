/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useState } from 'react';

import { useGame } from 'components/GameProvider';
import { colorInverse, colorIntToHex } from 'src/lib/utils';
import { PLAY_TOOL_TYPES, TOOLS } from 'src/tools';
import { useScene } from 'components/game/Scene';
import { useSubscribe } from 'hooks/useSubscribe';
import { PointerPos } from 'components/PointerPos';
import { FlashText } from 'components/FlashText';
import { Stats } from 'components/Stats';
import type PlayScene from 'src/scenes/Play';

const Directions: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div onClick={onClose} className="absolute left-0 top-0 bottom-0 right-0">
    <div id="directions" onClick={(e) => e.stopPropagation()}>
      <h2>Objective:</h2>
      <p>
        Connect rigid bodies with joints to build machines and vehicles in this
        physics sandbox game!
      </p>
      <h2>Legend:</h2>
      <ul>
        <li>
          <code>SPACE</code>
          <span>Pause/Resume</span>
        </li>
        <li>
          <code>R</code>
          <span>Restart</span>
        </li>
        <li>
          <code>T</code>
          <span>Switch between Editor/Play</span>
        </li>
        <li>
          <code>CTRL</code>
          <span> + mouse scroll to zoom in and out</span>
        </li>
        <li>
          <span>
            Hold right click and drag OR use the arrow keys to pan the camera
          </span>
        </li>
      </ul>
    </div>
  </div>
);

const PlayUI: React.FC<{ mapKey?: string }> = ({ mapKey }) => {
  const [showLegend, setShowLegend] = useState(false);

  const game = useGame();
  const playScene = useScene<PlayScene>();

  const activeToolType = useSubscribe(
    playScene.events,
    'setTool',
    () => playScene.tm.activeToolType,
  );

  const running = useSubscribe(
    playScene.events,
    'setRunning',
    () => playScene.running,
  );

  const selectedItems = useSubscribe(
    playScene.events,
    'setSelected',
    () => playScene.selected,
  );

  return (
    <div className="ui-wrap">
      <FlashText />

      <Stats />

      <div className="absolute left-0 top-0 p-4 space-y-2 flex flex-col">
        {PLAY_TOOL_TYPES.map((toolType) => {
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
              onClick={() => playScene.tm.setTool(toolType)}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="absolute left-1/2 top-0 -translate-x-1/2 p-4 space-x-2">
        <button
          className="ui-tool-button"
          title="Or press 'SPACE'"
          onClick={() => {
            playScene.setRunning(!running);
          }}
        >
          {running ? 'Pause ⏸︎' : 'Play ⏵︎'}
        </button>
        <button
          className="ui-tool-button"
          title="Or press 'R'"
          onClick={() => {
            playScene.restart();
          }}
        >
          Reset
        </button>
      </div>

      <div className="absolute right-0 top-0 p-4 space-y-2 flex flex-col">
        <button
          className="ui-tool-button"
          onClick={() => game.setScene('Menu')}
        >
          Menu
        </button>
        <button
          className="ui-tool-button"
          onClick={() => game.setScene('Editor', { mapKey })}
        >
          Edit
        </button>
        <button
          className="ui-tool-button"
          onClick={() => setShowLegend((v) => !v)}
        >
          Help?
        </button>
      </div>

      {selectedItems?.length ? (
        <div className="absolute left-0 bottom-0 p-4 space-y-2 flex flex-col">
          <button
            className="ui-tool-button"
            onClick={() => playScene.duplicateSelected()}
          >
            Duplicate {selectedItems.length} selected
          </button>
          <button
            className="ui-tool-button ui-tool-button--danger"
            onClick={() => playScene.deleteSelected()}
          >
            Delete {selectedItems.length} selected
          </button>
        </div>
      ) : null}

      <PointerPos />

      {showLegend && <Directions onClose={() => setShowLegend(false)} />}
    </div>
  );
};

export default PlayUI;
