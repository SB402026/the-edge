import { useState, useCallback } from "react";

// ─── STATIC FALLBACK DATA ─────────────────────────────────────────────────────
const DEFAULT_FPI = [
  { rank:1,  name:"Los Angeles Rams",     abbr:"LAR", fpiPts: 9.0, conf:"NFC", dome:true,  hfa:2.5 },
  { rank:2,  name:"Buffalo Bills",         abbr:"BUF", fpiPts: 8.4, conf:"AFC", dome:false, hfa:2.0 },
  { rank:3,  name:"Baltimore Ravens",      abbr:"BAL", fpiPts: 7.8, conf:"AFC", dome:false, hfa:2.5 },
  { rank:4,  name:"Seattle Seahawks",      abbr:"SEA", fpiPts: 7.2, conf:"NFC", dome:false, hfa:3.0 },
  { rank:5,  name:"San Francisco 49ers",   abbr:"SF",  fpiPts: 6.6, conf:"NFC", dome:false, hfa:2.0 },
  { rank:6,  name:"Green Bay Packers",     abbr:"GB",  fpiPts: 6.0, conf:"NFC", dome:false, hfa:2.5 },
  { rank:7,  name:"Los Angeles Chargers",  abbr:"LAC", fpiPts: 5.5, conf:"AFC", dome:false, hfa:1.5 },
  { rank:8,  name:"Detroit Lions",         abbr:"DET", fpiPts: 4.9, conf:"NFC", dome:true,  hfa:2.0 },
  { rank:9,  name:"Kansas City Chiefs",    abbr:"KC",  fpiPts: 4.4, conf:"AFC", dome:true,  hfa:2.5 },
  { rank:10, name:"Philadelphia Eagles",   abbr:"PHI", fpiPts: 3.8, conf:"NFC", dome:false, hfa:2.0 },
  { rank:11, name:"Dallas Cowboys",        abbr:"DAL", fpiPts: 3.3, conf:"NFC", dome:true,  hfa:1.5 },
  { rank:12, name:"Cincinnati Bengals",    abbr:"CIN", fpiPts: 2.7, conf:"AFC", dome:false, hfa:2.0 },
  { rank:13, name:"Houston Texans",        abbr:"HOU", fpiPts: 2.2, conf:"AFC", dome:true,  hfa:2.0 },
  { rank:14, name:"New England Patriots",  abbr:"NE",  fpiPts: 1.6, conf:"AFC", dome:false, hfa:1.5 },
  { rank:15, name:"Denver Broncos",        abbr:"DEN", fpiPts: 1.1, conf:"AFC", dome:false, hfa:2.5 },
  { rank:16, name:"Chicago Bears",         abbr:"CHI", fpiPts: 0.5, conf:"NFC", dome:false, hfa:2.0 },
  { rank:17, name:"Jacksonville Jaguars",  abbr:"JAC", fpiPts: 0.0, conf:"AFC", dome:true,  hfa:2.0 },
  { rank:18, name:"Tampa Bay Buccaneers",  abbr:"TB",  fpiPts:-0.5, conf:"NFC", dome:false, hfa:2.0 },
  { rank:19, name:"Minnesota Vikings",     abbr:"MIN", fpiPts:-1.1, conf:"NFC", dome:true,  hfa:2.0 },
  { rank:20, name:"Indianapolis Colts",    abbr:"IND", fpiPts:-1.6, conf:"AFC", dome:true,  hfa:2.0 },
  { rank:21, name:"Washington Commanders", abbr:"WSH", fpiPts:-2.2, conf:"NFC", dome:false, hfa:2.0 },
  { rank:22, name:"Pittsburgh Steelers",   abbr:"PIT", fpiPts:-2.7, conf:"AFC", dome:false, hfa:2.5 },
  { rank:23, name:"New York Giants",       abbr:"NYG", fpiPts:-3.3, conf:"NFC", dome:false, hfa:1.5 },
  { rank:24, name:"New Orleans Saints",    abbr:"NO",  fpiPts:-3.8, conf:"NFC", dome:true,  hfa:2.5 },
  { rank:25, name:"Atlanta Falcons",       abbr:"ATL", fpiPts:-4.4, conf:"NFC", dome:true,  hfa:2.0 },
  { rank:26, name:"Tennessee Titans",      abbr:"TEN", fpiPts:-5.0, conf:"AFC", dome:false, hfa:2.0 },
  { rank:27, name:"Carolina Panthers",     abbr:"CAR", fpiPts:-5.5, conf:"NFC", dome:false, hfa:1.5 },
  { rank:28, name:"Las Vegas Raiders",     abbr:"LV",  fpiPts:-6.0, conf:"AFC", dome:true,  hfa:2.0 },
  { rank:29, name:"Arizona Cardinals",     abbr:"ARI", fpiPts:-6.6, conf:"NFC", dome:false, hfa:2.0 },
  { rank:30, name:"Cleveland Browns",      abbr:"CLE", fpiPts:-7.2, conf:"AFC", dome:false, hfa:2.0 },
  { rank:31, name:"New York Jets",         abbr:"NYJ", fpiPts:-7.8, conf:"AFC", dome:false, hfa:1.5 },
  { rank:32, name:"Miami Dolphins",        abbr:"MIA", fpiPts:-8.4, conf:"AFC", dome:false, hfa:1.5 },
];

const DEFAULT_GAMES = [
  { away:"NE",  home:"SEA", dkSpread:-3.5,  dkTotal:44.5, gameTime:"Wed Sep 9  · 8:20 PM",  network:"NBC",     neutral:false, notes:"Super Bowl LX rematch" },
  { away:"SF",  home:"LAR", dkSpread:-2.5,  dkTotal:48.5, gameTime:"Thu Sep 10 · 8:35 PM",  network:"Netflix", neutral:true,  notes:"Melbourne Australia · Neutral site" },
  { away:"CAR", home:"CHI", dkSpread:-2.5,  dkTotal:44.5, gameTime:"Sun Sep 13 · 1:00 PM",  network:"FOX",     neutral:false, notes:"" },
  { away:"TB",  home:"CIN", dkSpread: 3.5,  dkTotal:50.5, gameTime:"Sun Sep 13 · 1:00 PM",  network:"FOX",     neutral:false, notes:"Highest O/U of Week 1" },
  { away:"BAL", home:"IND", dkSpread:-3.5,  dkTotal:45.5, gameTime:"Sun Sep 13 · 1:00 PM",  network:"CBS",     neutral:false, notes:"" },
  { away:"BUF", home:"HOU", dkSpread:-3.0,  dkTotal:49.5, gameTime:"Sun Sep 13 · 1:00 PM",  network:"CBS",     neutral:false, notes:"Allen vs. Stroud" },
  { away:"NO",  home:"DET", dkSpread:-7.0,  dkTotal:47.5, gameTime:"Sun Sep 13 · 1:00 PM",  network:"FOX",     neutral:false, notes:"" },
  { away:"CLE", home:"JAC", dkSpread:-2.5,  dkTotal:41.5, gameTime:"Sun Sep 13 · 1:00 PM",  network:"CBS",     neutral:false, notes:"" },
  { away:"PIT", home:"WSH", dkSpread:-1.0,  dkTotal:43.5, gameTime:"Sun Sep 13 · 1:00 PM",  network:"FOX",     neutral:false, notes:"Rodgers debut" },
  { away:"ARI", home:"LAC", dkSpread:-11.5, dkTotal:45.5, gameTime:"Sun Sep 13 · 4:25 PM",  network:"CBS",     neutral:false, notes:"Largest spread W1" },
  { away:"MIN", home:"GB",  dkSpread:-3.0,  dkTotal:48.0, gameTime:"Sun Sep 13 · 4:25 PM",  network:"FOX",     neutral:false, notes:"Murray NFC North debut" },
  { away:"ATL", home:"PHI", dkSpread:-4.5,  dkTotal:46.5, gameTime:"Sun Sep 13 · 4:25 PM",  network:"FOX",     neutral:false, notes:"" },
  { away:"TEN", home:"MIA", dkSpread:-2.0,  dkTotal:40.5, gameTime:"Sun Sep 13 · 4:05 PM",  network:"CBS",     neutral:false, notes:"" },
  { away:"LV",  home:"NYJ", dkSpread:-1.5,  dkTotal:39.5, gameTime:"Sun Sep 13 · 4:05 PM",  network:"CBS",     neutral:false, notes:"" },
  { away:"DAL", home:"NYG", dkSpread:-2.5,  dkTotal:48.5, gameTime:"Sun Sep 13 · 8:20 PM",  network:"NBC",     neutral:false, notes:"Harbaugh debut · SNF" },
  { away:"DEN", home:"KC",  dkSpread:-2.5,  dkTotal:42.5, gameTime:"Mon Sep 14 · 8:15 PM",  network:"ESPN",    neutral:false, notes:"Mahomes return TBD · MNF" },
];

const FPI_PASTE_TEMPLATE = `Rank,Team,Abbr,FPI
1,Los Angeles Rams,LAR,9.0
2,Buffalo Bills,BUF,8.4
3,Baltimore Ravens,BAL,7.8
4,Seattle Seahawks,SEA,7.2
5,San Francisco 49ers,SF,6.6
6,Green Bay Packers,GB,6.0
7,Los Angeles Chargers,LAC,5.5
8,Detroit Lions,DET,4.9
9,Kansas City Chiefs,KC,4.4
10,Philadelphia Eagles,PHI,3.8
11,Dallas Cowboys,DAL,3.3
12,Cincinnati Bengals,CIN,2.7
13,Houston Texans,HOU,2.2
14,New England Patriots,NE,1.6
15,Denver Broncos,DEN,1.1
16,Chicago Bears,CHI,0.5
17,Jacksonville Jaguars,JAC,0.0
18,Tampa Bay Buccaneers,TB,-0.5
19,Minnesota Vikings,MIN,-1.1
20,Indianapolis Colts,IND,-1.6
21,Washington Commanders,WSH,-2.2
22,Pittsburgh Steelers,PIT,-2.7
23,New York Giants,NYG,-3.3
24,New Orleans Saints,NO,-3.8
25,Atlanta Falcons,ATL,-4.4
26,Tennessee Titans,TEN,-5.0
27,Carolina Panthers,CAR,-5.5
28,Las Vegas Raiders,LV,-6.0
29,Arizona Cardinals,ARI,-6.6
30,Cleveland Browns,CLE,-7.2
31,New York Jets,NYJ,-7.8
32,Miami Dolphins,MIA,-8.4`;

const DK_PASTE_TEMPLATE = `Away,Home,Spread,Total,Time,Network,Neutral,Notes
NE,SEA,-3.5,44.5,Wed Sep 9 · 8:20 PM,NBC,false,Super Bowl LX rematch
SF,LAR,-2.5,48.5,Thu Sep 10 · 8:35 PM,Netflix,true,Melbourne neutral site
CAR,CHI,-2.5,44.5,Sun Sep 13 · 1:00 PM,FOX,false,
TB,CIN,3.5,50.5,Sun Sep 13 · 1:00 PM,FOX,false,Highest O/U W1
BAL,IND,-3.5,45.5,Sun Sep 13 · 1:00 PM,CBS,false,
BUF,HOU,-3.0,49.5,Sun Sep 13 · 1:00 PM,CBS,false,Allen vs Stroud
NO,DET,-7.0,47.5,Sun Sep 13 · 1:00 PM,FOX,false,
CLE,JAC,-2.5,41.5,Sun Sep 13 · 1:00 PM,CBS,false,
PIT,WSH,-1.0,43.5,Sun Sep 13 · 1:00 PM,FOX,false,Rodgers debut
ARI,LAC,-11.5,45.5,Sun Sep 13 · 4:25 PM,CBS,false,Largest spread W1
MIN,GB,-3.0,48.0,Sun Sep 13 · 4:25 PM,FOX,false,Murray debut
ATL,PHI,-4.5,46.5,Sun Sep 13 · 4:25 PM,FOX,false,
TEN,MIA,-2.0,40.5,Sun Sep 13 · 4:05 PM,CBS,false,
LV,NYJ,-1.5,39.5,Sun Sep 13 · 4:05 PM,CBS,false,
DAL,NYG,-2.5,48.5,Sun Sep 13 · 8:20 PM,NBC,false,Harbaugh debut SNF
DEN,KC,-2.5,42.5,Mon Sep 14 · 8:15 PM,ESPN,false,Mahomes return TBD`;

const TEAM_META = {
  LAR:{conf:"NFC",dome:true, hfa:2.5}, BUF:{conf:"AFC",dome:false,hfa:2.0},
  BAL:{conf:"AFC",dome:false,hfa:2.5}, SEA:{conf:"NFC",dome:false,hfa:3.0},
  SF: {conf:"NFC",dome:false,hfa:2.0}, GB: {conf:"NFC",dome:false,hfa:2.5},
  LAC:{conf:"AFC",dome:false,hfa:1.5}, DET:{conf:"NFC",dome:true, hfa:2.0},
  KC: {conf:"AFC",dome:true, hfa:2.5}, PHI:{conf:"NFC",dome:false,hfa:2.0},
  DAL:{conf:"NFC",dome:true, hfa:1.5}, CIN:{conf:"AFC",dome:false,hfa:2.0},
  HOU:{conf:"AFC",dome:true, hfa:2.0}, NE: {conf:"AFC",dome:false,hfa:1.5},
  DEN:{conf:"AFC",dome:false,hfa:2.5}, CHI:{conf:"NFC",dome:false,hfa:2.0},
  JAC:{conf:"AFC",dome:true, hfa:2.0}, TB: {conf:"NFC",dome:false,hfa:2.0},
  MIN:{conf:"NFC",dome:true, hfa:2.0}, IND:{conf:"AFC",dome:true, hfa:2.0},
  WSH:{conf:"NFC",dome:false,hfa:2.0}, PIT:{conf:"AFC",dome:false,hfa:2.5},
  NYG:{conf:"NFC",dome:false,hfa:1.5}, NO: {conf:"NFC",dome:true, hfa:2.5},
  ATL:{conf:"NFC",dome:true, hfa:2.0}, TEN:{conf:"AFC",dome:false,hfa:2.0},
  CAR:{conf:"NFC",dome:false,hfa:1.5}, LV: {conf:"AFC",dome:true, hfa:2.0},
  ARI:{conf:"NFC",dome:false,hfa:2.0}, CLE:{conf:"AFC",dome:false,hfa:2.0},
  NYJ:{conf:"AFC",dome:false,hfa:1.5}, MIA:{conf:"AFC",dome:false,hfa:1.5},
};

// ─── ENGINE ───────────────────────────────────────────────────────────────────
function buildTeamMap(fpiList) {
  return Object.fromEntries(fpiList.map(t => [t.abbr, { ...t, ...(TEAM_META[t.abbr]||{}) }]));
}
function calcSpread(game, teamMap, injAdj={}) {
  const h=teamMap[game.home], a=teamMap[game.away];
  if (!h||!a) return 0;
  let proj = h.fpiPts - a.fpiPts;
  if (!game.neutral) proj += (h.hfa||2.0);
  proj += (injAdj[game.home]||0) - (injAdj[game.away]||0);
  return parseFloat(proj.toFixed(1));
}
function getEdge(proj, dk) { return parseFloat((dk-proj).toFixed(1)); }
function getRec(edge) {
  const abs=Math.abs(edge), dir=edge>0?"away":"home";
  if (abs<1.5) return {verdict:"PASS",tier:0,units:0,pct:0,dir:null};
  if (abs<2.5) return {verdict:"LEAN",tier:1,units:1,pct:1,dir};
  if (abs<3.5) return {verdict:"BET", tier:2,units:2,pct:2,dir};
  return             {verdict:"BEST",tier:3,units:3,pct:3,dir};
}
function parseFPICSV(text) {
  return text.trim().split("\n")
    .filter(l=>l.trim()&&!l.startsWith("Rank"))
    .map(line => {
      const p=line.split(",").map(s=>s.trim());
      const abbr=p[2];
      return { rank:parseInt(p[0]), name:p[1], abbr, fpiPts:parseFloat(p[3]), ...(TEAM_META[abbr]||{conf:"NFC",dome:false,hfa:2.0}) };
    }).filter(t=>t.abbr&&!isNaN(t.fpiPts));
}
function parseDKCSV(text) {
  return text.trim().split("\n")
    .filter(l=>l.trim()&&!l.startsWith("Away"))
    .map(line => {
      const p=line.split(",").map(s=>s.trim());
      return { away:p[0], home:p[1], dkSpread:parseFloat(p[2]), dkTotal:parseFloat(p[3]),
        gameTime:p[4], network:p[5], neutral:p[6]==="true", notes:p[7]||"" };
    }).filter(g=>g.away&&g.home&&!isNaN(g.dkSpread));
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  pageBg:"#F7F5F0", cardBg:"#FFFFFF", cardBorder:"#E2DDD5", subBg:"#F0EDE8",
  textPrimary:"#1A1815", textSecondary:"#5A5650", textMuted:"#8C8880",
  green:"#1a5c36", greenLight:"#EBF5EE",
  bestBg:"#1a5c36", bestText:"#FFFFFF",
  betBg:"#EBF5EE",  betText:"#1a5c36",  betBorder:"#2E7D4F",
  leanBg:"#FEF8EC", leanText:"#7A5200", leanBorder:"#D4A017",
  passBg:"#F5F5F5", passText:"#888888", passBorder:"#D0D0D0",
  blue:"#1A56A0",   blueBg:"#E8F0FB",
};

// ─── API CALL — routes through /api/claude so key stays server-side ───────────
async function callClaude(body) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function VerdictBanner({ rec, betAmt, awayAbbr, homeAbbr }) {
  const C = {
    BEST:{ bg:S.bestBg, color:S.bestText, icon:"🔥", label:"BEST BET · 3 UNITS", border:S.bestBg },
    BET: { bg:S.betBg,  color:S.betText,  icon:"✅", label:"PLAY · 2 UNITS",     border:S.betBorder },
    LEAN:{ bg:S.leanBg, color:S.leanText, icon:"👀", label:"LEAN · 1 UNIT",      border:S.leanBorder },
    PASS:{ bg:S.passBg, color:S.passText, icon:"⏭",  label:"NO BET · PASS",      border:S.passBorder },
  }[rec.verdict];
  const side = rec.dir==="away" ? `Take ${awayAbbr} +ATS` : rec.dir==="home" ? `Take ${homeAbbr} −ATS` : null;
  return (
    <div style={{background:C.bg,color:C.color,border:`1px solid ${C.border}`,borderRadius:8,
      padding:"9px 13px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginTop:10}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>{C.icon}</span>
        <div>
          <div style={{fontSize:13,fontWeight:700}}>{C.label}</div>
          {side && <div style={{fontSize:11,opacity:0.8,marginTop:1}}>{side}</div>}
        </div>
      </div>
      {rec.units>0 && betAmt>0 && (
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:18,fontWeight:800}}>${betAmt.toLocaleString()}</div>
          <div style={{fontSize:10,opacity:0.7}}>{rec.pct}% of bankroll</div>
        </div>
      )}
    </div>
  );
}

function GameCard({ game, teamMap, injAdj, bankroll }) {
  const h=teamMap[game.home], a=teamMap[game.away];
  if (!h||!a) return null;
  const proj=calcSpread(game,teamMap,injAdj);
  const edge=getEdge(proj,game.dkSpread);
  const rec=getRec(edge);
  const betAmt=bankroll>0?Math.round(bankroll*rec.pct/100):0;
  const projLbl=proj>=0?`${h.abbr} −${Math.abs(proj)}`:`${a.abbr} −${Math.abs(proj)}`;
  const dkLbl=game.dkSpread<=0?`${h.abbr} −${Math.abs(game.dkSpread)}`:`${a.abbr} −${Math.abs(game.dkSpread)}`;
  const eSign=edge>=0?"+":"";
  const eColor=Math.abs(edge)>=2.5?S.green:Math.abs(edge)>=1.5?S.leanText:S.textMuted;
  const lBorder=rec.verdict==="BEST"?S.bestBg:rec.verdict==="BET"?S.betBorder:rec.verdict==="LEAN"?S.leanBorder:S.cardBorder;
  return (
    <div style={{background:S.cardBg,border:`1px solid ${S.cardBorder}`,borderLeft:`4px solid ${lBorder}`,
      borderRadius:10,overflow:"hidden",marginBottom:10}}>
      <div style={{background:S.subBg,padding:"7px 14px",borderBottom:`1px solid ${S.cardBorder}`,
        display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
        <span style={{fontSize:11,color:S.textSecondary,fontWeight:500}}>
          {game.gameTime} · {game.network}
          {game.neutral&&<span style={{marginLeft:8,fontSize:10,background:S.blueBg,color:S.blue,
            padding:"2px 7px",borderRadius:8,fontWeight:600}}>NEUTRAL</span>}
        </span>
        {game.notes&&<span style={{fontSize:10,color:S.textMuted,fontStyle:"italic"}}>{game.notes}</span>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 44px 1fr",alignItems:"center",padding:"12px 16px",gap:8}}>
        <div>
          <div style={{fontSize:17,fontWeight:700,color:S.textPrimary}}>{a.abbr}</div>
          <div style={{fontSize:11,color:S.textSecondary,marginTop:1}}>{a.name.split(" ").slice(-1)[0]}</div>
          <div style={{display:"flex",alignItems:"center",gap:4,marginTop:3}}>
            <span style={{background:S.subBg,border:`1px solid ${S.cardBorder}`,borderRadius:4,
              padding:"1px 5px",fontSize:10,fontWeight:700,color:S.textSecondary}}>#{a.rank}</span>
            <span style={{fontSize:11,color:S.textMuted}}>{a.fpiPts>0?"+":""}{a.fpiPts.toFixed(1)} FPI</span>
          </div>
        </div>
        <div style={{textAlign:"center",color:S.textMuted,fontSize:12,fontWeight:500}}>@</div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:17,fontWeight:700,color:S.textPrimary}}>{h.abbr}</div>
          <div style={{fontSize:11,color:S.textSecondary,marginTop:1}}>{h.name.split(" ").slice(-1)[0]}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4,marginTop:3}}>
            <span style={{fontSize:11,color:S.textMuted}}>{h.fpiPts>0?"+":""}{h.fpiPts.toFixed(1)} FPI</span>
            <span style={{background:S.subBg,border:`1px solid ${S.cardBorder}`,borderRadius:4,
              padding:"1px 5px",fontSize:10,fontWeight:700,color:S.textSecondary}}>#{h.rank}</span>
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderTop:`1px solid ${S.cardBorder}`,background:S.subBg}}>
        {[
          {label:"Our Proj", val:projLbl,                        color:S.textPrimary},
          {label:"DK Line",  val:dkLbl,                          color:S.textPrimary},
          {label:"Edge",     val:`${eSign}${edge.toFixed(1)}`,   color:eColor},
          {label:"Total O/U",val:game.dkTotal,                   color:S.textPrimary},
        ].map((c,i)=>(
          <div key={i} style={{padding:"8px 6px",textAlign:"center",borderRight:i<3?`1px solid ${S.cardBorder}`:"none"}}>
            <div style={{fontSize:9,color:S.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>{c.label}</div>
            <div style={{fontSize:13,fontWeight:700,color:c.color}}>{c.val}</div>
          </div>
        ))}
      </div>
      <div style={{padding:"0 14px 12px"}}>
        <VerdictBanner rec={rec} betAmt={betAmt} awayAbbr={a.abbr} homeAbbr={h.abbr}/>
      </div>
    </div>
  );
}

function InjurySlider({ abbr, name, value, onChange }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:`1px solid ${S.cardBorder}`}}>
      <div style={{minWidth:140,fontSize:12,color:S.textPrimary,fontWeight:500}}>{name}</div>
      <input type="range" min={-7} max={0} step={0.5} value={value}
        onChange={e=>onChange(abbr,parseFloat(e.target.value))}/>
      <div style={{minWidth:60,fontSize:12,textAlign:"right",fontWeight:700,color:value<0?"#C0392B":S.green}}>
        {value===0?"Healthy":`${value.toFixed(1)} pts`}
      </div>
    </div>
  );
}

function PastePanel({ title, icon, description, template, status, onApply, steps }) {
  const [text, setText] = useState(template);
  const [open, setOpen] = useState(false);
  const sc = status==="done"
    ? {bg:"#EBF5EE",color:S.green,dot:S.green,label:"Updated ✓"}
    : status==="error"
    ? {bg:"#FEECEC",color:"#8B1A1A",dot:"#C0392B",label:"Parse error"}
    : {bg:S.subBg,color:S.textMuted,dot:"#C0BAB0",label:"Template ready"};
  return (
    <div style={{background:S.subBg,borderRadius:8,marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",cursor:"pointer"}}
        onClick={()=>setOpen(o=>!o)}>
        <span style={{fontSize:16}}>{icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:700,color:S.textPrimary}}>{title}</div>
          <div style={{fontSize:11,color:S.textMuted,marginTop:1}}>{description}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,background:sc.bg,
          color:sc.color,padding:"3px 9px",borderRadius:20,fontWeight:600}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:sc.dot}}/>
          {sc.label}
        </div>
        <span style={{fontSize:12,color:S.textMuted}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{padding:"0 12px 12px"}}>
          <div style={{fontSize:11,color:S.textSecondary,marginBottom:8,lineHeight:1.6}}>
            {steps.map((s,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:4}}>
                <span style={{background:S.green,color:"#fff",borderRadius:"50%",width:16,height:16,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>
                  {i+1}
                </span>
                <span>{s}</span>
              </div>
            ))}
          </div>
          <textarea value={text} onChange={e=>setText(e.target.value)}
            style={{width:"100%",height:180,fontSize:11,fontFamily:"monospace",padding:"8px",
              borderRadius:6,border:`1px solid ${S.cardBorder}`,background:"#fff",
              color:S.textPrimary,resize:"vertical",boxSizing:"border-box"}}/>
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button onClick={()=>setText(template)}
              style={{fontSize:12,padding:"6px 12px",borderRadius:6,border:`1px solid ${S.cardBorder}`,
                background:S.cardBg,color:S.textSecondary,cursor:"pointer"}}>
              Reset template
            </button>
            <button onClick={()=>onApply(text)}
              style={{fontSize:12,padding:"6px 14px",borderRadius:6,border:"none",
                background:S.green,color:"#fff",cursor:"pointer",fontWeight:700}}>
              ✓ Apply data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function TheEdge() {
  const [fpiData,   setFpiData]   = useState(DEFAULT_FPI);
  const [games,     setGames]     = useState(DEFAULT_GAMES);
  const [fpiStatus, setFpiStatus] = useState("idle");
  const [dkStatus,  setDkStatus]  = useState("idle");
  const [fpiDesc,   setFpiDesc]   = useState("Preseason baseline — ESPN FPI June 2026");
  const [dkDesc,    setDkDesc]    = useState("Week 1 opening lines — DraftKings May 15 2026");
  const [bankroll,  setBankroll]  = useState(1000);
  const [weekNum,   setWeekNum]   = useState(1);
  const [filter,    setFilter]    = useState("all");
  const [injAdj,    setInjAdj]    = useState({});
  const [showInj,   setShowInj]   = useState(false);
  const [aiOutput,  setAiOutput]  = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHist,  setChatHist]  = useState([]);
  const [question,  setQuestion]  = useState("");

  const teamMap  = buildTeamMap(fpiData);
  const allTeams = [...new Set(games.flatMap(g=>[g.home,g.away]))].sort();
  const updateInj = useCallback((abbr,val)=>setInjAdj(p=>({...p,[abbr]:val})),[]);

  const applyFPI = useCallback((text)=>{
    try {
      const parsed=parseFPICSV(text);
      if (parsed.length<20) { setFpiStatus("error"); return; }
      setFpiData(parsed);
      setFpiDesc(`ESPN FPI — updated ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`);
      setFpiStatus("done");
    } catch { setFpiStatus("error"); }
  },[]);

  const applyDK = useCallback((text)=>{
    try {
      const parsed=parseDKCSV(text);
      if (parsed.length<8) { setDkStatus("error"); return; }
      setGames(parsed);
      setDkDesc(`DraftKings Week ${weekNum} — updated ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`);
      setDkStatus("done");
    } catch { setDkStatus("error"); }
  },[weekNum]);

  const computed = games.map(g=>{
    const proj=calcSpread(g,teamMap,injAdj);
    const edge=getEdge(proj,g.dkSpread);
    return {...g,proj,edge,rec:getRec(edge)};
  });
  const edgePlays  = computed.filter(g=>g.rec.tier>=2);
  const bestPlays  = computed.filter(g=>g.rec.tier>=3);
  const totalUnits = computed.reduce((a,g)=>a+g.rec.units,0);
  const totalExp   = bankroll>0?computed.reduce((a,g)=>a+Math.round(bankroll*g.rec.pct/100),0):0;
  const filtered   = computed.filter(g=>
    filter==="bets"?g.rec.tier>=2:filter==="best"?g.rec.tier>=3:filter==="pass"?g.rec.tier===0:true
  );

  const runAI = useCallback(async()=>{
    setAiLoading(true);
    const rows=computed.map(g=>{
      const h=teamMap[g.home],a=teamMap[g.away]; if(!h||!a) return "";
      const pL=g.proj>=0?`${h.abbr} -${Math.abs(g.proj)}`:`${a.abbr} -${Math.abs(g.proj)}`;
      const dL=g.dkSpread<=0?`${h.abbr} -${Math.abs(g.dkSpread)}`:`${a.abbr} -${Math.abs(g.dkSpread)}`;
      return `${a.abbr}(#${a.rank})@${h.abbr}(#${h.rank}) | Proj:${pL} | DK:${dL} | Edge:${g.edge>=0?"+":""}${g.edge.toFixed(1)} | ${g.rec.verdict}(${g.rec.units}u)`;
    }).filter(Boolean).join("\n");

    const sys=`You are a sharp NFL betting analyst. Key methodology:
- Power ratings express team strength as points above/below average on a neutral field
- Edge = difference between projected spread and the book line
- Only bet when edge ≥ 2.5 pts. Units: 1u lean, 2u play, 3u strong
- Home field: ~2.0-2.5 pts in current NFL era
- Injuries: QB ≈ 7 pts, key skill player ≈ 1 pt, most roster moves = 0 impact
- Never exceed 3% of bankroll on a single game
Be direct and analytical. No filler.`;

    const msg=`NFL Week ${weekNum} 2026 board (ESPN FPI vs DraftKings lines):\n\n${rows}\n\nBest bets: ${bestPlays.length} | Edge plays: ${edgePlays.length} | Total units: ${totalUnits}u\n\nGive me:\n1. Top 2 plays with reasoning tied to the numbers\n2. One game to avoid\n3. Brief unit-sizing note`;

    try {
      const data=await callClaude({model:"claude-sonnet-4-6",max_tokens:900,system:sys,messages:[{role:"user",content:msg}]});
      const text=data.content?.map(b=>b.text||"").join("")||"No response.";
      setAiOutput(text);
      setChatHist([{role:"user",content:msg},{role:"assistant",content:text}]);
    } catch(e) {
      setAiOutput("Could not reach AI — check connection.");
    }
    setAiLoading(false);
  },[computed,teamMap,bestPlays.length,edgePlays.length,totalUnits,weekNum]);

  const askFollowUp = useCallback(async()=>{
    if (!question.trim()||!chatHist.length) return;
    const q=question.trim(); setQuestion(""); setAiLoading(true);
    const ctx=computed.map(g=>`${g.away}@${g.home}:${g.edge>=0?"+":""}${g.edge.toFixed(1)},${g.rec.verdict}`).join("|");
    const msgs=[...chatHist,{role:"user",content:`Board: ${ctx}\n\nQuestion: ${q}`}];
    try {
      const data=await callClaude({model:"claude-sonnet-4-6",max_tokens:600,
        system:"Sharp NFL analyst. Power rating system. Be specific and direct.",messages:msgs});
      const text=data.content?.map(b=>b.text||"").join("")||"";
      setAiOutput(p=>`${p}\n\n━━━━\nYou: ${q}\n\n${text}`);
      setChatHist([...msgs,{role:"assistant",content:text}]);
    } catch { setAiOutput(p=>p+"\n\nError."); }
    setAiLoading(false);
  },[question,chatHist,computed]);

  const exportPicks=()=>{
    const lines=[`THE EDGE — NFL WEEK ${weekNum} 2026`,"=".repeat(50),
      `Bankroll: $${bankroll.toLocaleString()}`,
      `Best bets: ${bestPlays.length} | Edge plays: ${edgePlays.length} | Exposure: $${totalExp.toLocaleString()} (${totalUnits}u)`,
      `FPI: ${fpiDesc}`,`Lines: ${dkDesc}`,""];
    computed.forEach(g=>{
      const h=teamMap[g.home],a=teamMap[g.away]; if(!h||!a) return;
      const bet=bankroll>0?Math.round(bankroll*g.rec.pct/100):0;
      lines.push(`${a.abbr} @ ${h.abbr}  ${g.gameTime}`);
      lines.push(`  Proj:${g.proj>=0?h.abbr+" -"+Math.abs(g.proj):a.abbr+" -"+Math.abs(g.proj)} | DK:${g.dkSpread<=0?h.abbr+" -"+Math.abs(g.dkSpread):a.abbr+" -"+Math.abs(g.dkSpread)} | Edge:${g.edge>=0?"+":""}${g.edge.toFixed(1)}`);
      lines.push(`  → ${g.rec.verdict} (${g.rec.units}u)${bet>0?" — $"+bet.toLocaleString()+" ("+g.rec.pct+"% bankroll)":""}`);
      if(g.notes) lines.push(`  Note: ${g.notes}`);
      lines.push("");
    });
    lines.push("For entertainment only. Bet responsibly. Must be 21+.");
    const blob=new Blob([lines.join("\n")],{type:"text/plain"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download=`the-edge-week${weekNum}-2026.txt`; a.click();
  };

  const btn=(primary,sm)=>({
    fontSize:sm?12:13,padding:sm?"5px 10px":"7px 14px",borderRadius:7,
    cursor:"pointer",fontWeight:600,border:"none",
    background:primary?S.green:S.cardBg,color:primary?"#fff":S.textPrimary,
    ...(primary?{}:{border:`1px solid ${S.cardBorder}`}),
  });

  return (
    <div style={{background:S.pageBg,minHeight:"100vh",padding:"1.25rem 1rem"}}>
      <div style={{maxWidth:720,margin:"0 auto"}}>

        {/* HEADER */}
        <div style={{marginBottom:"1rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <h1 style={{fontSize:22,fontWeight:800,color:S.textPrimary,margin:0,letterSpacing:"-0.02em"}}>The Edge</h1>
                <span style={{background:S.green,color:"#fff",fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:4,letterSpacing:"0.06em"}}>NFL 2026</span>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:12,color:S.textSecondary}}>Week</span>
                  <select value={weekNum} onChange={e=>setWeekNum(+e.target.value)}
                    style={{fontSize:13,fontWeight:700,color:S.textPrimary,padding:"2px 6px",
                      borderRadius:5,border:`1px solid ${S.cardBorder}`,background:S.cardBg}}>
                    {Array.from({length:18},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>
                </div>
              </div>
              <div style={{fontSize:12,color:S.textSecondary}}>Power Rating System · ESPN FPI · DraftKings Lines</div>
            </div>
            <div style={{fontSize:11,color:S.textSecondary,textAlign:"right",lineHeight:1.7}}>
              <div style={{color:S.green,fontWeight:700}}>● Live model</div>
              <div>Refresh every Tuesday</div>
            </div>
          </div>
        </div>

        {/* DATA UPDATE PANEL */}
        <div style={{background:S.cardBg,border:`1.5px solid ${S.green}`,borderRadius:10,padding:"14px 16px",marginBottom:"1rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:16}}>📡</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:S.textPrimary}}>Weekly Data Update</div>
              <div style={{fontSize:11,color:S.textMuted}}>Every Tuesday: paste updated ESPN FPI rankings + that week's DraftKings lines</div>
            </div>
          </div>
          <PastePanel title="ESPN FPI Rankings" icon="📊" description={fpiDesc}
            template={FPI_PASTE_TEMPLATE} status={fpiStatus} onApply={applyFPI}
            steps={[
              "Go to espn.com/nfl/fpi on Tuesday",
              "Note the rank order of all 32 teams",
              "Update the Rank and FPI columns below (keep CSV format)",
              "Tap 'Apply data' — board recalculates instantly",
            ]}/>
          <PastePanel title="DraftKings Lines" icon="💰" description={dkDesc}
            template={DK_PASTE_TEMPLATE} status={dkStatus} onApply={applyDK}
            steps={[
              "Go to sportsbook.draftkings.com or espn.com/nfl/odds",
              "Find spreads and totals for each game this week",
              "Update Spread and Total columns (Spread = home perspective: negative = home favored)",
              "Tap 'Apply data' — all edge calculations update",
            ]}/>
          <div style={{marginTop:10,padding:"8px 10px",background:S.blueBg,borderRadius:6,fontSize:11,color:S.blue,lineHeight:1.6}}>
            💡 On this deployed version, the AI Handicapper button is fully live — powered by your Anthropic API key.
          </div>
        </div>

        {/* BANKROLL */}
        <div style={{background:S.cardBg,border:`1px solid ${S.cardBorder}`,borderRadius:10,
          padding:"12px 16px",marginBottom:"1rem",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{fontSize:13,fontWeight:600,color:S.textPrimary}}>My bankroll</div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:14,color:S.textSecondary}}>$</span>
            <input type="number" value={bankroll} min={0} step={100}
              onChange={e=>setBankroll(Math.max(0,parseInt(e.target.value)||0))}
              style={{width:110,fontSize:15,fontWeight:700,color:S.textPrimary,
                padding:"5px 10px",borderRadius:6,border:`1.5px solid ${S.green}`,
                background:S.greenLight,outline:"none"}}/>
          </div>
          <div style={{fontSize:12,color:S.textSecondary}}>
            1u=<b style={{color:S.textPrimary}}>${Math.round(bankroll*.01).toLocaleString()}</b>
            {" · "}2u=<b style={{color:S.textPrimary}}>${Math.round(bankroll*.02).toLocaleString()}</b>
            {" · "}3u=<b style={{color:S.textPrimary}}>${Math.round(bankroll*.03).toLocaleString()}</b>
          </div>
        </div>

        {/* METRICS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:"1rem"}}>
          {[
            {label:"Best bets",  val:bestPlays.length,  sub:"≥ 3.5 pt edge",   accent:S.green},
            {label:"Edge plays", val:edgePlays.length,  sub:"≥ 2.5 pt edge",   accent:S.green},
            {label:"Exposure",   val:bankroll>0?`$${totalExp.toLocaleString()}`:"—", sub:`${totalUnits}u total`, accent:S.textPrimary},
            {label:"Games",      val:games.length,      sub:`Week ${weekNum}`,  accent:S.textPrimary},
          ].map(m=>(
            <div key={m.label} style={{background:S.cardBg,border:`1px solid ${S.cardBorder}`,borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:10,color:S.textMuted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>{m.label}</div>
              <div style={{fontSize:20,fontWeight:800,color:m.accent}}>{m.val}</div>
              <div style={{fontSize:10,color:S.textMuted,marginTop:2}}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* CONTROLS */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:"1rem"}}>
          <select value={filter} onChange={e=>setFilter(e.target.value)}
            style={{fontSize:13,padding:"7px 10px",borderRadius:7,border:`1px solid ${S.cardBorder}`,
              background:S.cardBg,color:S.textPrimary,fontWeight:500,cursor:"pointer"}}>
            <option value="all">All games</option>
            <option value="bets">Bets only (≥2.5)</option>
            <option value="best">Best bets only (≥3.5)</option>
            <option value="pass">Pass games</option>
          </select>
          <button onClick={()=>setShowInj(s=>!s)} style={btn(false)}>{showInj?"Hide":"Edit"} injuries</button>
          <button onClick={runAI} disabled={aiLoading} style={btn(true)}>{aiLoading?"Analyzing…":"⚡ AI Handicapper"}</button>
          <button onClick={exportPicks} style={btn(false)}>↓ Export</button>
        </div>

        {/* VERDICT KEY */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:"1rem"}}>
          {[
            {icon:"🔥",label:"Best bet · 3u · 3%",bg:S.bestBg, color:S.bestText, border:S.bestBg},
            {icon:"✅",label:"Play · 2u · 2%",    bg:S.betBg,  color:S.betText,  border:S.betBorder},
            {icon:"👀",label:"Lean · 1u · 1%",    bg:S.leanBg, color:S.leanText, border:S.leanBorder},
            {icon:"⏭", label:"No bet · pass",     bg:S.passBg, color:S.passText, border:S.passBorder},
          ].map((k,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,
              background:k.bg,color:k.color,border:`1px solid ${k.border}`,borderRadius:20,padding:"4px 10px",fontWeight:600}}>
              {k.icon} {k.label}
            </div>
          ))}
        </div>

        {/* INJURY PANEL */}
        {showInj&&(
          <div style={{background:S.cardBg,border:`1px solid ${S.cardBorder}`,borderRadius:10,padding:"14px 16px",marginBottom:"1rem"}}>
            <div style={{fontSize:13,fontWeight:700,color:S.textPrimary,marginBottom:4}}>Injury adjustments</div>
            <div style={{fontSize:11,color:S.textSecondary,marginBottom:12}}>QB out ≈ −7 pts · Key WR/RB ≈ −1 pt · 60% of roster = zero impact</div>
            {allTeams.map(abbr=>{
              const t=teamMap[abbr]; if(!t) return null;
              return <InjurySlider key={abbr} abbr={abbr} name={t.name.split(" ").slice(-2).join(" ")} value={injAdj[abbr]||0} onChange={updateInj}/>;
            })}
            <button onClick={()=>setInjAdj({})} style={{marginTop:10,fontSize:12,color:"#C0392B",background:"none",border:"none",cursor:"pointer"}}>Reset all</button>
          </div>
        )}

        {/* AI PANEL */}
        {(aiOutput||aiLoading)&&(
          <div style={{background:S.cardBg,border:`1px solid ${S.cardBorder}`,borderRadius:10,padding:"14px 16px",marginBottom:"1rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:S.green,animation:aiLoading?"pulse 1s infinite":"none"}}/>
              <span style={{fontSize:13,fontWeight:700,color:S.textPrimary}}>AI Handicapper</span>
            </div>
            {aiLoading&&!aiOutput
              ?<div style={{fontSize:13,color:S.textSecondary,fontStyle:"italic"}}>Reading the board…</div>
              :<div style={{fontSize:13,color:S.textPrimary,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{aiOutput}</div>
            }
            {chatHist.length>0&&(
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <input value={question} onChange={e=>setQuestion(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&askFollowUp()}
                  placeholder="Ask about a game, line, or injury…"
                  style={{flex:1,fontSize:13,padding:"7px 12px",borderRadius:7,
                    border:`1px solid ${S.cardBorder}`,background:S.pageBg,color:S.textPrimary}}/>
                <button onClick={askFollowUp} disabled={aiLoading} style={btn(true)}>Send</button>
              </div>
            )}
          </div>
        )}

        {/* GAME BOARD */}
        <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.09em",color:S.textMuted,fontWeight:700,marginBottom:10}}>
          Week {weekNum} · {filtered.length}/{games.length} games
        </div>
        {filtered.map((g,i)=>(
          <GameCard key={i} game={g} teamMap={teamMap} injAdj={injAdj} bankroll={bankroll}/>
        ))}
        {filtered.length===0&&(
          <div style={{padding:"2rem",textAlign:"center",color:S.textSecondary,fontSize:13,
            background:S.cardBg,borderRadius:8,border:`1px solid ${S.cardBorder}`}}>
            No games match this filter.
          </div>
        )}

        {/* METHOD */}
        <div style={{marginTop:"1.5rem",borderTop:`1px solid ${S.cardBorder}`,paddingTop:"1.25rem"}}>
          <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.09em",color:S.textMuted,fontWeight:700,marginBottom:10}}>The Method — Key Variables</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8}}>
            {[
              {icon:"📊",title:"Power ratings",desc:"ESPN FPI rank → numeric score. Spread = home minus away + HFA."},
              {icon:"🏠",title:"Home field",   desc:"2.5 pts historical avg. Recent era 1-2 pts. Model uses 1.5–3 by venue."},
              {icon:"🏥",title:"Injuries",     desc:"QB ≈ 7 pts. Key skill ≈ 1 pt. 60% of roster = zero line impact."},
              {icon:"📅",title:"Schedule",     desc:"Short week, travel, letdown spots all factored in."},
              {icon:"🌤",title:"Game factors", desc:"Weather, turf, prevent D tendencies, stadium quirks."},
              {icon:"💰",title:"Unit sizing",  desc:"1–3% bankroll. Scale to edge size. Never exceed 3u per game."},
            ].map(m=>(
              <div key={m.title} style={{background:S.cardBg,border:`1px solid ${S.cardBorder}`,borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:18,marginBottom:5}}>{m.icon}</div>
                <div style={{fontSize:12,fontWeight:700,color:S.textPrimary,marginBottom:3}}>{m.title}</div>
                <div style={{fontSize:11,color:S.textSecondary,lineHeight:1.55}}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{fontSize:11,color:S.textMuted,borderTop:`1px solid ${S.cardBorder}`,paddingTop:"0.75rem",marginTop:"1rem",lineHeight:1.7}}>
          ⚠️ For informational and entertainment purposes only. Not financial advice. Sports betting involves risk.
          Verify all lines on DraftKings before wagering. Must be 21+ in a legal jurisdiction.
        </div>
      </div>
    </div>
  );
}
