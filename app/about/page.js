import Link from "next/link";

export const metadata = {
  title: "About YES YOU PRO — India Ka #1 Free Crypto AI Tool",
  description: "YES YOU PRO ke baare mein jaano — India ka pehla free AI-powered crypto analysis platform jo Indian investors ke liye banaya gaya hai.",
};

export default function AboutPage(){
  return(
    <main style={{fontFamily:"'Inter',sans-serif",background:"#f0fdf8",minHeight:"100vh",
      color:"#0f172a",paddingBottom:60}}>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",padding:"24px 20px",
        borderBottom:"2px solid #10b981"}}>
        <Link href="/" style={{color:"#6ee7b7",fontSize:13,textDecoration:"none",fontWeight:600,
          display:"block",marginBottom:12}}>← Home</Link>
        <h1 style={{fontWeight:900,fontSize:28,color:"#fff",letterSpacing:-1,marginBottom:6}}>
          About YES YOU PRO
        </h1>
        <p style={{fontSize:13,color:"#64748b"}}>India Ka #1 Free Crypto AI Analysis Platform</p>
      </div>

      <div style={{padding:"20px",maxWidth:680,margin:"0 auto"}}>

        {/* Mission */}
        <div style={{background:"#fff",borderRadius:16,padding:"22px",marginBottom:16,
          boxShadow:"0 2px 12px rgba(0,0,0,.06)",borderTop:"4px solid #10b981"}}>
          <h2 style={{fontSize:18,fontWeight:900,marginBottom:12,color:"#0f172a"}}>
            🎯 Hamara Mission
          </h2>
          <p style={{fontSize:14,color:"#374151",lineHeight:1.9,marginBottom:14}}>
            YES YOU PRO ek free, AI-powered cryptocurrency analysis platform hai jo specifically
            Indian investors ke liye design kiya gaya hai. Hamara mission hai ki har Indian —
            chahe woh Mumbai mein ho ya kisi chhote shahar mein — world-class crypto analysis
            tools access kar sake, bilkul free mein.
          </p>
          <p style={{fontSize:14,color:"#374151",lineHeight:1.9,marginBottom:14}}>
            India mein cryptocurrency ka interest bahut tezi se badh raha hai. Millions of Indians
            crypto mein invest kar rahe hain ya karna chahte hain. Lekin accurate, reliable aur
            samajhne mein aasaan analysis tools available nahi the — jo Indian investors ke liye
            optimized hon, jo Hinglish mein samjhaayen, aur jo bilkul free hon.
          </p>
          <p style={{fontSize:14,color:"#374151",lineHeight:1.9}}>
            Yahi gap hum fill karte hain. YES YOU PRO ne yeh sab change kiya hai.
          </p>
        </div>

        {/* What we offer */}
        <div style={{background:"#fff",borderRadius:16,padding:"22px",marginBottom:16,
          boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
          <h2 style={{fontSize:18,fontWeight:900,marginBottom:16,color:"#0f172a"}}>
            🛠️ Kya Offer Karte Hain Hum?
          </h2>

          {[
            {emoji:"🏆",title:"Expert Choice — AI Signal Finder",desc:"Hamare AI engine ko 30+ coins ko daily scan karta hai. RSI, Moving Averages, Volume aur momentum indicators ke combination se top 5 best investment opportunities identify karta hai. Har signal ke saath entry price, stop loss aur 3 profit targets milte hain."},
            {emoji:"⚔️",title:"Coin vs Coin Comparison",desc:"Do ya zyada coins ko side-by-side compare karo. Score, category stars, risk level, ₹10,000 simulator aur historical performance — sab ek jagah. AI batayega kaunsa coin better investment opportunity hai."},
            {emoji:"📈",title:"Position Tracker",desc:"Apni crypto position real-time track karo. Live P&L, ROE%, aur 4 different timeframes (5 min, 15 min, 1 hour, 4 hour) par AI analysis. Pata chale kab hold karo, kab sell karo."},
            {emoji:"🚨",title:"Pump Radar",desc:"120 coins ko continuously monitor karo. CoinGecko aur CoinMarketCap trending data ke saath Binance volume spikes combine karke potential pump hone wale coins identify karo — pump hone se pehle."},
            {emoji:"📊",title:"Live Market",desc:"Top 120 cryptocurrencies ki live prices, market cap, volume aur 24h change ek jagah dekho. 1 second mein automatically update hota hai."},
            {emoji:"🧾",title:"Tax Calculator",desc:"India ka pehla free crypto tax calculator. CSV upload karo aur instantly jaano kitna tax banana padega. 13+ Indian aur international exchanges support karta hai."},
            {emoji:"📄",title:"Whitepaper AI Analyzer",desc:"Kisi bhi crypto project ka whitepaper ya website URL daalo — AI 2-3 minute ki jagah 30 seconds mein complete analysis de dega. Team, technology, risks, aur buy recommendation."},
            {emoji:"📚",title:"Crypto Sikho",desc:"21 structured lessons — Beginner se Advanced tak. Blockchain basics se lekar advanced trading strategies tak — sab Hinglish mein. Bilkul free."},
          ].map((f,i)=>(
            <div key={i} style={{display:"flex",gap:12,marginBottom:16,
              paddingBottom:16,borderBottom:i<7?"1px solid #f1f5f9":"none"}}>
              <div style={{fontSize:24,flexShrink:0,marginTop:2}}>{f.emoji}</div>
              <div>
                <h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:5}}>{f.title}</h3>
                <p style={{fontSize:13,color:"#475569",lineHeight:1.7}}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Why free */}
        <div style={{background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)",borderRadius:16,
          padding:"22px",marginBottom:16,border:"1px solid #6ee7b7"}}>
          <h2 style={{fontSize:18,fontWeight:900,marginBottom:12,color:"#065f46"}}>
            💚 Yeh Sab Free Kyun Hai?
          </h2>
          <p style={{fontSize:14,color:"#166534",lineHeight:1.9,marginBottom:12}}>
            Hum strongly believe karte hain ki financial education aur quality tools sabke liye
            accessible hone chahiye — sirf unke liye nahi jo expensive subscriptions afford kar
            saken. India mein millions of small investors hain jo better tools deserve karte hain.
          </p>
          <p style={{fontSize:14,color:"#166534",lineHeight:1.9}}>
            Platform Google AdSense advertisements se sustain hota hai. Hum koi subscription
            charge nahi karte, koi hidden fees nahi hain. Sab tools hamesha free rahenge.
            <strong> Koi signup bhi required nahi</strong> — sirf open karo aur use karo.
          </p>
        </div>

        {/* Technology */}
        <div style={{background:"#fff",borderRadius:16,padding:"22px",marginBottom:16,
          boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
          <h2 style={{fontSize:18,fontWeight:900,marginBottom:12,color:"#0f172a"}}>
            ⚡ Technology Stack
          </h2>
          <p style={{fontSize:14,color:"#374151",lineHeight:1.9,marginBottom:12}}>
            YES YOU PRO latest cutting-edge technology par build kiya gaya hai:
          </p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {t:"AI Engine",v:"Claude AI (Anthropic)"},
              {t:"Real-time Data",v:"Binance WebSocket"},
              {t:"Market Data",v:"CoinGecko + CMC"},
              {t:"Frontend",v:"Next.js 14 + React"},
              {t:"Hosting",v:"Vercel (Global CDN)"},
              {t:"Domain",v:"yesyoupro.com"},
            ].map((s,i)=>(
              <div key={i} style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px",
                border:"1px solid #e2e8f0"}}>
                <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,marginBottom:2}}>{s.t}</div>
                <div style={{fontSize:12,fontWeight:700,color:"#0f172a"}}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{background:"#fffbeb",borderRadius:14,padding:"18px",
          border:"1px solid #fde68a",marginBottom:16}}>
          <h3 style={{fontSize:14,fontWeight:800,color:"#92400e",marginBottom:8}}>
            ⚠️ Disclaimer
          </h3>
          <p style={{fontSize:12,color:"#78350f",lineHeight:1.8}}>
            YES YOU PRO ek educational aur informational platform hai. Yahan diya gaya koi bhi
            analysis, signal ya recommendation financial advice nahi hai. Cryptocurrency
            investments highly risky hoti hain. Invest karne se pehle apni khud ki research
            (DYOR — Do Your Own Research) zaroor karein aur qualified financial advisor se
            consult karein. Past performance future results guarantee nahi karta.
          </p>
        </div>

        {/* CTA */}
        <div style={{textAlign:"center",padding:"20px"}}>
          <Link href="/" style={{display:"inline-block",background:"linear-gradient(135deg,#10b981,#059669)",
            color:"#fff",borderRadius:12,padding:"14px 32px",fontSize:15,fontWeight:800,
            textDecoration:"none",boxShadow:"0 4px 16px rgba(16,185,129,.4)"}}>
            🚀 Free Analysis Shuru Karo →
          </Link>
          <div style={{marginTop:12,display:"flex",justifyContent:"center",gap:16}}>
            <Link href="/blog" style={{color:"#10b981",textDecoration:"none",fontSize:12,fontWeight:600}}>📚 Blog</Link>
            <Link href="/sikho" style={{color:"#10b981",textDecoration:"none",fontSize:12,fontWeight:600}}>🎓 Crypto Sikho</Link>
            <Link href="/contact" style={{color:"#10b981",textDecoration:"none",fontSize:12,fontWeight:600}}>📧 Contact</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
