import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "./auth-store";

export function RequireAuth({
  children,
  redirectTo = "/login",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const { status, initialized, initialize } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized && status !== "authenticated" && status !== "loading") {
      void navigate({ to: redirectTo as "/login", replace: true });
    }
  }, [initialized, status, navigate, redirectTo]);

  if (!initialized || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-card border border-border p-2 shadow-sm">
            <img src="/orion-logo.png" alt="Orion" className="w-full h-full object-contain" />
          </div>
          <Spinner size="sm" />
          <p className="text-xs text-muted-foreground">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") return null;

  return <>{children}</>;
}
