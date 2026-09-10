import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CASEFILE — AI Missing Person Investigation System" },
      {
        name: "description",
        content:
          "CASEFILE helps investigators manage missing person cases, log sightings and predict the most probable search areas with AI reasoning.",
      },
      { property: "og:title", content: "CASEFILE — AI Missing Person Investigation System" },
      {
        property: "og:description",
        content:
          "Case management, sightings correlation and AI-ranked search areas for missing person investigations.",
      },
    ],
  }),
  component: Home,
});

const steps = [
  {
    n: "01",
    title: "File the case",
    body: "Record identity, physical description, last known position, clothing, vehicle and vulnerability factors.",
  },
  {
    n: "02",
    title: "Log every sighting",
    body: "Add reported sightings with time, place and reliability so patterns of movement become visible.",
  },
  {
    n: "03",
    title: "Predict search areas",
    body: "The analysis engine ranks probable areas with a confidence score, reasoning and next steps for the field team.",
  },
];

function Home() {
  return (
    <AppShell>
      <section className="panel rule-top p-8 sm:p-12">
        <p className="label-caps">Investigation support system</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          Missing person casework, with AI-ranked search areas.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          CASEFILE keeps every case file, sighting and assessment in one place, then reasons over
          them to tell your team where to look first — and why.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/cases">Open the case index</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/cases/new">File a new case</Link>
          </Button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="panel p-6">
            <span className="font-mono text-sm text-primary">{s.n}</span>
            <h2 className="mt-2 text-lg font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="label-caps">Operating limits</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Predictions are probabilistic decision support built from the information you enter. They
          are not evidence, they do not identify individuals, and every search must be coordinated
          with the responsible law enforcement agency.
        </p>
      </section>
    </AppShell>
  );
}
