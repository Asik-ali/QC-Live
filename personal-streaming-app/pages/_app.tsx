import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>QC Live - Professional Streaming Application</title>
        <meta name="description" content="QC Live - Professional 24/7 streaming application designed by Himanshu-HIVEcorp" />
        <meta name="author" content="Himanshu-HIVEcorp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#262626',
            color: '#fafafa',
            border: '1px solid #404040',
          },
        }}
      />
    </>
  );
}