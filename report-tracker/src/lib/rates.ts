import { db } from "./db";
import { DEFAULT_CLIENT_RATE, DEFAULT_EMPLOYEE_RATE } from "./calc";

export type RateDefaults = { clientRate: number; employeeRate: number };

// Uniform rates (Settings page). Falls back to the built-in values if the row is missing.
export async function getRateDefaults(): Promise<RateDefaults> {
  const s = await db.setting.findUnique({ where: { id: "default" } });
  return { clientRate: s?.defaultClientRate ?? DEFAULT_CLIENT_RATE, employeeRate: s?.defaultEmployeeRate ?? DEFAULT_EMPLOYEE_RATE };
}
