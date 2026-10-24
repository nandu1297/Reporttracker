export const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export const monthLabel = (year: number, month: number) => `${MONTH_NAMES[month - 1]} ${year}`;
export const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

// Splits an inclusive date range into 4 consecutive weeks.
// Ranges of 28+ days: W1-W3 are 7 days each and W4 takes the remaining days. Shorter ranges are split evenly.
export function weekRanges(start: Date, end: Date) {
  const n = Math.round((+end - +start) / 864e5) + 1;
  const sizes = n >= 28 ? [7, 7, 7, n - 21] : [0, 1, 2].map((i) => Math.floor(n / 4) + (i < n % 4 ? 1 : 0)).concat(0);
  if (n < 28) sizes[3] = n - sizes[0] - sizes[1] - sizes[2];
  let offset = 0;
  return sizes.map((size, i) => {
    const s = new Date(+start + offset * 864e5);
    const e = new Date(+start + (offset + size - 1) * 864e5);
    offset += size;
    return { number: i + 1, startDate: s, endDate: e };
  });
}

export const fmtDay = (d: Date) =>
  `${DAY_NAMES[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()].slice(0, 3)}`;
export const fmtShort = (d: Date) => `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()].slice(0, 3)}`;
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
