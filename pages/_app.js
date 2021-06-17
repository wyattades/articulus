import React from 'react';
import Head from 'next/head';
import { DefaultSeo } from 'next-seo';

import 'src/styles/index.scss';

const HOST_URL = process.env.HOST_URL;

const App = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <DefaultSeo
        title="Articulus Game"
        description="Connect rigid bodies with joints to build machines and vehicles in this physics sandbox game"
        openGraph={{
          type: 'website',
          locale: 'en_US',
          url: HOST_URL,
          site_name: 'Articulus',
          images: [
            {
              url: HOST_URL + '/images/cover.jpg',
              width: 1824,
              height: 1454,
              alt: 'Articulus game',
            },
          ],
        }}
        twitter={{
          handle: '@wyattades',
          cardType: 'summary_large_image',
        }}
      />

      <Component {...pageProps} />
    </>
  );
};

export default App;
