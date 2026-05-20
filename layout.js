import "./globals.css";

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
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}/>
        <script dangerouslySetInnerHTML={{__html:`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { page_path: window.location.pathname });
        `}}/>
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9884021055437527"
          crossOrigin="anonymous"
        />
        <style>{`
          body { margin: 0; padding-bottom: 68px; }
          .yyp-bottom-nav {
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 999;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
            display: flex; align-items: stretch;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
            height: 60px;
          }
          .yyp-nav-item {
            flex: 1; display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 3px; text-decoration: none;
            color: #94a3b8; font-family: 'Inter', sans-serif;
            font-size: 9px; font-weight: 600;
            border: none; background: transparent; cursor: pointer;
            transition: color 0.15s;
            padding: 0;
          }
          .yyp-nav-item.active { color: #059669; }
          .yyp-nav-item .nav-icon { font-size: 20px; line-height: 1; }
          .yyp-nav-item:active { opacity: 0.7; }
        `}</style>
      </head>
      <body>
        {children}

        {/* Bottom Navigation */}
        <nav className="yyp-bottom-nav">
          <a href="/" className="yyp-nav-item">
            <span className="nav-icon">🏠</span>
            <span>Home</span>
          </a>
          <a href="/#analyze" className="yyp-nav-item">
            <span className="nav-icon">📊</span>
            <span>Analyze</span>
          </a>
          <a href="/features" className="yyp-nav-item">
            <span className="nav-icon">✨</span>
            <span>Features</span>
          </a>
          <a href="/trade" className="yyp-nav-item">
            <span className="nav-icon">📈</span>
            <span>Trade</span>
          </a>
          <a href="/blog" className="yyp-nav-item">
            <span className="nav-icon">📚</span>
            <span>Blog</span>
          </a>
        </nav>
      </body>
    </html>
  );
}
