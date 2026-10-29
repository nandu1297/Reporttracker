"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addClient, addEmployee } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AddClientDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [defaultReports, setDefaultReports] = useState("1");
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      const r = await addClient({ name, notes, defaultReports });
      if (!r.ok) return void toast.error(r.error);
      toast.success(`Client “${r.client.name}” added`);
      setName("");
      setNotes("");
      setDefaultReports("1");
      onOpenChange(false);
      onCreated(r.client.id);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add client</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Client name</Label>
            <Input className="h-11" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Reports received by default</Label>
            <Input className="h-11" type="number" min={1} inputMode="numeric" value={defaultReports} onChange={(e) => setDefaultReports(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button className="h-11" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddEmployeeDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      const r = await addEmployee({ name, contact });
      if (!r.ok) return void toast.error(r.error);
      toast.success(`Employee “${r.employee.name}” added`);
      setName("");
      setContact("");
      onOpenChange(false);
      onCreated(r.employee.id);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add employee</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Employee name</Label>
            <Input className="h-11" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Contact information (optional)</Label>
            <Input className="h-11" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button className="h-11" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
