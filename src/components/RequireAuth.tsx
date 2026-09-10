import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="panel p-10 text-center">
        <p className="label-caps">Verifying credentials…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="panel mx-auto max-w-md p-8 text-center">
        <p className="label-caps">Restricted</p>
        <h2 className="mt-2 text-xl font-semibold">Investigator access required</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to open case files, log sightings and run location analysis.
        </p>
        <Button asChild className="mt-5">
          <Link to="/auth">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
