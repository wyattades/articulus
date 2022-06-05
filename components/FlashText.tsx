import { useEffect, useState } from 'react';
import clsx from 'clsx';

import { useScene } from 'components/game/Scene';

export const FlashText: React.FC = () => {
  const [text, setText] = useState('');
  const [showing, setShowing] = useState(false);

  const scene = useScene();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cb = (flashText: string) => {
      clearTimeout(timer);
      setText(flashText);
      setShowing(true);
      timer = setTimeout(() => {
        setShowing(false);
      }, 60);
    };
    scene.events.on('showFlash', cb);
    return () => {
      scene.events.off('showFlash', cb);
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
