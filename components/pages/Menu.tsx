import { useState } from 'react';
import * as _ from 'lodash-es';
import { useAsync } from 'react-use';
import { useSession } from 'next-auth/react';

import { useGame } from 'components/GameProvider';
import { MapSaver } from 'lib/saver';
import { InlineInput } from 'components/form/InlineInput';
import { AuthMenu } from 'components/Auth';

const useMapMetas = () => {
  const [i, setI] = useState(0);
  const data = useAsync(() => MapSaver.loadMapsMeta(), [i]).value || null;

  return [data, async () => setI((prev) => prev + 1)] as const;
};

const MenuUI: React.FC = () => {
  const [allLevels, revalidateLevels] = useMapMetas();

  const groups = _.groupBy(allLevels, (l) => (l.mine ? 'mine' : 'public'));

  const game = useGame();

  const session = useSession();

  return (
    <div className="ui-wrap container py-8 px-6">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <AuthMenu onLogout={revalidateLevels} />
        </div>

        <h1 className="ui-markup text-5xl text-center">Articulus</h1>
        <div className="flex-1" />
      </div>

      <div className="flex justify-end space-x-4 py-4">
        <button
          type="button"
          className="ui-tool-button"
          onClick={() => game.setScene('Editor')}
        >
          New Level
        </button>
        <button
          type="button"
          className="ui-tool-button"
          onClick={() => game.setScene('Play')}
        >
          Random Level
        </button>
      </div>

      {!allLevels ? (
        <p className="ui-markup text-center text-lg pt-24">Loading...</p>
      ) : (
        [
          session.status === 'authenticated' && ['mine', 'Your levels'],
          ['public', 'Public levels'],
        ]
          .filter((d): d is string[] => !!d)
          .map(([groupKey, title]) => {
            const levels = groups[groupKey];

            return (
              <div key={groupKey} className="mb-10">
                <p className="ui-markup text-3xl">{title}</p>
                <div className="py-4">
                  {!levels?.length ? (
                    <p className="ui-markup text-center py-8">
                      Nothing here yet!
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-4">
                      {levels.map((level) => {
                        return (
                          <div key={level.id} className="ui-box">
                            <InlineInput
                              value={level.name || '???'}
                              className="ui-markup text-xl mb-4"
                              disabled={!level.mine}
                              onUpdate={async (newName) => {
                                await new MapSaver(level).setName(newName);
                              }}
                            />
                            {!level.mine ? (
                              <p className="ui-markup mb-4">
                                By {level.user?.username || '???'}
                              </p>
                            ) : null}
                            <div className="flex space-x-4">
                              <button
                                type="button"
                                className="ui-tool-button"
                                onClick={() =>
                                  game.setScene('Play', { mapKey: level.slug })
                                }
                              >
                                Play
                              </button>
                              <button
                                type="button"
                                className="ui-tool-button"
                                onClick={() =>
                                  game.setScene('Editor', {
                                    mapKey: level.slug,
                                  })
                                }
                              >
                                {level.mine ? 'Edit' : 'Fork'}
                              </button>

                              {level.mine ? (
                                <button
                                  type="button"
                                  className="ui-tool-button ui-tool-button--danger"
                                  onClick={async () => {
                                    if (
                                      // eslint-disable-next-line no-alert
                                      !window.confirm(
                                        `Are you sure you want to delete "${level.name}"?`,
                                      )
                                    )
                                      return;

                                    await new MapSaver(level).delete();
                                    await revalidateLevels();
                                  }}
                                >
                                  Delete
                                </button>
                              ) : null}
                            </div>
                            {level.mine ? (
                              <div className="mt-2">
                                <label className="ui-markup whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={level.isPublic}
                                    onChange={async (e) => {
                                      await new MapSaver(level).setPublic(
                                        e.target.checked,
                                      );
                                      await revalidateLevels();
                                    }}
                                  />{' '}
                                  Is Public?
                                </label>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
      )}
    </div>
  );
};

export default MenuUI;
