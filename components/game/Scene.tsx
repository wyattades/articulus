import { createContext, useContext, useEffect, useState } from 'react';
import type Phaser from 'phaser';

import { useGame } from 'components/GameProvider';

const SceneCtx = createContext<Phaser.Scene | null>(null);

export const useScene = <V extends Phaser.Scene>() => {
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

  const [scene, setScene] = useState(null);

  useEffect(() => {
    game.scene.start(sceneKey, data);

    game.waitForSceneReady(sceneKey).then(setScene);

    return () => {
      // @ts-expect-error missing shutdown
      game.scene.getScene(sceneKey)?.shutdown?.();
      game.scene.stop(sceneKey);
    };
  }, []);

  return (
    <SceneCtx.Provider value={scene}>
      {scene ? children : null}
    </SceneCtx.Provider>
  );
};