import { useScene } from 'components/game/Scene';
import { useSubscribe } from 'hooks/useSubscribe';

export const PointerPos: React.FC = () => {
  const playScene = useScene();

  const { worldX, worldY } = useSubscribe(
    playScene.input,
    'pointermove',
    (evt = playScene.input.activePointer) => ({
      worldX: evt.worldX,
      worldY: evt.worldY,
    }),
    true,
  );

  return (
    <p className="ui-text text-lg absolute bottom-0 right-0 p-4">
      x: {Math.round(worldX)}, y: {Math.round(worldY)}
    </p>
  );
};
