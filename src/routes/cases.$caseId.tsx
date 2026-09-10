import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generatePrediction } from "@/lib/cases.functions";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusPill, PriorityPill, ConfidencePill } from "@/components/CasePills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/cases/$caseId")({
  head: () => ({
    meta: [
      { title: "Case File — CASEFILE Investigation" },
      {
        name: "description",
        content:
          "Full case file: subject details, logged sightings and AI-predicted search areas with confidence and reasoning.",
      },
      { property: "og:title", content: "Case File — CASEFILE Investigation" },
      {
        property: "og:description",
        content: "Sightings timeline and AI-predicted search areas for a missing person case.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireAuth>
        <CaseDetail />
      </RequireAuth>
    </AppShell>
  ),
});

type PredictedLocation = {
  name?: string;
  radius_km?: number;
  confidence?: number;
  reasoning?: string;
};

function CaseDetail() {
  const { caseId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const runPrediction = useServerFn(generatePrediction);

  const caseQuery = useQuery({
    queryKey: ["case", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", caseId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const sightingsQuery = useQuery({
    queryKey: ["sightings", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sightings")
        .select("*")
        .eq("case_id", caseId)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const predictionsQuery = useQuery({
    queryKey: ["predictions", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const analyse = useMutation({
    mutationFn: async () => runPrediction({ data: { caseId } }),
    onSuccess: () => {
      toast.success("Location analysis complete");
      queryClient.invalidateQueries({ queryKey: ["predictions", caseId] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "The analysis could not be completed"),
  });

  const [sighting, setSighting] = useState({
    location: "",
    occurred_at: "",
    reported_by: "",
    confidence: "medium",
    notes: "",
  });

  async function addSighting(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("sightings").insert({
      case_id: caseId,
      user_id: user.id,
      location: sighting.location,
      occurred_at: sighting.occurred_at ? new Date(sighting.occurred_at).toISOString() : null,
      reported_by: sighting.reported_by || null,
      confidence: sighting.confidence,
      notes: sighting.notes || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setSighting({ location: "", occurred_at: "", reported_by: "", confidence: "medium", notes: "" });
    toast.success("Sighting logged");
    queryClient.invalidateQueries({ queryKey: ["sightings", caseId] });
  }

  async function updateStatus(status: string) {
    const { error } = await supabase.from("cases").update({ status }).eq("id", caseId);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    queryClient.invalidateQueries({ queryKey: ["cases"] });
  }

  async function deleteCase() {
    const { error } = await supabase.from("cases").delete().eq("id", caseId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Case file closed and removed");
    navigate({ to: "/cases" });
  }

  if (caseQuery.isLoading) {
    return (
      <div className="panel p-10 text-center">
        <p className="label-caps">Opening case file…</p>
      </div>
    );
  }

  const record = caseQuery.data;
  if (!record) {
    return (
      <div className="panel p-10 text-center">
        <h1 className="text-xl font-semibold">Case file not found</h1>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/cases">Back to case index</Link>
        </Button>
      </div>
    );
  }

  const latest = predictionsQuery.data?.[0];
  const locations = (latest?.locations as PredictedLocation[] | null) ?? [];
  const nextSteps = (latest?.next_steps as string[] | null) ?? [];

  return (
    <div className="space-y-6">
      <Link to="/cases" className="label-caps hover:text-foreground">
        ← Case index
      </Link>

      <header className="panel rule-top p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            {record.photo_url ? (
              <img
                src={record.photo_url}
                alt={`Photograph of ${record.full_name}`}
                className="h-24 w-20 rounded border object-cover"
                loading="lazy"
              />
            ) : null}
            <div>
              <p className="label-caps">File #{record.id.slice(0, 8)}</p>
              <h1 className="mt-1 text-3xl font-semibold">{record.full_name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {[record.age ? `${record.age} yrs` : null, record.gender, record.height_cm ? `${record.height_cm} cm` : null]
                  .filter(Boolean)
                  .join(" · ") || "No physical profile recorded"}
              </p>
              <div className="mt-3 flex gap-2">
                <StatusPill status={record.status} />
                <PriorityPill priority={record.priority} />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Select value={record.status} onValueChange={updateStatus}>
              <SelectTrigger className="w-40">
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
            <Button variant="outline" size="sm" onClick={deleteCase}>
              Delete case file
            </Button>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Last seen">{record.last_seen_location}</Detail>
          <Detail label="Date & time">
            {record.last_seen_at ? new Date(record.last_seen_at).toLocaleString() : "Unknown"}
          </Detail>
          <Detail label="Clothing">{record.clothing || "—"}</Detail>
          <Detail label="Vehicle">{record.vehicle || "—"}</Detail>
          <Detail label="Description">{record.description || "—"}</Detail>
          <Detail label="Medical / vulnerability">{record.medical_notes || "—"}</Detail>
          <Detail label="Investigator notes">{record.investigator_notes || "—"}</Detail>
        </dl>
      </header>

      <section className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">AI location prediction</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Weighs last known position, sightings, timing and vulnerability factors to rank
              probable search areas.
            </p>
          </div>
          <Button onClick={() => analyse.mutate()} disabled={analyse.isPending}>
            {analyse.isPending ? "Analysing case…" : "Run location analysis"}
          </Button>
        </div>

        {analyse.isPending ? (
          <div className="mt-5 rounded-lg border border-dashed p-6 text-center">
            <p className="label-caps">Correlating sightings and travel patterns…</p>
          </div>
        ) : latest ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-lg bg-surface p-4">
              <p className="label-caps">
                Assessment · {latest.risk_level ?? "unrated"} risk ·{" "}
                {new Date(latest.created_at).toLocaleString()}
              </p>
              <p className="mt-2 text-sm leading-relaxed">{latest.summary}</p>
            </div>

            <div className="space-y-3">
              <h3 className="label-caps">Ranked search areas</h3>
              {locations.map((loc, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold">
                      {i + 1}. {loc.name}
                      {loc.radius_km ? (
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          ~{loc.radius_km} km radius
                        </span>
                      ) : null}
                    </p>
                    <span className="font-mono text-sm text-primary">{loc.confidence ?? 0}%</span>
                  </div>
                  <Progress value={Number(loc.confidence ?? 0)} className="mt-2 h-1.5" />
                  <p className="mt-2 text-sm text-muted-foreground">{loc.reasoning}</p>
                </div>
              ))}
            </div>

            {nextSteps.length > 0 ? (
              <div>
                <h3 className="label-caps">Recommended next steps</h3>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {nextSteps.map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-mono text-xs text-primary">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {(predictionsQuery.data?.length ?? 0) > 1 ? (
              <p className="label-caps">
                {predictionsQuery.data!.length} analyses on file — showing the most recent
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No analysis yet. Log any sightings first, then run the analysis for sharper areas.
          </div>
        )}
      </section>

      <section className="panel p-6">
        <h2 className="text-xl font-semibold">Sightings log</h2>
        <form onSubmit={addSighting} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input
              required
              value={sighting.location}
              onChange={(e) => setSighting({ ...sighting, location: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>When</Label>
            <Input
              type="datetime-local"
              value={sighting.occurred_at}
              onChange={(e) => setSighting({ ...sighting, occurred_at: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Reported by</Label>
            <Input
              value={sighting.reported_by}
              onChange={(e) => setSighting({ ...sighting, reported_by: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Reliability</Label>
            <Select
              value={sighting.confidence}
              onValueChange={(v) => setSighting({ ...sighting, confidence: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["low", "medium", "high"].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={sighting.notes}
              onChange={(e) => setSighting({ ...sighting, notes: e.target.value })}
            />
          </div>
          <Button type="submit" className="sm:w-fit">
            Log sighting
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          {(sightingsQuery.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No sightings reported yet.</p>
          ) : (
            sightingsQuery.data?.map((s) => (
              <div key={s.id} className="flex flex-wrap items-start gap-3 border-l-2 border-primary bg-surface p-4">
                <div className="flex-1">
                  <p className="font-medium">{s.location}</p>
                  <p className="label-caps mt-1">
                    {s.occurred_at ? new Date(s.occurred_at).toLocaleString() : "Time unknown"}
                    {s.reported_by ? ` · reported by ${s.reported_by}` : ""}
                  </p>
                  {s.notes ? <p className="mt-2 text-sm">{s.notes}</p> : null}
                </div>
                <ConfidencePill confidence={s.confidence} />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="label-caps">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}
