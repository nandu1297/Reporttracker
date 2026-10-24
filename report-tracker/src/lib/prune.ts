export const KEEP_OPTIONS = [1, 2, 3, 6, 12] as const;

export const monthIndex = (year: number, month: number) => year * 12 + month;

// Index of the current month, taking "today" in IST.
export function currentMonthIndex() {
  const now = new Date(Date.now() + 5.5 * 3600_000);
  return monthIndex(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

// Archived months older than the last `keep` months (the current month counts as the first).
// Active months are never included.
export function monthsToPrune<T extends { year: number; month: number; status: string }>(months: T[], keep: number, current: number) {
  return months.filter((m) => m.status === "COMPLETED" && monthIndex(m.year, m.month) <= current - keep);
}
