import os,sys
FILE="app/page.js"
if not os.path.exists(FILE):
    print("❌ app/page.js nahi mila")
    sys.exit(1)
with open(FILE,'r') as f:
    c=f.read()
changes=0

# Fix 1: Remove Exclusive Features banner
if "EXCLUSIVE FEATURES" in c:
    start=c.find("        {/* ✨ EXCLUSIVE FEATURES BANNER")
    end=c.find("        {activeTab===\"analyze\" && (")
    if start>0 and end>0:
        new='''        {/* Quick Links */}
        <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",scrollbarWidth:"none"}}>
          {[
            {icon:"✨",label:"Features",href:"/features",color:"#6366f1",bg:"#eff6ff",border:"#c7d2fe"},
            {icon:"🤖",label:"AI Chat",href:"/chat",color:"#10b981",bg:"#f0fdf4",border:"#6ee7b7"},
            {icon:"📈",label:"Trade",href:"/trade",color:"#059669",bg:"#ecfdf5",border:"#6ee7b7"},
            {icon:"📚",label:"Blog",href:"/blog",color:"#d97706",bg:"#fffbeb",border:"#fde68a"},
          ].map((l,i)=>(
            <Link key={i} href={l.href} style={{display:"flex",alignItems:"center",gap:5,flexShrink:0,background:l.bg,border:`1px solid ${l.border}`,borderRadius:20,padding:"7px 14px",fontSize:12,fontWeight:700,color:l.color,textDecoration:"none"}}>
              {l.icon} {l.label}
            </Link>
          ))}
        </div>

        {activeTab==="analyze" && ('''
        c=c[:start]+new+c[end+len("        {activeTab===\"analyze\" && ("):]
        changes+=1
        print("✅ Fix 1: Exclusive Features banner hataya")
    else:
        print("⚠️ Fix 1: Pattern nahi mila")
else:
    print("⏭️  Fix 1: Already done")

# Fix 2: Remove TOOLS divider section
if "TOOLS divider" in c:
    ts=c.find("{/* TOOLS divider */}")
    if ts<0:
        ts=c.find("TOOLS divider")
        ts=c.rfind("{/*",0,ts)
    ad=c.find("{/* Ad — end of analyze tab */}")
    if ts>0 and ad>ts:
        new2='''            {/* Ad — end of analyze tab */}
            <div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px",margin:"12px 0"}}>
              <div style={{fontSize:9,color:"#94a3b8",letterSpacing:1,marginBottom:2}}>ADVERTISEMENT</div>
              <ins className="adsbygoogle" style={{display:"block"}} data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO" data-ad-format="auto" data-full-width-responsive="true"/>
              <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
            </div>

          </div>
        )}
'''
        end2=c.find("</div>\n        )}\n\n        {/*",ad)
        if end2>0:
            c=c[:ts]+new2+c[end2+len("</div>\n        )}\n\n        {/*"):]
            c=c[:ts+len(new2)]+"\n        {/*"+c[ts+len(new2):]
            changes+=1
            print("✅ Fix 2: TOOLS+WhatIf+Compare hataya")
        else:
            print("⚠️ Fix 2: End bracket nahi mila")
    else:
        print("⚠️ Fix 2: Pattern nahi mila")
else:
    print("⏭️  Fix 2: Already done")

# Fix 3: Value props
if "Real-time data" not in c:
    old='            India ka free crypto research tool \u2014 No signup, No fees\n          </p>'
    new3='''            \U0001f1ee\U0001f1f3 India ka free crypto research tool \u2014 No signup, No fees
          </p>
          <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap",justifyContent:"center"}}>
            {[{icon:"\u26a1",text:"Real-time data"},{icon:"\U0001f916",text:"AI analysis"},{icon:"\u20b9",text:"India ke liye"}].map((v,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(16,185,129,.08)",borderRadius:20,padding:"4px 10px",fontSize:11,color:"#059669",fontWeight:700}}>
                <span>{v.icon}</span><span>{v.text}</span>
              </div>
            ))}
          </div>'''
    if old in c:
        c=c.replace(old,new3)
        changes+=1
        print("✅ Fix 3: Value props add kiya")
    else:
        print("⚠️ Fix 3: Tagline nahi mili")
else:
    print("⏭️  Fix 3: Already done")

ok=c.count("(")==c.count(")")
print(f"\nParens: {'✅ OK' if ok else '❌ MISMATCH'}")
print(f"Changes: {changes}")
if ok and changes>0:
    with open(FILE,'w') as f:
        f.write(c)
    print("✅ File saved!")
elif changes==0:
    print("⏭️  Koi change nahi hua")
else:
    print("❌ File save nahi kiya — paren error")
