export const PRESETS = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-3-months", label: "Last 3 months" },
  { value: "last-6-months", label: "Last 6 months" },
  { value: "this-year", label: "This year" },
  { value: "last-year", label: "Last year" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
] as const;

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

// Resolves a preset (or custom from/to) to an inclusive UTC date range. "Today" is taken in IST.
export function resolveRange(range?: string, from?: string, to?: string) {
  const now = new Date(Date.now() + 5.5 * 3600_000);
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const key = PRESETS.some((p) => p.value === range) ? range! : "this-month";
  let start: Date | null;
  let end: Date | null;
  switch (key) {
    case "last-month":
      start = utc(y, m - 1, 1);
      end = utc(y, m, 0);
      break;
    case "last-3-months":
      start = utc(y, m - 2, 1);
      end = utc(y, m + 1, 0);
      break;
    case "last-6-months":
      start = utc(y, m - 5, 1);
      end = utc(y, m + 1, 0);
      break;
    case "this-year":
      start = utc(y, 0, 1);
      end = utc(y, 11, 31);
      break;
    case "last-year":
      start = utc(y - 1, 0, 1);
      end = utc(y - 1, 11, 31);
      break;
    case "all":
      start = null;
      end = null;
      break;
    case "custom": {
      const f = from && !isNaN(+new Date(from)) ? new Date(from + "T00:00:00Z") : utc(y, m, 1);
      const t = to && !isNaN(+new Date(to)) ? new Date(to + "T00:00:00Z") : utc(y, m + 1, 0);
      start = f <= t ? f : t;
      end = f <= t ? t : f;
      break;
    }
    default:
      start = utc(y, m, 1);
      end = utc(y, m + 1, 0);
  }
  return { key, start, end, from: start ? iso(start) : "", to: end ? iso(end) : "" };
}
