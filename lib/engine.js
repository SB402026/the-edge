// ─── SHARED ENGINE — used by both NFL and NCAAF pages ────────────────────────

export function buildTeamMap(fpiList) {
  const seen = {};
  fpiList.forEach(t => { if (!seen[t.abbr]) seen[t.abbr] = t; });
  return seen;
}

/**
 * Projects the spread from the HOME team's perspective.
 * Positive result = home team favored by that many points.
 * e.g. proj = +7 means home favored by 7.
 */
export function calcSpread(game, teamMap, injAdj = {}) {
  const h = teamMap[game.home], a = teamMap[game.away];
  if (!h || !a) return 0;
  // Home rating minus away rating = home advantage in points on neutral field
  let proj = h.fpiPts - a.fpiPts;
  // Add home field advantage (not applied at neutral sites)
  if (!game.neutral) proj += (h.hfa || 2.0);
  // Injury adjustments: positive = helps home, negative = hurts home
  proj += (injAdj[game.home] || 0) - (injAdj[game.away] || 0);
  return parseFloat(proj.toFixed(1));
}

/**
 * Edge = how much better our number is vs the book, from home perspective.
 * 
 * Convention: both proj and dkSpread are from HOME perspective.
 *   proj > 0 = we think home is favored
 *   dkSpread < 0 = book has home favored (DK uses negative for home fav)
 * 
 * To compare apples to apples, we negate dkSpread so both use
 * "positive = home favored" convention.
 * 
 * edge > 0 = we think home is stronger than book does → take HOME -ATS
 * edge < 0 = we think away is stronger than book does → take AWAY +ATS
 */
export function getEdge(proj, dkSpread) {
  // dkSpread: negative = home favored (DK convention)
  // Convert to "positive = home favored" by negating
  const dkHomePerspective = -dkSpread;
  // Edge = our view minus book's view (both now positive = home favored)
  return parseFloat((proj - dkHomePerspective).toFixed(1));
}

// NFL rec — threshold 2.5 pts
// edge > 0 = home stronger than book → take HOME -ATS
// edge < 0 = away stronger than book → take AWAY +ATS
export function getNFLRec(edge) {
  const abs = Math.abs(edge);
  const dir = edge > 0 ? "home" : "away";
  if (abs < 1.5) return { verdict:"PASS", tier:0, units:0, pct:0, dir:null };
  if (abs < 2.5) return { verdict:"LEAN", tier:1, units:1, pct:1, dir };
  if (abs < 3.5) return { verdict:"BET",  tier:2, units:2, pct:2, dir };
  return               { verdict:"BEST",  tier:3, units:3, pct:3, dir };
}

// NCAAF spread penalty — based on historical cover rates since 1980
// Applied when home team is a big favorite (dkSpread very negative)
export function getSpreadPenalty(dkSpread) {
  const abs = Math.abs(dkSpread);
  if (dkSpread > 0) return 0; // away team favored — no penalty on home
  if (abs >= 28) return -4.0;
  if (abs >= 21) return -2.5;
  if (abs >= 14) return -1.5;
  return 0;
}

export function getAdjustedEdge(rawEdge, dkSpread) {
  // Penalty reduces edge when home team is a large favorite
  // (historically they underperform the spread)
  return parseFloat((rawEdge + getSpreadPenalty(dkSpread)).toFixed(1));
}

// NCAAF rec — higher threshold due to variance
export function getCFBRec(adjEdge) {
  const abs = Math.abs(adjEdge);
  const dir = adjEdge > 0 ? "home" : "away";
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
