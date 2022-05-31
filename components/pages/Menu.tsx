import { useAsync } from 'react-use';

import { useGame } from 'components/GameProvider';
import { MapSaver } from 'src/lib/saver';

const useLevels = () => {
  const levels =
    useAsync(() => MapSaver.loadMapsMeta(), [MapSaver]).value || null;

  return levels;
};

const MenuUI: React.FC = () => {
  const levels = useLevels();

  const game = useGame();

  return (
    <div className="ui-wrap container py-8">
      <h1 className="ui-text text-5xl p-4 text-center mb-10">Articulus</h1>

      <div className="flex space-x-4 p-4">
        <p className="ui-text text-xl mb-4 flex-1">Select a level:</p>

        <button
          className="ui-tool-button"
          onClick={() => game.setScene('Editor')}
        >
          New Level
        </button>
        <button
          className="ui-tool-button"
          onClick={() => game.setScene('Play')}
        >
          Random Level
        </button>
      </div>

      {!levels ? (
        <p className="ui-text">Loading...</p>
      ) : !levels.length ? (
        <p className="ui-text">No levels!</p>
      ) : (
        <div className="grid grid-cols-4 gap-4 p-4">
          {levels.map((level) => {
            return (
              <div key={level.id} className="ui-box">
                <p className="ui-text mb-4">{level.name || '???'}</p>
                <div className="flex space-x-4">
                  <button
                    className="ui-tool-button"
                    onClick={() => game.setScene('Play', { mapKey: level.id })}
                  >
                    Play
                  </button>
                  <button
                    className="ui-tool-button"
                    onClick={() =>
                      game.setScene('Editor', { mapKey: level.id })
                    }
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MenuUI;
