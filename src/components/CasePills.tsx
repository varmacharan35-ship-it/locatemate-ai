const base =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em]";

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "border-transparent bg-primary text-primary-foreground",
    lead: "border-transparent bg-warning text-warning-foreground",
    found: "border-transparent bg-success text-success-foreground",
    closed: "border-border bg-muted text-muted-foreground",
  };
  return <span className={`${base} ${styles[status] ?? styles["closed"]}`}>{status}</span>;
}

export function PriorityPill({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    critical: "border-transparent bg-destructive text-destructive-foreground",
    high: "border-transparent bg-warning text-warning-foreground",
    medium: "border-border bg-accent text-accent-foreground",
    low: "border-border bg-muted text-muted-foreground",
  };
  return (
    <span className={`${base} ${styles[priority] ?? styles["medium"]}`}>{priority} priority</span>
  );
}

export function ConfidencePill({ confidence }: { confidence: string }) {
  const styles: Record<string, string> = {
    high: "border-transparent bg-primary text-primary-foreground",
    medium: "border-border bg-accent text-accent-foreground",
    low: "border-border bg-muted text-muted-foreground",
  };
  return (
    <span className={`${base} ${styles[confidence] ?? styles["medium"]}`}>
      {confidence} confidence
    </span>
  );
}
