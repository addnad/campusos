/// The level ladder for one programme. Length comes from the programme
/// itself: full-time ND runs 2 years, part-time ND runs 3 (six semesters).
export function ladderFor(award: string, years: number) {
  const roman = ["I", "II", "III", "IV", "V"];
  if (["ND", "HND", "NCE"].includes(award)) {
    return Array.from({ length: years }, (_, i) => `${award} ${roman[i]}`);
  }
  return Array.from({ length: years }, (_, i) => `${(i + 1) * 100} Level`);
}
