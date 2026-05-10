"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ── FULL COURSE DATA ───────────────────────────────────────────────────────────
const COURSE = [
  {
    id: "beginner",
    title: "🌱 Beginner",
    subtitle: "Crypto ki duniya mein welcome",
    color: "#10b981", bg: "#ecfdf5", border: "#6ee7b7",
    lessons: [
      {
        id:"b1", title:"Crypto Kya Hota Hai?",
        emoji:"🪙", time:"2 min",
        content:`**Desi Example se samjho:**\nMaan lo tumhara mohalla hai. Har ghar ke paas ek register hota hai jisme likhte hain "Ramesh ne Suresh ko ₹500 diye." Yeh register sirf 1 jagah nahi — **hazaaron jagah ek saath** hota hai.\n\nKoi ek banda iska malik nahi — yeh **sabka** register hai.\n\nBus yahi hai **Cryptocurrency + Blockchain!**\n\n**Simple definition:**\nCrypto = Digital paisa jo:\n✅ Online anywhere bhej sako\n✅ Koi bank rokne wala nahi\n✅ 24/7 available\n✅ Transparent\n\n**Real example:**\nBTC bhejo US se India — 10 minute mein, ₹5 fee — bank wire se 3 din aur ₹2000+ lagta.`,
        practice:`🎯 **Practice:**\nApne phone mein CoinDCX ya WazirX app download karo — account create karo (invest mat karo abhi). Bas dekho kaise dikhta hai!`,
        key: ["Crypto = digital currency", "Decentralized = koi owner nahi", "Fast + cheap = global transfer"],
      },
      {
        id:"b2", title:"Bitcoin Ki Kahani",
        emoji:"₿", time:"3 min",
        content:`**2008 — Jab sab toot gaya:**\nAmerica mein bade banks ne log logon ka paisa dooba diya. Ek mysterious person **"Satoshi Nakamoto"** ne socha — "Bank ke bina digital paisa bana sakte hain kya?"\n\n**2009 mein Bitcoin aaya.**\n\n**Bitcoin kya hai?**\nImagine karo — **digital sona** 🥇\n- Total sirf 21 million BTC honge kabhi bhi\n- Ek bhi zyada nahi banega\n- Jaise sona — rare = valuable\n\n**Cricket analogy:**\nManch 100 tickets hain ek game ke liye.\nDheere dheere log buy karte hain.\nJab sirf 10 tickets bachte hain — price badh jaata!\n\nYahi Bitcoin ke saath hota hai.\n\n**Ek Bitcoin ki journey:**\n2010: $0.001\n2017: $20,000\n2021: $69,000\n2024: $100,000+`,
        practice:`🎯 **Practice:**\nyesyoupro.com pe jao → BTC analyze karo → RSI aur price dekho. Note karo aaj ka price.`,
        key: ["21 million BTC total — fixed supply", "Satoshi Nakamoto = mysterious creator", "Jitna rare = utna valuable"],
      },
      {
        id:"b3", title:"Blockchain Samjho",
        emoji:"🔗", time:"3 min",
        content:`**Desi Dukan ka example:**\nEk dukan mein bahi-khata (ledger) hota hai.\nHar transaction likhte hain.\n\nBlockchain = Digital bahi-khata lekin:\n✅ Lakhon copies hain (sabke paas)\n✅ Koi erase nahi kar sakta\n✅ Sab dekh sakte hain\n\n**Block kya hai?**\nHar "page" ek block hai.\nHar block mein ~2000 transactions hain.\nSabke blocks ek chain mein jude hain.\n\n**Kyun hack nahi ho sakta?**\nEk block badalne ke liye poori chain badalni padegi.\nAur woh ek saath lakhon computers pe hoti hai.\n\n**Train ka example:**\n🚂 Engine (Block 1) → Bogie (Block 2) → Bogie (Block 3)\nEk bogie nahi hata sakte bina poori train tod ke.\n\nYahi blockchain ki strength hai!`,
        practice:`🎯 **Practice:**\nhttps://blockchain.com/explorer kholo — live BTC transactions dekho. Real mein ho raha hai!`,
        key: ["Block = page of transactions", "Chain = sab pages linked", "Immutable = koi change nahi kar sakta"],
      },
      {
        id:"b4", title:"Wallet Kya Hota Hai?",
        emoji:"👛", time:"2 min",
        content:`**Galat samajhna:**\nWallet mein crypto NAHI rehta!\n\n**Sahi samajhna:**\nWallet ek **chabi** ki tarah hai.\nCrypto blockchain pe rehta hai.\nChabi = aapka access.\n\n**Types of Wallets:**\n\n🏦 **Exchange Wallet** (Beginner)\nCoinDCX, WazirX mein account = wallet\nPro: Easy\nCon: Exchange hack ho sakta\n\n📱 **Software Wallet** (Intermediate)\nMetaMask, Trust Wallet app\nPro: Aapke phone mein\nCon: Phone kho gaya = gone\n\n🔐 **Hardware Wallet** (Advanced)\nLedger, Trezor (physical device)\nPro: Safest\nCon: ₹10,000+ cost\n\n**Rule of thumb:**\n₹10,000 se kam = exchange theek hai\n₹10,000+ = software wallet\n₹1 lakh+ = hardware wallet`,
        practice:`🎯 **Practice:**\nTrust Wallet download karo — seed phrase likhke safe jagah rakho. Kisi ko batana mat!`,
        key: ["Wallet = key, not storage", "Exchange wallet = easiest but risky", "Never share seed phrase"],
      },
      {
        id:"b5", title:"Exchange Kaise Use Karein?",
        emoji:"🏪", time:"3 min",
        content:`**Exchange = dukaan jahan crypto kharidein/bechein**\n\n**India ke top exchanges:**\n🔵 CoinDCX — sabse popular\n🟠 WazirX — easy UI\n🟣 CoinSwitch — beginners ke liye\n🔴 ZebPay — oldest\n\n**Account banana:**\n1. App download karo\n2. Email + phone verify karo\n3. KYC karo (Aadhaar + PAN)\n4. Bank account link karo\n5. UPI se paisa daalo\n6. Crypto kharedo!\n\n**KYC kyun zaroori hai?**\nIndia mein law hai — ₹50,000+ ke liye mandatory.\nTumhara paisa safe rehta hai.\n\n**Fees samjho:**\nTrading fee: ~0.1-0.5%\nWithdrawal fee: Fixed amount\nTDS: 1% (government le jaati hai)`,
        practice:`🎯 **Practice:**\nCoinDCX pe ₹100 daalo — sirf practice ke liye. USDT ya BTC kharedo. Process samjho.`,
        key: ["KYC is mandatory in India", "Compare fees before trading", "Start small — practice first"],
      },
      {
        id:"b6", title:"Buy/Sell Kaise Karein?",
        emoji:"💱", time:"3 min",
        content:`**Market Order vs Limit Order:**\n\n🔴 **Market Order:**\nAbhi ka price pe instantly buy/sell\n"Aaj ka bhav do — turant chahiye"\n\n🟢 **Limit Order:**\nTumhara price set karo\n"₹90,000 pe BTC aaye tabhi khareedunga"\nAgar price aata hai → auto buy!\n\n**Spot vs Futures:**\n\n**Spot Trading:**\nAsli coin khareedna\n"1 BTC kharida — mere paas hai"\nBeginner ke liye\n\n**Futures Trading:**\nContract pe bet karna\n"BTC $1 lakh jaayega" — leverage se\nAdvanced — pehle mat karo!\n\n**Practical steps (CoinDCX):**\n1. Markets → BTC/USDT\n2. Buy → Amount daalo\n3. Market order → Confirm\n4. Portfolio mein dikhega!\n\n**Golden rule:**\nSirf woh lagao jo lose kar sako 🙏`,
        practice:`🎯 **Practice:**\nyesyoupro.com pe BTC search karo → AI signal dekho → Decide karo buy karna chahiye ya nahi.`,
        key: ["Market order = instant price", "Limit order = your price", "Never invest more than you can lose"],
      },
      {
        id:"b7", title:"Safe Kaise Rahein?",
        emoji:"🛡️", time:"3 min",
        content:`**Top 5 Crypto Scams India mein:**\n\n❌ **1. Pump & Dump Groups**\n"Aaj raat 8 baje yeh coin 10x hoga"\nYeh scam hai. Pehle organizers buy karte hain, phir tumhe sell karte hain.\n\n❌ **2. Fake Apps**\nGoogle pe "CoinDCX APK download" mat karo\nSirf official store se lo\n\n❌ **3. Too Good to Be True Returns**\n"10% daily returns guaranteed"\nImposible hai. Scam 100%.\n\n❌ **4. Seed Phrase Maangna**\nKoi bhi — support, admin, friend — KABHIT nahi maangega\nDiya = account gone.\n\n❌ **5. Celebrity Endorsements**\n"Amitabh Bachchan invest kar rahe hain"\nFake news. Verify karo pehle.\n\n**Safe rehne ke rules:**\n✅ 2FA hamesha on\n✅ Seed phrase offline rakho\n✅ Random links pe click mat karo\n✅ FOMO mein trade mat karo`,
        practice:`🎯 **Practice:**\nApne exchange account pe 2FA (Google Authenticator) enable karo. 2 min ka kaam — life ka protection.`,
        key: ["Never share seed phrase", "2FA always on", "FOMO = Scammer ka weapon"],
      },
      {
        id:"b8", title:"Beginner Mistakes",
        emoji:"⚠️", time:"3 min",
        content:`**Yeh mistakes sabne ki hain:**\n\n❌ **1. FOMO mein pump ke baad buy karna**\n"BTC 20% badh gaya — ab bhi badhega!"\nActuality mein correction aata hai.\n\n❌ **2. Stop Loss nahi lagana**\n"Thodi der mein wapas aayega"\nWapas nahi aaya — aur -50% ho gaya.\n\n❌ **3. Poora paisa ek coin mein**\n"Sirf DOGE rakhunga — 1000x hoga"\nDiversify karo: BTC 40%, ETH 30%, Alts 30%\n\n❌ **4. Trading charts nahi samjhna**\nBina RSI/MA samjhe trade = Gambling\n\n❌ **5. Tax nahi bharana**\n30% tax + 1% TDS India mein mandatory\nReturn file nahi kiya = notice aa sakta hai\n\n❌ **6. Roj price check karke panic karna**\nCrypto volatile hai. Weekly check karo.\n\n**Golden rules yaad karo:**\n🟢 DYOR — Do Your Own Research\n🟢 Never invest more than you afford to lose\n🟢 Start small, learn first`,
        practice:`🎯 **Practice:**\nyesyoupro.com pe apna FOMO Score check karo — Pichli koi trade yaad karo aur analyze karo!`,
        key: ["FOMO is enemy #1", "Stop loss is your friend", "Tax filing is mandatory in India"],
      },
    ]
  },
  {
    id: "intermediate",
    title: "📊 Intermediate",
    subtitle: "Charts aur indicators seekho",
    color: "#2563eb", bg: "#eff6ff", border: "#93c5fd",
    lessons: [
      {
        id:"i1", title:"Chart Padna Seekho",
        emoji:"📈", time:"4 min",
        content:`**Candlestick Chart — Desi Explanation:**\nHar candle ek period ka summary hai (1 min / 1 hour / 1 day)\n\n**Ek candle mein 4 cheezein:**\n🟢 GREEN candle = price badhi (bullish)\n🔴 RED candle = price giri (bearish)\n\n**Candle ke parts:**\n- Open: Kaha se shuru hua\n- Close: Kahan khatam hua\n- High: Sabse upar gaya\n- Low: Sabse neeche gaya\n- Wick/Shadow: Extreme movements\n\n**Muhavara:**\nEk candle = ek cricketer ki inning ka scorecard\nOpen = pehla run, Close = last run\nHigh = century, Low = duck\n\n**Timeframes:**\n1m = Scalpers ke liye (risky)\n1H = Day traders\n4H = Swing traders ← Best for beginners\n1D = Long term holders`,
        practice:`🎯 **Practice:**\nTradingView.com kholo → BTC/USDT → 1D chart → 10 candles analyze karo. Green/red pattern note karo.`,
        key: ["Green = bullish, Red = bearish", "4H chart best for beginners", "Wick shows volatility"],
      },
      {
        id:"i2", title:"RSI Samjho",
        emoji:"📊", time:"3 min",
        content:`**RSI = Relative Strength Index**\n0 se 100 ka meter\n\n**Desi Autowala Example:**\nAutoricshaw driver 8 ghante chala — thak gaya (oversold)\nThoda rest karega phir wapas chalega (bounce)\n\nYahi market ke saath hota hai!\n\n**RSI values:**\n🔴 RSI > 70 = OVERBOUGHT\n"Bahut zyada badh gaya — correction aa sakta hai"\nYaha NEW entry mat lo\n\n🟢 RSI < 30 = OVERSOLD\n"Bahut gir gaya — bounce possible"\nYaha BUY opportunity dekho\n\n🟡 RSI 30-70 = NEUTRAL\n"Normal zone"\n\n**Best use:**\nRSI < 35 + Price near support = Strong buy signal\nRSI > 75 + Price near resistance = Sell signal\n\n**Yaad rakho:**\nRSI 25 pe bhi aur gir sakta hai!\nSirf ek indicator pe mat chalao.`,
        practice:`🎯 **Practice:**\nyesyoupro.com pe ETH analyze karo → RSI note karo → 30 se neeche hai kya? → Signal check karo.`,
        key: ["RSI < 30 = oversold (buy zone)", "RSI > 70 = overbought (sell zone)", "Combine with other indicators"],
      },
      {
        id:"i3", title:"Support & Resistance",
        emoji:"🏋️", time:"4 min",
        content:`**Desi Building Example:**\nMaan lo ek building hai. Har floor pe ek spring hai.\n- Spring oopar dhakelta hai = SUPPORT\n- Ceiling neeche press karti hai = RESISTANCE\n\n**Support:**\nWoh price level jaha se market baar baar bounce karti hai\n"BTC $90,000 pe 3 baar aaya aur bounce kiya"\n= $90,000 strong support hai\n\n**Resistance:**\nWoh level jahan market baar baar rok jaati hai\n"BTC $100,000 ke upar nahi jaata"\n= $100,000 strong resistance hai\n\n**Breakout:**\nJab resistance toot jaaye = Bade move ka signal!\nJab support toot jaaye = Aur girne ka signal!\n\n**Kaise draw karein:**\n1. Chart pe zooom out karo\n2. 3+ times bounce kiya = valid level\n3. Line draw karo\n\n**Trading rule:**\nSupport ke paas BUY\nResistance ke paas SELL ya TAKE PROFIT`,
        practice:`🎯 **Practice:**\nBTC 1D chart pe support aur resistance draw karo. Minimum 3 touch points dhundho.`,
        key: ["Support = floor (price bounces up)", "Resistance = ceiling (price bounces down)", "Breakout = strong move coming"],
      },
      {
        id:"i4", title:"Moving Averages",
        emoji:"〰️", time:"3 min",
        content:`**MA = Average price line**\n\n**Rickshaw analogy:**\nHar roz ek rickshaw kitna chala average mein?\nMA50 = Last 50 din ka average\nMA200 = Last 200 din ka average\n\n**MA50 (Blue line):**\nShort-term trend\n"Last 50 din kya hua"\n\n**MA200 (Red line):**\nLong-term trend\n"Last 200 din kya hua"\n\n**Golden Cross:**\n🟢 MA50 crosses ABOVE MA200\n= Bullish signal! Bull run shuru ho sakta hai\n2020 aur 2023 mein BTC ka golden cross = massive rally\n\n**Death Cross:**\n🔴 MA50 crosses BELOW MA200\n= Bearish signal! Bear market aa sakta hai\n\n**Simple rules:**\n✅ Price > MA50 + MA200 = Uptrend (buy zone)\n❌ Price < MA50 + MA200 = Downtrend (careful)\n\n**Best combo:**\nRSI oversold + Price above MA200 = Strong BUY signal`,
        practice:`🎯 **Practice:**\nyesyoupro.com pe koi coin analyze karo → MA50 aur MA200 check karo → Uptrend hai ya downtrend?`,
        key: ["MA50 = short term trend", "MA200 = long term trend", "Golden cross = bullish signal"],
      },
      {
        id:"i5", title:"MACD Samjho",
        emoji:"📉", time:"3 min",
        content:`**MACD = Moving Average Convergence Divergence**\n(Bada naam, simple concept)\n\n**Desi Chai analogy:**\nDo chai wale hain — ek fast (EMA 12) ek slow (EMA 26)\nJab fast wala slow wale se aage nikal jaaye = Kuch hone wala hai!\n\n**MACD = Fast line - Slow line**\n\n**3 parts:**\n1. MACD Line (blue)\n2. Signal Line (orange) — 9 day EMA of MACD\n3. Histogram (bars) — difference\n\n**Signals:**\n🟢 MACD Line crosses ABOVE Signal Line = BUY\n🔴 MACD Line crosses BELOW Signal Line = SELL\n\n**Extra strong signal:**\nCross happens BELOW zero line = Even stronger buy!\nCross happens ABOVE zero line = Even stronger sell!\n\n**Weakness:**\nMACD lag karta hai (indicator is late)\nSirf trend confirmation ke liye use karo\nNot for exact entry timing`,
        practice:`🎯 **Practice:**\nTradingView pe BTC daily chart → Add indicator → MACD → Last crossover kahan hua note karo.`,
        key: ["MACD crossover = trend change signal", "Below zero = stronger buy signal", "MACD is a lagging indicator"],
      },
      {
        id:"i6", title:"Volume Analysis",
        emoji:"📊", time:"3 min",
        content:`**Volume = Kitne log trade kar rahe hain**\n\n**Desi Market analogy:**\nSabzi mandi mein jab bheed hoti hai = Volume high\nJab sab ghar chale jaate hain = Volume low\n\nHigh volume = Real move\nLow volume = Fake move (trap!)\n\n**Rules:**\n\n✅ **Price UP + Volume UP = Real bullrun**\n"Genuine buying — trust karo"\n\n⚠️ **Price UP + Volume DOWN = Suspicious**\n"Koi push kar raha hai — careful"\n\n✅ **Price DOWN + Volume HIGH = Panic selling**\n"Opportunity! Baaki log bech rahe hain"\n\n❌ **Price DOWN + Volume LOW = Weak selling**\n"Sideways market — wait karo"\n\n**Whale detection:**\nSudden volume spike + price move\n= Whale entered the market!\n\nyesyoupro.com ka Whale Alert tab yahi track karta hai!`,
        practice:`🎯 **Practice:**\nyesyoupro.com → Whale Alert tab → Volume spikes dekho → Kaunse coins mein unusual volume hai?`,
        key: ["High volume = real move", "Low volume up = suspicious", "Volume spike = whale activity"],
      },
      {
        id:"i7", title:"Risk Management",
        emoji:"🛡️", time:"4 min",
        content:`**Sabse important lesson — yeh miss mat karo!**\n\n**1% Rule:**\nEk trade mein apne total portfolio ka max 1-2% risk lo\n₹1,00,000 portfolio → max ₹1,000-₹2,000 risk per trade\n\n**Position Sizing:**\nMaan lo: BTC $94,000 → Stop loss $90,000 (4.3% neeche)\nAgar ₹1,000 lose karna hai max:\nPosition size = ₹1,000 / 4.3% = ₹23,256 buy karo\n\n**3 Zones concept:**\n\n🟢 **Entry Zone:** RSI low + Support pe\n🔴 **Stop Loss:** Support ke 2-3% neeche\n🎯 **Take Profit:** Risk-Reward 1:2 minimum\n\n**Example:**\nBTC entry: $94,000\nStop Loss: $88,000 (6% neeche)\nTake Profit: $106,000 (12% upar)\nR:R = 1:2 ✅\n\n**Golden rules:**\n✅ Har trade mein SL lagao\n✅ R:R minimum 1.5:1\n✅ Portfolio 30% se zyada risk nahi\n✅ Emotional ho ke trade mat karo`,
        practice:`🎯 **Practice:**\nyesyoupro.com → Koi coin analyze karo → Signal dekhke entry, SL, TP calculate karo manually.`,
        key: ["1-2% max risk per trade", "Always set stop loss", "Minimum 1.5:1 risk reward"],
      },
      {
        id:"i8", title:"Portfolio Banana",
        emoji:"💼", time:"3 min",
        content:`**Diversification — Anda ek basket mein nahi!**\n\n**Beginner Portfolio (₹10,000):**\nBTC: 40% = ₹4,000 (safest)\nETH: 30% = ₹3,000 (second safest)\nAlts: 20% = ₹2,000 (SOL/BNB/etc)\nCash (USDT): 10% = ₹1,000 (for dips)\n\n**Risk levels:**\n🟢 LOW RISK: BTC, ETH, BNB\n🟡 MEDIUM RISK: SOL, ADA, LINK\n🔴 HIGH RISK: Small caps, new coins\n⚫ VERY HIGH: Meme coins (PEPE, DOGE)\n\n**DCA Strategy:**\nHar mahine fixed amount invest karo\n₹2,000/month → ups and downs average out\n\nKisi ne 2020-2024 mein ₹2,000/month BTC mein lagaye\n= ₹96,000 invest → Today ~₹6-8 lakh!\n\n**Rebalancing:**\nHar 3 mahine check karo:\nBTC 40% se badh ke 60% ho gaya?\nThoda sell karo → Others mein daalo`,
        practice:`🎯 **Practice:**\nyesyoupro.com → Features → Portfolio Tracker → Apna current portfolio add karo, live P&L dekho!`,
        key: ["Never put all eggs in one basket", "DCA removes timing risk", "Rebalance every 3 months"],
      },
    ]
  },
  {
    id: "advanced",
    title: "🚀 Advanced",
    subtitle: "Pro strategies aur DeFi",
    color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd",
    lessons: [
      {
        id:"a1", title:"Futures Trading Samjho",
        emoji:"⚡", time:"5 min",
        content:`**WARNING: Advanced — Nuksaan ka risk bahut zyada hai!**\n\n**Spot vs Futures:**\nSpot = Asli coin khareedte ho\nFutures = Contract — future price pe bet\n\n**Leverage kya hai?**\n10x Leverage = ₹1,000 se ₹10,000 ka trade\n\nBTC 1% upar gaya → Tumhara 10% profit!\nBTC 1% neeche gaya → Tumhara 10% loss!\nBTC 10% neeche → LIQUIDATED (sab gone)\n\n**Liquidation:**\nJab loss itna bada ho ke position force-close ho jaati hai\n₹1,000 gaya — poora!\n\n**Long vs Short:**\n🟢 Long = Bullish bet (badhega sochke)\n🔴 Short = Bearish bet (girega sochke)\n\n**Hamari advice:**\nKabhi bhi 5x se zyada leverage mat lo\nFutures mein woh paisa daalo jo lose karne ke liye ready ho\nPehle paper trading (virtual) karo!\n\nyesyoupro.com ka Arena exactly yahi hai — practice karo pehle!`,
        practice:`🎯 **Practice:**\nyesyoupro.com → Trading Arena → Virtual ₹1 lakh se futures trading practice karo. Real paisa mat lagao abhi!`,
        key: ["Leverage amplifies both profits and losses", "Liquidation = total loss", "Always practice with virtual money first"],
      },
      {
        id:"a2", title:"DeFi Kya Hai?",
        emoji:"🏦", time:"4 min",
        content:`**DeFi = Decentralized Finance**\nBank ke bina financial services!\n\n**Traditional Bank:**\n- Account kholne ke liye documents\n- 9-5 timing\n- Fees bharo\n- RBI rules\n\n**DeFi:**\n- Koi documents nahi (wallet se connect karo)\n- 24/7/365\n- Automatic (smart contracts)\n- Koi middleman nahi\n\n**DeFi products:**\n\n🔄 **DEX (Decentralized Exchange):**\nUniswap, PancakeSwap\nBina registration ke coins swap karo\n\n💰 **Yield Farming:**\nApne crypto "bank" mein daalo\nInterest kamao (5-20% APY bhi possible)\n\n🏦 **Lending/Borrowing:**\nAave, Compound\nCrypto collateral pe loan lo\nYa apna crypto deploy karo — interest lo\n\n⚠️ **Risks:**\nSmart contract bugs\nRug pulls (founders bhaag jaate hain)\nImpermanent loss\nHigh gas fees (Ethereum pe)`,
        practice:`🎯 **Practice:**\nMetaMask install karo → Ethereum testnet se connect karo → Uniswap pe fake tokens swap karo (no real money).`,
        key: ["DeFi = bank without bank", "Smart contracts automate everything", "High rewards = high risks"],
      },
      {
        id:"a3", title:"Market Cycles",
        emoji:"🔄", time:"4 min",
        content:`**Crypto mein 4 seasons hote hain:**\n\n**☀️ Accumulation (Spring):**\nMarket bottom ke paas\nSmart money quietly buy kar raha hai\nNews negative, log dar rahe hain\n\n**📈 Bull Market (Summer):**\nPrices badh rahi hain\nMain stream coverage\nRetail investors FOMO mein aa rahe hain\nATH (All-time High) break hote hain\n\n**🍂 Distribution (Autumn):**\nSmart money bech raha hai\nNews positive, YouTube pe predictions\nDumb money peak pe buy kar rahi hai\n\n**❄️ Bear Market (Winter):**\nPrices gir rahi hain (-70 to -90%)\n"Crypto dead hai" news\nSmart money accumulate kar raha hai\n\n**Bitcoin Halving cycle:**\nHar 4 saal BTC mining reward half hota hai\n2020 Halving → 2021 Bull run\n2024 Halving → 2025 expected Bull run\n\n**Buy rule:**\nFear mein buy karo\nGreed mein sell karo`,
        practice:`🎯 **Practice:**\nyesyoupro.com → Fear & Greed Index dekho → Abhi market kahan hai cycle mein?`,
        key: ["4 phases: Accumulation, Bull, Distribution, Bear", "Halving = every 4 years", "Buy fear, sell greed"],
      },
      {
        id:"a4", title:"India Mein Crypto Tax",
        emoji:"🧾", time:"3 min",
        content:`**India ka Crypto Tax — Samajh lo nahi toh notice aa sakta hai!**\n\n**30% Flat Tax:**\nHar crypto profit pe 30% tax\nKoi deduction nahi\nLoss set-off nahi kar sakte (other income se)\n\n**1% TDS:**\nJab bhi crypto sell/trade karo\n1% apne aap deduct hogi exchange se\nYeh tax ADVANCE hai — return mein adjust hogi\n\n**ITR Filing:**\nSchedule VDA mein report karo\nHar transaction declare karo\nDeadline: July 31 (har saal)\n\n**Example:**\nBTC ₹50 lakh mein kharida\nBTC ₹80 lakh mein becha\nProfit: ₹30 lakh\nTax: ₹30 lakh × 30% = ₹9 lakh\nTDS paid: ₹80,000 (1% of ₹80L)\nBalance tax: ₹8.2 lakh\n\n**Tools:**\nyesyoupro.com → Features → Tax Card\nCSV upload karo → Instant tax calculation!`,
        practice:`🎯 **Practice:**\nyesyoupro.com → Features → Tax Calc tab → Ek sample trade calculate karo.`,
        key: ["30% flat tax on profits", "1% TDS on every sell", "File ITR Schedule VDA"],
      },
      {
        id:"a5", title:"Pro Trading Strategies",
        emoji:"🎯", time:"5 min",
        content:`**Top 3 Strategies jo actually kaam karti hain:**\n\n**1. Swing Trading (Recommended):**\nBuy oversold coins\n2-14 din hold karo\nSupport/Resistance pe trade karo\n\nBest timeframe: 4H + 1D\nBest indicators: RSI + MACD + Volume\nAvg trade time: 3-7 days\n\n**2. DCA (Dollar Cost Averaging):**\nHar mahine fixed amount invest karo\nKabhi perfect timing ki zaroorat nahi\nLong term ke liye best\n\n**3. Breakout Trading:**\nJab price resistance tod ke bahar jaaye\nVolume confirm kare\nEntry: Breakout ke turant baad\nSL: Below breakout level\n\n**Kya avoid karein:**\n❌ Scalping (without experience)\n❌ 10x+ leverage\n❌ Trading on emotions\n❌ Following telegram signals blindly\n\n**The ultimate strategy:**\n70% BTC + ETH (long term)\n20% Swing trading (active)\n10% High risk plays\n\nYahi most successful Indian traders karte hain!`,
        practice:`🎯 **Practice:**\nyesyoupro.com → Smart Signal Finder → Jo coins aaye unka full analysis dekho — entry, SL, TP compare karo.`,
        key: ["Swing trading best for beginners", "DCA removes emotion from investing", "70-20-10 portfolio rule"],
      },
    ]
  }
];

export default function SikhoPage() {
  const [progress, setProgress] = useState({});
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeModule, setActiveModule] = useState("beginner");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("yyp_sikho_progress") || "{}");
      setProgress(saved);
    } catch(_) {}
  }, []);

  const markDone = (lessonId) => {
    const updated = { ...progress, [lessonId]: true };
    setProgress(updated);
    try { localStorage.setItem("yyp_sikho_progress", JSON.stringify(updated)); } catch(_) {}
  };

  const totalLessons = COURSE.reduce((s,m)=>s+m.lessons.length, 0);
  const doneLessons  = Object.keys(progress).filter(k=>progress[k]).length;
  const pct = Math.round((doneLessons/totalLessons)*100);

  const currentModule = COURSE.find(m=>m.id===activeModule);

  const formatContent = (text) => {
    return text.split("\n").map((line,i) => {
      if (line.startsWith("**") && line.endsWith("**") && !line.slice(2,-2).includes("**")) {
        return <div key={i} style={{fontWeight:800,fontSize:14,color:"#0f172a",marginTop:12,marginBottom:4}}>{line.slice(2,-2)}</div>;
      }
      if (line.startsWith("✅")||line.startsWith("❌")||line.startsWith("🟢")||line.startsWith("🔴")||line.startsWith("🟡")||line.startsWith("⚠️")||line.startsWith("🎯")||line.startsWith("💰")) {
        return <div key={i} style={{fontSize:13,color:"#475569",lineHeight:1.7,paddingLeft:4}}>{line}</div>;
      }
      if (line.trim()==="") return <div key={i} style={{height:8}}/>;
      return <div key={i} style={{fontSize:13,color:"#475569",lineHeight:1.7}}>{line.replace(/\*\*(.*?)\*\*/g,"$1")}</div>;
    });
  };

  return (
    <main style={{fontFamily:"'Inter',sans-serif",background:"#f0fdf8",minHeight:"100vh",paddingBottom:40}}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fadein{animation:fadein .3s ease-out}
        .mono{font-family:'JetBrains Mono',monospace}
        .lesson:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08)!important}
        .lesson{transition:all .2s ease}
      `}</style>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",padding:"16px",paddingBottom:24}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <Link href="/" style={{color:"#6ee7b7",fontSize:12,textDecoration:"none",fontWeight:600}}>← Home</Link>
          <Link href="/market" style={{color:"#6ee7b7",fontSize:12,textDecoration:"none",fontWeight:600}}>📊 Market →</Link>
        </div>
        <div style={{fontSize:10,color:"#6ee7b7",fontWeight:700,letterSpacing:2,marginBottom:6}}>YES YOU PRO</div>
        <h1 style={{fontSize:26,fontWeight:900,color:"white",letterSpacing:-1,marginBottom:4}}>📚 Crypto Sikho</h1>
        <p style={{fontSize:12,color:"#64748b",marginBottom:16}}>Beginner se Advanced — Desi language mein free course</p>

        {/* Progress bar */}
        <div style={{background:"rgba(255,255,255,.08)",borderRadius:14,padding:"12px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:12,color:"white",fontWeight:700}}>{doneLessons}/{totalLessons} Lessons Complete</span>
            <span style={{fontSize:12,color:"#10b981",fontWeight:800}}>{pct}%</span>
          </div>
          <div style={{background:"rgba(255,255,255,.1)",borderRadius:100,height:8,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:100,background:"linear-gradient(90deg,#10b981,#34d399)",
              width:`${pct}%`,transition:"width 0.5s ease"}}/>
          </div>
          <div style={{fontSize:10,color:"#64748b",marginTop:6}}>
            {pct===0?"Shuru karo!":pct<33?"Accha shuru!":pct<66?"Halfway there!":pct<100?"Almost done!":"🏆 Course Complete!"}
          </div>
        </div>
      </div>

      {/* AD — BELOW HEADER */}
      <div style={{margin:"0 16px 12px",borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px"}}>
        <div style={{fontSize:9,color:"#94a3b8",marginBottom:2,letterSpacing:1}}>ADVERTISEMENT</div>
        <ins className="adsbygoogle"
          style={{display:"block"}}
          data-ad-client="ca-pub-9884021055437527"
          data-ad-slot="AUTO"
          data-ad-format="auto"
          data-full-width-responsive="true"/>
        <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
      </div>

      {/* Lesson Detail View */}
      {activeLesson ? (
        <div className="fadein" style={{padding:"16px"}}>
          <button onClick={()=>setActiveLesson(null)}
            style={{background:"none",border:"none",color:"#10b981",fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:16,display:"flex",alignItems:"center",gap:6,padding:0,fontFamily:"'Inter',sans-serif"}}>
            ← Wapas Jaao
          </button>

          <div style={{background:"#fff",borderRadius:20,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,.06)",marginBottom:14}}>
            {/* Lesson header */}
            <div style={{background:`linear-gradient(135deg,${COURSE.find(m=>m.lessons.find(l=>l.id===activeLesson.id))?.color||"#10b981"}22,transparent)`,
              padding:"20px",borderBottom:"1px solid #f1f5f9"}}>
              <div style={{fontSize:36,marginBottom:8}}>{activeLesson.emoji}</div>
              <h2 style={{fontSize:20,fontWeight:900,color:"#0f172a",marginBottom:4}}>{activeLesson.title}</h2>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:11,color:"#94a3b8"}}>⏱️ {activeLesson.time}</span>
                {progress[activeLesson.id] && (
                  <span style={{background:"#ecfdf5",border:"1px solid #6ee7b7",borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:700,color:"#059669"}}>✅ Done!</span>
                )}
              </div>
            </div>

            {/* Content */}
            <div style={{padding:"20px"}}>
              {formatContent(activeLesson.content)}
            </div>

            {/* Practice */}
            {activeLesson.practice && (
              <div style={{margin:"0 20px 16px",background:"linear-gradient(135deg,#eff6ff,#dbeafe)",border:"1px solid #93c5fd",borderRadius:14,padding:"14px"}}>
                {formatContent(activeLesson.practice)}
              </div>
            )}

            {/* Key Points */}
            {activeLesson.key && (
              <div style={{margin:"0 20px 20px",background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)",border:"1px solid #6ee7b7",borderRadius:14,padding:"14px"}}>
                <div style={{fontWeight:700,fontSize:12,color:"#059669",marginBottom:8}}>🎯 Key Takeaways</div>
                {activeLesson.key.map((k,i)=>(
                  <div key={i} style={{fontSize:12,color:"#065f46",marginBottom:4,paddingLeft:4}}>✓ {k}</div>
                ))}
              </div>
            )}

            {/* AD in lesson */}
            <div style={{margin:"0 20px 14px",borderRadius:12,overflow:"hidden",textAlign:"center",background:"#f8fafc",border:"1px solid #e2e8f0",padding:"4px"}}>
              <div style={{fontSize:9,color:"#94a3b8",marginBottom:2,letterSpacing:1}}>ADVERTISEMENT</div>
              <ins className="adsbygoogle"
                style={{display:"block"}}
                data-ad-client="ca-pub-9884021055437527"
                data-ad-slot="AUTO"
                data-ad-format="auto"
                data-full-width-responsive="true"/>
              <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
            </div>

            {/* Mark done button */}
            <div style={{padding:"0 20px 20px"}}>
              {progress[activeLesson.id] ? (
                <div style={{width:"100%",background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:14,padding:"13px",textAlign:"center",fontWeight:800,fontSize:14,color:"#fff"}}>
                  ✅ Lesson Complete!
                </div>
              ) : (
                <button onClick={()=>markDone(activeLesson.id)}
                  style={{width:"100%",background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",border:"none",borderRadius:14,padding:"13px",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"'Inter',sans-serif",boxShadow:"0 4px 14px rgba(16,185,129,.4)"}}>
                  ✅ Done! Next Lesson →
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{padding:"16px"}}>
          {/* Module tabs */}
          <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
            {COURSE.map(m=>(
              <button key={m.id} onClick={()=>setActiveModule(m.id)}
                style={{flexShrink:0,background:activeModule===m.id?`linear-gradient(135deg,${m.color},${m.color}cc)`:"#fff",
                  color:activeModule===m.id?"#fff":m.color,
                  border:`2px solid ${m.color}`,borderRadius:20,padding:"8px 16px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .2s",
                  boxShadow:activeModule===m.id?`0 4px 14px ${m.color}44`:"none"}}>
                {m.title}
              </button>
            ))}
          </div>

          {/* Module info */}
          {currentModule && (
            <div className="fadein">
              <div style={{background:`linear-gradient(135deg,${currentModule.bg},#fff)`,border:`2px solid ${currentModule.border}`,borderRadius:16,padding:"14px 16px",marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:15,color:currentModule.color,marginBottom:4}}>{currentModule.title}</div>
                <div style={{fontSize:12,color:"#64748b",marginBottom:8}}>{currentModule.subtitle}</div>
                <div style={{fontSize:11,color:"#94a3b8"}}>
                  {currentModule.lessons.filter(l=>progress[l.id]).length}/{currentModule.lessons.length} lessons complete
                </div>
                <div style={{background:"rgba(0,0,0,.06)",borderRadius:100,height:4,marginTop:6,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:100,background:currentModule.color,
                    width:`${(currentModule.lessons.filter(l=>progress[l.id]).length/currentModule.lessons.length)*100}%`,transition:"width .5s ease"}}/>
                </div>
              </div>

              {/* Lessons list */}
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {currentModule.lessons.map((lesson,i)=>{
                  const done = progress[lesson.id];
                  const locked = i > 0 && !progress[currentModule.lessons[i-1].id] && activeModule!=="beginner"? false : false;
                  return (
                    <div key={lesson.id} className="lesson"
                      onClick={()=>setActiveLesson(lesson)}
                      style={{background:"#fff",borderRadius:16,padding:"14px 16px",
                        border:`2px solid ${done?currentModule.color+"44":"#f1f5f9"}`,
                        display:"flex",alignItems:"center",gap:12,cursor:"pointer",
                        boxShadow:"0 2px 8px rgba(0,0,0,.04)",
                        background:done?`linear-gradient(135deg,${currentModule.bg},#fff)`:"#fff"}}>

                      {/* Number/Check */}
                      <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",
                        background:done?`linear-gradient(135deg,${currentModule.color},${currentModule.color}cc)`:"#f1f5f9",
                        fontWeight:900,fontSize:done?16:14,color:done?"#fff":"#94a3b8"}}>
                        {done?"✓":i+1}
                      </div>

                      {/* Emoji */}
                      <span style={{fontSize:24,flexShrink:0}}>{lesson.emoji}</span>

                      {/* Info */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:14,color:"#0f172a",marginBottom:2}}>{lesson.title}</div>
                        <div style={{fontSize:10,color:"#94a3b8"}}>⏱️ {lesson.time}</div>
                      </div>

                      {/* Arrow */}
                      <span style={{color:done?currentModule.color:"#cbd5e1",fontSize:18,flexShrink:0}}>{done?"✅":"→"}</span>
                    </div>
                  );
                })}
              </div>

              {/* Share progress */}
              {doneLessons > 0 && (
                <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(`📚 Maine "Crypto Sikho" course ${pct}% complete kiya!\n\n${doneLessons}/${totalLessons} lessons done 🎓\n\nFree mein seekho: yesyoupro.com/sikho`)}`)}
                  style={{width:"100%",background:"#25D366",color:"#fff",border:"none",borderRadius:14,padding:"12px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif",marginTop:16}}>
                  📱 Progress WhatsApp Pe Share Karo
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
