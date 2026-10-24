// Sample data for testing only. Run: npm run db:seed
// Remove it afterwards by deleting the sample month from its page ("Delete" button).
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const bounds = [[1, 7], [8, 14], [15, 21], [22, last]];

  const existing = await db.month.findUnique({ where: { year_month: { year, month } } });
  if (existing) {
    console.log("Month already exists; skipping seed.");
    return;
  }

  const m = await db.month.create({
    data: {
      year,
      month,
      weeks: {
        create: bounds.map(([s, e], i) => ({
          number: i + 1,
          startDate: new Date(Date.UTC(year, month - 1, s)),
          endDate: new Date(Date.UTC(year, month - 1, e)),
        })),
      },
    },
    include: { weeks: true },
  });
  const h1 = m.weeks.find((w) => w.number === 1)!;

  const sample = [
    { client: "Trevcon", employee: "Rithvik", reports: 2, qty: 2 },
    { client: "ETI", employee: "Nitish", reports: 1, qty: 1 },
    { client: "PTI", employee: "Harshita", reports: 1, qty: 1 },
  ];
  for (const [i, s] of sample.entries()) {
    const client = await db.client.upsert({ where: { name: s.client }, update: {}, create: { name: s.client, rate: 2000 } });
    const employee = await db.employee.upsert({ where: { name: s.employee }, update: {}, create: { name: s.employee } });
    await db.assignment.create({
      data: {
        weekId: h1.id,
        date: new Date(Date.UTC(year, month - 1, 1)),
        sortOrder: i,
        clientId: client.id,
        clientName: client.name,
        reportName: `Sample report ${i + 1}`,
        reportsReceived: s.reports,
        clientRate: 2000,
        clientTotal: s.reports * 2000,
        employeeId: employee.id,
        employeeName: employee.name,
        employeeRate: 400,
        employeeQty: s.qty,
        employeeTotal: 400 * s.qty,
      },
    });
  }
  console.log("Seeded sample month (expected: 4 reports, ₹8,000 client, ₹1,600 employee, ₹6,400 profit).");
}

main().finally(() => db.$disconnect());
