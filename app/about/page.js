"use client";
import Link from "next/link";

const T = {
  green:"#10b981", greenDk:"#059669",
  shadow:"0 4px 20px rgba(0,0,0,.06)",
};

export default function AboutPage() {
  return (
    <main style={{fontFamily:"'Inter',sans-serif",background:"#f0fdf8",minHeight:"100vh",color:"#0f172a"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .mono{font-family:'JetBrains Mono',monospace}
        @keyframes fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fadein{animation:fadein .4s ease-out}
        .hov{transition:transform .2s,box-shadow .2s}
        .hov:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(16,185,129,.12)!important}
      `}</style>

      {/* BG */}
      <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(rgba(16,185,129,.07) 1px,transparent 1px)",backgroundSize:"32px 32px",opacity:.5,pointerEvents:"none"}}/>
      <div style={{position:"fixed",top:-150,right:-150,width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(16,185,129,.08),transparent 70%)",pointerEvents:"none"}}/>

      <div style={{maxWidth:700,margin:"0 auto",padding:"36px 16px 56px",position:"relative"}}>

        {/* Back */}
        <Link href="/" style={{display:"inline-flex",alignItems:"center",gap:6,color:"#059669",textDecoration:"none",fontSize:13,fontWeight:600,marginBottom:28,background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:"6px 14px",boxShadow:T.shadow}}>
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="fadein" style={{textAlign:"center",marginBottom:36}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#ecfdf5,#d1fae5)",border:"1px solid #6ee7b7",borderRadius:40,padding:"6px 18px",marginBottom:16}}>
            <span style={{fontSize:16}}>👋</span>
            <span className="mono" style={{fontSize:10,color:"#059669",fontWeight:600,letterSpacing:2}}>ABOUT US</span>
          </div>
          <h1 style={{fontSize:36,fontWeight:900,letterSpacing:-1.5,marginBottom:10,background:"linear-gradient(135deg,#0f172a,#10b981)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            CryptoMind AI
          </h1>
          <p style={{fontSize:15,color:"#64748b",maxWidth:480,margin:"0 auto",lineHeight:1.7}}>
            India ka pehla AI-powered crypto decision platform — jo simple language mein batata hai: <strong style={{color:"#0f172a"}}>abhi kya karna chahiye.</strong>
          </p>
        </div>

        {/* Mission Card */}
        <div className="hov fadein" style={{background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)",border:"1px solid #6ee7b7",borderRadius:20,padding:"24px",marginBottom:14,boxShadow:T.shadow}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{width:44,height:44,background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🎯</div>
            <div>
              <div style={{fontWeight:800,fontSize:17,color:"#065f46"}}>Hamara Mission</div>
              <div style={{fontSize:12,color:"#059669",marginTop:1}}>Why we built this</div>
            </div>
          </div>
          <p style={{fontSize:14,color:"#166534",lineHeight:1.8,fontWeight:500}}>
            India mein crores log crypto mein invest karte hain — lekin zyada tar confuse rehte hain. Charts samajh nahi aate, RSI kya hai pata nahi, aur har jagah sirf English mein technical jargon hota hai.
          </p>
          <p style={{fontSize:14,color:"#166534",lineHeight:1.8,fontWeight:500,marginTop:10}}>
            <strong>CryptoMind AI</strong> banaya gaya hai taaki aam Indian investor ko ek simple, honest, aur real-time answer mile: <em>"BUY karo, SELL karo, HOLD karo, ya WAIT karo."</em>
          </p>
        </div>

        {/* What We Do */}
        <div className="fadein" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:"24px",marginBottom:14,boxShadow:T.shadow}}>
          <div style={{fontWeight:800,fontSize:16,marginBottom:18,color:"#0f172a"}}>⚡ Hum Kya Karte Hain</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              {icon:"📊",title:"Real-time Data",desc:"Binance se live price, volume aur market data"},
              {icon:"🧮",title:"Technical Analysis",desc:"RSI, MA50, MA200 automatically calculate hota hai"},
              {icon:"🤖",title:"AI Decision",desc:"Claude AI se honest, personalized analysis"},
              {icon:"🛡️",title:"Scam Detector",desc:"Suspicious coins ki automatic warning"},
              {icon:"📸",title:"Screenshot AI",desc:"Apna portfolio screenshot upload karo — AI analyze karega"},
              {icon:"🏆",title:"Top 5 Daily",desc:"Har din 25 coins scan karke best picks batate hain"},
            ].map((f,i)=>(
              <div key={i} style={{background:"#f8fafc",borderRadius:12,padding:"14px",border:"1px solid #e2e8f0"}}>
                <div style={{fontSize:22,marginBottom:6}}>{f.icon}</div>
                <div style={{fontWeight:700,fontSize:13,color:"#0f172a",marginBottom:4}}>{f.title}</div>
                <div style={{fontSize:12,color:"#64748b",lineHeight:1.5}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="fadein" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:"24px",marginBottom:14,boxShadow:T.shadow}}>
          <div style={{fontWeight:800,fontSize:16,marginBottom:18,color:"#0f172a"}}>🔍 Kaise Kaam Karta Hai</div>
          {[
            {step:"01",title:"Real Data Fetch",desc:"Binance API se us coin ka live price, 200 din ka history, aur volume fetch hota hai — koi fake data nahi."},
            {step:"02",title:"Indicators Calculate",desc:"RSI (14-period), Moving Average 50 & 200 automatically calculate hote hain — same jo professional traders use karte hain."},
            {step:"03",title:"AI Analysis",desc:"Claude AI (Anthropic) saare indicators analyze karke score banata hai aur honest BUY/SELL/HOLD/WAIT decision deta hai."},
            {step:"04",title:"Honest Output",desc:"Confidence %, Risk Level, Entry/Exit zones aur AI explanation clearly dikhaya jaata hai — koi false promises nahi."},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",gap:14,marginBottom:i<3?16:0,paddingBottom:i<3?16:0,borderBottom:i<3?"1px dashed #e2e8f0":"none"}}>
              <div style={{width:36,height:36,background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:900,fontSize:12,color:"#fff"}}>
                {s.step}
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:14,color:"#0f172a",marginBottom:4}}>{s.title}</div>
                <div style={{fontSize:13,color:"#64748b",lineHeight:1.6}}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Important Note */}
        <div className="fadein" style={{background:"linear-gradient(135deg,#fffbeb,#fef3c7)",border:"1px solid #fde68a",borderRadius:20,padding:"20px 24px",marginBottom:14,boxShadow:T.shadow}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{fontSize:24,flexShrink:0}}>⚠️</span>
            <div>
              <div style={{fontWeight:800,fontSize:15,color:"#92400e",marginBottom:8}}>Important Notice</div>
              <p style={{fontSize:13,color:"#78350f",lineHeight:1.7}}>
                CryptoMind AI ek <strong>analytical tool</strong> hai — yeh financial advisor nahi hai. Yahan di gayi koi bhi information investment advice nahi hai. Crypto market highly volatile hoti hai aur past performance future results guarantee nahi karti.
              </p>
              <p style={{fontSize:13,color:"#78350f",lineHeight:1.7,marginTop:8}}>
                Koi bhi investment decision lene se pehle apna research karo (DYOR) aur zaroorat padne par certified financial advisor se consult karo.
              </p>
            </div>
          </div>
        </div>

        {/* Built By */}
        <div className="fadein" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:"24px",marginBottom:14,boxShadow:T.shadow}}>
          <div style={{fontWeight:800,fontSize:16,marginBottom:16,color:"#0f172a"}}>🏗️ Banaya Gaya</div>
          <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px",background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)",borderRadius:14,border:"1px solid #bbf7d0"}}>
            <div style={{width:48,height:48,background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,color:"#fff",flexShrink:0}}>YYP</div>
            <div>
              <div style={{fontWeight:800,fontSize:15,color:"#065f46"}}>YesYouPro</div>
              <div style={{fontSize:12,color:"#059669",marginTop:2}}>yesyoupro.com</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:4}}>AI-powered tools for Indian entrepreneurs & investors</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
            {[{icon:"🤖",label:"Claude AI (Anthropic)"},{icon:"📊",label:"Binance API"},{icon:"😰",label:"Alternative.me"},{icon:"⚡",label:"Next.js + Vercel"}].map((t,i)=>(
              <span key={i} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:20,padding:"5px 12px",fontSize:11,color:"#475569",fontWeight:500}}>
                {t.icon} {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="fadein" style={{textAlign:"center",marginTop:8}}>
          <Link href="/" style={{display:"inline-flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",textDecoration:"none",borderRadius:14,padding:"14px 32px",fontWeight:700,fontSize:15,boxShadow:"0 4px 20px rgba(16,185,129,.4)"}}>
            ⚡ Start Analyzing Coins
          </Link>
          <div style={{marginTop:14,display:"flex",justifyContent:"center",gap:14}}>
            <Link href="/privacy" style={{fontSize:12,color:"#94a3b8",textDecoration:"none"}}>Privacy Policy</Link>
            <span style={{color:"#e2e8f0"}}>·</span>
            <Link href="/contact" style={{fontSize:12,color:"#94a3b8",textDecoration:"none"}}>Contact Us</Link>
          </div>
        </div>

      </div>
    </main>
  );
}
