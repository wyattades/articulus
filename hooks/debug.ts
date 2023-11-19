import { useScene } from 'components/game/Scene';
import { useSubscribe } from 'hooks/useSubscribe';
import { settingsSaver } from 'lib/saver';

export const useIsDebug = () => {
  const scene = useScene();
  return useSubscribe(
    scene.events,
    Phaser.Scenes.Events.START, // called on `scene.restart()`
    () => !!settingsSaver.get('debug'),
    true,
  );
};
