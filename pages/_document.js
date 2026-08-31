import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA / home screen */}
        <meta name="application-name" content="The Edge" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="The Edge" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1a5c36" />

        {/* Favicon / icon — swap in your own PNG if desired */}
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />

        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />

        <meta name="description" content="NFL power rating edge calculator" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
