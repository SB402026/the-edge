// ─── SHARED ENGINE — used by both NFL and NCAAF pages ────────────────────────

export function buildTeamMap(fpiList) {
  const seen = {};
  fpiList.forEach(t => { if (!seen[t.abbr]) seen[t.abbr] = t; });
  return seen;
}

export function calcSpread(game, teamMap, injAdj = {}) {
  const h = teamMap[game.home], a = teamMap[game.away];
  if (!h || !a) return 0;
  let proj = h.fpiPts - a.fpiPts;
  if (!game.neutral) proj += (h.hfa || 2.0);
  proj += (injAdj[game.home] || 0) - (injAdj[game.away] || 0);
  return parseFloat(proj.toFixed(1));
}

export function getEdge(proj, dk) {
  return parseFloat((dk - proj).toFixed(1));
}

// NFL rec — threshold 2.5 pts
export function getNFLRec(edge) {
  const abs = Math.abs(edge), dir = edge > 0 ? "away" : "home";
  if (abs < 1.5) return { verdict:"PASS", tier:0, units:0, pct:0, dir:null };
  if (abs < 2.5) return { verdict:"LEAN", tier:1, units:1, pct:1, dir };
  if (abs < 3.5) return { verdict:"BET",  tier:2, units:2, pct:2, dir };
  return               { verdict:"BEST",  tier:3, units:3, pct:3, dir };
}

// NCAAF spread penalty — based on historical cover rates since 1980
export function getSpreadPenalty(dkSpread) {
  const abs = Math.abs(dkSpread);
  if (dkSpread >= 0) return 0; // away team favored — no penalty
  if (abs >= 28) return -4.0;
  if (abs >= 21) return -2.5;
  if (abs >= 14) return -1.5;
  return 0;
}

export function getAdjustedEdge(rawEdge, dkSpread) {
  return parseFloat((rawEdge + getSpreadPenalty(dkSpread)).toFixed(1));
}

// NCAAF rec — higher threshold due to variance
export function getCFBRec(adjEdge) {
  const abs = Math.abs(adjEdge), dir = adjEdge > 0 ? "away" : "home";
  if (abs < 2.0) return { verdict:"PASS", tier:0, units:0, pct:0, dir:null };
  if (abs < 3.0) return { verdict:"LEAN", tier:1, units:1, pct:1, dir };
  if (abs < 4.5) return { verdict:"BET",  tier:2, units:2, pct:2, dir };
  return               { verdict:"BEST",  tier:3, units:3, pct:3, dir };
}

export function parseFPICSV(text) {
  return text.trim().split("\n")
    .filter(l => l.trim() && !l.toLowerCase().startsWith("rank"))
    .map(line => {
      const p = line.split(",").map(s => s.trim());
      return {
        rank: parseInt(p[0]), name: p[1], abbr: p[2],
        fpiPts: parseFloat(p[3]),
        conf: p[4] || "Unknown",
        hfa: parseFloat(p[5]) || 2.0,
        dome: p[6] === "true"
      };
    }).filter(t => t.abbr && !isNaN(t.fpiPts));
}

export function parseDKCSV(text) {
  return text.trim().split("\n")
    .filter(l => l.trim() && !l.toLowerCase().startsWith("away"))
    .map(line => {
      const p = line.split(",").map(s => s.trim());
      return {
        away: p[0], home: p[1],
        dkSpread: parseFloat(p[2]),
        dkTotal: parseFloat(p[3]),
        gameTime: p[4], network: p[5],
        neutral: p[6] === "true",
        notes: p[7] || ""
      };
    }).filter(g => g.away && g.home && !isNaN(g.dkSpread));
}
