import "./globals.css";

// ⚠️ APNA MEASUREMENT ID YAHAN DAALO
// Google Analytics → Admin → Data Streams → G-XXXXXXXXXX
const GA_ID = "G-H7HXYRXTM7";

export const metadata = {
  title: "YES YOU PRO — Abhi Kya Karna Chahiye?",
  description: "AI-powered crypto decision platform for Indian investors. Real-time BUY / SELL / HOLD / WAIT signals using RSI, MACD, Bollinger Bands & YES YOU PRO AI.",
  keywords: "crypto india, bitcoin buy sell, crypto AI, yes you pro, BTC ETH analysis, crypto signals hindi, RSI indicator, crypto trading India",
  authors: [{ name: "YES YOU PRO" }],
  creator: "YES YOU PRO",
  publisher: "YES YOU PRO",
  metadataBase: new URL("https://yesyoupro.com"),
  icons: {
    icon: [
      { url: "/yyp_logo.gif", type: "image/gif" },
      { url: "/favicon.ico",  sizes: "any" },
    ],
    apple: { url: "/yyp_logo.gif", type: "image/gif" },
    shortcut: "/yyp_logo.gif",
  },
  openGraph: {
    title: "YES YOU PRO — Crypto AI for India",
    description: "Real-time BUY / SELL / HOLD signals. Free crypto AI tool for Indian investors.",
    url: "https://yesyoupro.com",
    siteName: "YES YOU PRO",
    images: [{ url: "/yyp_logo.gif", width: 400, height: 400, alt: "YES YOU PRO Logo" }],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary",
    title: "YES YOU PRO — Crypto AI India",
    description: "Real-time BUY / SELL / HOLD signals for Indian crypto investors.",
    images: ["/yyp_logo.gif"],
  },
  robots: { index: true, follow: true },
  verification: { google: "" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/yyp_logo.gif" type="image/gif"/>
        <link rel="apple-touch-icon" href="/yyp_logo.gif"/>
        <link rel="shortcut icon" href="/yyp_logo.gif"/>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Google Analytics */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9884021055437527"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

  title: "YES YOU PRO — Abhi Kya Karna Chahiye?",
  description: "AI-powered crypto decision platform for Indian investors. Real-time BUY / SELL / HOLD / WAIT signals using RSI, MACD, Bollinger Bands & YES YOU PRO AI.",
  keywords: "crypto india, bitcoin buy sell, crypto AI, yes you pro, BTC ETH analysis, crypto signals hindi, RSI indicator, crypto trading India",
  authors: [{ name: "YES YOU PRO" }],
  creator: "YES YOU PRO",
  publisher: "YES YOU PRO",
  metadataBase: new URL("https://yesyoupro.com"),
  icons: {
    icon: [
      { url: "/yyp_logo.gif", type: "image/gif" },
      { url: "/favicon.ico",  sizes: "any" },
    ],
    apple: { url: "/yyp_logo.gif", type: "image/gif" },
    shortcut: "/yyp_logo.gif",
  },
  openGraph: {
    title: "YES YOU PRO — Crypto AI for India",
    description: "Real-time BUY / SELL / HOLD signals. Free crypto AI tool for Indian investors.",
    url: "https://yesyoupro.com",
    siteName: "YES YOU PRO",
    images: [{ url: "/yyp_logo.gif", width: 400, height: 400, alt: "YES YOU PRO Logo" }],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary",
    title: "YES YOU PRO — Crypto AI India",
    description: "Real-time BUY / SELL / HOLD signals for Indian crypto investors.",
    images: ["/yyp_logo.gif"],
  },
  robots: { index: true, follow: true },
  verification: { google: "" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/yyp_logo.gif" type="image/gif"/>
        <link rel="apple-touch-icon" href="/yyp_logo.gif"/>
        <link rel="shortcut icon" href="/yyp_logo.gif"/>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9884021055437527"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

