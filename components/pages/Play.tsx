import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

import { useGame } from 'components/GameProvider';
import { colorInverse, colorIntToHex } from 'src/lib/utils';
import { PLAY_TOOL_TYPES, TOOLS } from 'src/tools';
import { useScene } from 'components/game/Scene';
import { useSubscribe } from 'hooks/useSubscribe';
import { PointerPos } from 'components/PointerPos';
import type PlayScene from 'src/scenes/Play';

const Directions = ({ onClose }) => (
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
          <code>[SPACE]</code>
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
          <span>+ mouse scroll to zoom in and out</span>
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

const FlashText: React.FC = () => {
  const [text, setText] = useState('');
  const [showing, setShowing] = useState(false);

  const playScene = useScene<PlayScene>();

  useEffect(() => {
    const cb = (flashText: string) => {
      setText(flashText);
      setShowing(true);
      setTimeout(() => {
        setShowing(false);
      }, 60);
    };
    playScene.events.on('showFlash', cb);
    return () => {
      playScene.events.off('showFlash', cb);
    };
  }, []);

  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 overflow-hidden">
      <p
        className={clsx(
          'ui-flash ui-text text-center text-xl p-2',
          !showing && 'animate',
        )}
      >
        {text}
      </p>
    </div>
  );
};

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

      <div className="absolute left-0 top-0 p-4 space-y-2 flex flex-col">
        {PLAY_TOOL_TYPES.map((toolType) => {
          const t = TOOLS[toolType];
          return (
            <button
              key={toolType}
              className={clsx(
                'ui-tool-button',
                activeToolType === toolType && 'ui-tool-button--active',
              )}
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

      <div className="absolute left-1/2 top-0 -translate-x-1/2 p-4">
        <button
          className="ui-tool-button"
          onClick={() => {
            playScene.setRunning(!running);
          }}
        >
          {running ? 'Pause ⏸︎' : 'Play ⏵︎'}
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
