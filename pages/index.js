import { useState, useCallback } from "react";
import Link from "next/link";
import { buildTeamMap, calcSpread, getEdge, getNFLRec, parseFPICSV, parseDKCSV } from "../lib/engine";
import { S, btn } from "../lib/components";
import { callClaude, extractText, extractJSON, fetchWithSearch } from "../lib/fetcher";

// ─── DEFAULT NFL DATA ─────────────────────────────────────────────────────────
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
  { away:"NE",  home:"SEA", dkSpread:-3.5,  dkTotal:44.5, gameTime:"Wed Sep 9  · 8:20 PM", network:"NBC",     neutral:false, notes:"Super Bowl LX rematch" },
  { away:"SF",  home:"LAR", dkSpread:-2.5,  dkTotal:48.5, gameTime:"Thu Sep 10 · 8:35 PM", network:"Netflix", neutral:true,  notes:"Melbourne · Neutral site" },
  { away:"CAR", home:"CHI", dkSpread:-2.5,  dkTotal:44.5, gameTime:"Sun Sep 13 · 1:00 PM", network:"FOX",     neutral:false, notes:"" },
  { away:"TB",  home:"CIN", dkSpread: 3.5,  dkTotal:50.5, gameTime:"Sun Sep 13 · 1:00 PM", network:"FOX",     neutral:false, notes:"Highest O/U W1" },
  { away:"BAL", home:"IND", dkSpread:-3.5,  dkTotal:45.5, gameTime:"Sun Sep 13 · 1:00 PM", network:"CBS",     neutral:false, notes:"" },
  { away:"BUF", home:"HOU", dkSpread:-3.0,  dkTotal:49.5, gameTime:"Sun Sep 13 · 1:00 PM", network:"CBS",     neutral:false, notes:"Allen vs. Stroud" },
  { away:"NO",  home:"DET", dkSpread:-7.0,  dkTotal:47.5, gameTime:"Sun Sep 13 · 1:00 PM", network:"FOX",     neutral:false, notes:"" },
  { away:"CLE", home:"JAC", dkSpread:-2.5,  dkTotal:41.5, gameTime:"Sun Sep 13 · 1:00 PM", network:"CBS",     neutral:false, notes:"" },
  { away:"PIT", home:"WSH", dkSpread:-1.0,  dkTotal:43.5, gameTime:"Sun Sep 13 · 1:00 PM", network:"FOX",     neutral:false, notes:"Rodgers debut" },
  { away:"ARI", home:"LAC", dkSpread:-11.5, dkTotal:45.5, gameTime:"Sun Sep 13 · 4:25 PM", network:"CBS",     neutral:false, notes:"Largest spread W1" },
  { away:"MIN", home:"GB",  dkSpread:-3.0,  dkTotal:48.0, gameTime:"Sun Sep 13 · 4:25 PM", network:"FOX",     neutral:false, notes:"" },
  { away:"ATL", home:"PHI", dkSpread:-4.5,  dkTotal:46.5, gameTime:"Sun Sep 13 · 4:25 PM", network:"FOX",     neutral:false, notes:"" },
  { away:"TEN", home:"MIA", dkSpread:-2.0,  dkTotal:40.5, gameTime:"Sun Sep 13 · 4:05 PM", network:"CBS",     neutral:false, notes:"" },
  { away:"LV",  home:"NYJ", dkSpread:-1.5,  dkTotal:39.5, gameTime:"Sun Sep 13 · 4:05 PM", network:"CBS",     neutral:false, notes:"" },
  { away:"DAL", home:"NYG", dkSpread:-2.5,  dkTotal:48.5, gameTime:"Sun Sep 13 · 8:20 PM", network:"NBC",     neutral:false, notes:"Harbaugh debut · SNF" },
  { away:"DEN", home:"KC",  dkSpread:-2.5,  dkTotal:42.5, gameTime:"Mon Sep 14 · 8:15 PM", network:"ESPN",    neutral:false, notes:"MNF" },
];

// ─── SHARED UI PIECES ─────────────────────────────────────────────────────────
function VerdictBanner({ rec, betAmt, awayAbbr, homeAbbr }) {
  const C = {
    BEST:{ bg:S.bestBg, color:S.bestText, icon:"🔥", label:"BEST BET · 3 UNITS", border:S.bestBg },
    BET: { bg:S.betBg,  color:S.betText,  icon:"✅", label:"PLAY · 2 UNITS",     border:S.betBorder },
    LEAN:{ bg:S.leanBg, color:S.leanText, icon:"👀", label:"LEAN · 1 UNIT",      border:S.leanBorder },
    PASS:{ bg:S.passBg, color:S.passText, icon:"⏭",  label:"NO BET · PASS",      border:S.passBorder },
  }[rec.verdict];
  const side = rec.dir === "away" ? `Take ${awayAbbr} +ATS`
             : rec.dir === "home" ? `Take ${homeAbbr} −ATS` : null;
  return (
    <div style={{ background:C.bg, color:C.color, border:`1px solid ${C.border}`,
      borderRadius:8, padding:"9px 13px", display:"flex", alignItems:"center",
      justifyContent:"space-between", gap:10, marginTop:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:16 }}>{C.icon}</span>
        <div>
          <div style={{ fontSize:13, fontWeight:700 }}>{C.label}</div>
          {side && <div style={{ fontSize:11, opacity:0.8, marginTop:1 }}>{side}</div>}
        </div>
      </div>
      {rec.units > 0 && betAmt > 0 && (
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:18, fontWeight:800 }}>${betAmt.toLocaleString()}</div>
          <div style={{ fontSize:10, opacity:0.7 }}>{rec.pct}% of bankroll</div>
        </div>
      )}
    </div>
  );
}

function GameCard({ game, teamMap, injAdj, bankroll }) {
  const h = teamMap[game.home], a = teamMap[game.away];
  if (!h || !a) return (
    <div style={{ background:S.cardBg, border:`1px solid ${S.cardBorder}`, borderRadius:10,
      padding:"12px", marginBottom:10, fontSize:12, color:S.textMuted }}>
      ⚠️ Unknown team: {game.away} @ {game.home}
    </div>
  );
  const proj   = calcSpread(game, teamMap, injAdj);
  const edge   = getEdge(proj, game.dkSpread);
  const rec    = getNFLRec(edge);
  const betAmt = bankroll > 0 ? Math.round(bankroll * rec.pct / 100) : 0;
  const projLbl = proj >= 0 ? `${h.abbr} −${Math.abs(proj)}` : `${a.abbr} −${Math.abs(proj)}`;
  const dkLbl   = game.dkSpread <= 0 ? `${h.abbr} −${Math.abs(game.dkSpread)}` : `${a.abbr} −${Math.abs(game.dkSpread)}`;
  const eColor  = Math.abs(edge) >= 2.5 ? S.green : Math.abs(edge) >= 1.5 ? S.leanText : S.textMuted;
  const lBorder = rec.verdict==="BEST" ? S.bestBg : rec.verdict==="BET" ? S.betBorder : rec.verdict==="LEAN" ? S.leanBorder : S.cardBorder;

  return (
    <div style={{ background:S.cardBg, border:`1px solid ${S.cardBorder}`,
      borderLeft:`4px solid ${lBorder}`, borderRadius:10, overflow:"hidden", marginBottom:10 }}>
      <div style={{ background:S.subBg, padding:"7px 14px", borderBottom:`1px solid ${S.cardBorder}`,
        display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
        <span style={{ fontSize:11, color:S.textSecondary, fontWeight:500 }}>
          {game.gameTime} · {game.network}
          {game.neutral && <span style={{ marginLeft:8, fontSize:10, background:S.blueBg,
            color:S.blue, padding:"2px 7px", borderRadius:8, fontWeight:600 }}>NEUTRAL</span>}
        </span>
        {game.notes && <span style={{ fontSize:10, color:S.textMuted, fontStyle:"italic" }}>{game.notes}</span>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 44px 1fr", alignItems:"center", padding:"12px 16px", gap:8 }}>
        <div>
          <div style={{ fontSize:17, fontWeight:700, color:S.textPrimary }}>{a.abbr}</div>
          <div style={{ fontSize:11, color:S.textSecondary, marginTop:1 }}>{a.name.split(" ").slice(-1)[0]}</div>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3 }}>
            <span style={{ background:S.subBg, border:`1px solid ${S.cardBorder}`, borderRadius:4,
              padding:"1px 5px", fontSize:10, fontWeight:700, color:S.textSecondary }}>#{a.rank}</span>
            <span style={{ fontSize:11, color:S.textMuted }}>{a.fpiPts>0?"+":""}{a.fpiPts.toFixed(1)} FPI</span>
          </div>
        </div>
        <div style={{ textAlign:"center", color:S.textMuted, fontSize:12, fontWeight:500 }}>@</div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:17, fontWeight:700, color:S.textPrimary }}>{h.abbr}</div>
          <div style={{ fontSize:11, color:S.textSecondary, marginTop:1 }}>{h.name.split(" ").slice(-1)[0]}</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:4, marginTop:3 }}>
            <span style={{ fontSize:11, color:S.textMuted }}>{h.fpiPts>0?"+":""}{h.fpiPts.toFixed(1)} FPI</span>
            <span style={{ background:S.subBg, border:`1px solid ${S.cardBorder}`, borderRadius:4,
              padding:"1px 5px", fontSize:10, fontWeight:700, color:S.textSecondary }}>#{h.rank}</span>
          </div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", background:S.subBg,
        borderTop:`1px solid ${S.cardBorder}` }}>
        {[
          { label:"Our Proj",  val:projLbl,                              color:S.textPrimary },
          { label:"DK Line",   val:dkLbl,                                color:S.textPrimary },
          { label:"Edge",      val:`${edge>=0?"+":""}${edge.toFixed(1)}`, color:eColor },
          { label:"Total O/U", val:game.dkTotal,                         color:S.textPrimary },
        ].map((c,i) => (
          <div key={i} style={{ padding:"8px 6px", textAlign:"center",
            borderRight:i<3?`1px solid ${S.cardBorder}`:"none" }}>
            <div style={{ fontSize:9, color:S.textMuted, textTransform:"uppercase",
              letterSpacing:"0.08em", marginBottom:3 }}>{c.label}</div>
            <div style={{ fontSize:13, fontWeight:700, color:c.color }}>{c.val}</div>
          </div>
        ))}
      </div>
      <div style={{ padding:"0 14px 12px" }}>
        <VerdictBanner rec={rec} betAmt={betAmt} awayAbbr={a.abbr} homeAbbr={h.abbr} />
      </div>
    </div>
  );
}

function InjurySlider({ abbr, name, value, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0",
      borderBottom:`1px solid ${S.cardBorder}` }}>
      <div style={{ minWidth:150, fontSize:12, color:S.textPrimary, fontWeight:500 }}>{name}</div>
      <input type="range" min={-7} max={0} step={0.5} value={value}
        onChange={e => onChange(abbr, parseFloat(e.target.value))} />
      <div style={{ minWidth:60, fontSize:12, textAlign:"right", fontWeight:700,
        color:value<0?"#C0392B":S.green }}>
        {value === 0 ? "Healthy" : `${value.toFixed(1)} pts`}
      </div>
    </div>
  );
}

// ─── LIVE FETCH BUTTON ────────────────────────────────────────────────────────
function FetchButton({ label, icon, status, onFetch, description }) {
  const statusCfg = {
    idle:    { bg:S.subBg,     color:S.textMuted,  dot:"#C0BAB0", text:"Ready" },
    loading: { bg:"#FEF8EC",   color:S.leanText,   dot:S.leanBorder, text:"Fetching…" },
    done:    { bg:"#EBF5EE",   color:S.green,      dot:S.green,   text:"Updated ✓" },
    error:   { bg:"#FEECEC",   color:S.red,        dot:S.redBorder, text:"Error — retry" },
  };
  const sc = statusCfg[status] || statusCfg.idle;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
      background:S.subBg, borderRadius:8, marginBottom:8, flexWrap:"wrap" }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:700, color:S.textPrimary }}>{label}</div>
        <div style={{ fontSize:11, color:S.textMuted, marginTop:1,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{description}</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:10,
        background:sc.bg, color:sc.color, padding:"3px 9px", borderRadius:20, fontWeight:600 }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:sc.dot,
          animation:status==="loading"?"pulse 1s infinite":"none" }} />
        {sc.text}
      </div>
      <button onClick={onFetch} disabled={status==="loading"} style={btn(true, true, status==="loading")}>
        {status==="loading" ? "Fetching…" : `🔄 ${label}`}
      </button>
    </div>
  );
}

// ─── MAIN NFL APP ─────────────────────────────────────────────────────────────
export default function NFLEdge() {
  const [fpiData,   setFpiData]   = useState(DEFAULT_FPI);
  const [games,     setGames]     = useState(DEFAULT_GAMES);
  const [fpiStatus, setFpiStatus] = useState("idle");
  const [dkStatus,  setDkStatus]  = useState("idle");
  const [fpiDesc,   setFpiDesc]   = useState("ESPN FPI preseason 2026 · Rams #1");
  const [dkDesc,    setDkDesc]    = useState("DraftKings opening lines · May 15 2026");
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
  const allTeams = [...new Set(games.flatMap(g => [g.home, g.away]))].sort();
  const updateInj = useCallback((abbr, val) => setInjAdj(p => ({...p, [abbr]:val})), []);

  // ── LIVE FETCH FPI ──────────────────────────────────────────────────────────
  const fetchFPI = useCallback(async () => {
    setFpiStatus("loading");
    const today = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});

    const searchPrompt = `Search for the current ESPN NFL FPI power rankings for 2026. Find the full ranked list of all 32 NFL teams with their FPI values.`;

    const formatPrompt = `Convert this NFL FPI ranking data into a JSON array of exactly 32 teams.
Return ONLY the raw JSON array with no other text, no markdown, no explanation.
Each item must have: rank (1-32), name (full team name), abbr (use: LAR,BUF,BAL,SEA,SF,GB,LAC,DET,KC,PHI,DAL,CIN,HOU,NE,DEN,CHI,JAC,TB,MIN,IND,WSH,PIT,NYG,NO,ATL,TEN,CAR,LV,ARI,CLE,NYJ,MIA), fpiPts (rank 1=9.0 down to rank 32=-8.4 in linear steps), conf ("NFC" or "AFC"), dome (boolean), hfa (SEA=3.0, BAL/GB/KC/NO/PIT=2.5, LAC/DAL/NE/CAR/NYG/NYJ/MIA=1.5, rest=2.0).
Start your response with [ and end with ].`;

    try {
      const text = await fetchWithSearch(searchPrompt, formatPrompt);
      const parsed = extractJSON(text);
      if (!Array.isArray(parsed) || parsed.length < 30) throw new Error("Only got " + parsed.length + " teams");
      setFpiData(parsed);
      setFpiDesc(`ESPN FPI — fetched ${today}`);
      setFpiStatus("done");
    } catch(e) {
      console.error("NFL FPI fetch error:", e.message);
      setFpiStatus("error");
    }
  }, []);

  // ── LIVE FETCH DK LINES ─────────────────────────────────────────────────────
  const fetchDK = useCallback(async () => {
    setDkStatus("loading");
    const today = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});

    const searchPrompt = `Search for NFL Week ${weekNum} 2026 point spreads and totals. Find the DraftKings or any sportsbook lines for all games this week.`;

    const formatPrompt = `Convert this NFL Week ${weekNum} betting lines data into a JSON array of all games.
Return ONLY the raw JSON array with no other text, no markdown, no explanation.
Each item must have: away (team abbr), home (team abbr), dkSpread (number, home perspective: negative = home favored), dkTotal (number), gameTime (string like "Sun Sep 13 · 1:00 PM"), network (string), neutral (boolean), notes (string).
Use these abbreviations: LAR,BUF,BAL,SEA,SF,GB,LAC,DET,KC,PHI,DAL,CIN,HOU,NE,DEN,CHI,JAC,TB,MIN,IND,WSH,PIT,NYG,NO,ATL,TEN,CAR,LV,ARI,CLE,NYJ,MIA.
Start your response with [ and end with ].`;

    try {
      const text = await fetchWithSearch(searchPrompt, formatPrompt);
      const parsed = extractJSON(text);
      if (!Array.isArray(parsed) || parsed.length < 8) throw new Error("Only got " + parsed.length + " games");
      setGames(parsed);
      setDkDesc(`DraftKings Week ${weekNum} — fetched ${today}`);
      setDkStatus("done");
    } catch(e) {
      console.error("NFL DK fetch error:", e.message);
      setDkStatus("error");
    }
  }, [weekNum]);

  // ── COMPUTED ────────────────────────────────────────────────────────────────
  const computed = games.map(g => {
    const proj = calcSpread(g, teamMap, injAdj);
    const edge = getEdge(proj, g.dkSpread);
    const rec  = getNFLRec(edge);
    return { ...g, proj, edge, rec };
  });
  const edgePlays  = computed.filter(g => g.rec.tier >= 2);
  const bestPlays  = computed.filter(g => g.rec.tier >= 3);
  const totalUnits = computed.reduce((a,g) => a + g.rec.units, 0);
  const totalExp   = bankroll > 0 ? computed.reduce((a,g) => a + Math.round(bankroll*g.rec.pct/100), 0) : 0;
  const filtered   = computed.filter(g =>
    filter==="bets" ? g.rec.tier>=2 : filter==="best" ? g.rec.tier>=3 :
    filter==="pass" ? g.rec.tier===0 : true
  );

  // ── AI HANDICAPPER ──────────────────────────────────────────────────────────
  const runAI = useCallback(async () => {
    setAiLoading(true);
    const rows = computed.map(g => {
      const h=teamMap[g.home], a=teamMap[g.away]; if(!h||!a) return "";
      const pL = g.proj>=0?`${h.abbr}-${Math.abs(g.proj)}`:`${a.abbr}-${Math.abs(g.proj)}`;
      const dL = g.dkSpread<=0?`${h.abbr}-${Math.abs(g.dkSpread)}`:`${a.abbr}-${Math.abs(g.dkSpread)}`;
      return `${a.abbr}(#${a.rank})@${h.abbr}(#${h.rank})|Proj:${pL}|DK:${dL}|Edge:${g.edge>=0?"+":""}${g.edge.toFixed(1)}|${g.rec.verdict}(${g.rec.units}u)`;
    }).filter(Boolean).join("\n");

    const sys = `Sharp NFL betting analyst. Power rating methodology: team FPI values, edge = proj spread minus book line, bet when edge ≥ 2.5 pts, HFA 2.0-2.5 pts, QB injuries = 7 pts, never exceed 3% bankroll. Direct and specific.`;
    const msg = `NFL Week ${weekNum} 2026:\n\n${rows}\n\nBest bets: ${bestPlays.length} | Edge plays: ${edgePlays.length}\n\nTop 2 plays with reasoning, one fade, unit-sizing note.`;

    try {
      const data = await callClaude({ model:"claude-sonnet-4-6", max_tokens:900, system:sys, messages:[{role:"user",content:msg}] });
      const text = extractText(data) || "No response.";
      setAiOutput(text);
      setChatHist([{role:"user",content:msg},{role:"assistant",content:text}]);
    } catch(e) { setAiOutput("Could not reach AI: " + e.message); }
    setAiLoading(false);
  }, [computed, teamMap, bestPlays.length, edgePlays.length, weekNum]);

  const askFollowUp = useCallback(async () => {
    if (!question.trim() || !chatHist.length) return;
    const q = question.trim(); setQuestion(""); setAiLoading(true);
    const ctx = computed.map(g=>`${g.away}@${g.home}:${g.edge>=0?"+":""}${g.edge.toFixed(1)}`).join("|");
    const msgs = [...chatHist, {role:"user",content:`${ctx}\n\n${q}`}];
    try {
      const data = await callClaude({ model:"claude-sonnet-4-6", max_tokens:600,
        system:"Sharp NFL analyst. Power ratings. Direct and specific.", messages:msgs });
      const text = extractText(data) || "";
      setAiOutput(p => `${p}\n\n━━━━\nYou: ${q}\n\n${text}`);
      setChatHist([...msgs, {role:"assistant",content:text}]);
    } catch(e) { setAiOutput(p => p+"\n\nError: " + e.message); }
    setAiLoading(false);
  }, [question, chatHist, computed]);

  const exportPicks = () => {
    const lines = [`THE EDGE — NFL WEEK ${weekNum} 2026`, "=".repeat(50),
      `Bankroll: $${bankroll.toLocaleString()}`,
      `Best bets: ${bestPlays.length} | Edge plays: ${edgePlays.length} | Exposure: $${totalExp.toLocaleString()} (${totalUnits}u)`,
      `FPI: ${fpiDesc}`, `Lines: ${dkDesc}`, ""];
    computed.forEach(g => {
      const h=teamMap[g.home],a=teamMap[g.away]; if(!h||!a) return;
      const bet = bankroll>0?Math.round(bankroll*g.rec.pct/100):0;
      lines.push(`${a.abbr} @ ${h.abbr}  ${g.gameTime}`);
      lines.push(`  ${g.proj>=0?h.abbr+" -"+Math.abs(g.proj):a.abbr+" -"+Math.abs(g.proj)} proj | ${g.dkSpread<=0?h.abbr+" -"+Math.abs(g.dkSpread):a.abbr+" -"+Math.abs(g.dkSpread)} DK | ${g.edge>=0?"+":""}${g.edge.toFixed(1)} edge`);
      lines.push(`  → ${g.rec.verdict} (${g.rec.units}u)${bet>0?" — $"+bet.toLocaleString():""}`);
      if(g.notes) lines.push(`  ${g.notes}`);
      lines.push("");
    });
    lines.push("For entertainment only. Bet responsibly. 21+.");
    const blob=new Blob([lines.join("\n")],{type:"text/plain"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download=`the-edge-nfl-week${weekNum}-2026.txt`; a.click();
  };

  return (
    <div style={{ background:S.pageBg, minHeight:"100vh", padding:"1.25rem 1rem" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
      <div style={{ maxWidth:720, margin:"0 auto" }}>

        {/* NAV */}
        <div style={{ display:"flex", gap:8, marginBottom:"1rem" }}>
          <div style={{ background:S.green, color:"#fff", fontSize:12, fontWeight:700,
            padding:"6px 16px", borderRadius:20 }}>🏈 NFL</div>
          <Link href="/cfb" style={{ background:S.subBg, color:S.textSecondary, fontSize:12,
            fontWeight:600, padding:"6px 16px", borderRadius:20, textDecoration:"none",
            border:`1px solid ${S.cardBorder}` }}>🎓 NCAAF</Link>
        </div>

        {/* HEADER */}
        <div style={{ marginBottom:"1rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                <h1 style={{ fontSize:22, fontWeight:800, color:S.textPrimary, margin:0, letterSpacing:"-0.02em" }}>The Edge</h1>
                <span style={{ background:S.green, color:"#fff", fontSize:10, fontWeight:700,
                  padding:"3px 9px", borderRadius:4, letterSpacing:"0.06em" }}>NFL 2026</span>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:12, color:S.textSecondary }}>Week</span>
                  <select value={weekNum} onChange={e => setWeekNum(+e.target.value)}
                    style={{ fontSize:13, fontWeight:700, color:S.textPrimary, padding:"2px 6px",
                      borderRadius:5, border:`1px solid ${S.cardBorder}`, background:S.cardBg }}>
                    {Array.from({length:18},(_,i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ fontSize:12, color:S.textSecondary }}>Power Rating System · ESPN FPI · DraftKings Lines</div>
            </div>
            <div style={{ fontSize:11, color:S.textSecondary, textAlign:"right", lineHeight:1.7 }}>
              <div style={{ color:S.green, fontWeight:700 }}>● Live model</div>
              <div>Refresh every Tuesday</div>
            </div>
          </div>
        </div>

        {/* LIVE FETCH PANEL */}
        <div style={{ background:S.cardBg, border:`1.5px solid ${S.green}`, borderRadius:10,
          padding:"14px 16px", marginBottom:"1rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <span style={{ fontSize:16 }}>📡</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:S.textPrimary }}>Live Data — One Tap Update</div>
              <div style={{ fontSize:11, color:S.textMuted }}>Tap each button Tuesday morning — fetches latest ESPN FPI + DraftKings lines automatically</div>
            </div>
          </div>
          <FetchButton label="Fetch FPI" icon="📊" status={fpiStatus} description={fpiDesc} onFetch={fetchFPI} />
          <FetchButton label="Fetch Lines" icon="💰" status={dkStatus} description={dkDesc} onFetch={fetchDK} />
          <div style={{ marginTop:10, padding:"8px 10px", background:S.blueBg, borderRadius:6,
            fontSize:11, color:S.blue, lineHeight:1.6 }}>
            💡 Each fetch takes ~10 seconds. Run FPI first, then Lines. Board updates automatically.
          </div>
        </div>

        {/* BANKROLL */}
        <div style={{ background:S.cardBg, border:`1px solid ${S.cardBorder}`, borderRadius:10,
          padding:"12px 16px", marginBottom:"1rem", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ fontSize:13, fontWeight:600, color:S.textPrimary }}>My bankroll</div>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:14, color:S.textSecondary }}>$</span>
            <input type="number" value={bankroll} min={0} step={100}
              onChange={e => setBankroll(Math.max(0, parseInt(e.target.value)||0))}
              style={{ width:110, fontSize:15, fontWeight:700, color:S.textPrimary,
                padding:"5px 10px", borderRadius:6, border:`1.5px solid ${S.green}`,
                background:S.greenLight, outline:"none" }} />
          </div>
          <div style={{ fontSize:12, color:S.textSecondary }}>
            1u=<b style={{color:S.textPrimary}}>${Math.round(bankroll*.01).toLocaleString()}</b>
            {" · "}2u=<b style={{color:S.textPrimary}}>${Math.round(bankroll*.02).toLocaleString()}</b>
            {" · "}3u=<b style={{color:S.textPrimary}}>${Math.round(bankroll*.03).toLocaleString()}</b>
          </div>
        </div>

        {/* METRICS */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:"1rem" }}>
          {[
            { label:"Best bets",  val:bestPlays.length,  sub:"≥ 3.5 pt edge", accent:S.green },
            { label:"Edge plays", val:edgePlays.length,  sub:"≥ 2.5 pt edge", accent:S.green },
            { label:"Exposure",   val:bankroll>0?`$${totalExp.toLocaleString()}`:"—", sub:`${totalUnits}u`, accent:S.textPrimary },
            { label:"Games",      val:games.length,      sub:`Week ${weekNum}`, accent:S.textPrimary },
          ].map(m => (
            <div key={m.label} style={{ background:S.cardBg, border:`1px solid ${S.cardBorder}`, borderRadius:8, padding:"10px 12px" }}>
              <div style={{ fontSize:10, color:S.textMuted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{m.label}</div>
              <div style={{ fontSize:20, fontWeight:800, color:m.accent }}>{m.val}</div>
              <div style={{ fontSize:10, color:S.textMuted, marginTop:2 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* CONTROLS */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:"1rem" }}>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ fontSize:13, padding:"7px 10px", borderRadius:7, border:`1px solid ${S.cardBorder}`,
              background:S.cardBg, color:S.textPrimary, fontWeight:500, cursor:"pointer" }}>
            <option value="all">All games</option>
            <option value="bets">Bets only (≥2.5)</option>
            <option value="best">Best bets (≥3.5)</option>
            <option value="pass">Pass games</option>
          </select>
          <button onClick={() => setShowInj(s=>!s)} style={btn(false)}>{showInj?"Hide":"Edit"} injuries</button>
          <button onClick={runAI} disabled={aiLoading} style={btn(true, false, aiLoading)}>{aiLoading?"Analyzing…":"⚡ AI Handicapper"}</button>
          <button onClick={exportPicks} style={btn(false)}>↓ Export</button>
        </div>

        {/* VERDICT KEY */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:"1rem" }}>
          {[
            {icon:"🔥",label:"Best bet · 3u · 3%",bg:S.bestBg, color:S.bestText, border:S.bestBg},
            {icon:"✅",label:"Play · 2u · 2%",    bg:S.betBg,  color:S.betText,  border:S.betBorder},
            {icon:"👀",label:"Lean · 1u · 1%",    bg:S.leanBg, color:S.leanText, border:S.leanBorder},
            {icon:"⏭", label:"No bet · pass",     bg:S.passBg, color:S.passText, border:S.passBorder},
          ].map((k,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11,
              background:k.bg, color:k.color, border:`1px solid ${k.border}`,
              borderRadius:20, padding:"4px 10px", fontWeight:600 }}>
              {k.icon} {k.label}
            </div>
          ))}
        </div>

        {/* INJURY PANEL */}
        {showInj && (
          <div style={{ background:S.cardBg, border:`1px solid ${S.cardBorder}`, borderRadius:10,
            padding:"14px 16px", marginBottom:"1rem" }}>
            <div style={{ fontSize:13, fontWeight:700, color:S.textPrimary, marginBottom:4 }}>Injury adjustments</div>
            <div style={{ fontSize:11, color:S.textSecondary, marginBottom:12 }}>QB out ≈ −7 pts · Key WR/RB ≈ −1 pt · Depth injuries = zero impact</div>
            {allTeams.map(abbr => {
              const t=teamMap[abbr]; if(!t) return null;
              return <InjurySlider key={abbr} abbr={abbr} name={t.name.split(" ").slice(-2).join(" ")} value={injAdj[abbr]||0} onChange={updateInj}/>;
            })}
            <button onClick={() => setInjAdj({})} style={{ marginTop:10, fontSize:12, color:"#C0392B", background:"none", border:"none", cursor:"pointer" }}>Reset all</button>
          </div>
        )}

        {/* AI PANEL */}
        {(aiOutput || aiLoading) && (
          <div style={{ background:S.cardBg, border:`1px solid ${S.cardBorder}`, borderRadius:10,
            padding:"14px 16px", marginBottom:"1rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:S.green,
                animation:aiLoading?"pulse 1s infinite":"none" }} />
              <span style={{ fontSize:13, fontWeight:700, color:S.textPrimary }}>AI Handicapper</span>
            </div>
            {aiLoading && !aiOutput
              ? <div style={{ fontSize:13, color:S.textSecondary, fontStyle:"italic" }}>Reading the board…</div>
              : <div style={{ fontSize:13, color:S.textPrimary, lineHeight:1.8, whiteSpace:"pre-wrap" }}>{aiOutput}</div>
            }
            {chatHist.length > 0 && (
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <input value={question} onChange={e=>setQuestion(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&askFollowUp()}
                  placeholder="Ask about a game, line, or injury…"
                  style={{ flex:1, fontSize:13, padding:"7px 12px", borderRadius:7,
                    border:`1px solid ${S.cardBorder}`, background:S.pageBg, color:S.textPrimary }}/>
                <button onClick={askFollowUp} disabled={aiLoading} style={btn(true, false, aiLoading)}>Send</button>
              </div>
            )}
          </div>
        )}

        {/* GAME BOARD */}
        <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.09em",
          color:S.textMuted, fontWeight:700, marginBottom:10 }}>
          Week {weekNum} · {filtered.length}/{games.length} games
        </div>
        {filtered.map((g,i) => <GameCard key={i} game={g} teamMap={teamMap} injAdj={injAdj} bankroll={bankroll}/>)}
        {filtered.length === 0 && (
          <div style={{ padding:"2rem", textAlign:"center", color:S.textSecondary,
            fontSize:13, background:S.cardBg, borderRadius:8, border:`1px solid ${S.cardBorder}` }}>
            No games match this filter.
          </div>
        )}

        <div style={{ fontSize:11, color:S.textMuted, borderTop:`1px solid ${S.cardBorder}`,
          paddingTop:"0.75rem", marginTop:"1rem", lineHeight:1.7 }}>
          ⚠️ For informational and entertainment purposes only. Not financial advice. Sports betting involves risk. Must be 21+.
        </div>
      </div>
    </div>
  );
}
