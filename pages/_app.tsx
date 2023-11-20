import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { DefaultSeo } from 'next-seo';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';

import { GameProvider } from 'components/GameProvider';
// import { Footer } from 'components/Footer';

import 'src/styles/index.scss';

const HOST_URL = process.env.HOST_URL;

const App: React.FC<
  Omit<AppProps, 'pageProps'> & {
    pageProps: { session?: Session | null };
  } & Record<string, unknown>
> = ({ Component, pageProps: { session, ...pageProps } }) => {
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
      {process.env.NODE_ENV === 'production' ? (
        <Script
          async
          defer
          data-website-id="41249c7a-b770-4a8a-98a0-408572b9658e"
          src="https://sip-umami.vercel.app/sip.js"
        />
      ) : null}

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

      <SessionProvider session={session}>
        <GameProvider>
          <Component {...pageProps} />

          {/* <Footer /> */}
        </GameProvider>
      </SessionProvider>
    </>
  );
};

export default App;
