import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

import { Scene } from 'components/game/Scene';

const UI = dynamic(() => import('components/pages/Editor'), { ssr: false });

const EditPage: React.FC = () => {
  const mapKey = useRouter().query.edit?.[0] || null;

  return (
    <>
      <Scene sceneKey="Editor" data={{ mapKey }}>
        <UI />
      </Scene>
    </>
  );
};

export default EditPage;
