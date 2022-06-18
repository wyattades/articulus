import { useScene } from 'components/game/Scene';
import { settingsSaver } from 'lib/saver';
import { useSubscribe } from 'hooks/useSubscribe';

export const useIsDebug = () => {
  const scene = useScene();
  return useSubscribe(
    scene.events,
    Phaser.Scenes.Events.START, // called on `scene.restart()`
    () => !!settingsSaver.get('debug'),
    true,
  );
};
