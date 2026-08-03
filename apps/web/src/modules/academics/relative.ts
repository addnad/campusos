export const clockTime = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export function relative(at: Date, now: Date) {
  const mins = Math.round((at.getTime() - now.getTime()) / 60000);
  if (mins < -60) {
    const hrs = Math.round(-mins / 60);
    if (hrs < 24) return "Late";
    const days = Math.round(hrs / 24);
    return days === 1 ? "Yesterday" : `${days} days late`;
  }
  if (mins < 0) return "Late";
  if (mins === 0) return "Now";
  if (mins < 60) return `In ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `In ${hrs} hr`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "Tomorrow" : `In ${days} days`;
}
