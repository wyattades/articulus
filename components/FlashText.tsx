import clsx from 'clsx';
import { useEffect, useState } from 'react';

import { useScene } from 'components/game/Scene';

export type FlashStatus = 'info' | 'error' | 'win';
export type FlashPayload = { message: string; status: FlashStatus };

export const FlashText: React.FC = () => {
  const [flash, setFlash] = useState<FlashPayload>({
    message: '',
    status: 'info',
  });
  const [showing, setShowing] = useState(false);

  const scene = useScene();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cb = (payload: FlashPayload) => {
      clearTimeout(timer);
      setFlash(payload);
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
          'ui-flash ui-text text-center p-2',
          !showing && 'animate',
          flash.status === 'win'
            ? 'ui-flash--win'
            : flash.status === 'error'
              ? 'ui-flash--danger'
              : null,
        )}
      >
        {flash.message}
      </p>
    </div>
  );
};
