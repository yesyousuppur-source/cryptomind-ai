export const metadata = {
  title: "Terms of Service — YES YOU PRO",
  description: "YES YOU PRO ki Terms of Service. Is platform ka use karne se pehle yeh terms padho aur samjho.",
};
const S = {
  card:{background:"#fff",borderRadius:16,padding:"24px",marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.06)"},
  h2:{fontSize:18,fontWeight:800,marginBottom:12,color:"#0f172a"},
  p:{fontSize:14,color:"#374151",lineHeight:1.9,marginBottom:12,margin:"0 0 12px 0"},
  li:{fontSize:14,color:"#374151",lineHeight:2.0},
};
export default function TermsPage() {
  return (
    <main style={{fontFamily:"'Inter',sans-serif",background:"#f8fafc",minHeight:"100vh",paddingBottom:80}}>
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",padding:"36px 20px 44px",textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:10}}>📋</div>
        <h1 style={{fontSize:26,fontWeight:900,color:"#fff",marginBottom:8}}>Terms of Service</h1>
        <p style={{fontSize:14,color:"rgba(255,255,255,.6)",margin:0}}>Last updated: January 2025</p>
      </div>
      <div style={{maxWidth:680,margin:"0 auto",padding:"24px 16px"}}>

        <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:14,padding:"16px 20px",marginBottom:16}}>
          <p style={{fontSize:14,color:"#92400e",lineHeight:1.8,margin:0}}>
            <strong>Important:</strong> YES YOU PRO strictly ek educational aur research platform hai. Yahan di gayi koi bhi information financial advice nahi hai. Cryptocurrency mein invest karne se pehle hamesha qualified financial advisor se consult karo aur apna khud ka research karo (DYOR).
          </p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>1. Agreement to Terms</h2>
          <p style={S.p}>YES YOU PRO (yesyoupro.com) visit karke ya hamare tools use karke, aap in Terms of Service se agree karte ho. Agar aap in terms se agree nahi karte, toh please is website ka use band karo.</p>
          <p style={S.p}>Yeh terms Indian law ke under govern hote hain. Koi bhi dispute Indian courts mein resolve hoga.</p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>2. Description of Service</h2>
          <p style={S.p}>YES YOU PRO ek free online platform hai jo provide karta hai:</p>
          <ul style={{paddingLeft:20,marginBottom:12}}>
            {["Real-time cryptocurrency market data aur technical analysis tools","AI-powered coin scanning aur expert recommendations","Market heatmap, sector analysis, aur trend indicators","Educational blog content about cryptocurrency","DCA Planner, Tax Calculator, aur other financial calculators","AI chat assistant for crypto-related queries"].map((item,i)=>(
              <li key={i} style={S.li}>{item}</li>
            ))}
          </ul>
          <p style={S.p}>Yeh saari services strictly educational aur informational purposes ke liye hain.</p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>3. Disclaimer — Not Financial Advice</h2>
          <p style={S.p}>YES YOU PRO pe available koi bhi content, tools, analysis, signals, ya information:</p>
          <ul style={{paddingLeft:20,marginBottom:12}}>
            {["Financial advice constitute nahi karta","Investment recommendations nahi hain","Trading signals guarantee nahi karte","Professional financial guidance ka substitute nahi hain","Specific investment actions ki recommendation nahi karte"].map((item,i)=>(
              <li key={i} style={S.li}>❌ {item}</li>
            ))}
          </ul>
          <p style={{...S.p,fontWeight:700,color:"#dc2626"}}>Cryptocurrency investments mein significant risk hota hai. Aap apna poora invested capital kho sakte ho. Sirf utna invest karo jo tum afford kar sako kho ne ke liye.</p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>4. Data Accuracy</h2>
          <p style={S.p}>Hum accurate data provide karne ki koshish karte hain lekin:</p>
          <ul style={{paddingLeft:20,marginBottom:12}}>
            {["Market data third-party APIs (Binance, CoinGecko) se aata hai","Data mein delay ho sakta hai","Technical errors ya API failures possible hain","Historical data projections future results guarantee nahi karte","We are not responsible for decisions made based on our data"].map((item,i)=>(
              <li key={i} style={S.li}>{item}</li>
            ))}
          </ul>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>5. User Responsibilities</h2>
          <p style={S.p}>Is platform ka use karke, aap agree karte ho ki:</p>
          <ul style={{paddingLeft:20,marginBottom:12}}>
            {["Aap 18+ saal ke ho","Aap apne jurisdiction mein cryptocurrency trading legally kar sakte ho","Aap hamare tools ka use sirf lawful purposes ke liye karoge","Aap hamare systems ko hack, scrape, ya abuse nahi karoge","Aap false information provide nahi karoge","Aap copyrighted content copy ya redistribute nahi karoge"].map((item,i)=>(
              <li key={i} style={S.li}>{item}</li>
            ))}
          </ul>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>6. Intellectual Property</h2>
          <p style={S.p}>YES YOU PRO ka naam, logo, website design, original content, aur tools hamare intellectual property hain. Inhe bina permission ke copy, reproduce, ya use nahi kar sakte.</p>
          <p style={S.p}>Third-party data (Binance prices, CoinGecko data) unke respective owners ki property hai aur unke terms ke under use hota hai.</p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>7. Limitation of Liability</h2>
          <p style={S.p}>YES YOU PRO aur uske creators kisi bhi direct, indirect, incidental, ya consequential damages ke liye liable nahi hain jo arise ho:</p>
          <ul style={{paddingLeft:20,marginBottom:12}}>
            {["Hamare platform pe diye gaye information pe based investment decisions se","Market data inaccuracies ya delays se","Platform downtime ya technical failures se","Third-party services ke issues se","Any other use of our platform"].map((item,i)=>(
              <li key={i} style={S.li}>{item}</li>
            ))}
          </ul>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>8. Advertising</h2>
          <p style={S.p}>YES YOU PRO Google AdSense aur other advertising networks use karta hai revenue generate karne ke liye. Yeh revenue platform ko free rakhne mein help karta hai.</p>
          <p style={S.p}>Advertisements third-party advertisers ke hain aur hum unke content ke liye responsible nahi hain. Advertisers ke saath koi bhi transaction aapka aur unka personal matter hai.</p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>9. Third-Party Links</h2>
          <p style={S.p}>Hamaare platform mein external websites ke links ho sakte hain. Hum un sites ke content, privacy practices, ya services ke liye responsible nahi hain. Un sites ki terms aur privacy policies review karo.</p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>10. Changes to Terms</h2>
          <p style={S.p}>Hum yeh Terms kabhi bhi update kar sakte hain bina prior notice ke. Updated terms website pe post hone ke baad immediately effective ho jaate hain. Continued use of our platform means acceptance of updated terms.</p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>11. Governing Law</h2>
          <p style={S.p}>Yeh Terms of Service Indian law ke under govern hote hain. Koi bhi dispute Indian courts mein resolve hoga. Aap Indian jurisdiction se consent dete ho.</p>
        </div>

        <div style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:14,padding:"20px",textAlign:"center"}}>
          <p style={{fontSize:14,color:"#047857",marginBottom:12,margin:"0 0 12px 0",lineHeight:1.8}}>Koi bhi sawaal ke liye humse contact karo:</p>
          <a href="mailto:Yesyousuppur@gmail.com" style={{color:"#059669",fontWeight:700,fontSize:15}}>Yesyousuppur@gmail.com</a>
          <p style={{fontSize:12,color:"#94a3b8",marginTop:10,margin:"10px 0 0 0"}}>YES YOU PRO · yesyoupro.com · India</p>
        </div>

      </div>
    </main>
  );
}
