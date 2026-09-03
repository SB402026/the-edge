/**
 * Calls /api/claude and correctly extracts text from responses.
 * Handles mixed tool_use and text blocks from web search responses.
 */
export async function callClaude(body) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(String(msg));
  }

  return data;
}

/**
 * Extracts only text blocks from an Anthropic response.
 * Web search responses contain tool_use and tool_result blocks —
 * we only want the final text output.
 */
export function extractText(data) {
  if (!data?.content) return "";
  return data.content
    .filter(b => b.type === "text")
    .map(b => b.text || "")
    .join("");
}

/**
 * Two-step fetch with web search:
 * Step 1: Search the web and get raw results
 * Step 2: Ask Claude to format those results as clean JSON
 * 
 * This avoids the problem where Claude returns search results
 * as prose instead of the structured JSON we need.
 */
export async function fetchWithSearch(searchPrompt, formatPrompt) {
  // Step 1: Web search
  const searchData = await callClaude({
    _useWebSearch: true,
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{ role: "user", content: searchPrompt }]
  });

  // Extract all content — both text and tool results
  const allContent = searchData?.content || [];
  const textParts = allContent
    .filter(b => b.type === "text")
    .map(b => b.text || "")
    .join("\n");

  if (!textParts && allContent.length === 0) {
    throw new Error("Empty response from web search");
  }

  // Step 2: Format as JSON
  const formatData = await callClaude({
    model: "claude-sonnet-4-6",
    max_tokens: 2500,
    messages: [{
      role: "user",
      content: `${formatPrompt}\n\nHere is the raw data to format:\n\n${textParts || "Use your knowledge to generate the data."}`
    }]
  });

  const result = extractText(formatData);
  if (!result) throw new Error("Empty response from format step");
  return result;
}

/**
 * Extracts a JSON array from a text string.
 * Handles responses wrapped in markdown, explanation text, etc.
 */
export function extractJSON(text) {
  if (!text) throw new Error("Empty text passed to extractJSON");

  // Strip markdown code fences
  let clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  // Try direct parse first (cleanest case)
  try {
    const direct = JSON.parse(clean);
    if (Array.isArray(direct)) return direct;
  } catch {}

  // Find outermost [ ... ] array
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    console.error("extractJSON: no array found. Preview:", clean.slice(0, 200));
    throw new Error("No JSON array found in response");
  }

  try {
    const parsed = JSON.parse(clean.slice(start, end + 1));
    if (!Array.isArray(parsed)) throw new Error("Not an array");
    return parsed;
  } catch(e) {
    console.error("extractJSON parse error:", e.message, "| Preview:", clean.slice(start, start + 200));
    throw new Error("JSON parse failed: " + e.message);
  }
}
