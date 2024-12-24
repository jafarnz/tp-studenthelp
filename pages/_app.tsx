import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import Head from 'next/head';
import '@/styles/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <>
      <Head>
        <title>TP Connect</title>
        <meta name="description" content="Connect with fellow students at Temasek Polytechnic" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SessionProvider session={session}>
        <div className="min-h-screen bg-bg-primary">
          <Component {...pageProps} />
        </div>
      </SessionProvider>
    </>
  );
}
