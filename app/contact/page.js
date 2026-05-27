export const metadata = {
  title: "Contact Us — YES YOU PRO",
  description: "YES YOU PRO se contact karo — feedback, bug report, partnership ya koi bhi sawaal ke liye.",
};

export default function ContactPage() {
  return (
    <main style={{fontFamily:"'Inter',sans-serif",background:"#f8fafc",minHeight:"100vh",paddingBottom:80}}>
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",padding:"36px 20px 44px",textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:10}}>📬</div>
        <h1 style={{fontSize:26,fontWeight:900,color:"#fff",marginBottom:8}}>Contact Karo</h1>
        <p style={{fontSize:14,color:"rgba(255,255,255,.6)"}}>Hum sunna chahte hain — feedback se hi improve hote hain</p>
      </div>

      <div style={{maxWidth:600,margin:"0 auto",padding:"24px 16px"}}>

        <div style={{background:"#fff",borderRadius:16,padding:"24px",marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
          <h2 style={{fontSize:18,fontWeight:800,marginBottom:16,color:"#0f172a"}}>📧 Direct Contact</h2>
          <a href="mailto:Yesyousuppur@gmail.com" style={{display:"flex",alignItems:"center",gap:14,background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)",border:"2px solid #6ee7b7",borderRadius:14,padding:"18px 20px",textDecoration:"none",marginBottom:12}}>
            <div style={{width:48,height:48,background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📧</div>
            <div>
              <div style={{fontSize:11,color:"#64748b",marginBottom:2}}>Email (Best way to reach us)</div>
              <div style={{fontSize:15,fontWeight:800,color:"#059669"}}>Yesyousuppur@gmail.com</div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Reply time: 24-48 hours</div>
            </div>
          </a>
          <a href="https://yesyoupro.com" style={{display:"flex",alignItems:"center",gap:14,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:14,padding:"16px 20px",textDecoration:"none"}}>
            <div style={{width:48,height:48,background:"#f1f5f9",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🌐</div>
            <div>
              <div style={{fontSize:11,color:"#64748b",marginBottom:2}}>Website</div>
              <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>yesyoupro.com</div>
            </div>
          </a>
        </div>

        <div style={{background:"#fff",borderRadius:16,padding:"24px",marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
          <h2 style={{fontSize:18,fontWeight:800,marginBottom:14,color:"#0f172a"}}>💬 Kyun Contact Karein?</h2>
          {[
            {e:"🐛",t:"Bug Report",d:"Koi feature kaam nahi kar raha? Batao — hum fix karenge!"},
            {e:"💡",t:"Feature Request",d:"Koi nayi feature chahiye? Tumhara idea valuable hai."},
            {e:"📊",t:"Data Issue",d:"Analysis ya price data mein koi problem? Let us know."},
            {e:"🤝",t:"Partnership",d:"Business collaboration ya integration ke liye."},
            {e:"📝",t:"Content Feedback",d:"Blog articles ya guides mein improvement suggest karo."},
            {e:"❓",t:"General Queries",d:"Koi bhi sawaal — website, tools, ya services ke baare mein."},
          ].map((item,i)=>(
            <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<5?"1px solid #f8fafc":"none"}}>
              <span style={{fontSize:20,flexShrink:0}}>{item.e}</span>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:"#0f172a",marginBottom:2}}>{item.t}</div>
                <div style={{fontSize:12,color:"#64748b"}}>{item.d}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:14,padding:"18px",marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:13,color:"#92400e",marginBottom:8}}>⚠️ Important Note</div>
          <p style={{fontSize:13,color:"#78350f",lineHeight:1.8,margin:0}}>YES YOU PRO ek free educational platform hai. Hum financial advice nahi dete. Investment decisions ke liye please qualified financial advisor se consult karo. Crypto markets mein risk hota hai — hamesha DYOR (Do Your Own Research) karo.</p>
        </div>

        <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",borderRadius:16,padding:"20px",textAlign:"center"}}>
          <div style={{fontSize:14,color:"rgba(255,255,255,.6)",marginBottom:12}}>Aur bhi help chahiye?</div>
          <a href="https://yesyoupro.com/chat" style={{display:"inline-block",background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",borderRadius:10,padding:"12px 28px",fontWeight:700,fontSize:14,textDecoration:"none"}}>
            🤖 AI Chat Se Pucho →
          </a>
        </div>

      </div>
    </main>
  );
}
