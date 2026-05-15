"use client";
import { useState } from "react";
import Link from "next/link";

const ARTICLES = [
  {
    id: 1,
    title: "Bitcoin Kya Hai? Beginners Ke Liye Complete Guide",
    category: "Beginner",
    emoji: "₿",
    color: "#F0B90B",
    time: "8 min read",
    content: `Bitcoin — yeh naam aapne zaroor suna hoga. News mein, social media par, ya dosto ke beech. Lekin Bitcoin actually kya hai? Kaise kaam karta hai? Aur kyu itna important hai? Aaj hum sab kuch samjhenge — bilkul simple language mein.

## Bitcoin Kya Hai?

Bitcoin ek digital currency hai — matlab ek aisa paisa jo sirf internet par exist karta hai. Isko koi central bank ya government nahi chalati. Yeh ek decentralized system par kaam karta hai jise Blockchain kehte hain.

Socho aise: Jab tum bank se kisi ko paise bhejte ho, toh bank beech mein hota hai — record rakhta hai, transaction verify karta hai. Bitcoin mein yeh kaam thousands of computers milkar karte hain. Koi ek entity control nahi karti.

## Bitcoin Ka Itihaas

2008 mein Satoshi Nakamoto — ek anonymous person ya group — ne Bitcoin ka whitepaper publish kiya. 2009 mein pehla Bitcoin transaction hua. Pehle ek pizza ke liye 10,000 Bitcoin diye gaye the — aaj ki value mein woh billions mein hote!

## Bitcoin Kaise Kaam Karta Hai?

Bitcoin Blockchain technology par kaam karta hai. Blockchain ek public ledger hai jahan sab transactions permanently record hote hain. Ek baar record ho jaaye toh delete nahi ho sakta.

**Mining:** Naye Bitcoin create karne ki process ko Mining kehte hain. Miners powerful computers se complex mathematical problems solve karte hain. Successful miner ko naye Bitcoin milte hain — yahi reward hai.

**Wallet:** Bitcoin store karne ke liye digital wallet chahiye. Yeh ek software hai jo aapki private key store karta hai. Private key matlab aapka password — isko kabhi share mat karo.

**Transaction:** Jab Bitcoin bhejte ho, toh transaction network mein broadcast hoti hai. Miners use verify karte hain aur blockchain mein add karte hain.

## Bitcoin Ki Khasiyaten

**Limited Supply:** Sirf 21 million Bitcoin kabhi exist karenge. Iss scarcity ki wajah se value maintain rehti hai — sone ki tarah.

**Decentralized:** Koi ek entity control nahi karti. Government, bank — koi ban nahi kar sakta (practically).

**Transparent:** Sab transactions publicly visible hain blockchain par. Privacy hai kyunki names nahi hote, sirf addresses hote hain.

**Peer-to-Peer:** Directly ek person se doosre person ko bhejna possible hai — bina bank ke.

## India Mein Bitcoin

India mein Bitcoin legal hai, lekin regulated. 2022 se 30% tax lagta hai crypto profits par. TDS bhi applicable hai transactions par. Yes You Pro ka Tax Calculator use karke apna tax easily calculate kar sakte ho.

## Bitcoin Buy Kaise Karein?

India mein WazirX, CoinDCX, CoinSwitch Kuber se Bitcoin khareed sakte ho. Simple process:
1. Account banao
2. KYC complete karo  
3. Bank se paisa add karo
4. Bitcoin khareed lo

## Kya Bitcoin Mein Invest Karna Chahiye?

Bitcoin highly volatile hai — price ek din mein 20% upar ya neeche ja sakti hai. Isliye:
- Sirf utna invest karo jo afford kar sako lose karne ke liye
- Long term perspective rakho
- Research zaroor karo
- Yes You Pro ke AI analysis ka use karo

Bitcoin ne pichle 10 saal mein millions of investors ko life-changing returns diye hain. Lekin risk bhi utna hi hai. Informed decision lo, emotional nahi.`
  },
  {
    id: 2,
    title: "RSI Indicator Kya Hota Hai — Trading Ka Sabse Powerful Tool",
    category: "Technical Analysis",
    emoji: "📊",
    color: "#6366f1",
    time: "6 min read",
    content: `RSI — Relative Strength Index. Yeh crypto traders ka sabse popular technical indicator hai. Agar aap trading karte ho ya karna chahte ho, toh RSI samajhna bahut zaroori hai. Aaj hum RSI ko itne simple tarike se samjhayenge ki aap turant use karna shuru kar sako.

## RSI Kya Hota Hai?

RSI ek momentum indicator hai jo 0 se 100 ke beech value dikhata hai. Yeh batata hai ki ek coin "overbought" hai ya "oversold" — yani kya price bahut zyada badh gayi hai ya bahut zyada gir gayi hai.

**Simple explanation:** Socho RSI ek thermometer ki tarah hai. High temperature = garam = overbought. Low temperature = thanda = oversold.

## RSI Values Ka Matlab

**RSI 70 se upar = Overbought**
Matlab: Price bahut tezi se badhi hai. Buyers ka enthusiasm peak par hai. Correction (price ka girna) ho sakta hai. Experienced traders yahan sell consider karte hain.

**RSI 30 se neeche = Oversold**  
Matlab: Price bahut tezi se giri hai. Sellers ne bahut zyada becha. Bounce (price ka uthna) ho sakta hai. Buyers opportunity dhundhte hain yahan.

**RSI 50 ke aaspaas = Neutral**
Na overbought, na oversold. Trend unclear hai. Wait karo better signal ke liye.

## RSI Ko Kaise Calculate Karte Hain?

RSI calculation complex hai, lekin samajhna simple:
- Pichle 14 candles mein kitne green (up) the
- Kitne red (down) the  
- Gain aur loss ka average nikalo
- Formula lagao

Yes You Pro automatically RSI calculate karta hai. Tumhe manually kuch nahi karna.

## RSI Ka Practical Use

**Oversold bounce strategy:**
1. RSI 30 se neeche aaye
2. Price support level par ho
3. Bullish candle form ho
4. BUY karo with stop loss

**Overbought exit strategy:**
1. RSI 70 se upar jaaye
2. Price resistance level par ho
3. Bearish candle form ho
4. SELL ya partial exit karo

## RSI Ki Limitations

RSI akela kaafi nahi hai. Strong trends mein RSI lamba time overbought ya oversold reh sakta hai. Isliye hamesha aur indicators ke saath use karo — jaise Moving Average, Bollinger Bands, Volume.

Yes You Pro mein RSI ke saath MA20, MA50, aur Volume sab combine karke signal deta hai — zyada accurate results ke liye.

## Important Tips

1. **Divergence dekho:** Agar price new high bana rahi hai lekin RSI nahi — bearish divergence hai. Warning sign!

2. **Timeframe matter karta hai:** 1-hour RSI aur 4-hour RSI alag signal de sakte hain. Multiple timeframes dekho.

3. **RSI blindly follow mat karo:** Har oversold stock immediately nahi uthti. Context dekho.

RSI ek powerful tool hai jo sahi tarike se use karne par trading decisions significantly improve kar sakta hai.`
  },
  {
    id: 3,
    title: "Crypto Mein Invest Kaise Karein — Step by Step Guide for Indians",
    category: "Beginner",
    emoji: "🚀",
    color: "#10b981",
    time: "10 min read",
    content: `India mein crypto investing fast grow kar rahi hai. Millions of Indians already invest kar rahe hain. Lekin bahut log confused hain — kahan se start karein? Kaise karein? Kya safe hai? Is complete guide mein hum step by step explain karenge.

## Step 1: Basics Samjho Pehle

Invest karne se pehle fundamentals samajhna zaroori hai:

**Blockchain kya hai?** Digital ledger jahan sab transactions record hote hain. Permanent, transparent, tamper-proof.

**Cryptocurrency kya hai?** Blockchain par kaam karne wali digital currency. Bitcoin, Ethereum, Solana — sab cryptocurrencies hain.

**Volatile kya matlab?** Crypto prices bahut tezi se change hoti hain — ek din mein 10-20% up ya down possible hai. Yeh normal hai crypto mein.

## Step 2: Sahi Exchange Choose Karo

India mein popular exchanges:

**WazirX:** Sabse popular Indian exchange. Simple UI. INR se directly buy kar sakte ho.

**CoinDCX:** Large selection of coins. Good for beginners. INR support.

**CoinSwitch Kuber:** Very beginner friendly. Step-by-step guided buying.

**Binance:** World's largest exchange. More advanced features. International platform.

Beginners ke liye WazirX ya CoinSwitch recommend hai.

## Step 3: Account Setup Karo

1. App download karo
2. Email se register karo
3. KYC complete karo (Aadhar + PAN)
4. Bank account link karo
5. Paisa add karo UPI se

KYC 15-30 minute mein ho jaati hai generally.

## Step 4: Kaunse Coin Khareedein?

**Beginners ke liye safe options:**

**Bitcoin (BTC):** Sabse established. Lowest risk comparatively. Long-term hold ke liye best.

**Ethereum (ETH):** Second largest. Strong fundamentals. DeFi aur NFT ecosystem.

**Solana (SOL):** Fast growing. Good technology. High potential.

**Rule:** 70% large caps (BTC, ETH), 30% small caps. Diversification important hai.

## Step 5: Kitna Invest Karein?

**Golden Rule:** Sirf utna invest karo jo lose karne ke liye afford kar sako.

Recommended allocation for beginners:
- Income ka maximum 5-10% crypto mein
- Emergency fund pehle banao
- Debt pehle clear karo
- Phir crypto mein invest karo

## Step 6: DCA Strategy Use Karo

DCA = Dollar Cost Averaging. Matlab: Ek saath sab invest mat karo. Regularly thoda thoda invest karo.

Example: ₹5000 monthly Bitcoin mein invest karo — price high ho ya low. Average cost automatically smooth ho jaati hai.

## Step 7: Security Ka Dhyan Rakho

- **Strong password** use karo
- **2FA enable** karo — Google Authenticator
- **Phishing se bachho** — fake emails/websites
- **Private keys share mat karo** kabhi

## Step 8: Research Karte Raho

Yes You Pro ke tools regularly use karo:
- Expert Choice se daily best signals dekho
- Whitepaper AI se coins research karo
- Tax Calculator se tax calculate karo
- Position Tracker se trades monitor karo

Crypto mein successful hone ka ek hi formula hai — informed decisions + patience + risk management.`
  },
  {
    id: 4,
    title: "Stop Loss Kyu Zaroori Hai — Paisa Bachane Ka Sabse Important Tool",
    category: "Risk Management",
    emoji: "🛡️",
    color: "#ef4444",
    time: "7 min read",
    content: `Crypto trading mein ek cheez hai jo beginners ignore karte hain aur experienced traders kabhi nahi bhoolte — Stop Loss. Yeh ek simple tool hai jo aapka paisa barbad hone se bacha sakta hai. Aaj hum samjhenge Stop Loss kya hai, kyu zaroori hai, aur kaise set karein.

## Stop Loss Kya Hota Hai?

Stop Loss ek automatic order hai jo aapke loss ko limit karta hai. Simple terms mein: Aap pehle se decide karte ho ki "agar price itni giregi, toh main automatically sell kar dunga."

**Example:** 
APT kharida ₹100 mein. Stop Loss set kiya ₹85 par.
Agar price ₹85 tak giregi — automatically sell ho jaayega.
Maximum loss: ₹15 per coin.

Bina Stop Loss ke: Price ₹100 se ₹20 ja sakti hai. Full loss!

## Stop Loss Kyu Zaroori Hai?

**1. Emotions remove karta hai**
Trading mein biggest enemy emotions hain. Jab price girne lagti hai, log sochte hain "abhi recover ho jaayegi." Yeh HOPE trading hai — dangerous.

Stop Loss emotion-free trading enable karta hai. Pehle decide karo, phir market dekho.

**2. Capital protect karta hai**
Ek bada loss recover karna bahut mushkil hai:
- 50% loss = 100% gain chahiye recover karne ke liye
- 25% loss = 33% gain chahiye recover karne ke liye

Small losses control mein rakho — zyada baar trade kar paoge.

**3. Peace of mind deta hai**
Stop Loss set karo aur raat ko chain se so jaao. Price monitor karne ki zaroorat nahi.

## Stop Loss Kahan Set Karein?

**Too tight:** ₹100 par kharida, ₹98 par stop loss — normal volatility mein trigger ho jaayega. Unnecessary loss.

**Too loose:** ₹100 par kharida, ₹50 par stop loss — bahut zyada risk accept kar raho ho.

**Sahi jagah:**
- Recent support level ke neeche
- ATR (Average True Range) ke basis par
- Usually 5-15% neeche entry price se

Yes You Pro automatically Stop Loss levels calculate karta hai — RSI, ATR, aur Support levels ke basis par.

## Different Types of Stop Loss

**Fixed Stop Loss:** Ek fixed price par set karo. Simple lekin always move nahi hota.

**Trailing Stop Loss:** Price ke saath move karta hai upar — downside protect karta hai, upside open rakhta hai.

Example trailing: APT ₹100 par kharida. 10% trailing SL. Price ₹150 gayee — SL automatically ₹135 ho gaya. Price ₹135 aaye — sell ho jaaye. ₹35 profit lock!

**Mental Stop Loss:** Exchange par order nahi lagaya, khud manually dekho. Beginners ke liye nahi recommend — emotions interfere karte hain.

## Common Stop Loss Mistakes

**Mistake 1: Stop Loss move karna neeche**
Price ₹85 pe aayi, log ₹75 par shift kar dete hain. Yeh stop loss ka purpose khatam karta hai.

**Mistake 2: Stop Loss nahi lagana**
"Main dhyan rakhunga" — yeh sochna dangerous hai. Hamesha exchange par proper order lagao.

**Mistake 3: Same SL sab coins par**
Har coin ki volatility alag hai. BTC ko 8% SL sahi hai, small alt coins ke liye 15-20% chahiye.

## Yes You Pro Ka Stop Loss Feature

Jab tum Position Tracker mein trade enter karte ho, AI automatically calculate karta hai:
- TP1 (Target 1) — pehla profit level
- TP2 (Target 2) — doosra profit level  
- TP3 (Target 3) — maximum target
- Stop Loss — maximum acceptable loss

Yeh levels RSI, ATR, Support/Resistance ke basis par calculate hote hain. Smart trading decisions ke liye use karo.

Remember: Professional traders ka rule hai — "Take care of your losses, profits will take care of themselves."`
  },
  {
    id: 5,
    title: "India Mein Crypto Tax Kaise Calculate Karein — 2024 Complete Guide",
    category: "Tax & Legal",
    emoji: "🧾",
    color: "#f59e0b",
    time: "9 min read",
    content: `2022 se India mein crypto par tax lagana start ho gaya. Bahut log confused hain — kitna tax dena hai? Kab dena hai? Losses set-off kar sakte hain? Aaj hum sab clearly explain karenge.

## India Mein Crypto Taxation — Basic Rules

**1 February 2022 ko Budget mein announce hua:**
- Crypto gains par 30% flat tax
- No deductions (sirf acquisition cost)
- 1% TDS on transactions above ₹10,000
- Losses set-off NAHI kar sakte (even crypto losses against crypto gains)

## Kaunse Transactions Taxable Hain?

**Taxable Events (tax lagega):**
- Crypto sell karna INR ke liye
- Ek crypto se doosri crypto mein swap
- Crypto se kuch kharidna
- Crypto mining se income
- Staking rewards

**Not Taxable (abhi tak):**
- Crypto kharidna (holding)
- Crypto ek wallet se doosre mein transfer
- Gifts received (receiving end)

## Tax Calculation Ka Formula

**Profit/Gain = Selling Price - Cost of Acquisition**

Example:
- Bitcoin kharida: ₹20,00,000
- Bitcoin becha: ₹30,00,000  
- Profit: ₹10,00,000
- Tax (30%): ₹3,00,000

**Important:** Trading fees cost of acquisition mein add nahi ho sakti (2022 ke baad se).

## TDS — Tax Deducted at Source

1% TDS exchange transactions par:
- WazirX, CoinDCX automatically deduct karte hain
- Yeh advance tax hai — final tax se adjust ho jaata hai
- Form 26AS mein reflect hota hai

## Short Term vs Long Term — Koi Distinction Nahi

India mein crypto ke liye short term/long term ka koi concept nahi hai (stocks jaisa). Chahe 1 din hold karo ya 10 saal — 30% flat tax hi lagega.

## Losses Ka Kya Hoga?

Yeh painful rule hai: Crypto losses ek crypto se doosri crypto mein ya other income se set-off NAHI kar sakte.

Example:
- Bitcoin mein ₹1 lakh profit
- Ethereum mein ₹50,000 loss
- Tax lagega puri ₹1 lakh par — loss set-off nahi hoga

## ITR Filing — Kahan Show Karein?

Crypto income ITR-2 ya ITR-3 mein show karni hai under "Income from Virtual Digital Assets (VDA)."

Schedule VDA specifically crypto ke liye add kiya gaya hai.

## Yes You Pro Ka Tax Calculator

Yes You Pro ka Tax Calculator use karke:
1. CSV file upload karo (exchange se download karo)
2. Tool automatically calculate karega
3. Taxable amount dikhega
4. Tax amount dikhega
5. Share/download kar sakte ho CA ke saath

Supported exchanges: 13+ major Indian aur international exchanges.

## Important Tips

**Record keeping:** Sab transactions ka record rakho — date, amount, price. Exchanges ki history 3-5 saal tak accessible hoti hai.

**Advance tax:** Agar annual crypto tax ₹10,000 se zyada hai, toh advance tax quarterly bharna padta hai. Penalty avoid karo.

**CA Consult Karo:** Crypto tax complex hai. Large amounts ke liye CA se consult karo jo crypto taxation mein experienced ho.

**Disclaimer:** Yeh information educational purpose ke liye hai. Tax laws change hoti rehti hain. Official advice ke liye CA ya tax professional se consult karein.`
  },
  {
    id: 6,
    title: "Bull Market vs Bear Market — Crypto Cycles Samjho",
    category: "Market Education",
    emoji: "🐂",
    color: "#10b981",
    time: "7 min read",
    content: `Crypto market ek cycle mein chalta hai — kabhi bahut upar, kabhi bahut neeche. In cycles ko samajhna investors ke liye bahut zaroori hai. Aaj hum Bull Market aur Bear Market ke baare mein detail mein samjhenge.

## Bull Market Kya Hota Hai?

Bull market wo period hota hai jab prices continuously upar jaati hain. Positive sentiment, high trading volume, new investors market mein aate hain.

**Bull Market ke signs:**
- Bitcoin new all-time highs bana raha ho
- Har jagah crypto ka charcha ho
- Media positive news dikh rahi ho
- Friends aur family invest karne ki baat karein
- FOMO (Fear of Missing Out) everywhere

**Historical Bull Markets:**
- 2017: Bitcoin ₹700 se ₹14 lakh tak
- 2020-21: Bitcoin ₹7 lakh se ₹50 lakh tak
- 2024: Bitcoin ne ₹60 lakh+ touch kiya

## Bear Market Kya Hota Hai?

Bear market wo period hota hai jab prices lamba time continuously girती hain. Negative sentiment, low volume, investors fearful.

**Bear Market ke signs:**
- Prices 80-90% neeche hain all-time highs se
- News negative — bans, regulations, hacks
- Volume bahut kam ho jaata hai
- Log crypto se baat karna band kar dete hain
- Despair aur hopelessness market mein

**Historical Bear Markets:**
- 2018: Bitcoin ₹14 lakh se ₹2.5 lakh tak
- 2022: Bitcoin ₹50 lakh se ₹12 lakh tak

## Crypto Market Cycle — 4 Phases

**Phase 1 — Accumulation:**
Smart money quietly khareed raha hota hai. Prices low, sentiment negative. Best time to buy lekin koi nahi kharidta fear ki wajah se.

**Phase 2 — Markup (Bull Market):**
Prices badhna shuru. More buyers aate hain. FOMO create hota hai. Media positive cover karta hai. Retail investors late enter karte hain.

**Phase 3 — Distribution:**
Smart money slowly sell kar raha hota hai. Prices still high dikhti hain. Whales exit kar rahe hote hain. Signs subtle hote hain.

**Phase 4 — Markdown (Bear Market):**
Prices tezi se girna shuru. Panic selling. Weak hands exit karte hain. Cycle reset hoti hai.

## Bitcoin Halving — Cycle Ka Engine

Har 4 saal mein Bitcoin Halving hota hai — jisme miners ko milne wale naye BTC half ho jaate hain. Historically har halving ke 12-18 mahine baad bull market peak aaya hai.

2024 mein halving hua — historically bull run expected ahead.

## Bear Market Mein Kya Karein?

**Do's:**
- DCA karo — regularly thoda thoda kharido
- Strong coins accumulate karo (BTC, ETH)
- Research karo upcoming projects par
- Skills improve karo — technical analysis seekho

**Don'ts:**
- Panic sell mat karo
- Leveraged trades avoid karo
- Random altcoins mat kharido
- Loans mat lo invest karne ke liye

## Yes You Pro Ka Fear & Greed Index

Yes You Pro pe Fear & Greed Index daily dikhta hai. Jab market Extreme Fear mein ho (0-25) — historically yeh buying opportunity raha hai. Jab Extreme Greed ho (75-100) — caution signal.

Market timing perfectly karna impossible hai. Lekin cycles samajhna aur sentiment indicators dekh kar informed decisions le sakte ho. Long-term perspective ke saath invest karo — market cycles tumhare favor mein kaam karenge.`
  }
];

export default function BlogPage() {
  const [selected, setSelected] = useState(null);

  if (selected !== null) {
    const article = ARTICLES[selected];
    return (
      <main style={{fontFamily:"'Inter',sans-serif",background:"#f0fdf8",minHeight:"100vh",
        color:"#0f172a",paddingBottom:40}}>
        <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",padding:"16px",
          borderBottom:"2px solid #10b981"}}>
          <button onClick={()=>setSelected(null)}
            style={{color:"#6ee7b7",fontSize:13,background:"none",border:"none",
              cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600,marginBottom:8,
              display:"flex",alignItems:"center",gap:6}}>
            ← Wapas Blog
          </button>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:10,background:article.color,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
              {article.emoji}
            </div>
            <div>
              <div style={{fontSize:11,color:"#6ee7b7",fontWeight:600}}>{article.category} · {article.time}</div>
            </div>
          </div>
          <h1 style={{fontSize:20,fontWeight:900,color:"#fff",marginTop:10,lineHeight:1.3}}>
            {article.title}
          </h1>
        </div>
        <div style={{padding:"20px 16px",maxWidth:680,margin:"0 auto"}}>
          <div style={{background:"#fff",borderRadius:16,padding:"20px",
            boxShadow:"0 4px 20px rgba(0,0,0,.06)"}}>
            {article.content.split("\n\n").map((para,i)=>{
              if(para.startsWith("## ")){
                return(
                  <h2 key={i} style={{fontSize:17,fontWeight:800,color:"#0f172a",
                    margin:"24px 0 10px",paddingBottom:6,
                    borderBottom:"2px solid #f0fdf8"}}>
                    {para.replace("## ","")}
                  </h2>
                );
              }
              if(para.startsWith("**") && para.endsWith("**")){
                return(
                  <p key={i} style={{fontSize:14,fontWeight:700,color:"#059669",
                    margin:"12px 0",lineHeight:1.7}}>
                    {para.replace(/\*\*/g,"")}
                  </p>
                );
              }
              if(para.startsWith("- ")||para.startsWith("1. ")){
                const items=para.split("\n");
                return(
                  <ul key={i} style={{margin:"10px 0",paddingLeft:20}}>
                    {items.map((item,j)=>(
                      <li key={j} style={{fontSize:14,color:"#374151",lineHeight:1.8,marginBottom:4}}>
                        {item.replace(/^- /,"").replace(/^\d+\. /,"")}
                      </li>
                    ))}
                  </ul>
                );
              }
              return(
                <p key={i} style={{fontSize:14,color:"#374151",lineHeight:1.9,margin:"12px 0"}}
                  dangerouslySetInnerHTML={{__html:para.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")}}>
                </p>
              );
            })}
          </div>
          <div style={{marginTop:16,background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)",
            borderRadius:14,padding:"14px",border:"1px solid #6ee7b7",textAlign:"center"}}>
            <div style={{fontWeight:700,fontSize:13,color:"#059669",marginBottom:6}}>
              🚀 YES YOU PRO pe Free AI Analysis karo!
            </div>
            <Link href="/" style={{display:"inline-block",background:"linear-gradient(135deg,#10b981,#059669)",
              color:"#fff",borderRadius:10,padding:"10px 24px",fontSize:13,fontWeight:700,
              textDecoration:"none"}}>
              yesyoupro.com → Free mein try karo
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{fontFamily:"'Inter',sans-serif",background:"#f0fdf8",minHeight:"100vh",
      color:"#0f172a",paddingBottom:40}}>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",padding:"20px 16px",
        borderBottom:"2px solid #10b981"}}>
        <Link href="/" style={{color:"#6ee7b7",fontSize:12,textDecoration:"none",fontWeight:600,
          display:"block",marginBottom:10}}>← Home</Link>
        <h1 style={{fontWeight:900,fontSize:26,color:"#fff",letterSpacing:-1,marginBottom:4}}>
          📚 Crypto Sikho Blog
        </h1>
        <p style={{fontSize:13,color:"#64748b"}}>
          Bitcoin, Trading, Tax, Investment — sab kuch Hindi mein
        </p>
      </div>

      <div style={{padding:"16px",maxWidth:680,margin:"0 auto"}}>

        {/* Intro */}
        <div style={{background:"#fff",borderRadius:16,padding:"18px",marginBottom:16,
          boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
          <h2 style={{fontSize:16,fontWeight:800,marginBottom:8,color:"#0f172a"}}>
            Welcome to YES YOU PRO Blog!
          </h2>
          <p style={{fontSize:13,color:"#475569",lineHeight:1.8}}>
            Yahan aapko milega cryptocurrency ke baare mein sab kuch — bilkul simple Hinglish mein.
            Beginner ho ya experienced trader, yahan har level ke liye helpful guides hain.
            Bitcoin kya hai, kaise trade karein, tax kaise bharen — sab kuch cover kiya gaya hai.
          </p>
        </div>

        {/* Articles */}
        {ARTICLES.map((art,i)=>(
          <div key={art.id} onClick={()=>setSelected(i)}
            style={{background:"#fff",borderRadius:16,padding:"16px",marginBottom:12,
              cursor:"pointer",boxShadow:"0 2px 12px rgba(0,0,0,.06)",
              border:"1px solid #e2e8f0",transition:"all .2s"}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(16,185,129,.15)"}
            onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.06)"}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{width:46,height:46,borderRadius:12,background:art.color,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:22,flexShrink:0}}>
                {art.emoji}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:9,background:`${art.color}22`,color:art.color,
                    borderRadius:20,padding:"2px 8px",fontWeight:700}}>
                    {art.category}
                  </span>
                  <span style={{fontSize:9,color:"#94a3b8",fontWeight:500}}>
                    ⏱️ {art.time}
                  </span>
                </div>
                <h3 style={{fontSize:14,fontWeight:800,color:"#0f172a",lineHeight:1.4,
                  marginBottom:6}}>
                  {art.title}
                </h3>
                <p style={{fontSize:12,color:"#64748b",lineHeight:1.6}}>
                  {art.content.substring(0,120)}...
                </p>
              </div>
            </div>
            <div style={{marginTop:10,textAlign:"right"}}>
              <span style={{fontSize:12,color:"#10b981",fontWeight:700}}>
                Poora padhein →
              </span>
            </div>
          </div>
        ))}

        <div style={{textAlign:"center",padding:"20px",background:"#fff",borderRadius:16,
          border:"1px solid #e2e8f0"}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:8}}>
            📊 Yeh articles helpful lage?
          </div>
          <p style={{fontSize:12,color:"#64748b",marginBottom:12,lineHeight:1.7}}>
            YES YOU PRO pe free mein AI-powered crypto analysis karo, signals dekho,
            tax calculate karo — sab ek jagah, bilkul free!
          </p>
          <Link href="/" style={{display:"inline-block",background:"linear-gradient(135deg,#10b981,#059669)",
            color:"#fff",borderRadius:10,padding:"12px 28px",fontSize:13,fontWeight:700,
            textDecoration:"none"}}>
            Free Analysis Karo →
          </Link>
        </div>
      </div>
    </main>
  );
}
