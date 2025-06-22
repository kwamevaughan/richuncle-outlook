import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Preload Google Fonts for Poppins */}
          <link
            rel="preload"
            href="https://fonts.googleapis.com/css2?family=Poppins&display=swap"
            as="style"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Poppins&display=swap"
            rel="stylesheet"
          />
          {/* Preload Rokt Icons */}
          <link
            rel="preload"
            href="https://apps.rokt.com/icons/rokt-icons.woff"
            as="font"
            type="font/woff"
            crossOrigin="anonymous"
          />

          {/* Favicon Links */}
          <link rel="icon" href="/favicon.png" />
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
          <meta
            name="description"
            content=""
          />

          
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
