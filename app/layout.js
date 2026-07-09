import "./globals.css";

const GA_ID = "G-H7HXYRXTM7";
const SITE_URL = "https://yesyoupro.com";
const LOGO_URL = `${SITE_URL}/yyp_logo.gif`;

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export const metadata = {
  title: "YES YOU PRO — India Ka Free Crypto AI Tool",
  description: "AI-powered crypto analysis platform for Indian investors. Real-time BUY / SELL / HOLD signals. RSI, MACD, Bollinger Bands. 120+ coins. Bilkul free — koi signup nahi.",
  keywords: "crypto india, bitcoin analysis, crypto AI india, yes you pro, BTC ETH analysis, crypto signals hindi, RSI indicator, crypto trading India, free crypto tool",
  authors: [{ name: "YES YOU PRO" }],
  creator: "YES YOU PRO",
  publisher: "YES YOU PRO",
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: "/yyp_logo.gif", type: "image/gif" },
      { url: "/favicon.ico",  sizes: "any" },
    ],
    apple: { url: "/yyp_logo.gif" },
    shortcut: "/yyp_logo.gif",
  },
  openGraph: {
    title: "YES YOU PRO — India Ka Free Crypto AI Tool",
    description: "Real-time BUY / SELL / HOLD signals. 120+ coins ka free AI analysis.",
    url: SITE_URL,
    siteName: "YES YOU PRO",
    images: [{
      url: LOGO_URL,
      width: 512,
      height: 512,
      alt: "YES YOU PRO — India Ka Free Crypto AI Tool",
    }],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary",
    title: "YES YOU PRO — Free Crypto AI India",
    description: "Real-time BUY / SELL / HOLD signals for Indian crypto investors.",
    images: [LOGO_URL],
    site: "@yesyoupro",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

// Organization Schema for Google Search logo
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "YES YOU PRO",
  "url": SITE_URL,
  "logo": {
    "@type": "ImageObject",
    "url": LOGO_URL,
    "width": 512,
    "height": 512,
  },
  "description": "India ka free AI-powered cryptocurrency analysis platform. Real-time signals, tax calculator, DCA planner aur zyada — bilkul free.",
  "foundingDate": "2024",
  "areaServed": "IN",
  "knowsAbout": ["Cryptocurrency", "Bitcoin", "Ethereum", "Crypto Trading", "DeFi"],
  "sameAs": [
    SITE_URL,
    "https://yesyoupro.com/about",
  ],
};

// WebSite Schema for Google Search Box
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "YES YOU PRO",
  "url": SITE_URL,
  "description": "India ka free AI crypto analysis tool",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${SITE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Viewport — CRITICAL for mobile responsiveness */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"/>
        <meta name="theme-color" content="#0f172a"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>

        {/* Favicon — multiple formats */}
        <link rel="icon" href="/yyp_logo.gif" type="image/gif"/>
        <link rel="icon" href="/favicon.ico" sizes="any"/>
        <link rel="apple-touch-icon" href="/yyp_logo.gif"/>
        <link rel="shortcut icon" href="/yyp_logo.gif"/>

        {/* Google Search — Logo Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
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
          * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }

          html {
            height: 100%;
            -webkit-text-size-adjust: 100%;
            text-size-adjust: 100%;
          }

          body {
            margin: 0;
            min-height: 100%;
            /* Reserve space for fixed bottom nav + iOS safe area */
            padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
            overscroll-behavior-y: none;
            -webkit-overflow-scrolling: touch;
          }

          /* Stable fixed nav — anchored to visual viewport bottom, handles iOS address-bar collapse without jumping */
          .yyp-bottom-nav {
            position: fixed;
            left: 0; right: 0; bottom: 0;
            z-index: 999;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
            display: flex;
            align-items: stretch;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
            height: 60px;
            padding-bottom: env(safe-area-inset-bottom, 0px);
            /* Prevents the nav from being pushed/squashed by mobile keyboard or browser chrome resize */
            transform: translateZ(0);
            will-change: transform;
          }

          .yyp-nav-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            text-decoration: none;
            color: #94a3b8;
            font-family: 'Inter', sans-serif;
            font-size: 9px;
            font-weight: 600;
            border: none;
            background: transparent;
            cursor: pointer;
            transition: color 0.15s;
            padding: 0;
            -webkit-user-select: none;
            user-select: none;
          }
          .yyp-nav-item .nav-icon { font-size: 20px; line-height: 1; }
          .yyp-nav-item:active { opacity: 0.7; }

          /* Prevent horizontal overflow / accidental zoom on any page */
          img, svg { max-width: 100%; height: auto; }
          input, textarea, select, button { font-size: 16px; } /* prevents iOS auto-zoom on focus */

          @media (max-width: 380px) {
            .yyp-nav-item { font-size: 8px; }
            .yyp-nav-item .nav-icon { font-size: 18px; }
          }
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
          <a href="/trade" className="yyp-nav-item">
            <span className="nav-icon">📈</span>
            <span>Trade</span>
          </a>
          <a href="/chat" className="yyp-nav-item" style={{color:"#10b981"}}>
            <span className="nav-icon">🤖</span>
            <span>AI Chat</span>
          </a>
          <a href="/features" className="yyp-nav-item">
            <span className="nav-icon">✨</span>
            <span>Features</span>
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

