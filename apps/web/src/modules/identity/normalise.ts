/// Pure, so client components can import it without reaching Prisma.
export const normaliseName = (n: string) =>
  n.toUpperCase().replace(/[^A-Z0-9]/g, "");

/// Cheap similarity for near-duplicate programme names. Not fuzzy
/// matching in any serious sense: it catches plural/spacing/abbreviation
/// drift ("Computer Sciences" vs "Computer Science"), which is the
/// failure that would split one cohort across several programmes.
export function looksLike(a: string, b: string) {
  const x = normaliseName(a);
  const y = normaliseName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.startsWith(y) || y.startsWith(x)) return true;
  const shorter = x.length < y.length ? x : y;
  const longer = x.length < y.length ? y : x;
  return longer.includes(shorter) && shorter.length >= 6;
}
