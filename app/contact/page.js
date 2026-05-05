"use client";
import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [form, setForm]       = useState({ name:"", email:"", subject:"", message:"" });
  const [status, setStatus]   = useState(null); // null | "loading" | "success" | "error"
  const [errMsg, setErrMsg]   = useState("");

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      setErrMsg("Please fill Name, Email and Message."); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrMsg("Please enter a valid email address."); return;
    }
    setErrMsg(""); setStatus("loading");
    try {
      const r = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (j.success) { setStatus("success"); setForm({ name:"", email:"", subject:"", message:"" }); }
      else { setStatus("error"); setErrMsg(j.error || "Something went wrong."); }
    } catch { setStatus("error"); setErrMsg("Network error. Please try again."); }
  };

  const INP = {
    width:"100%", background:"#f8fafc", border:"2px solid #e2e8f0",
    borderRadius:12, padding:"12px 14px", fontSize:13, color:"#0f172a",
    fontFamily:"'JetBrains Mono',monospace", transition:"border-color .2s",
  };

  return (
    <main style={{fontFamily:"'Inter',sans-serif",background:"#f0fdf8",minHeight:"100vh",color:"#0f172a"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .mono{font-family:'JetBrains Mono',monospace}
        input::placeholder,textarea::placeholder{color:#94a3b8}
        input:focus,textarea:focus{outline:none;border-color:#10b981!important}
        @keyframes fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fadein{animation:fadein .4s ease-out}
        .hov{transition:transform .2s,box-shadow .2s}
        .hov:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(16,185,129,.12)!important}
      `}</style>

      <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(rgba(16,185,129,.07) 1px,transparent 1px)",backgroundSize:"32px 32px",opacity:.4,pointerEvents:"none"}}/>
      <div style={{position:"fixed",top:-150,left:-100,width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(16,185,129,.07),transparent 70%)",pointerEvents:"none"}}/>

      <div style={{maxWidth:680,margin:"0 auto",padding:"36px 16px 56px",position:"relative"}}>

        <Link href="/" style={{display:"inline-flex",alignItems:"center",gap:6,color:"#059669",textDecoration:"none",fontSize:13,fontWeight:600,marginBottom:28,background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:"6px 14px",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="fadein" style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#ecfdf5,#d1fae5)",border:"1px solid #6ee7b7",borderRadius:40,padding:"6px 18px",marginBottom:16}}>
            <span style={{fontSize:16}}>💬</span>
            <span className="mono" style={{fontSize:10,color:"#059669",fontWeight:600,letterSpacing:2}}>CONTACT US</span>
          </div>
          <h1 style={{fontSize:32,fontWeight:900,letterSpacing:-1.2,marginBottom:10,color:"#0f172a"}}>
            Baat Karo Hamse
          </h1>
          <p style={{fontSize:14,color:"#64748b",maxWidth:420,margin:"0 auto",lineHeight:1.6}}>
            Koi sawaal, suggestion, ya feedback? Hum 24-48 hours mein reply karte hain.
          </p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[
            {icon:"📧",title:"Email",val:"support@yesyoupro.com",link:"mailto:support@yesyoupro.com"},
            {icon:"📸",title:"Instagram",val:"@yesyoupro",link:"https://instagram.com/yesyoupro"},
            {icon:"⏰",title:"Reply Time",val:"24–48 hours",link:null},
            {icon:"🌐",title:"Website",val:"yesyoupro.com",link:"https://yesyoupro.com"},
          ].map((c,i)=>(
            <div key={i} className="hov" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"16px",boxShadow:"0 2px 10px rgba(0,0,0,.05)"}}>
              <div style={{fontSize:24,marginBottom:8}}>{c.icon}</div>
              <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,marginBottom:4}}>{c.title}</div>
              {c.link
                ? <a href={c.link} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:"#059669",fontWeight:700,textDecoration:"none"}}>{c.val}</a>
                : <div style={{fontSize:13,color:"#0f172a",fontWeight:700}}>{c.val}</div>}
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="fadein hov" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:"28px",boxShadow:"0 4px 20px rgba(0,0,0,.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
            <div style={{width:44,height:44,background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>✉️</div>
            <div>
              <div style={{fontWeight:800,fontSize:16}}>Message Bhejo</div>
              <div style={{fontSize:12,color:"#94a3b8",marginTop:1}}>Hum seriously read karte hain har message</div>
            </div>
          </div>

          {/* Success */}
          {status === "success" && (
            <div style={{background:"linear-gradient(135deg,#ecfdf5,#d1fae5)",border:"1px solid #6ee7b7",borderRadius:14,padding:"16px 20px",marginBottom:18,display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:24,flexShrink:0}}>🎉</span>
              <div>
                <div style={{fontWeight:800,fontSize:14,color:"#065f46",marginBottom:4}}>Message Mil Gaya!</div>
                <div style={{fontSize:13,color:"#166534"}}>Hum 24-48 hours mein aapko reply karenge. Thank you!</div>
              </div>
            </div>
          )}

          {/* Error */}
          {errMsg && (
            <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:12,padding:"12px 16px",marginBottom:16,fontSize:13,color:"#dc2626",display:"flex",alignItems:"center",gap:8}}>
              <span>⚠️</span> {errMsg}
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:6,display:"block",letterSpacing:.5}}>YOUR NAME *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Apna naam likho"
                style={{...INP}} />
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:6,display:"block",letterSpacing:.5}}>EMAIL ADDRESS *</label>
              <input name="email" value={form.email} onChange={handleChange} placeholder="your@email.com"
                type="email" style={{...INP}} />
            </div>
          </div>

          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:6,display:"block",letterSpacing:.5}}>SUBJECT</label>
            <select name="subject" value={form.subject} onChange={handleChange}
              style={{...INP,cursor:"pointer"}}>
              <option value="">Select a topic…</option>
              <option value="General Question">General Question</option>
              <option value="Bug / Issue Report">Bug / Issue Report</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Business / Partnership">Business / Partnership</option>
              <option value="Privacy Concern">Privacy Concern</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{marginBottom:18}}>
            <label style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:6,display:"block",letterSpacing:.5}}>MESSAGE *</label>
            <textarea name="message" value={form.message} onChange={handleChange}
              placeholder="Apni baat yahan likho… koi bhi sawaal, suggestion ya feedback!"
              rows={5}
              style={{...INP,resize:"vertical",lineHeight:1.7}} />
          </div>

          <button onClick={handleSubmit} disabled={status==="loading"}
            style={{width:"100%",background:status==="loading"?"#e2e8f0":"linear-gradient(135deg,#10b981,#059669)",color:status==="loading"?"#94a3b8":"#fff",border:"none",borderRadius:14,padding:"14px",fontWeight:800,fontSize:15,cursor:status==="loading"?"not-allowed":"pointer",boxShadow:status==="loading"?"none":"0 4px 20px rgba(16,185,129,.4)",transition:"all .2s",fontFamily:"'Inter',sans-serif"}}>
            {status==="loading"
              ? <span style={{display:"inline-flex",alignItems:"center",gap:8}}><span style={{display:"inline-block",animation:"spin .8s linear infinite"}}>⟳</span> Sending…</span>
              : "📤 Send Message"}
          </button>

          <p style={{fontSize:11,color:"#94a3b8",textAlign:"center",marginTop:12,lineHeight:1.6}}>
            By submitting you agree to our{" "}
            <Link href="/privacy" style={{color:"#059669",textDecoration:"none",fontWeight:600}}>Privacy Policy</Link>.
            Hum aapka email kisi third party ke saath share nahi karte.
          </p>
        </div>

        {/* FAQ Quick */}
        <div className="fadein" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:"24px",marginTop:14,boxShadow:"0 4px 20px rgba(0,0,0,.05)"}}>
          <div style={{fontWeight:800,fontSize:15,marginBottom:16,color:"#0f172a"}}>❓ Common Questions</div>
          {[
            {q:"Kya yeh platform guaranteed profit deta hai?",a:"Nahi. CryptoMind AI sirf data-based analysis deta hai. Koi bhi investment mein risk hota hai. Hum financial advice nahi dete."},
            {q:"Mera data safe hai?",a:"Haan. Hum koi financial data store nahi karte. Screenshots analysis ke baad delete ho jaate hain."},
            {q:"Binance data accurate hai?",a:"Data directly Binance API se real-time fetch hota hai — 60 second cache ke saath. Indicators mathematically calculate hote hain."},
            {q:"Free hai ya paid?",a:"Basic features bilkul free hain. Premium features ke liye YesYouPro membership ka option future mein aayega."},
          ].map((faq,i)=>(
            <div key={i} style={{borderBottom:i<3?"1px dashed #e2e8f0":"none",paddingBottom:i<3?14:0,marginBottom:i<3?14:0}}>
              <div style={{fontWeight:700,fontSize:13,color:"#0f172a",marginBottom:5}}>Q: {faq.q}</div>
              <div style={{fontSize:13,color:"#64748b",lineHeight:1.6}}>A: {faq.a}</div>
            </div>
          ))}
        </div>

        <div style={{textAlign:"center",marginTop:20,display:"flex",justifyContent:"center",gap:14}}>
          <Link href="/about" style={{fontSize:12,color:"#94a3b8",textDecoration:"none"}}>About Us</Link>
          <span style={{color:"#e2e8f0"}}>·</span>
          <Link href="/privacy" style={{fontSize:12,color:"#94a3b8",textDecoration:"none"}}>Privacy Policy</Link>
          <span style={{color:"#e2e8f0"}}>·</span>
          <Link href="/" style={{fontSize:12,color:"#059669",textDecoration:"none",fontWeight:600}}>← Home</Link>
        </div>

      </div>
    </main>
  );
}
