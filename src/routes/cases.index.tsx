import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { StatusPill, PriorityPill } from "@/components/CasePills";

export const Route = createFileRoute("/cases/")({
  head: () => ({
    meta: [
      { title: "Case Index — CASEFILE Investigations" },
      {
        name: "description",
        content:
          "Every active and closed missing person case in your CASEFILE workspace, with priority, last known location and AI analysis status.",
      },
      { property: "og:title", content: "Case Index — CASEFILE Investigations" },
      {
        property: "og:description",
        content: "Track active missing person investigations and their predicted search areas.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireAuth>
        <CaseIndex />
      </RequireAuth>
    </AppShell>
  ),
});

function CaseIndex() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["cases", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*, predictions(id), sightings(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const active = data?.filter((c) => c.status === "active").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">Case index</p>
          <h1 className="mt-1 text-3xl font-semibold">Missing person investigations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? "Loading records…" : `${data?.length ?? 0} case files · ${active} active`}
          </p>
        </div>
        <Button asChild>
          <Link to="/cases/new">Open a new case</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="panel p-10 text-center">
          <p className="label-caps">Retrieving case files…</p>
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="panel rule-top p-10 text-center">
          <h2 className="text-lg font-semibold">No case files yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Open your first case with the person's details and last known position. The analysis
            engine will suggest probable search areas.
          </p>
          <Button asChild className="mt-5">
            <Link to="/cases/new">Open a case</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.map((c) => (
            <Link
              key={c.id}
              to="/cases/$caseId"
              params={{ caseId: c.id }}
              className="panel block p-5 transition-shadow hover:shadow-[var(--shadow-panel-lg)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="label-caps">
                    File #{c.id.slice(0, 8)}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">{c.full_name}</h2>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusPill status={c.status} />
                  <PriorityPill priority={c.priority} />
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="label-caps">Last seen</dt>
                  <dd className="mt-0.5">{c.last_seen_location}</dd>
                </div>
                <div>
                  <dt className="label-caps">Date</dt>
                  <dd className="mt-0.5">
                    {c.last_seen_at ? new Date(c.last_seen_at).toLocaleDateString() : "Unknown"}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 font-mono text-xs text-muted-foreground">
                {c.sightings?.length ?? 0} sightings · {c.predictions?.length ?? 0} AI analyses
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
