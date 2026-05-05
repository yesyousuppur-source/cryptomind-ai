"use client";
import Link from "next/link";

export default function PrivacyPage() {
  const today = new Date().toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });

  const Section = ({title, children}) => (
    <div style={{marginBottom:24}}>
      <div style={{fontWeight:800,fontSize:15,color:"#0f172a",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:4,height:20,background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:2}}/>
        {title}
      </div>
      <div style={{fontSize:13,color:"#475569",lineHeight:1.9}}>{children}</div>
    </div>
  );

  return (
    <main style={{fontFamily:"'Inter',sans-serif",background:"#f0fdf8",minHeight:"100vh",color:"#0f172a"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .mono{font-family:'JetBrains Mono',monospace}
        ul{padding-left:18px}
        li{margin-bottom:6px}
        @keyframes fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fadein{animation:fadein .4s ease-out}
      `}</style>

      <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(rgba(16,185,129,.07) 1px,transparent 1px)",backgroundSize:"32px 32px",opacity:.4,pointerEvents:"none"}}/>

      <div style={{maxWidth:700,margin:"0 auto",padding:"36px 16px 56px",position:"relative"}}>

        <Link href="/" style={{display:"inline-flex",alignItems:"center",gap:6,color:"#059669",textDecoration:"none",fontSize:13,fontWeight:600,marginBottom:28,background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:"6px 14px",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="fadein" style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#ecfdf5,#d1fae5)",border:"1px solid #6ee7b7",borderRadius:40,padding:"6px 18px",marginBottom:16}}>
            <span style={{fontSize:16}}>🔒</span>
            <span className="mono" style={{fontSize:10,color:"#059669",fontWeight:600,letterSpacing:2}}>PRIVACY POLICY</span>
          </div>
          <h1 style={{fontSize:32,fontWeight:900,letterSpacing:-1.2,marginBottom:10,color:"#0f172a"}}>Privacy Policy</h1>
          <p style={{fontSize:13,color:"#94a3b8"}}>Last updated: {today}</p>
        </div>

        <div className="fadein" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:"28px",boxShadow:"0 4px 20px rgba(0,0,0,.06)"}}>

          {/* Intro */}
          <div style={{background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)",border:"1px solid #6ee7b7",borderRadius:14,padding:"16px 18px",marginBottom:28,fontSize:13,color:"#166534",lineHeight:1.7}}>
            <strong>CryptoMind AI</strong> ("hum", "hamari website") aapki privacy ka samman karta hai. Yeh Privacy Policy explain karti hai ki hum kaunsi information collect karte hain, kaise use karte hain, aur aapke kya rights hain.
          </div>

          <Section title="1. Jo Information Hum Collect Karte Hain">
            <p style={{marginBottom:10}}><strong style={{color:"#0f172a"}}>Voluntarily di gayi information:</strong></p>
            <ul>
              <li>Contact form se aapka naam aur email (agar aap submit karte hain)</li>
              <li>Portfolio screenshots jo aap upload karte hain (yeh server pe store NAHI hote)</li>
            </ul>
            <p style={{marginTop:12,marginBottom:10}}><strong style={{color:"#0f172a"}}>Automatically collect hone wali information:</strong></p>
            <ul>
              <li>Browser type aur version</li>
              <li>Pages visited aur time spent (Google Analytics ke through)</li>
              <li>IP address (anonymized)</li>
              <li>Device type (mobile/desktop)</li>
            </ul>
            <p style={{marginTop:12,padding:"10px 14px",background:"#f0fdf4",borderRadius:10,color:"#166534",fontWeight:500}}>
              ✅ Hum aapka <strong>naam, phone number, financial data, ya wallet address</strong> kabhi store nahi karte.
            </p>
          </Section>

          <div style={{borderTop:"1px dashed #e2e8f0",marginBottom:24}}/>

          <Section title="2. Screenshots Ka Kya Hota Hai">
            <p>Jab aap portfolio screenshot upload karte hain:</p>
            <ul style={{marginTop:8}}>
              <li>Image <strong>sirf analysis ke liye</strong> Claude AI (Anthropic) ko bheji jaati hai</li>
              <li>Image hamare servers pe <strong>permanently store nahi hoti</strong></li>
              <li>Analysis complete hone ke baad image memory se delete ho jaati hai</li>
              <li>Anthropic ki apni Privacy Policy apply hoti hai: <a href="https://anthropic.com/privacy" target="_blank" rel="noopener noreferrer" style={{color:"#059669"}}>anthropic.com/privacy</a></li>
            </ul>
          </Section>

          <div style={{borderTop:"1px dashed #e2e8f0",marginBottom:24}}/>

          <Section title="3. Cookies">
            <p>Hum limited cookies use karte hain:</p>
            <ul style={{marginTop:8}}>
              <li><strong>Analytics cookies:</strong> Google Analytics ke through traffic samajhne ke liye</li>
              <li><strong>No tracking cookies:</strong> Hum third-party advertising cookies use nahi karte</li>
              <li><strong>Session cookies:</strong> Basic website functionality ke liye</li>
            </ul>
            <p style={{marginTop:10}}>Aap browser settings se cookies disable kar sakte hain, lekin site ka kuch functionality affect ho sakta hai.</p>
          </Section>

          <div style={{borderTop:"1px dashed #e2e8f0",marginBottom:24}}/>

          <Section title="4. Data Sharing">
            <p style={{marginBottom:8}}>Hum aapka data kisi bhi third party ke saath <strong>sell ya rent nahi karte.</strong></p>
            <p style={{marginBottom:8}}>Data sirf inke saath share hota hai:</p>
            <ul>
              <li><strong>Anthropic (Claude AI):</strong> Coin analysis aur screenshot analysis ke liye</li>
              <li><strong>Binance API:</strong> Real-time price data fetch karne ke liye (no personal data)</li>
              <li><strong>Google Analytics:</strong> Anonymous usage statistics</li>
              <li><strong>Legal requirements:</strong> Agar court order ya law enforcement request ho</li>
            </ul>
          </Section>

          <div style={{borderTop:"1px dashed #e2e8f0",marginBottom:24}}/>

          <Section title="5. Data Security">
            <ul>
              <li>Saari data transmission HTTPS (SSL encryption) se hoti hai</li>
              <li>Sensitive API keys server-side environment variables mein secure hain</li>
              <li>Hum regular security reviews karte hain</li>
              <li>Koi bhi financial data ya passwords hamare paas store nahi hote</li>
            </ul>
          </Section>

          <div style={{borderTop:"1px dashed #e2e8f0",marginBottom:24}}/>

          <Section title="6. Aapke Rights (Indian IT Act + GDPR)">
            <ul>
              <li><strong>Access:</strong> Jaanna ka haq ki humne kya data rakha hai</li>
              <li><strong>Correction:</strong> Galat information theek karvane ka haq</li>
              <li><strong>Deletion:</strong> Apna data delete karvane ka haq</li>
              <li><strong>Objection:</strong> Processing rokne ka haq</li>
            </ul>
            <p style={{marginTop:10}}>In rights ke liye hum se contact karo: <a href="mailto:support@yesyoupro.com" style={{color:"#059669",fontWeight:600}}>support@yesyoupro.com</a></p>
          </Section>

          <div style={{borderTop:"1px dashed #e2e8f0",marginBottom:24}}/>

          <Section title="7. Children's Privacy">
            <p>Yeh service 18 saal se kam umra ke logon ke liye nahi hai. Hum jaante-bujhte minors ka data collect nahi karte. Agar aapko lagta hai ki kisi minor ne data share kiya hai, hamse contact karein.</p>
          </Section>

          <div style={{borderTop:"1px dashed #e2e8f0",marginBottom:24}}/>

          <Section title="8. Policy Changes">
            <p>Hum yeh policy kabhi bhi update kar sakte hain. Changes hone par "Last Updated" date change hogi. Major changes ke liye hum website pe notice dikhayenge.</p>
          </Section>

          <div style={{borderTop:"1px dashed #e2e8f0",marginBottom:24}}/>

          <Section title="9. Contact">
            <p>Privacy se related koi bhi sawaal ke liye:</p>
            <div style={{background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)",border:"1px solid #6ee7b7",borderRadius:12,padding:"14px 16px",marginTop:10}}>
              <div style={{fontWeight:700,color:"#065f46",marginBottom:4}}>YesYouPro — CryptoMind AI</div>
              <div style={{fontSize:13,color:"#166534"}}>📧 Email: <a href="mailto:support@yesyoupro.com" style={{color:"#059669",fontWeight:600}}>support@yesyoupro.com</a></div>
              <div style={{fontSize:13,color:"#166534",marginTop:4}}>🌐 Website: <a href="https://yesyoupro.com" style={{color:"#059669",fontWeight:600}}>yesyoupro.com</a></div>
            </div>
          </Section>

        </div>

        <div style={{textAlign:"center",marginTop:20,display:"flex",justifyContent:"center",gap:14}}>
          <Link href="/about" style={{fontSize:12,color:"#94a3b8",textDecoration:"none"}}>About Us</Link>
          <span style={{color:"#e2e8f0"}}>·</span>
          <Link href="/contact" style={{fontSize:12,color:"#94a3b8",textDecoration:"none"}}>Contact</Link>
          <span style={{color:"#e2e8f0"}}>·</span>
          <Link href="/" style={{fontSize:12,color:"#059669",textDecoration:"none",fontWeight:600}}>← Home</Link>
        </div>

      </div>
    </main>
  );
}
