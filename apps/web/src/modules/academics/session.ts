/// The academic session an enrolment belongs to, as students write it:
/// "2025/2026". Derived from the date rather than asked, because a
/// student picks a level and a semester, never a session.
///
/// Nigerian sessions run roughly October to September. A session that
/// shifts — strikes move them by months — makes this occasionally wrong,
/// but it is invisible to the student and correctable.
export function sessionFor(d = new Date()) {
  const y = d.getFullYear();
  return d.getMonth() >= 9 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}
