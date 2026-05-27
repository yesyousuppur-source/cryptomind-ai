export const metadata = {
  title: "Privacy Policy — YES YOU PRO",
  description: "YES YOU PRO ki Privacy Policy. Jaano hum kaunsa data collect karte hain, kaise use karte hain aur aapke rights kya hain.",
};

export default function PrivacyPage() {
  const S = {
    main:{fontFamily:"'Inter',sans-serif",background:"#f8fafc",minHeight:"100vh",paddingBottom:80},
    hero:{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",padding:"36px 20px 44px",textAlign:"center"},
    h1:{fontSize:26,fontWeight:900,color:"#fff",marginBottom:8},
    sub:{fontSize:14,color:"rgba(255,255,255,.6)",marginTop:0},
    wrap:{maxWidth:680,margin:"0 auto",padding:"24px 16px"},
    card:{background:"#fff",borderRadius:16,padding:"24px",marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.06)"},
    h2:{fontSize:18,fontWeight:800,marginBottom:12,color:"#0f172a"},
    p:{fontSize:14,color:"#374151",lineHeight:1.9,marginBottom:12},
    ul:{fontSize:14,color:"#374151",lineHeight:2,paddingLeft:20,marginBottom:12},
  };
  const updated = "January 2025";
  return (
    <main style={S.main}>
      <div style={S.hero}>
        <div style={{fontSize:44,marginBottom:10}}>🔒</div>
        <h1 style={S.h1}>Privacy Policy</h1>
        <p style={S.sub}>Last updated: {updated}</p>
      </div>
      <div style={S.wrap}>

        <div style={S.card}>
          <h2 style={S.h2}>1. Introduction</h2>
          <p style={S.p}>YES YOU PRO ("we", "our", "us") yesyoupro.com operate karta hai. Yeh Privacy Policy explain karti hai ki hum aapki personal information kaise collect, use aur share karte hain jab aap hamaari services use karte ho.</p>
          <p style={S.p}>Is policy ko padhke aap samjhoge ki hum aapke data ke saath kya karte hain. Agar aap koi bhi concern feel karo toh humse contact karo: Yesyousuppur@gmail.com</p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>2. Information Jo Hum Collect Karte Hain</h2>
          <p style={S.p}><strong>Automatically Collected Information:</strong></p>
          <ul style={S.ul}>
            <li>Browser type aur version</li>
            <li>Operating system</li>
            <li>Pages visited aur time spent</li>
            <li>Referring website URLs</li>
            <li>IP address (anonymized)</li>
            <li>Device type (mobile/desktop)</li>
          </ul>
          <p style={S.p}><strong>Information Jo Aap Provide Karte Ho:</strong></p>
          <ul style={S.ul}>
            <li>Email address (agar contact karo to)</li>
            <li>Search queries (coin names jo analyze karo)</li>
          </ul>
          <p style={S.p}>Hum koi bhi sensitive financial information, passwords ya payment details store nahi karte.</p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>3. Cookies aur Tracking</h2>
          <p style={S.p}>Hum cookies aur similar tracking technologies use karte hain:</p>
          <ul style={S.ul}>
            <li><strong>Google Analytics:</strong> Website traffic aur user behavior analyze karne ke liye</li>
            <li><strong>Google AdSense:</strong> Relevant advertisements show karne ke liye</li>
            <li><strong>Local Storage:</strong> Aapki preferences save karne ke liye (dark/light mode, saved coins)</li>
          </ul>
          <p style={S.p}>Aap browser settings se cookies disable kar sakte ho, lekin isse site ka kuch functionality affect ho sakti hai.</p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>4. Google AdSense aur Advertising</h2>
          <p style={S.p}>Hum Google AdSense use karte hain advertisements show karne ke liye. Google aur uske partners cookies use karke relevant ads serve karte hain based on your visits to our site and other sites on the internet.</p>
          <p style={S.p}>Aap Google's advertising opt-out page visit karke personalized advertising disable kar sakte ho: <strong>google.com/settings/ads</strong></p>
          <p style={S.p}>More information ke liye Google's Privacy Policy dekhein: <strong>google.com/policies/privacy</strong></p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>5. Hum Aapka Data Kaise Use Karte Hain</h2>
          <ul style={S.ul}>
            <li>Website performance improve karne ke liye</li>
            <li>User experience better banane ke liye</li>
            <li>Technical issues fix karne ke liye</li>
            <li>Relevant advertisements show karne ke liye</li>
            <li>Legal obligations comply karne ke liye</li>
          </ul>
          <p style={S.p}>Hum aapka personal data kabhi bhi third parties ko sell nahi karte. Hum sirf trusted service providers (Google Analytics, AdSense) ke saath share karte hain jo strict data protection standards follow karte hain.</p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>6. Data Security</h2>
          <p style={S.p}>Hum industry-standard security measures use karte hain aapke data ko protect karne ke liye. Hamaari website HTTPS use karti hai encryption ke liye. Lekin internet pe koi bhi transmission 100% secure nahi hoti.</p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>7. Third-Party Links</h2>
          <p style={S.p}>Hamaari website mein third-party websites ke links ho sakte hain (Binance, CoinGecko, etc.). Hum un sites ki privacy practices ke liye responsible nahi hain. Unki privacy policies padho jab tum unhe visit karo.</p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>8. Children's Privacy</h2>
          <p style={S.p}>YES YOU PRO 18 saal se kam age ke users ke liye design nahi kiya gaya hai. Hum knowingly minors ka personal data collect nahi karte. Agar aapko lagta hai ki kisi minor ne hamare saath information share ki hai, toh please humse contact karo.</p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>9. Aapke Rights</h2>
          <p style={S.p}>Aapke paas yeh rights hain:</p>
          <ul style={S.ul}>
            <li>Apna data access karne ka right</li>
            <li>Data correction request karne ka right</li>
            <li>Data deletion request karne ka right</li>
            <li>Marketing communications se opt-out karne ka right</li>
          </ul>
          <p style={S.p}>In rights exercise karne ke liye email karo: <strong>Yesyousuppur@gmail.com</strong></p>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>10. Policy Updates</h2>
          <p style={S.p}>Hum yeh Privacy Policy kabhi bhi update kar sakte hain. Changes hamare website pe post kiye jayenge. Important changes ke liye hum email notification bhej sakte hain (agar aapne subscribe kiya ho).</p>
          <p style={S.p}>Is policy ka use continue karna change accept karna maana jayega.</p>
        </div>

        <div style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:14,padding:"20px",textAlign:"center"}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:8,color:"#065f46"}}>📧 Koi Sawaal Hai?</div>
          <p style={{fontSize:13,color:"#047857",marginBottom:12}}>Privacy se related koi bhi concern ke liye humse contact karo:</p>
          <a href="mailto:Yesyousuppur@gmail.com" style={{color:"#059669",fontWeight:700,fontSize:14}}>Yesyousuppur@gmail.com</a>
        </div>

      </div>
    </main>
  );
}
