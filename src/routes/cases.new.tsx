import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/cases/new")({
  head: () => ({
    meta: [
      { title: "Open a New Case — CASEFILE" },
      {
        name: "description",
        content:
          "Record a missing person's description, last known position and identifying details to start an AI-assisted investigation.",
      },
      { property: "og:title", content: "Open a New Case — CASEFILE" },
      {
        property: "og:description",
        content: "Start a missing person case file with last known position and identifiers.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireAuth>
        <NewCase />
      </RequireAuth>
    </AppShell>
  ),
});

function NewCase() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    age: "",
    gender: "",
    photo_url: "",
    last_seen_location: "",
    last_seen_at: "",
    height_cm: "",
    clothing: "",
    vehicle: "",
    medical_notes: "",
    description: "",
    investigator_notes: "",
    priority: "medium",
    status: "active",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("cases")
        .insert({
          user_id: user.id,
          full_name: form.full_name,
          age: form.age ? Number(form.age) : null,
          gender: form.gender || null,
          photo_url: form.photo_url || null,
          last_seen_location: form.last_seen_location,
          last_seen_at: form.last_seen_at ? new Date(form.last_seen_at).toISOString() : null,
          height_cm: form.height_cm ? Number(form.height_cm) : null,
          clothing: form.clothing || null,
          vehicle: form.vehicle || null,
          medical_notes: form.medical_notes || null,
          description: form.description || null,
          investigator_notes: form.investigator_notes || null,
          priority: form.priority,
          status: form.status,
        })
        .select()
        .single();
      if (error) throw error;
      toast.success("Case file opened");
      navigate({ to: "/cases/$caseId", params: { caseId: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open the case");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <p className="label-caps">New file</p>
        <h1 className="mt-1 text-3xl font-semibold">Open a case</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The more precise the last known position and timing, the sharper the location analysis.
        </p>
      </div>

      <section className="panel rule-top space-y-4 p-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-primary">
          Subject identity
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            <Input
              required
              value={form.full_name}
              onChange={(e) => set("full_name")(e.target.value)}
            />
          </Field>
          <Field label="Age">
            <Input
              type="number"
              min={0}
              value={form.age}
              onChange={(e) => set("age")(e.target.value)}
            />
          </Field>
          <Field label="Gender">
            <Input value={form.gender} onChange={(e) => set("gender")(e.target.value)} />
          </Field>
          <Field label="Height (cm)">
            <Input
              type="number"
              min={0}
              value={form.height_cm}
              onChange={(e) => set("height_cm")(e.target.value)}
            />
          </Field>
          <Field label="Photo link">
            <Input
              type="url"
              placeholder="https://…"
              value={form.photo_url}
              onChange={(e) => set("photo_url")(e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="panel space-y-4 p-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-primary">
          Last known position
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Last seen location" required>
            <Input
              required
              placeholder="Street, area, city"
              value={form.last_seen_location}
              onChange={(e) => set("last_seen_location")(e.target.value)}
            />
          </Field>
          <Field label="Last seen date & time">
            <Input
              type="datetime-local"
              value={form.last_seen_at}
              onChange={(e) => set("last_seen_at")(e.target.value)}
            />
          </Field>
          <Field label="Clothing when last seen">
            <Input value={form.clothing} onChange={(e) => set("clothing")(e.target.value)} />
          </Field>
          <Field label="Vehicle">
            <Input value={form.vehicle} onChange={(e) => set("vehicle")(e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="panel space-y-4 p-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-primary">
          Context & assessment
        </h2>
        <Field label="Physical description and distinguishing features">
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description")(e.target.value)}
          />
        </Field>
        <Field label="Medical or vulnerability notes">
          <Textarea
            rows={2}
            value={form.medical_notes}
            onChange={(e) => set("medical_notes")(e.target.value)}
          />
        </Field>
        <Field label="Investigator notes">
          <Textarea
            rows={3}
            value={form.investigator_notes}
            onChange={(e) => set("investigator_notes")(e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Priority">
            <Select value={form.priority} onValueChange={set("priority")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["low", "medium", "high", "critical"].map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={set("status")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["active", "lead", "found", "closed"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "Filing…" : "File the case"}
      </Button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}
