import { useEffect, useRef } from 'react';
import { useAsync } from 'react-use';

import { useScene } from 'components/game/Scene';
import { useIsDebug } from 'hooks/debug';

export const Stats = () => {
  const scene = useScene();
  const ref = useRef<HTMLDivElement>(null);

  const debug = useIsDebug();

  const StatsJs =
    useAsync(
      () => (debug ? import('stats.js') : Promise.resolve(null)),
      [debug],
    ).value?.default || null;

  useEffect(() => {
    if (!scene || !StatsJs) return;

    const stats = new StatsJs();
    scene.stats = stats;
    stats.dom.style.position = 'static';
    ref.current!.appendChild(stats.dom);

    return () => {
      scene.stats = undefined;
      stats.dom.remove();
    };
  }, [scene, StatsJs]);

  return <div ref={ref} className="absolute top-0 right-28" />;
};
