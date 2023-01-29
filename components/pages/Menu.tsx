import { useRef, useState } from 'react';
import * as _ from 'lodash-es';
import { useAsync } from 'react-use';
import clsx from 'clsx';
import { signIn, signOut, useSession } from 'next-auth/react';

import { useGame } from 'components/GameProvider';
import { MapSaver } from 'lib/saver';

const useMapMetas = () => {
  const [i, setI] = useState(0);
  const data = useAsync(() => MapSaver.loadMapsMeta(), [i]).value || null;

  return [data, () => setI((prev) => prev + 1)] as const;
};

const InlineInput: React.FC<{
  className?: string;
  value: string;
  onUpdate: (next: string) => void;
}> = ({ className, value, onUpdate }) => {
  const prevVal = useRef(value);
  return (
    <input
      type="text"
      className={clsx(
        className,
        'bg-transparent border border-transparent hover:border-blue-500 focus:border-blue-500 -mx-2 px-2',
      )}
      defaultValue={value}
      onBlur={(e) => {
        if (prevVal.current !== e.target.value) {
          onUpdate(e.target.value);
          prevVal.current = e.target.value;
        }
      }}
    />
  );
};

const AuthMenu = () => {
  const session = useSession();

  if (session.status === 'loading') return <p>Loading...</p>;

  if (session.status === 'authenticated')
    return (
      <>
        <button
          type="button"
          className="ui-tool-button ui-tool-button--light"
          onClick={() => {
            signOut();
          }}
        >
          Logout
        </button>
        {session.data.user ? (
          <>
            <span className="text-white mr-2 ml-4">
              {session.data.user.name}
            </span>
            <img
              src={session.data.user.image!}
              className="inline-block w-10 h-10 rounded-full"
              alt="profile"
            />
          </>
        ) : null}
      </>
    );

  return (
    <button
      type="button"
      className="ui-tool-button ui-tool-button--light"
      onClick={() => {
        signIn('discord');
      }}
    >
      Login with Discord
    </button>
  );
};

const MenuUI: React.FC = () => {
  const [allLevels, revalidateLevels] = useMapMetas();

  const groups = _.groupBy(allLevels, (l) => (l.mine ? 'mine' : 'public'));

  const game = useGame();

  return (
    <div className="ui-wrap container py-8">
      <AuthMenu />

      <h1 className="ui-markup text-5xl p-4 text-center mb-10">Articulus</h1>

      <div className="flex justify-end space-x-4 p-4">
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
          ['mine', 'Your levels'],
          ['public', 'Public levels'],
        ].map(([groupKey, title]) => {
          const levels = groups[groupKey];

          return (
            <div key={groupKey} className="mb-10">
              <p className="ui-markup text-3xl">{title}</p>
              <div className="p-4">
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
                                game.setScene('Editor', { mapKey: level.slug })
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
