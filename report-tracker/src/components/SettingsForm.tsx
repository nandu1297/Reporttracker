"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveDefaultRates, setSpecificRate } from "@/app/actions";
import type { RateDefaults } from "@/lib/rates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Person = { id: string; name: string; rateOverride: number | null };

function SpecificList({
  title,
  kind,
  people,
  fallback,
}: {
  title: string;
  kind: "client" | "employee";
  people: Person[];
  fallback: number;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="font-semibold">{title}</h2>
      <p className="mb-3 text-sm text-slate-500">Leave empty to use the default (₹{fallback}).</p>
      {people.length === 0 ? (
        <p className="text-sm text-slate-400">None yet</p>
      ) : (
        <div className="divide-y">
          {people.map((p) => (
            <SpecificRow key={p.id} kind={kind} person={p} fallback={fallback} />
          ))}
        </div>
      )}
    </div>
  );
}

function SpecificRow({ kind, person, fallback }: { kind: "client" | "employee"; person: Person; fallback: number }) {
  const initial = person.rateOverride === null ? "" : String(person.rateOverride);
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [, start] = useTransition();

  const commit = () => {
    if (value === saved) return;
    start(async () => {
      const r = await setSpecificRate(kind, person.id, value);
      if (!r.ok) {
        toast.error(r.error);
        setValue(saved);
        return;
      }
      setSaved(value);
      toast.success(value === "" ? `${person.name}: using default rate` : `${person.name}: ₹${value}`);
    });
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="min-w-0 truncate text-sm font-medium">{person.name}</span>
      <Input
        className="h-10 w-32"
        type="number"
        min={0}
        inputMode="numeric"
        placeholder={`₹${fallback}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
      />
    </div>
  );
}

export function SettingsForm({
  defaults,
  clients,
  employees,
}: {
  defaults: RateDefaults;
  clients: Person[];
  employees: Person[];
}) {
  const [clientRate, setClientRate] = useState(String(defaults.clientRate));
  const [employeeRate, setEmployeeRate] = useState(String(defaults.employeeRate));
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      const r = await saveDefaultRates({ clientRate, employeeRate });
      if (!r.ok) return void toast.error(r.error);
      toast.success("Default rates saved");
    });

  return (
    <>
      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold">Default rates (same for everyone)</h2>
        <p className="mb-3 text-sm text-slate-500">Used for every new report unless a client or employee has a specific rate below.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Client rate per report (₹)</Label>
            <Input className="h-11" type="number" min={0} inputMode="numeric" value={clientRate} onChange={(e) => setClientRate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Employee rate per report (₹)</Label>
            <Input className="h-11" type="number" min={0} inputMode="numeric" value={employeeRate} onChange={(e) => setEmployeeRate(e.target.value)} />
          </div>
        </div>
        <Button className="mt-4 h-11 w-full sm:w-auto" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save default rates"}
        </Button>
      </div>

      <SpecificList title="Specific rate per client" kind="client" people={clients} fallback={defaults.clientRate} />
      <SpecificList title="Specific rate per employee" kind="employee" people={employees} fallback={defaults.employeeRate} />
    </>
  );
}
