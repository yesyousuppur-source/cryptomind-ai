import Link from "next/link";

export const metadata = {
  title: "About Us — YES YOU PRO | India Ka Free Crypto Research Platform",
  description: "YES YOU PRO ke baare mein jaano — kaun banaya, kya mission hai, aur kyun India ke investors ke liye yeh platform free mein available hai.",
};

export default function AboutPage() {
  return (
    <main style={{fontFamily:"'Inter',sans-serif",background:"#f8fafc",minHeight:"100vh",paddingBottom:80}}>
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",padding:"40px 20px 50px",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>👋</div>
        <h1 style={{fontSize:28,fontWeight:900,color:"#fff",letterSpacing:-1,marginBottom:10}}>YES YOU PRO ke baare mein</h1>
        <p style={{fontSize:15,color:"rgba(255,255,255,.65)",maxWidth:500,margin:"0 auto",lineHeight:1.7}}>India ke crypto investors ke liye banaya gaya ek honest, free research platform.</p>
      </div>
      <div style={{maxWidth:680,margin:"0 auto",padding:"24px 16px"}}>

        <div style={{background:"#fff",borderRadius:16,padding:"24px",marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
          <h2 style={{fontSize:20,fontWeight:900,marginBottom:12,color:"#0f172a"}}>🎯 Hamara Mission</h2>
          <p style={{fontSize:14,color:"#374151",lineHeight:1.9,marginBottom:14}}>YES YOU PRO ek free cryptocurrency research platform hai jo specifically Indian investors ke liye design kiya gaya hai. Hamara mission simple hai — <strong>har Indian investor ko professional-grade crypto analysis tools available karana, bilkul free mein.</strong></p>
          <p style={{fontSize:14,color:"#374151",lineHeight:1.9,marginBottom:14}}>India mein lakhs log cryptocurrency mein invest karte hain lekin unke paas proper research tools nahi hote. Premium tools expensive hain aur mostly English mein hain. YES YOU PRO is gap ko fill karta hai — Hindi aur English dono mein, zero cost pe.</p>
          <p style={{fontSize:14,color:"#374151",lineHeight:1.9}}>Hum believe karte hain ki informed investment decisions se hi financial growth hoti hai. Bina research ke invest karna gambling hai. Isliye humne AI-powered analysis tools banaye jo real-time data use karte hain aur Indian investors ke liye optimized hain.</p>
        </div>

        <div style={{background:"#fff",borderRadius:16,padding:"24px",marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
          <h2 style={{fontSize:20,fontWeight:900,marginBottom:14,color:"#0f172a"}}>🛠️ Hum Kya Offer Karte Hain</h2>
          {[
            {e:"📊",t:"Real-Time Coin Analysis",d:"120+ cryptocurrencies ka live technical analysis — RSI, MACD, Bollinger Bands, Moving Averages. Binance API se real-time data fetch hota hai."},
            {e:"🏆",t:"Expert Choice Scanner",d:"AI-powered scanner jo 120 coins ko 6 technical indicators se score karta hai aur top 5 best entry opportunities daily identify karta hai."},
            {e:"🌡️",t:"Market Heatmap",d:"8 crypto sectors ka visual heatmap — Layer 1, DeFi, Gaming, AI, Meme, Infrastructure. Ek nazar mein poora market samjho."},
            {e:"📅",t:"DCA Planner",d:"Real Binance historical monthly data se calculate karo — agar past mein regular invest kiya hota to aaj kitna hota."},
            {e:"🚨",t:"Rug Pull Detector",d:"Nayi coins ka safety analysis — Binance aur DexScreener data se liquidity, volume aur price patterns check hote hain."},
            {e:"🎯",t:"Best Entry Time Finder",d:"1000 real hourly candles analyze karke IST time zones mein best buy time dhundo — kaunsa din, kaunsa hour sahi hai."},
            {e:"🪙",t:"Airdrop Tracker",d:"Active airdrops ki curated list step-by-step Hindi guides ke saath — free tokens earn karo."},
            {e:"🤖",t:"AI Chat Assistant",d:"Live market data ke saath powered chatbot jo crypto se koi bhi sawaal answer karta hai — Hinglish mein, 24/7."},
          ].map((item,i)=>(
            <div key={i} style={{display:"flex",gap:12,marginBottom:14,paddingBottom:14,borderBottom:i<7?"1px solid #f1f5f9":"none"}}>
              <div style={{fontSize:22,flexShrink:0,marginTop:2}}>{item.e}</div>
              <div>
                <div style={{fontWeight:700,fontSize:14,color:"#0f172a",marginBottom:3}}>{item.t}</div>
                <div style={{fontSize:13,color:"#64748b",lineHeight:1.7}}>{item.d}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)",border:"1px solid #6ee7b7",borderRadius:16,padding:"24px",marginBottom:16}}>
          <h2 style={{fontSize:20,fontWeight:900,marginBottom:12,color:"#065f46"}}>💚 Yeh Platform Free Kyun Hai?</h2>
          <p style={{fontSize:14,color:"#047857",lineHeight:1.9,marginBottom:12}}>YES YOU PRO ke saare tools bilkul free hain — koi subscription nahi, koi hidden charges nahi, koi credit card nahi. Platform ka cost advertisements se cover hota hai.</p>
          <p style={{fontSize:14,color:"#047857",lineHeight:1.9,marginBottom:12}}>Jab aap hamare ads dekhte ho, aap indirectly is platform ko support karte ho. Isliye ad blocker off rakhna help karta hai. Hum users ka data kabhi nahi bechenge.</p>
          <p style={{fontSize:14,color:"#047857",lineHeight:1.9}}><strong>Financial advice nahi dete — sirf educational research tools provide karte hain.</strong> Yeh hamara commitment hai.</p>
        </div>

        <div style={{background:"#fff",borderRadius:16,padding:"24px",marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
          <h2 style={{fontSize:20,fontWeight:900,marginBottom:14,color:"#0f172a"}}>⚙️ Technology Stack</h2>
          <p style={{fontSize:14,color:"#374151",lineHeight:1.9,marginBottom:14}}>YES YOU PRO Next.js 14 pe built hai, Vercel pe hosted hai. Real-time data Binance aur CoinGecko APIs se aata hai. AI features ke liye Claude AI use hota hai.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["Market Data","Binance API"],["AI Analysis","Claude AI"],["Framework","Next.js 14"],["Hosting","Vercel"],["Additional Data","CoinGecko"],["Analytics","Google Analytics"]].map(([l,v],i)=>(
              <div key={i} style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px"}}>
                <div style={{fontSize:10,color:"#94a3b8",marginBottom:2}}>{l}</div>
                <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:16,padding:"24px",marginBottom:16}}>
          <h2 style={{fontSize:18,fontWeight:900,marginBottom:12,color:"#92400e"}}>⚠️ Important Disclaimer</h2>
          <p style={{fontSize:13,color:"#78350f",lineHeight:1.9,marginBottom:10}}>YES YOU PRO strictly ek <strong>educational aur research platform</strong> hai. Hamare tools aur analysis financial advice constitute nahi karte aur professional financial guidance ka substitute nahi hain.</p>
          <p style={{fontSize:13,color:"#78350f",lineHeight:1.9,marginBottom:10}}>Cryptocurrency investments mein significant risk hota hai aur aap apna invested capital kho sakte ho. Past performance future results guarantee nahi karta. Invest sirf utna karo jo tum lose afford kar sako.</p>
          <p style={{fontSize:13,color:"#78350f",lineHeight:1.9}}>Koi bhi investment decision lene se pehle apna khud ka research karo (DYOR) aur agar zaroorat ho toh qualified financial advisor se consult karo.</p>
        </div>

        <div style={{background:"#fff",borderRadius:16,padding:"24px",marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
          <h2 style={{fontSize:20,fontWeight:900,marginBottom:12,color:"#0f172a"}}>📬 Contact Karo</h2>
          <p style={{fontSize:14,color:"#374151",lineHeight:1.9,marginBottom:14}}>Koi sawaal, feedback, bug report ya partnership ke liye humse contact karo:</p>
          <a href="mailto:Yesyousuppur@gmail.com" style={{display:"flex",alignItems:"center",gap:10,background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:12,padding:"14px 16px",textDecoration:"none",marginBottom:10}}>
            <span style={{fontSize:22}}>📧</span>
            <div><div style={{fontSize:11,color:"#64748b"}}>Email</div><div style={{fontSize:14,fontWeight:700,color:"#059669"}}>Yesyousuppur@gmail.com</div></div>
          </a>
          <a href="https://yesyoupro.com" style={{display:"flex",alignItems:"center",gap:10,background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:12,padding:"14px 16px",textDecoration:"none"}}>
            <span style={{fontSize:22}}>🌐</span>
            <div><div style={{fontSize:11,color:"#64748b"}}>Website</div><div style={{fontSize:14,fontWeight:700,color:"#059669"}}>yesyoupro.com</div></div>
          </a>
        </div>

        <div style={{textAlign:"center",padding:"20px 0"}}>
          <Link href="/" style={{display:"inline-block",background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",borderRadius:12,padding:"14px 36px",fontWeight:800,fontSize:15,textDecoration:"none"}}>
            🚀 Tools Try Karo — Free
          </Link>
        </div>
      </div>
    </main>
  );
}
