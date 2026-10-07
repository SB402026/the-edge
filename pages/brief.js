import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { S, btn } from "../lib/components";

// ─── ID COUNTER ───────────────────────────────────────────────────────────────
let _id = 0;
const uid = () => ++_id;

const newPick = (overrides = {}) => ({
  id:      uid(),
  matchup: "",
  pick:    "",
  line:    "",
  power:   "",
  edge:    "",
  time:    "",
  conf:    "Standard",
  thesis:  "",
  flags:   "",
  ...overrides,
});

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CONF_COLOR = {
  High:     { bg:"#0F1F14", color:"#22C55E", border:"#22C55E" },
  Standard: { bg:"#0A1A2B", color:"#60A5FA", border:"#2563EB" },
  Lean:     { bg:"#1A1500", color:"#FACC15", border:"#CA8A04" },
  Pass:     { bg:S.subBg,   color:S.textMuted, border:S.cardBorder },
};

const fieldStyle = {
  fontSize:13, color:S.textPrimary, padding:"6px 10px",
  borderRadius:6, border:`1px solid ${S.cardBorder}`,
  background:S.subBg, outline:"none", width:"100%", boxSizing:"border-box",
};

const labelStyle = {
  fontSize:10, color:S.textMuted, textTransform:"uppercase",
  letterSpacing:"0.07em", marginBottom:3, display:"block",
};

// ─── BRIEF GENERATOR PAGE ─────────────────────────────────────────────────────
export default function BriefPage() {
  const [tab,         setTab]         = useState("builder");
  const [league,      setLeague]      = useState("NFL");
  const [wkLabel,     setWkLabel]     = useState("Week 1");
  const [wkDate,      setWkDate]      = useState(() => new Date().toISOString().slice(0, 10));
  const [record,      setRecord]      = useState("");
  const [seasonUnits, setSeasonUnits] = useState("");
  const [roi,         setRoi]         = useState("");
  const [editorNote,  setEditorNote]  = useState("");
  const [picks,       setPicks]       = useState([newPick()]);
  const [importBanner,setImportBanner]= useState(null);
  const [copied,      setCopied]      = useState(false);
  const [copiedX,     setCopiedX]     = useState(null);

  // ── Load from localStorage on mount ────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem("edgeBriefExport");
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.picks) && data.picks.length > 0) {
          if (data.league)   setLeague(data.league);
          if (data.weekNum)  setWkLabel(`Week ${data.weekNum}`);
          setPicks(data.picks.map(p => ({ ...newPick(), ...p, id: uid() })));
          setImportBanner(`${data.picks.length} pick${data.picks.length !== 1 ? "s" : ""} imported from The Edge pick engine`);
          localStorage.removeItem("edgeBriefExport");
        }
      }
    } catch (e) {}
  }, []);

  // ── Pick helpers ────────────────────────────────────────────────────────────
  const updatePick = (id, field, val) =>
    setPicks(ps => ps.map(p => p.id === id ? { ...p, [field]: val } : p));

  const addPick = () => setPicks(ps => [...ps, newPick()]);

  const removePick = (id) => setPicks(ps => ps.length > 1 ? ps.filter(p => p.id !== id) : ps);

  const clearAll = () => { setPicks([newPick()]); setImportBanner(null); };

  // ── Brief HTML generator ────────────────────────────────────────────────────
  const generateBrief = useCallback(() => {
    const validPicks = picks.filter(p => p.matchup || p.pick);
    const featPick   = validPicks.find(p => p.conf === "High") || validPicks[0];

    const confBadge = (conf) => {
      const c = CONF_COLOR[conf] || CONF_COLOR.Standard;
      return `<span style="background:${c.bg};color:${c.color};border:1px solid ${c.border};border-radius:4px;padding:2px 8px;font-size:10px;font-weight:700;letter-spacing:0.06em">${conf.toUpperCase()}</span>`;
    };

    const pickRows = validPicks.map(p => `
      <div style="border:1px solid #1E2A1E;border-radius:8px;overflow:hidden;margin-bottom:10px;background:#0B1510">
        <div style="background:#0F1F14;padding:7px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <span style="font-size:13px;font-weight:700;color:#E8F5E9">${p.matchup || "—"}</span>
          <div style="display:flex;align-items:center;gap:6px">
            ${p.time ? `<span style="font-size:10px;color:#6B8F71">${p.time}</span>` : ""}
            ${confBadge(p.conf || "Standard")}
          </div>
        </div>
        <div style="padding:10px 12px">
          <div style="font-size:17px;font-weight:800;color:#22C55E;margin-bottom:6px">${p.pick || "—"}</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px">
            ${[
              ["DK Line", p.line],
              ["Power Rating", p.power],
              ["Edge", p.edge],
            ].map(([label, val]) => `
              <div style="background:#0F1F14;border:1px solid #1E2A1E;border-radius:5px;padding:6px 8px;text-align:center">
                <div style="font-size:9px;color:#6B8F71;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:2px">${label}</div>
                <div style="font-size:12px;font-weight:700;color:#E8F5E9">${val || "—"}</div>
              </div>`).join("")}
          </div>
          ${p.thesis ? `<div style="font-size:11px;color:#A8C5A0;line-height:1.6;border-left:2px solid #22C55E30;padding-left:8px;margin-bottom:6px">${p.thesis}</div>` : ""}
          ${p.flags  ? `<div style="font-size:10px;color:#FACC15;margin-top:4px">⚑ ${p.flags}</div>` : ""}
        </div>
      </div>`).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>The Edge — ${league} ${wkLabel} Brief</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#060E09;color:#E8F5E9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:20px 16px;max-width:680px;margin:0 auto}
  h1{font-size:26px;font-weight:900;letter-spacing:-0.03em}
</style>
</head>
<body>
  <div style="border-bottom:1px solid #1E2A1E;padding-bottom:16px;margin-bottom:20px">
    <div style="font-size:10px;color:#6B8F71;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">The Edge · ${league} ${wkLabel}</div>
    <h1>🏆 Pick Brief</h1>
    ${wkDate ? `<div style="font-size:11px;color:#6B8F71;margin-top:4px">${new Date(wkDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>` : ""}
    <div style="display:flex;gap:16px;margin-top:12px;flex-wrap:wrap">
      ${record      ? `<div style="font-size:11px"><span style="color:#6B8F71">Record</span> <b style="color:#22C55E">${record}</b></div>` : ""}
      ${seasonUnits ? `<div style="font-size:11px"><span style="color:#6B8F71">Season Units</span> <b style="color:#22C55E">${seasonUnits > 0 ? "+" : ""}${seasonUnits}</b></div>` : ""}
      ${roi         ? `<div style="font-size:11px"><span style="color:#6B8F71">ROI</span> <b style="color:#22C55E">${roi}%</b></div>` : ""}
    </div>
  </div>

  ${featPick ? `
  <div style="background:linear-gradient(135deg,#0F2718 0%,#0A1F14 100%);border:1px solid #22C55E30;border-radius:10px;padding:14px 16px;margin-bottom:20px">
    <div style="font-size:10px;color:#6B8F71;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">🔥 Featured Play</div>
    <div style="font-size:20px;font-weight:800;color:#22C55E">${featPick.pick || "—"}</div>
    <div style="font-size:12px;color:#A8C5A0;margin-top:2px">${featPick.matchup || ""}</div>
  </div>` : ""}

  <div style="font-size:10px;color:#6B8F71;text-transform:uppercase;letter-spacing:0.09em;font-weight:700;margin-bottom:10px">
    ${validPicks.length} Pick${validPicks.length !== 1 ? "s" : ""} · ${wkLabel}
  </div>
  ${pickRows}

  ${editorNote ? `
  <div style="background:#0A1520;border:1px solid #1E2D3E;border-radius:8px;padding:12px 14px;margin-top:16px">
    <div style="font-size:10px;color:#6B8F71;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px">📝 Editor's Note</div>
    <div style="font-size:12px;color:#93C5FD;line-height:1.7">${editorNote}</div>
  </div>` : ""}

  <div style="font-size:10px;color:#3D5244;border-top:1px solid #1E2A1E;padding-top:12px;margin-top:20px;line-height:1.7">
    ⚠️ For informational and entertainment purposes only. Not financial advice. Sports betting involves risk. Must be 21+.
  </div>
</body>
</html>`;
  }, [picks, league, wkLabel, wkDate, record, seasonUnits, roi, editorNote]);

  // ── Discord copy ────────────────────────────────────────────────────────────
  const generateDiscord = useCallback(() => {
    const validPicks = picks.filter(p => p.matchup || p.pick);
    let text = `**THE EDGE — ${league} ${wkLabel.toUpperCase()} PICKS**\n`;
    if (record || seasonUnits) {
      text += `📊 `;
      if (record)      text += `Record: **${record}**  `;
      if (seasonUnits) text += `Season: **${seasonUnits > 0 ? "+" : ""}${seasonUnits}u**`;
      text += "\n";
    }
    text += "\n";
    validPicks.forEach(p => {
      const confEmoji = { High:"🔥", Standard:"✅", Lean:"👀", Pass:"⏭" }[p.conf] || "✅";
      text += `${confEmoji} **${p.pick || "—"}**\n`;
      if (p.matchup) text += `📍 ${p.matchup}`;
      if (p.time)    text += ` · ${p.time}`;
      text += "\n";
      if (p.line || p.edge) {
        const parts = [];
        if (p.line)  parts.push(`Line: ${p.line}`);
        if (p.power) parts.push(`Power: ${p.power}`);
        if (p.edge)  parts.push(`Edge: ${p.edge}`);
        text += `> ${parts.join(" | ")}\n`;
      }
      if (p.thesis) text += `> _${p.thesis}_\n`;
      text += "\n";
    });
    if (editorNote) text += `📝 ${editorNote}\n\n`;
    text += "*For entertainment only. 21+ | Bet responsibly.*";
    return text;
  }, [picks, league, wkLabel, record, seasonUnits, editorNote]);

  // ── X (Twitter) posts ───────────────────────────────────────────────────────
  const generateXPosts = useCallback(() => {
    const validPicks = picks.filter(p => p.pick);
    const posts = [];

    const featPick = validPicks.find(p => p.conf === "High") || validPicks[0];
    if (featPick) {
      posts.push({
        label: "🔥 Featured Play Drop",
        text: `🔥 ${league} ${wkLabel} FEATURED PLAY:\n\n${featPick.pick}${featPick.matchup ? `\n📍 ${featPick.matchup}` : ""}${featPick.edge ? `\n📈 Edge: ${featPick.edge}` : ""}\n\n${featPick.thesis || "Sharp value on the board."}\n\n#TheEdge #${league}Picks`,
      });
    }

    validPicks.forEach((p, i) => {
      const confEmoji = { High:"🔥", Standard:"✅", Lean:"👀" }[p.conf] || "✅";
      posts.push({
        label: `Pick ${i + 1}: ${p.matchup || p.pick}`,
        text: `${confEmoji} ${league} ${wkLabel} PICK ${i + 1}/${validPicks.length}:\n\n${p.pick}${p.matchup ? `\n📍 ${p.matchup}` : ""}${p.time ? ` · ${p.time}` : ""}${p.edge ? `\n📈 Edge: ${p.edge}` : ""}\n\n#TheEdge #${league}Picks`,
      });
    });

    if (record || seasonUnits) {
      posts.push({
        label: "📊 Season Stats",
        text: `📊 THE EDGE — ${league} ${wkLabel} RESULTS\n${record ? `Record: ${record}` : ""}${seasonUnits ? `\nSeason units: ${seasonUnits > 0 ? "+" : ""}${seasonUnits}` : ""}${roi ? `\nROI: ${roi}%` : ""}\n\n#TheEdge #${league}Picks`,
      });
    }
    return posts;
  }, [picks, league, wkLabel, record, seasonUnits, roi]);

  const copyText = async (text, key) => {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const el = document.createElement("textarea");
      el.value = text; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopiedX(key);
    setTimeout(() => setCopiedX(null), 2000);
  };

  const copyBrief = async () => {
    try { await navigator.clipboard.writeText(generateBrief()); }
    catch (e) {
      const el = document.createElement("textarea");
      el.value = generateBrief(); document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copyDiscord = async () => copyText(generateDiscord(), "discord");

  const xPosts = generateXPosts();

  return (
    <div style={{ background:S.pageBg, minHeight:"100vh", padding:"1.25rem 1rem" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
      <div style={{ maxWidth:720, margin:"0 auto" }}>

        {/* NAV */}
        <div style={{ display:"flex", gap:8, marginBottom:"1rem", flexWrap:"wrap" }}>
          <Link href="/"    style={{ background:S.subBg, color:S.textSecondary, fontSize:12, fontWeight:600, padding:"6px 16px", borderRadius:20, textDecoration:"none", border:`1px solid ${S.cardBorder}` }}>🏈 NFL</Link>
          <Link href="/cfb" style={{ background:S.subBg, color:S.textSecondary, fontSize:12, fontWeight:600, padding:"6px 16px", borderRadius:20, textDecoration:"none", border:`1px solid ${S.cardBorder}` }}>🎓 NCAAF</Link>
          <div style={{ background:S.green, color:"#fff", fontSize:12, fontWeight:700, padding:"6px 16px", borderRadius:20 }}>📋 Brief Generator</div>
        </div>

        {/* HEADER */}
        <div style={{ marginBottom:"1rem" }}>
          <h1 style={{ fontSize:22, fontWeight:800, color:S.textPrimary, margin:0, letterSpacing:"-0.02em" }}>Brief Generator</h1>
          <div style={{ fontSize:12, color:S.textSecondary, marginTop:3 }}>Build your pick brief · Export to Discord & X</div>
        </div>

        {/* IMPORT BANNER */}
        {importBanner && (
          <div style={{ background:"#0F1F14", border:`1px solid ${S.green}50`, borderRadius:8,
            padding:"10px 14px", marginBottom:"1rem", display:"flex", alignItems:"center",
            justifyContent:"space-between", gap:8 }}>
            <div style={{ fontSize:12, color:S.green }}>✓ {importBanner}</div>
            <button onClick={() => setImportBanner(null)}
              style={{ fontSize:11, color:S.textMuted, background:"none", border:"none", cursor:"pointer" }}>✕</button>
          </div>
        )}

        {/* META FIELDS */}
        <div style={{ background:S.cardBg, border:`1px solid ${S.cardBorder}`, borderRadius:10, padding:"14px 16px", marginBottom:"1rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>
            <div>
              <label style={labelStyle}>League</label>
              <select value={league} onChange={e => setLeague(e.target.value)} style={fieldStyle}>
                <option>NFL</option>
                <option>NCAAF</option>
                <option>NBA</option>
                <option>MLB</option>
                <option>NHL</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Week / Label</label>
              <input style={fieldStyle} value={wkLabel} onChange={e => setWkLabel(e.target.value)} placeholder="Week 5" />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" style={fieldStyle} value={wkDate} onChange={e => setWkDate(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Record</label>
              <input style={fieldStyle} value={record} onChange={e => setRecord(e.target.value)} placeholder="32-18" />
            </div>
            <div>
              <label style={labelStyle}>Season Units</label>
              <input style={fieldStyle} value={seasonUnits} onChange={e => setSeasonUnits(e.target.value)} placeholder="+14.5" />
            </div>
            <div>
              <label style={labelStyle}>ROI %</label>
              <input style={fieldStyle} value={roi} onChange={e => setRoi(e.target.value)} placeholder="12.3" />
            </div>
          </div>
          <div style={{ marginTop:10 }}>
            <label style={labelStyle}>Editor's Note (optional)</label>
            <textarea style={{ ...fieldStyle, height:52, resize:"vertical", fontFamily:"inherit" }}
              value={editorNote} onChange={e => setEditorNote(e.target.value)}
              placeholder="Any context, notes, or caveats for subscribers…" />
          </div>
        </div>

        {/* TABS */}
        <div style={{ display:"flex", gap:0, marginBottom:"1rem", borderRadius:8, overflow:"hidden", border:`1px solid ${S.cardBorder}` }}>
          {[["builder","🔨 Builder"],["preview","👁 Preview"],["posts","✉ Export"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ flex:1, padding:"9px 6px", fontSize:12, fontWeight:700, cursor:"pointer", border:"none",
                background:tab===id ? S.green : S.cardBg, color:tab===id ? "#fff" : S.textSecondary,
                borderRight:id!=="posts"?`1px solid ${S.cardBorder}`:"none" }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── BUILDER TAB ── */}
        {tab === "builder" && (
          <div>
            {picks.map((p, idx) => {
              const C = CONF_COLOR[p.conf] || CONF_COLOR.Standard;
              return (
                <div key={p.id} style={{ background:S.cardBg, border:`1px solid ${S.cardBorder}`,
                  borderLeft:`4px solid ${C.border}`, borderRadius:10, padding:"14px 16px", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:S.textSecondary }}>Pick {idx + 1}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <select value={p.conf} onChange={e => updatePick(p.id, "conf", e.target.value)}
                        style={{ ...fieldStyle, width:"auto", fontSize:11, padding:"3px 8px",
                          background:C.bg, color:C.color, border:`1px solid ${C.border}` }}>
                        <option>High</option>
                        <option>Standard</option>
                        <option>Lean</option>
                        <option>Pass</option>
                      </select>
                      {picks.length > 1 && (
                        <button onClick={() => removePick(p.id)}
                          style={{ fontSize:11, color:"#C0392B", background:"none", border:"none", cursor:"pointer" }}>✕</button>
                      )}
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                    <div>
                      <label style={labelStyle}>Matchup</label>
                      <input style={fieldStyle} value={p.matchup} onChange={e => updatePick(p.id, "matchup", e.target.value)} placeholder="KC @ BUF" />
                    </div>
                    <div>
                      <label style={labelStyle}>Your Pick</label>
                      <input style={fieldStyle} value={p.pick} onChange={e => updatePick(p.id, "pick", e.target.value)} placeholder="BUF -3.5" />
                    </div>
                    <div>
                      <label style={labelStyle}>DK Line</label>
                      <input style={fieldStyle} value={p.line} onChange={e => updatePick(p.id, "line", e.target.value)} placeholder="BUF -3.5" />
                    </div>
                    <div>
                      <label style={labelStyle}>Power Rating</label>
                      <input style={fieldStyle} value={p.power} onChange={e => updatePick(p.id, "power", e.target.value)} placeholder="BUF -6.2" />
                    </div>
                    <div>
                      <label style={labelStyle}>Edge</label>
                      <input style={fieldStyle} value={p.edge} onChange={e => updatePick(p.id, "edge", e.target.value)} placeholder="+2.7" />
                    </div>
                    <div>
                      <label style={labelStyle}>Game Time</label>
                      <input style={fieldStyle} value={p.time} onChange={e => updatePick(p.id, "time", e.target.value)} placeholder="Sun 1:00 PM ET" />
                    </div>
                  </div>
                  <div style={{ marginBottom:6 }}>
                    <label style={labelStyle}>Thesis (shows in brief)</label>
                    <textarea style={{ ...fieldStyle, height:52, resize:"vertical", fontFamily:"inherit" }}
                      value={p.thesis} onChange={e => updatePick(p.id, "thesis", e.target.value)}
                      placeholder="Why this pick has value…" />
                  </div>
                  <div>
                    <label style={labelStyle}>Flags / Alerts</label>
                    <input style={fieldStyle} value={p.flags} onChange={e => updatePick(p.id, "flags", e.target.value)} placeholder="Weather, injury note, etc." />
                  </div>
                </div>
              );
            })}
            <div style={{ display:"flex", gap:8, marginTop:4 }}>
              <button onClick={addPick} style={btn(false)}>+ Add Pick</button>
              <button onClick={clearAll} style={{ fontSize:12, color:"#C0392B", background:"none", border:"none", cursor:"pointer", padding:"6px 4px" }}>Clear all</button>
            </div>
          </div>
        )}

        {/* ── PREVIEW TAB ── */}
        {tab === "preview" && (
          <div>
            <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
              <button onClick={copyBrief} style={btn(true, false, false)}>
                {copied ? "✓ Copied!" : "Copy HTML Brief"}
              </button>
              <button onClick={copyDiscord} style={btn(false)}>
                {copiedX === "discord" ? "✓ Copied!" : "Copy Discord"}
              </button>
            </div>
            <div style={{ background:S.cardBg, border:`1px solid ${S.cardBorder}`, borderRadius:10,
              padding:"14px 16px", fontSize:11, color:S.textSecondary, marginBottom:8, lineHeight:1.6 }}>
              💡 <strong style={{ color:S.textPrimary }}>Copy HTML Brief</strong> — paste into a note or send as a styled message.<br/>
              💬 <strong style={{ color:S.textPrimary }}>Copy Discord</strong> — formatted markdown for #picks-briefs channel.
            </div>
            <div style={{ background:"#060E09", border:`1px solid #1E2A1E`, borderRadius:10,
              padding:"16px", overflow:"auto" }}>
              <div style={{ fontSize:10, color:"#6B8F71", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>
                Brief Preview · {picks.filter(p => p.pick || p.matchup).length} picks
              </div>
              {picks.filter(p => p.pick || p.matchup).map((p) => {
                const C = CONF_COLOR[p.conf] || CONF_COLOR.Standard;
                return (
                  <div key={p.id} style={{ border:`1px solid #1E2A1E`, borderRadius:8, overflow:"hidden", marginBottom:10 }}>
                    <div style={{ background:"#0F1F14", padding:"7px 12px", display:"flex",
                      alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"#E8F5E9" }}>{p.matchup || "—"}</span>
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        {p.time && <span style={{ fontSize:10, color:"#6B8F71" }}>{p.time}</span>}
                        <span style={{ background:C.bg, color:C.color, border:`1px solid ${C.border}`,
                          borderRadius:4, padding:"2px 8px", fontSize:10, fontWeight:700, letterSpacing:"0.06em" }}>
                          {(p.conf || "Standard").toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding:"10px 12px", background:"#0B1510" }}>
                      <div style={{ fontSize:17, fontWeight:800, color:"#22C55E", marginBottom:6 }}>{p.pick || "—"}</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:8 }}>
                        {[["DK Line",p.line],["Power Rating",p.power],["Edge",p.edge]].map(([label,val])=>(
                          <div key={label} style={{ background:"#0F1F14", border:"1px solid #1E2A1E",
                            borderRadius:5, padding:"5px 8px", textAlign:"center" }}>
                            <div style={{ fontSize:9, color:"#6B8F71", textTransform:"uppercase",
                              letterSpacing:"0.07em", marginBottom:2 }}>{label}</div>
                            <div style={{ fontSize:12, fontWeight:700, color:"#E8F5E9" }}>{val || "—"}</div>
                          </div>
                        ))}
                      </div>
                      {p.thesis && <div style={{ fontSize:11, color:"#A8C5A0", lineHeight:1.6,
                        borderLeft:"2px solid #22C55E30", paddingLeft:8, marginBottom:6 }}>{p.thesis}</div>}
                      {p.flags  && <div style={{ fontSize:10, color:"#FACC15" }}>⚑ {p.flags}</div>}
                    </div>
                  </div>
                );
              })}
              {picks.filter(p => p.pick || p.matchup).length === 0 && (
                <div style={{ textAlign:"center", padding:"2rem", color:"#6B8F71", fontSize:13 }}>
                  Add picks in the Builder tab to preview your brief.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EXPORT TAB ── */}
        {tab === "posts" && (
          <div>
            {/* Discord */}
            <div style={{ background:S.cardBg, border:`1px solid ${S.cardBorder}`, borderRadius:10, padding:"14px 16px", marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ fontSize:13, fontWeight:700, color:S.textPrimary }}>💬 Discord — #picks-briefs</div>
                <button onClick={copyDiscord} style={btn(true, false, false)}>
                  {copiedX === "discord" ? "✓ Copied!" : "Copy"}
                </button>
              </div>
              <pre style={{ fontSize:11, color:S.textSecondary, background:S.subBg, border:`1px solid ${S.cardBorder}`,
                borderRadius:6, padding:"10px 12px", whiteSpace:"pre-wrap", fontFamily:"monospace", lineHeight:1.7, margin:0 }}>
                {generateDiscord()}
              </pre>
            </div>

            {/* X Posts */}
            <div style={{ fontSize:12, fontWeight:700, color:S.textSecondary, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.07em" }}>
              𝕏 Posts ({xPosts.length})
            </div>
            {xPosts.map((post, i) => (
              <div key={i} style={{ background:S.cardBg, border:`1px solid ${S.cardBorder}`, borderRadius:10, padding:"12px 14px", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:S.textSecondary }}>{post.label}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:10, color:post.text.length > 280 ? "#C0392B" : S.textMuted }}>
                      {post.text.length}/280
                    </span>
                    <button onClick={() => copyText(post.text, `x-${i}`)} style={btn(true, false, false)}>
                      {copiedX === `x-${i}` ? "✓" : "Copy"}
                    </button>
                  </div>
                </div>
                <pre style={{ fontSize:12, color:S.textPrimary, background:S.subBg, border:`1px solid ${S.cardBorder}`,
                  borderRadius:6, padding:"10px 12px", whiteSpace:"pre-wrap", fontFamily:"inherit", lineHeight:1.6, margin:0 }}>
                  {post.text}
                </pre>
                {post.text.length > 280 && (
                  <div style={{ fontSize:10, color:"#C0392B", marginTop:5 }}>
                    ⚠️ Over 280 chars — trim the thesis or split into a thread.
                  </div>
                )}
              </div>
            ))}
            {xPosts.length === 0 && (
              <div style={{ textAlign:"center", padding:"2rem", color:S.textSecondary,
                fontSize:13, background:S.cardBg, borderRadius:8, border:`1px solid ${S.cardBorder}` }}>
                Add picks in the Builder tab to generate posts.
              </div>
            )}
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
