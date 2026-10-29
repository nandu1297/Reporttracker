import { db } from "@/lib/db";
import { getRateDefaults } from "@/lib/rates";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const [defaults, clients, employees] = await Promise.all([
    getRateDefaults(),
    db.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, rateOverride: true } }),
    db.employee.findMany({ where: { isSelf: false }, orderBy: { name: "asc" }, select: { id: true, name: true, rateOverride: true } }),
  ]);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-slate-500">
          Default rates for new reports. Reports already in the tracker keep the rates they were saved with.
        </p>
      </div>
      <SettingsForm defaults={defaults} clients={clients} employees={employees} />
    </div>
  );
}
