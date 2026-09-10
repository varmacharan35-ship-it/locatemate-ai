import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-primary font-mono text-xs font-bold text-primary-foreground">
              CF
            </span>
            <span className="font-mono text-sm font-semibold tracking-[0.16em] text-primary">
              CASEFILE
            </span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm sm:flex">
            <Link
              to="/cases"
              className="rounded px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded px-3 py-1.5 bg-accent text-accent-foreground" }}
            >
              Case index
            </Link>
            <Link
              to="/cases/new"
              className="rounded px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded px-3 py-1.5 bg-accent text-accent-foreground" }}
            >
              Open a case
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {session ? (
              <>
                <span className="hidden font-mono text-xs text-muted-foreground md:inline">
                  {session.user.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate({ to: "/auth" });
                  }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => navigate({ to: "/auth" })}>
                Investigator sign in
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-5 pb-10 pt-2">
        <p className="label-caps">
          CASEFILE — decision support only. Always coordinate with law enforcement.
        </p>
      </footer>
    </div>
  );
}
