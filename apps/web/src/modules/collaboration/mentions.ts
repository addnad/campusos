/// Handles are 3-20 chars of lowercase letters, digits and underscores,
/// so the pattern stops naturally at punctuation: "@john," yields "john".
const PATTERN = /@([a-z0-9_]{3,20})/gi;

export function parseHandles(body: string) {
  const found = new Set<string>();
  for (const m of body.matchAll(PATTERN)) found.add(m[1].toLowerCase());
  return [...found];
}

/// Splits a message body into text and mention parts, so a handle can be
/// marked without dangerouslySetInnerHTML.
export function splitMentions(body: string) {
  const parts: { text: string; handle: string | null }[] = [];
  let last = 0;
  for (const m of body.matchAll(PATTERN)) {
    const at = m.index ?? 0;
    if (at > last) parts.push({ text: body.slice(last, at), handle: null });
    parts.push({ text: m[0], handle: m[1].toLowerCase() });
    last = at + m[0].length;
  }
  if (last < body.length) parts.push({ text: body.slice(last), handle: null });
  return parts;
}
