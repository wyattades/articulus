import dynamic from 'next/dynamic';

const UI = dynamic(() => import('components/pages/Menu'), { ssr: false });

const IndexPage: React.FC = () => {
  return (
    <>
      <UI />
    </>
  );
};

export default IndexPage;
