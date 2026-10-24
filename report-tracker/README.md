# Report Tracker

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Prisma + Neon PostgreSQL.

## Local setup
1. In Neon, copy the connection string (use the non-pooled one if migrations hang).
2. Put your Neon string in `.env` as `DATABASE_URL` (a password is optional: `APP_PASSWORD`, empty = no login).
3. `npm install`
4. `npx prisma migrate deploy`   (creates the tables from `prisma/migrations`)
5. `npm run db:seed`            (optional sample data: expects 4 reports, ₹8,000 / ₹1,600 / ₹6,400 profit)
6. `npm run dev` → http://localhost:3000

Other commands: `npm test` (calculation tests), `npm run lint`, `npm run build`, `npm run db:studio`.
When you change `prisma/schema.prisma`, run `npm run db:migrate`.

## Deploy to Vercel
1. Push this folder to GitHub.
2. Vercel → Add New Project → import the repo. If the repo root is the parent folder, set **Root Directory** to `report-tracker`.
3. Environment Variables: `DATABASE_URL` (and optionally `APP_PASSWORD`).
4. Deploy. The build command (`prisma generate && prisma migrate deploy && next build`) applies migrations automatically.
5. Vercel gives you a public URL (`https://<project>.vercel.app`); open it on laptop and phone.

## Notes
- Currency is stored as whole rupees (integers). Employee total = rate × quantity; client amount = reports × client rate.
- Payments are separate records (`ClientPayment`, `EmployeePayment`), so partial payments are supported; the UI toggles full paid/pending.
- Client/employee names are snapshotted on each assignment, so renames never change history.
- Weeks: W1 = days 1–7, W2 = 8–14, W3 = 15–21, W4 = 22–end of month.
