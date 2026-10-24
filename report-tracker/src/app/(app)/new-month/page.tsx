import { NewMonthForm } from "@/components/NewMonthForm";

export default function NewMonthPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">New month</h1>
      <p className="text-slate-600">
        Pick a from and to date. The range is split into four weeks (W1–W4). Earlier months are kept in Recents.
      </p>
      <NewMonthForm />
    </div>
  );
}
