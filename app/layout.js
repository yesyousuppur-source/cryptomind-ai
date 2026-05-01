import "./globals.css";

export const metadata = {
  title: "CryptoMind AI — Abhi Kya Karna Chahiye?",
  description:
    "AI-powered crypto decision platform. Real-time BUY / SELL / HOLD / WAIT signals using RSI, Moving Averages & Claude AI.",
  keywords: "crypto, bitcoin, ai, trading, analysis, RSI, buy sell hold",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
