import { useState, useCallback } from "react";
import Link from "next/link";
import { buildTeamMap, calcSpread, getEdge, getCFBRec, getSpreadPenalty, getAdjustedEdge, parseFPICSV, parseDKCSV } from "../lib/engine";
import { S, btn } from "../lib/components";
import { callClaude, extractText, extractJSON, fetchWithSearch } from "../lib/fetcher";

// ─── DEFAULT NCAAF DATA (2026 ESPN FPI preseason) ─────────────────────────────
const DEFAULT_FPI = [
  { rank:1,  name:"Ohio State",        abbr:"OSU",  conf:"Big Ten", fpiPts:28.7, hfa:3.5, dome:false },
  { rank:2,  name:"Texas",             abbr:"TEX",  conf:"SEC",     fpiPts:25.8, hfa:4.0, dome:false },
  { rank:3,  name:"Notre Dame",        abbr:"ND",   conf:"Ind",     fpiPts:23.4, hfa:3.5, dome:false },
  { rank:4,  name:"Oregon",            abbr:"ORE",  conf:"Big Ten", fpiPts:21.9, hfa:3.5, dome:false },
  { rank:5,  name:"Georgia",           abbr:"UGA",  conf:"SEC",     fpiPts:20.6, hfa:4.0, dome:false },
  { rank:6,  name:"Indiana",           abbr:"IND",  conf:"Big Ten", fpiPts:19.1, hfa:3.0, dome:false },
  { rank:7,  name:"Miami FL",          abbr:"MIA",  conf:"ACC",     fpiPts:17.8, hfa:3.0, dome:false },
  { rank:8,  name:"Alabama",           abbr:"ALA",  conf:"SEC",     fpiPts:16.5, hfa:4.0, dome:false },
  { rank:9,  name:"LSU",               abbr:"LSU",  conf:"SEC",     fpiPts:15.3, hfa:4.0, dome:false },
  { rank:10, name:"Penn State",        abbr:"PSU",  conf:"Big Ten", fpiPts:14.2, hfa:3.5, dome:false },
  { rank:11, name:"Texas A&M",         abbr:"ATM",  conf:"SEC",     fpiPts:13.1, hfa:4.0, dome:false },
  { rank:12, name:"Oklahoma",          abbr:"OU",   conf:"SEC",     fpiPts:12.0, hfa:3.5, dome:false },
  { rank:13, name:"USC",               abbr:"USC",  conf:"Big Ten", fpiPts:11.0, hfa:3.0, dome:false },
  { rank:14, name:"Ole Miss",          abbr:"MISS", conf:"SEC",     fpiPts:10.1, hfa:3.5, dome:false },
  { rank:15, name:"Michigan",          abbr:"MICH", conf:"Big Ten", fpiPts: 9.2, hfa:3.5, dome:false },
  { rank:16, name:"Tennessee",         abbr:"TENN", conf:"SEC",     fpiPts: 8.4, hfa:4.0, dome:false },
  { rank:17, name:"Florida",           abbr:"FLA",  conf:"SEC",     fpiPts: 7.0, hfa:3.5, dome:false },
  { rank:18, name:"Clemson",           abbr:"CLEM", conf:"ACC",     fpiPts: 6.3, hfa:3.5, dome:false },
  { rank:19, name:"BYU",               abbr:"BYU",  conf:"Big 12",  fpiPts: 5.7, hfa:3.5, dome:false },
  { rank:20, name:"Missouri",          abbr:"MIZ",  conf:"SEC",     fpiPts: 5.1, hfa:3.0, dome:false },
  { rank:21, name:"Auburn",            abbr:"AUB",  conf:"SEC",     fpiPts: 4.5, hfa:3.5, dome:false },
  { rank:22, name:"South Carolina",    abbr:"SCU",  conf:"SEC",     fpiPts: 3.9, hfa:3.0, dome:false },
  { rank:23, name:"SMU",               abbr:"SMU",  conf:"ACC",     fpiPts: 3.3, hfa:3.0, dome:true  },
  { rank:24, name:"Iowa",              abbr:"IOWA", conf:"Big Ten", fpiPts: 2.8, hfa:3.5, dome:false },
  { rank:25, name:"Kansas State",      abbr:"KST",  conf:"Big 12",  fpiPts: 2.2, hfa:3.0, dome:false },
  { rank:26, name:"Utah",              abbr:"UTAH", conf:"Big 12",  fpiPts: 1.8, hfa:3.5, dome:false },
  { rank:27, name:"Wisconsin",         abbr:"WIS",  conf:"Big Ten", fpiPts: 1.3, hfa:3.0, dome:false },
  { rank:28, name:"North Carolina",    abbr:"UNC",  conf:"ACC",     fpiPts: 0.8, hfa:3.0, dome:false },
  { rank:29, name:"Arkansas",          abbr:"ARK",  conf:"SEC",     fpiPts: 0.3, hfa:3.0, dome:false },
  { rank:30, name:"TCU",               abbr:"TCU",  conf:"Big 12",  fpiPts:-0.3, hfa:3.0, dome:false },
  { rank:31, name:"Arizona",           abbr:"ARIZ", conf:"Big 12",  fpiPts:-0.9, hfa:3.0, dome:false },
  { rank:32, name:"Duke",              abbr:"DUKE", conf:"ACC",     fpiPts:-1.5, hfa:3.0, dome:false },
  { rank:33, name:"Louisville",        abbr:"LOU",  conf:"ACC",     fpiPts:-2.1, hfa:3.0, dome:false },
  { rank:34, name:"Nebraska",          abbr:"NEB",  conf:"Big Ten", fpiPts:-2.8, hfa:3.5, dome:false },
  { rank:35, name:"Kentucky",          abbr:"UK",   conf:"SEC",     fpiPts:-3.2, hfa:3.0, dome:false },
  { rank:36, name:"Washington",        abbr:"WASH", conf:"Big Ten", fpiPts:-3.8, hfa:3.0, dome:false },
  { rank:37, name:"Colorado",          abbr:"COL",  conf:"Big 12",  fpiPts:-4.5, hfa:3.0, dome:false },
  { rank:38, name:"Mississippi State", abbr:"MST",  conf:"SEC",     fpiPts:-4.0, hfa:3.0, dome:false },
  { rank:39, name:"Vanderbilt",        abbr:"VAN",  conf:"SEC",     fpiPts:-5.5, hfa:2.5, dome:false },
  { rank:40, name:"San Jose State",    abbr:"SJS",  conf:"MWC",     fpiPts:-8.0, hfa:2.5, dome:false },
];

const DEFAULT_GAMES = [
  { away:"TEX",  home:"OSU",  dkSpread: 3.5, dkTotal:58.5, gameTime:"Sat Aug 29 · 8:00 PM", network:"ABC",   neutral:true,  notes:"Dublin Ireland · Neutral site" },
  { away:"ALA",  home:"ND",   dkSpread:-2.5, dkTotal:52.5, gameTime:"Sat Sep 5  · 7:30 PM", network:"NBC",   neutral:false, notes:"South Bend opener" },
  { away:"UGA",  home:"LSU",  dkSpread:-3.0, dkTotal:54.0, gameTime:"Sat Sep 5  · 8:00 PM", network:"ESPN",  neutral:false, notes:"SEC opener" },
  { away:"ORE",  home:"MICH", dkSpread:-7.0, dkTotal:50.5, gameTime:"Sat Sep 5  · 12:00 PM",network:"FOX",   neutral:false, notes:"" },
  { away:"IND",  home:"MIA",  dkSpread:-2.5, dkTotal:55.5, gameTime:"Sat Sep 5  · 3:30 PM", network:"CBS",   neutral:false, notes:"Defending champ road" },
  { away:"ATM",  home:"OU",   dkSpread:-4.0, dkTotal:53.0, gameTime:"Sat Sep 5  · 7:00 PM", network:"ESPN",  neutral:false, notes:"SEC rivalry" },
  { away:"PSU",  home:"WIS",  dkSpread:-13.5,dkTotal:47.5, gameTime:"Sat Sep 5  · 12:00 PM",network:"BTN",   neutral:false, notes:"" },
  { away:"TENN", home:"FLA",  dkSpread:-5.5, dkTotal:56.5, gameTime:"Sat Sep 5  · 3:30 PM", network:"CBS",   neutral:false, notes:"Third Saturday in September" },
  { away:"BYU",  home:"UTAH", dkSpread:-6.5, dkTotal:51.5, gameTime:"Sat Sep 5  · 10:00 PM",network:"FS1",   neutral:false, notes:"Holy War" },
  { away:"USC",  home:"NEB",  dkSpread:-14.5,dkTotal:52.0, gameTime:"Sat Sep 5  · 7:30 PM", network:"NBC",   neutral:false, notes:"" },
  { away:"MISS", home:"ARK",  dkSpread:-9.5, dkTotal:58.0, gameTime:"Sat Sep 5  · 7:00 PM", network:"ESPN2", neutral:false, notes:"" },
  { away:"CLEM", home:"LOU",  dkSpread:-10.5,dkTotal:50.0, gameTime:"Sat Sep 5  · 7:00 PM", network:"ACCN",  neutral:false, notes:"" },
  { away:"SMU",  home:"DUKE", dkSpread:-8.5, dkTotal:57.5, gameTime:"Sat Sep 5  · 12:00 PM",network:"ACCN",  neutral:false, notes:"" },
  { away:"MIZ",  home:"UK",   dkSpread:-5.0, dkTotal:48.5, gameTime:"Sat Sep 5  · 12:00 PM",network:"SEC",   neutral:false, notes:"" },
  { away:"AUB",  home:"MST",  dkSpread:-11.0,dkTotal:47.5, gameTime:"Sat Sep 5  · 3:30 PM", network:"SEC",   neutral:false, notes:"" },
  { away:"COL",  home:"ARIZ", dkSpread:-3.5, dkTotal:60.5, gameTime:"Sat Sep 5  · 10:30 PM",network:"FS1",   neutral:false, notes:"Deion vs Fisch" },
];

// ─── SPREAD CONTEXT ───────────────────────────────────────────────────────────
function getSpreadContext(dkSpread) {
  const abs = Math.abs(dkSpread);
  const fav = dkSpread < 0 ? "Home" : "Away";
  if (abs >= 28) return { label:`${fav} −${abs} · HEAVY FAV`, color:S.red,     warn:"Cover rate ~40% historically" };
  if (abs >= 21) return { label:`${fav} −${abs} · LARGE FAV`, color:"#C0392B", warn:"Cover rate ~44% historically" };
  if (abs >= 14) return { label:`${fav} −${abs} · BIG FAV`,   color:"#D4A017", warn:"Cover rate ~47% — caution zone" };
  if (abs >= 7)  return { label:`${fav} −${abs}`,             color:S.textSecondary, warn:"" };
  return               { label:"Close game",                  color:S.green,   warn:"" };
}

// ─── FETCH BUTTON ─────────────────────────────────────────────────────────────
function FetchButton({ label, icon, status, onFetch, description }) {
  const sc = {
    idle:    { bg:S.subBg,   color:S.textMuted, dot:"#C0BAB0", text:"Ready" },
    loading: { bg:"#FEF8EC", color:S.leanText,  dot:S.leanBorder, text:"Fetching…" },
    done:    { bg:"#EBF5EE", color:S.green,     dot:S.green,  text:"Updated ✓" },
    error:   { bg:"#FEECEC", color:S.red,       dot:"#C0392B",text:"Error — retry" },
  }[status] || { bg:S.subBg, color:S.textMuted, dot:"#C0BAB0", text:"Ready" };

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

// ─── VERDICT BANNER ───────────────────────────────────────────────────────────
function VerdictBanner({ rec, betAmt, adjEdge, rawEdge, dkSpread, awayAbbr, homeAbbr }) {
  const C = {
    BEST:{ bg:S.bestBg, color:S.bestText, icon:"🔥", label:"BEST BET · 3 UNITS", border:S.bestBg },
    BET: { bg:S.betBg,  color:S.betText,  icon:"✅", label:"PLAY · 2 UNITS",     border:S.betBorder },
    LEAN:{ bg:S.leanBg, color:S.leanText, icon:"👀", label:"LEAN · 1 UNIT",      border:S.leanBorder },
    PASS:{ bg:S.passBg, color:S.passText, icon:"⏭",  label:"NO BET · PASS",      border:S.passBorder },
  }[rec.verdict];
  const side = rec.dir === "away" ? `Take ${awayAbbr} +ATS`
             : rec.dir === "home" ? `Take ${homeAbbr} −ATS` : null;
  const penalty = getSpreadPenalty(dkSpread);

  return (
    <div style={{ background:C.bg, color:C.color, border:`1px solid ${C.border}`,
      borderRadius:8, padding:"9px 13px", marginTop:10 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
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
      {penalty < 0 && rec.verdict !== "PASS" && (
        <div style={{ marginTop:6, fontSize:10, opacity:0.8,
          borderTop:`1px solid ${C.border}`, paddingTop:5 }}>
          ⚠️ Raw edge {rawEdge>=0?"+":""}{rawEdge.toFixed(1)} → adjusted to {adjEdge>=0?"+":""}{adjEdge.toFixed(1)} ({penalty} wide-spread penalty)
        </div>
      )}
    </div>
  );
}

// ─── GAME CARD ────────────────────────────────────────────────────────────────
function GameCard({ game, teamMap, injAdj, bankroll }) {
  const h = teamMap[game.home], a = teamMap[game.away];
  if (!h || !a) return (
    <div style={{ background:S.cardBg, border:`1px solid ${S.cardBorder}`, borderRadius:10,
      padding:"12px", marginBottom:10, fontSize:12, color:S.textMuted }}>
      ⚠️ Unknown: {game.away} @ {game.home} — add to FPI data
    </div>
  );
  const proj     = calcSpread(game, teamMap, injAdj);
  const rawEdge  = getEdge(proj, game.dkSpread);
  const adjEdge  = getAdjustedEdge(rawEdge, game.dkSpread);
  const rec      = getCFBRec(adjEdge);
  const betAmt   = bankroll > 0 ? Math.round(bankroll * rec.pct / 100) : 0;
  const ctx      = getSpreadContext(game.dkSpread);
  const projLbl  = proj >= 0 ? `${h.abbr} −${Math.abs(proj)}` : `${a.abbr} −${Math.abs(proj)}`;
  const dkLbl    = game.dkSpread <= 0 ? `${h.abbr} −${Math.abs(game.dkSpread)}` : `${a.abbr} −${Math.abs(game.dkSpread)}`;
  const eColor   = Math.abs(adjEdge) >= 3.0 ? S.green : Math.abs(adjEdge) >= 2.0 ? S.leanText : S.textMuted;
  const lBorder  = rec.verdict==="BEST" ? S.bestBg : rec.verdict==="BET" ? S.betBorder : rec.verdict==="LEAN" ? S.leanBorder : S.cardBorder;

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
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {ctx.warn && <span style={{ fontSize:10, color:ctx.color, fontWeight:600 }}>⚠️ {ctx.warn}</span>}
          {game.notes && <span style={{ fontSize:10, color:S.textMuted, fontStyle:"italic" }}>{game.notes}</span>}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 44px 1fr", alignItems:"center", padding:"12px 16px", gap:8 }}>
        <div>
          <div style={{ fontSize:17, fontWeight:700, color:S.textPrimary }}>{a.abbr}</div>
          <div style={{ fontSize:11, color:S.textSecondary, marginTop:1 }}>{a.name}</div>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3 }}>
            <span style={{ background:S.subBg, border:`1px solid ${S.cardBorder}`, borderRadius:4,
              padding:"1px 5px", fontSize:10, fontWeight:700, color:S.textSecondary }}>#{a.rank}</span>
            <span style={{ fontSize:10, color:S.textMuted }}>{a.fpiPts>0?"+":""}{a.fpiPts.toFixed(1)} · {a.conf}</span>
          </div>
        </div>
        <div style={{ textAlign:"center", color:S.textMuted, fontSize:12, fontWeight:500 }}>@</div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:17, fontWeight:700, color:S.textPrimary }}>{h.abbr}</div>
          <div style={{ fontSize:11, color:S.textSecondary, marginTop:1 }}>{h.name}</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:4, marginTop:3 }}>
            <span style={{ fontSize:10, color:S.textMuted }}>{h.conf} · {h.fpiPts>0?"+":""}{h.fpiPts.toFixed(1)}</span>
            <span style={{ background:S.subBg, border:`1px solid ${S.cardBorder}`, borderRadius:4,
              padding:"1px 5px", fontSize:10, fontWeight:700, color:S.textSecondary }}>#{h.rank}</span>
          </div>
        </div>
      </div>
      {/* Spread context bar */}
      <div style={{ padding:"4px 14px", background:Math.abs(game.dkSpread)>=14?"#FFF8F0":S.subBg,
        borderTop:`1px solid ${S.cardBorder}`, borderBottom:`1px solid ${S.cardBorder}`,
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:10, color:ctx.color, fontWeight:700 }}>{ctx.label}</span>
        <span style={{ fontSize:10, color:S.textMuted }}>
          HFA {game.neutral?"none (neutral)":h.hfa+" pts"} · Penalty: {getSpreadPenalty(game.dkSpread)||"none"}
        </span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", background:S.subBg }}>
        {[
          { label:"Our Proj",   val:projLbl,                                  color:S.textPrimary },
          { label:"DK Line",    val:dkLbl,                                    color:S.textPrimary },
          { label:"Adj Edge",   val:`${adjEdge>=0?"+":""}${adjEdge.toFixed(1)}`, color:eColor },
          { label:"Total O/U",  val:game.dkTotal,                             color:S.textPrimary },
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
        <VerdictBanner rec={rec} betAmt={betAmt} adjEdge={adjEdge} rawEdge={rawEdge}
          dkSpread={game.dkSpread} awayAbbr={a.abbr} homeAbbr={h.abbr} />
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

// ─── MAIN NCAAF APP ───────────────────────────────────────────────────────────
export default function CFBEdge() {
  const [fpiData,   setFpiData]   = useState(DEFAULT_FPI);
  const [games,     setGames]     = useState(DEFAULT_GAMES);
  const [fpiStatus, setFpiStatus] = useState("idle");
  const [dkStatus,  setDkStatus]  = useState("idle");
  const [fpiDesc,   setFpiDesc]   = useState("ESPN FPI preseason 2026 · Ohio State #1 at 28.7");
  const [dkDesc,    setDkDesc]    = useState("DraftKings Week 1 2026 opening lines");
  const [bankroll,  setBankroll]  = useState(1000);
  const [weekNum,   setWeekNum]   = useState(1);
  const [filter,    setFilter]    = useState("all");
  const [injAdj,    setInjAdj]    = useState({});
  const [showInj,   setShowInj]   = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [aiOutput,  setAiOutput]  = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHist,  setChatHist]  = useState([]);
  const [question,  setQuestion]  = useState("");

  const teamMap  = buildTeamMap(fpiData);
  const allTeams = [...new Set(games.flatMap(g => [g.home, g.away]))].sort();
  const updateInj = useCallback((abbr, val) => setInjAdj(p => ({...p,[abbr]:val})), []);

  // ── LIVE FETCH FPI ──────────────────────────────────────────────────────────
  const fetchFPI = useCallback(async () => {
    setFpiStatus("loading");
    const today = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});

    const searchPrompt = `Search for the current ESPN College Football FPI rankings for 2026. Find the full list of top FBS teams with their FPI values.`;

    const formatPrompt = `Convert this college football FPI data into a JSON array of the top 40 teams.
Return ONLY the raw JSON array with no other text, no markdown, no explanation.
CRITICAL: fpiPts must be the RAW ESPN FPI value (e.g. Ohio State ~28.7, Texas ~25, Georgia ~20). Do NOT convert ranks to points. Do NOT add home field. Use the actual FPI number from ESPN exactly as shown.
Each item must have: rank (integer), name (full school name), abbr (2-5 char abbreviation like OSU/TEX/UGA/ND), fpiPts (raw ESPN FPI number, positive for good teams, can be negative for weak teams), conf (conference), hfa (SEC=4.0, Big Ten=3.5, ACC/Big12=3.0, others=2.5), dome (boolean).
Start your response with [ and end with ].`;

    try {
      const text = await fetchWithSearch(searchPrompt, formatPrompt);
      const parsed = extractJSON(text);
      if (!Array.isArray(parsed) || parsed.length < 20) throw new Error("Only got " + parsed.length + " teams");
      setFpiData(parsed);
      setFpiDesc(`ESPN FPI — fetched ${today}`);
      setFpiStatus("done");
    } catch(e) {
      console.error("CFB FPI fetch error:", e.message);
      setFpiStatus("error");
    }
  }, []);

  // ── LIVE FETCH DK LINES ─────────────────────────────────────────────────────
  const fetchDK = useCallback(async () => {
    setDkStatus("loading");
    const today = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});

    const searchPrompt = `Search for college football Week ${weekNum} 2026 point spreads and totals. Find DraftKings or any sportsbook lines for major games this week.`;

    const formatPrompt = `Convert this college football Week ${weekNum} betting lines into a JSON array of games.
Return ONLY the raw JSON array with no other text, no markdown, no explanation.
Each item must have: away (team abbr), home (team abbr), dkSpread (number, home perspective: negative = home favored), dkTotal (number), gameTime (string like "Sat Sep 5 · 3:30 PM"), network (string), neutral (boolean), notes (string).
Focus on top 25 matchups and major conference games. Start your response with [ and end with ].`;

    try {
      const text = await fetchWithSearch(searchPrompt, formatPrompt);
      const parsed = extractJSON(text);
      if (!Array.isArray(parsed) || parsed.length < 5) throw new Error("Only got " + parsed.length + " games");
      setGames(parsed);
      setDkDesc(`DraftKings Week ${weekNum} — fetched ${today}`);
      setDkStatus("done");
    } catch(e) {
      console.error("CFB DK fetch error:", e.message);
      setDkStatus("error");
    }
  }, [weekNum]);

  // ── COMPUTED ────────────────────────────────────────────────────────────────
  const computed = games.map(g => {
    const proj    = calcSpread(g, teamMap, injAdj);
    const rawEdge = getEdge(proj, g.dkSpread);
    const adjEdge = getAdjustedEdge(rawEdge, g.dkSpread);
    const rec     = getCFBRec(adjEdge);
    return { ...g, proj, rawEdge, adjEdge, rec };
  });
  const edgePlays  = computed.filter(g => g.rec.tier >= 2);
  const bestPlays  = computed.filter(g => g.rec.tier >= 3);
  const fadeZone   = computed.filter(g => Math.abs(g.dkSpread) >= 14);
  const totalUnits = computed.reduce((a,g) => a+g.rec.units, 0);
  const totalExp   = bankroll>0 ? computed.reduce((a,g)=>a+Math.round(bankroll*g.rec.pct/100),0) : 0;
  const filtered   = computed.filter(g =>
    filter==="bets" ? g.rec.tier>=2 : filter==="best" ? g.rec.tier>=3 :
    filter==="fade" ? Math.abs(g.dkSpread)>=14 : filter==="pass" ? g.rec.tier===0 : true
  );

  // ── AI HANDICAPPER ──────────────────────────────────────────────────────────
  const runAI = useCallback(async () => {
    setAiLoading(true);
    const rows = computed.map(g => {
      const h=teamMap[g.home],a=teamMap[g.away]; if(!h||!a) return "";
      const pL=g.proj>=0?`${h.abbr}-${Math.abs(g.proj)}`:`${a.abbr}-${Math.abs(g.proj)}`;
      const dL=g.dkSpread<=0?`${h.abbr}-${Math.abs(g.dkSpread)}`:`${a.abbr}-${Math.abs(g.dkSpread)}`;
      return `${a.abbr}(#${a.rank},${a.conf})@${h.abbr}(#${h.rank},${h.conf})|Proj:${pL}|DK:${dL}|Raw:${g.rawEdge>=0?"+":""}${g.rawEdge.toFixed(1)}|Pen:${getSpreadPenalty(g.dkSpread)}|Adj:${g.adjEdge>=0?"+":""}${g.adjEdge.toFixed(1)}|${g.rec.verdict}(${g.rec.units}u)`;
    }).filter(Boolean).join("\n");

    const sys = `Sharp college football analyst. Key methodology:
- ESPN FPI values represent points above/below average on neutral field (much larger scale than NFL)  
- Home field: 3-4 pts (vs NFL's 2 pts)
- CRITICAL spread penalty system based on historical NCAAF data since 1980:
  14-20 pt favorites: cover only ~47% → -1.5 pt penalty applied
  21-27 pt favorites: cover only ~44% → -2.5 pt penalty applied  
  28+ pt favorites: cover only ~40% → -4.0 pt penalty applied
  "Ranked Team Tax": books inflate spreads 1-2.5 pts for ranked teams
  Oregon 2024: 13-1 SU but 7-7 ATS — failed to cover 5 spreads of 14.5+
- Bet when adjusted edge ≥ 3.0 pts. Unit sizing: 1-3% bankroll.
Be direct and reference the actual adjusted edge numbers.`;

    const msg = `NCAAF Week ${weekNum} 2026:\n\n${rows}\n\nBest bets: ${bestPlays.length} | Edge plays: ${edgePlays.length} | Fade zone (14+): ${fadeZone.length}\n\nTop 2 adjusted-edge plays, best wide-spread fade, one game to avoid, unit note.`;

    try {
      const data = await callClaude({ model:"claude-sonnet-4-6", max_tokens:1000, system:sys, messages:[{role:"user",content:msg}] });
      const text = extractText(data) || "No response.";
      setAiOutput(text);
      setChatHist([{role:"user",content:msg},{role:"assistant",content:text}]);
    } catch(e) { setAiOutput("Could not reach AI: " + e.message); }
    setAiLoading(false);
  }, [computed, teamMap, bestPlays.length, edgePlays.length, fadeZone.length, weekNum]);

  const askFollowUp = useCallback(async () => {
    if (!question.trim()||!chatHist.length) return;
    const q=question.trim(); setQuestion(""); setAiLoading(true);
    const ctx=computed.map(g=>`${g.away}@${g.home}:adj${g.adjEdge>=0?"+":""}${g.adjEdge.toFixed(1)},${g.rec.verdict}`).join("|");
    const msgs=[...chatHist,{role:"user",content:`${ctx}\n\n${q}`}];
    try {
      const data = await callClaude({model:"claude-sonnet-4-6",max_tokens:600,
        system:"Sharp NCAAF analyst. Spread penalty system. Direct and specific.",messages:msgs});
      const text = extractText(data) || "";
      setAiOutput(p=>`${p}\n\n━━━━\nYou: ${q}\n\n${text}`);
      setChatHist([...msgs,{role:"assistant",content:text}]);
    } catch(e) { setAiOutput(p=>p+"\n\nError: " + e.message); }
    setAiLoading(false);
  }, [question,chatHist,computed]);

  const exportPicks = () => {
    const lines=[`THE EDGE — NCAAF WEEK ${weekNum} 2026`,"=".repeat(55),
      `Bankroll: $${bankroll.toLocaleString()}`,
      `Best bets: ${bestPlays.length} | Edge plays: ${edgePlays.length} | Exposure: $${totalExp.toLocaleString()} (${totalUnits}u)`,
      `FPI: ${fpiDesc}`,`Lines: ${dkDesc}`,"",
      "Spread penalties: 14-20pts=-1.5, 21-27pts=-2.5, 28+pts=-4.0",""];
    computed.forEach(g=>{
      const h=teamMap[g.home],a=teamMap[g.away]; if(!h||!a) return;
      const bet=bankroll>0?Math.round(bankroll*g.rec.pct/100):0;
      lines.push(`${a.abbr} @ ${h.abbr}  ${g.gameTime}`);
      lines.push(`  Proj:${g.proj>=0?h.abbr+"-"+Math.abs(g.proj):a.abbr+"-"+Math.abs(g.proj)} | DK:${g.dkSpread<=0?h.abbr+"-"+Math.abs(g.dkSpread):a.abbr+"-"+Math.abs(g.dkSpread)} | RawEdge:${g.rawEdge>=0?"+":""}${g.rawEdge.toFixed(1)} | AdjEdge:${g.adjEdge>=0?"+":""}${g.adjEdge.toFixed(1)}`);
      lines.push(`  → ${g.rec.verdict} (${g.rec.units}u)${bet>0?" — $"+bet.toLocaleString():""}`);
      if(g.notes) lines.push(`  ${g.notes}`);
      lines.push("");
    });
    lines.push("For entertainment only. Bet responsibly. 21+.");
    const blob=new Blob([lines.join("\n")],{type:"text/plain"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download=`the-edge-cfb-week${weekNum}-2026.txt`; a.click();
  };

  return (
    <div style={{ background:S.pageBg, minHeight:"100vh", padding:"1.25rem 1rem" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
      <div style={{ maxWidth:720, margin:"0 auto" }}>

        {/* NAV */}
        <div style={{ display:"flex", gap:8, marginBottom:"1rem" }}>
          <Link href="/" style={{ background:S.subBg, color:S.textSecondary, fontSize:12,
            fontWeight:600, padding:"6px 16px", borderRadius:20, textDecoration:"none",
            border:`1px solid ${S.cardBorder}` }}>🏈 NFL</Link>
          <div style={{ background:"#8B1A1A", color:"#fff", fontSize:12, fontWeight:700,
            padding:"6px 16px", borderRadius:20 }}>🎓 NCAAF</div>
        </div>

        {/* HEADER */}
        <div style={{ marginBottom:"1rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                <h1 style={{ fontSize:22, fontWeight:800, color:S.textPrimary, margin:0, letterSpacing:"-0.02em" }}>The Edge</h1>
                <span style={{ background:"#8B1A1A", color:"#fff", fontSize:10, fontWeight:700,
                  padding:"3px 9px", borderRadius:4, letterSpacing:"0.06em" }}>NCAAF 2026</span>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:12, color:S.textSecondary }}>Week</span>
                  <select value={weekNum} onChange={e=>setWeekNum(+e.target.value)}
                    style={{ fontSize:13, fontWeight:700, color:S.textPrimary, padding:"2px 6px",
                      borderRadius:5, border:`1px solid ${S.cardBorder}`, background:S.cardBg }}>
                    {Array.from({length:16},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ fontSize:12, color:S.textSecondary }}>Power Rating System · ESPN FPI · DraftKings · Wide Spread Penalty Model</div>
            </div>
            <div style={{ fontSize:11, color:S.textSecondary, textAlign:"right", lineHeight:1.7 }}>
              <div style={{ color:S.green, fontWeight:700 }}>● Live model</div>
              <div>Refresh Tuesdays</div>
            </div>
          </div>
        </div>

        {/* HISTORICAL DATA BANNER */}
        <button onClick={()=>setShowStats(s=>!s)}
          style={{ width:"100%", background:"#FFF8F0", border:`1px solid #D4A017`, borderRadius:8,
            padding:"10px 14px", marginBottom:"1rem", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"space-between", textAlign:"left" }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#7A5200" }}>📊 Wide Spread Penalty System — Why NCAAF Is Different</div>
            <div style={{ fontSize:11, color:"#9A6800", marginTop:2 }}>14+ pt favorites cover only 40–47% historically · Tap to {showStats?"hide":"view"} data</div>
          </div>
          <span style={{ fontSize:12, color:"#9A6800" }}>{showStats?"▲":"▼"}</span>
        </button>
        {showStats && (
          <div style={{ background:"#FFF8F0", border:`1px solid #D4A017`, borderRadius:10,
            padding:"14px 16px", marginBottom:"1rem" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#7A5200", marginBottom:10 }}>NCAAF Favorite Cover Rate by Spread (since 1980)</div>
            {[
              {range:"1–6 pts",   pct:"~52%", pen:"0",    action:"Bet favorites with edge",         color:S.green},
              {range:"7–13 pts",  pct:"~50%", pen:"0",    action:"Neutral — need FPI edge",          color:S.textSecondary},
              {range:"14–20 pts", pct:"~47%", pen:"-1.5", action:"Lean underdog +ATS",               color:"#D4A017"},
              {range:"21–27 pts", pct:"~44%", pen:"-2.5", action:"Strong underdog fade",             color:"#C0392B"},
              {range:"28+ pts",   pct:"~40%", pen:"-4.0", action:"Heavy underdog — primary play",   color:S.red},
            ].map(row=>(
              <div key={row.range} style={{ display:"grid", gridTemplateColumns:"90px 50px 60px 1fr",
                gap:8, padding:"6px 0", borderBottom:`1px solid #F0DDB0`, alignItems:"center", fontSize:12 }}>
                <div style={{ fontWeight:700, color:S.textPrimary }}>{row.range}</div>
                <div style={{ fontWeight:700, color:row.color }}>{row.pct}</div>
                <div style={{ color:"#C0392B", fontWeight:600 }}>{row.pen}</div>
                <div style={{ color:S.textSecondary }}>{row.action}</div>
              </div>
            ))}
            <div style={{ fontSize:11, color:"#9A6800", marginTop:10, lineHeight:1.6 }}>
              Oregon 2024: 13-1 SU, only 7-7 ATS — failed to cover 5 spreads of 14.5+. Ranked team tax: books add 1–2.5 pts to ranked team lines due to public bias.
            </div>
          </div>
        )}

        {/* LIVE FETCH PANEL */}
        <div style={{ background:S.cardBg, border:`1.5px solid ${S.green}`, borderRadius:10,
          padding:"14px 16px", marginBottom:"1rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <span style={{ fontSize:16 }}>📡</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:S.textPrimary }}>Live Data — One Tap Update</div>
              <div style={{ fontSize:11, color:S.textMuted }}>Tap each button Tuesday morning — auto-fetches latest ESPN FPI + DraftKings lines</div>
            </div>
          </div>
          <FetchButton label="Fetch FPI" icon="📊" status={fpiStatus} description={fpiDesc} onFetch={fetchFPI}/>
          <FetchButton label="Fetch Lines" icon="💰" status={dkStatus} description={dkDesc} onFetch={fetchDK}/>
          <div style={{ marginTop:10, padding:"8px 10px", background:S.blueBg, borderRadius:6,
            fontSize:11, color:S.blue, lineHeight:1.6 }}>
            💡 Fetch FPI first, then Lines. Wide spread penalties apply automatically. Board updates in ~10 seconds per fetch.
          </div>
        </div>

        {/* BANKROLL */}
        <div style={{ background:S.cardBg, border:`1px solid ${S.cardBorder}`, borderRadius:10,
          padding:"12px 16px", marginBottom:"1rem", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ fontSize:13, fontWeight:600, color:S.textPrimary }}>My bankroll</div>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:14, color:S.textSecondary }}>$</span>
            <input type="number" value={bankroll} min={0} step={100}
              onChange={e=>setBankroll(Math.max(0,parseInt(e.target.value)||0))}
              style={{ width:110, fontSize:15, fontWeight:700, color:S.textPrimary,
                padding:"5px 10px", borderRadius:6, border:`1.5px solid ${S.green}`,
                background:S.greenLight, outline:"none" }}/>
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
            {label:"Best bets",  val:bestPlays.length,  sub:"≥ 4.5 adj edge", accent:S.green},
            {label:"Edge plays", val:edgePlays.length,  sub:"≥ 3.0 adj edge", accent:S.green},
            {label:"Fade zone",  val:fadeZone.length,   sub:"spread ≥ 14",    accent:"#C0392B"},
            {label:"Exposure",   val:bankroll>0?`$${totalExp.toLocaleString()}`:"—", sub:`${totalUnits}u`, accent:S.textPrimary},
          ].map(m=>(
            <div key={m.label} style={{ background:S.cardBg, border:`1px solid ${S.cardBorder}`, borderRadius:8, padding:"10px 12px" }}>
              <div style={{ fontSize:10, color:S.textMuted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{m.label}</div>
              <div style={{ fontSize:20, fontWeight:800, color:m.accent }}>{m.val}</div>
              <div style={{ fontSize:10, color:S.textMuted, marginTop:2 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* CONTROLS */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:"1rem" }}>
          <select value={filter} onChange={e=>setFilter(e.target.value)}
            style={{ fontSize:13, padding:"7px 10px", borderRadius:7, border:`1px solid ${S.cardBorder}`,
              background:S.cardBg, color:S.textPrimary, fontWeight:500, cursor:"pointer" }}>
            <option value="all">All games</option>
            <option value="bets">Bets only (≥3.0)</option>
            <option value="best">Best bets (≥4.5)</option>
            <option value="fade">Fade zone (14+ spread)</option>
            <option value="pass">Pass games</option>
          </select>
          <button onClick={()=>setShowInj(s=>!s)} style={btn(false)}>{showInj?"Hide":"Edit"} injuries</button>
          <button onClick={runAI} disabled={aiLoading} style={btn(true,false,aiLoading)}>{aiLoading?"Analyzing…":"⚡ AI Handicapper"}</button>
          <button onClick={exportPicks} style={btn(false)}>↓ Export</button>
        </div>

        {/* VERDICT KEY */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:"1rem" }}>
          {[
            {icon:"🔥",label:"Best bet · 3u · 3%",bg:S.bestBg, color:S.bestText,border:S.bestBg},
            {icon:"✅",label:"Play · 2u · 2%",    bg:S.betBg,  color:S.betText, border:S.betBorder},
            {icon:"👀",label:"Lean · 1u · 1%",    bg:S.leanBg, color:S.leanText,border:S.leanBorder},
            {icon:"⏭", label:"No bet · pass",     bg:S.passBg, color:S.passText,border:S.passBorder},
          ].map((k,i)=>(
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
            <div style={{ fontSize:11, color:S.textSecondary, marginBottom:12 }}>QB out ≈ −7 pts · Star RB/WR ≈ −1 to −2 pts · Depth = zero impact</div>
            {allTeams.map(abbr=>{
              const t=teamMap[abbr]; if(!t) return null;
              return <InjurySlider key={abbr} abbr={abbr} name={t.name} value={injAdj[abbr]||0} onChange={updateInj}/>;
            })}
            <button onClick={()=>setInjAdj({})} style={{ marginTop:10, fontSize:12, color:"#C0392B", background:"none", border:"none", cursor:"pointer" }}>Reset all</button>
          </div>
        )}

        {/* AI PANEL */}
        {(aiOutput||aiLoading)&&(
          <div style={{ background:S.cardBg, border:`1px solid ${S.cardBorder}`, borderRadius:10,
            padding:"14px 16px", marginBottom:"1rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:S.green,
                animation:aiLoading?"pulse 1s infinite":"none" }}/>
              <span style={{ fontSize:13, fontWeight:700, color:S.textPrimary }}>AI Handicapper</span>
            </div>
            {aiLoading&&!aiOutput
              ?<div style={{ fontSize:13, color:S.textSecondary, fontStyle:"italic" }}>Reading the board…</div>
              :<div style={{ fontSize:13, color:S.textPrimary, lineHeight:1.8, whiteSpace:"pre-wrap" }}>{aiOutput}</div>
            }
            {chatHist.length>0&&(
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <input value={question} onChange={e=>setQuestion(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&askFollowUp()}
                  placeholder="Ask about a matchup, spread, or rivalry…"
                  style={{ flex:1, fontSize:13, padding:"7px 12px", borderRadius:7,
                    border:`1px solid ${S.cardBorder}`, background:S.pageBg, color:S.textPrimary }}/>
                <button onClick={askFollowUp} disabled={aiLoading} style={btn(true,false,aiLoading)}>Send</button>
              </div>
            )}
          </div>
        )}

        {/* GAME BOARD */}
        <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.09em",
          color:S.textMuted, fontWeight:700, marginBottom:10 }}>
          Week {weekNum} · {filtered.length}/{games.length} games
        </div>
        {filtered.map((g,i)=><GameCard key={i} game={g} teamMap={teamMap} injAdj={injAdj} bankroll={bankroll}/>)}
        {filtered.length===0&&(
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
