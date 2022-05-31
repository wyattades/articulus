import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

import { Scene } from 'components/game/Scene';

const UI = dynamic(() => import('components/pages/Play'), { ssr: false });

const PlayPage: React.FC = () => {
  const mapKey = useRouter().query.edit?.[0] || null;

  return (
    <>
      <Scene sceneKey="Play" data={{ mapKey }}>
        <UI mapKey={mapKey} />
      </Scene>
    </>
  );
};

export default PlayPage;