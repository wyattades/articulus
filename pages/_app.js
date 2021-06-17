import React from 'react';
import Head from 'next/head';
import { DefaultSeo } from 'next-seo';

import Footer from 'components/Footer';

import 'src/styles/index.scss';

const HOST_URL = process.env.HOST_URL;
const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS;

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
        {GA_ID ? (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${GA_ID}');`,
              }}
            />
          </>
        ) : null}
      </Head>

      <DefaultSeo
        title="Articulus - A Physics Sandbox Game"
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

      <main>
        <Component {...pageProps} />
      </main>
      <Footer />
    </>
  );
};

export default App;
