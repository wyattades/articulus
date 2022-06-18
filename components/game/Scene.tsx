import { createContext, useContext, useEffect, useState } from 'react';

import { useGame } from 'components/GameProvider';
import type { BaseScene } from 'src/scenes/Scene';

const SceneCtx = createContext<BaseScene | null>(null);

export const useScene = <V extends BaseScene>() => {
  const scene = useContext(SceneCtx);
  if (!scene) throw new Error('Missing Scene provider');
  return scene as V;
};

export const Scene: React.FC<{
  children?: React.ReactNode;
  sceneKey: string;
  data?: Record<string, any>;
}> = ({ children, sceneKey, data }) => {
  const game = useGame();

  const [scene, setScene] = useState<BaseScene | null>(null);

  useEffect(() => {
    setScene(null);

    game.scene.start(sceneKey, data);

    game.waitForSceneReady(sceneKey).then(setScene);

    return () => {
      if (game.destroyed) return;
      (game.scene.getScene(sceneKey) as BaseScene)?.shutdown?.();
      game.scene.stop(sceneKey);
    };
  }, [game, sceneKey]);

  return (
    <SceneCtx.Provider value={scene}>
      {scene && !scene.game.destroyed ? children : null}
    </SceneCtx.Provider>
  );
};
