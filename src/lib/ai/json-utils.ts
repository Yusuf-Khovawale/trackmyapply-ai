// Robustly parse JSON out of a model response: strips markdown code
// fences and leading/trailing prose, then JSON.parse.
export function parseModelJson(raw: string): unknown {
  let text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    text = fenced[1].trim();
  }
  // Fall back to the outermost {...} or [...] block if there's stray prose.
  if (!text.startsWith("{") && !text.startsWith("[")) {
    const start = text.search(/[[{]/);
    if (start !== -1) {
      text = text.slice(start);
    }
  }
  const lastBrace = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (lastBrace !== -1) {
    text = text.slice(0, lastBrace + 1);
  }
  return JSON.parse(text);
}
