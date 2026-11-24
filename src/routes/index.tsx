import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LandingPage } from "@/components/orion/landing-page";
import { useAuth } from "@/lib/auth-store";
import { Spinner } from "@/components/ui/spinner";
import { DashboardOverview } from "@/components/ui/glassy-dashboard";

function IndexSwitch() {
  const { initialize, status, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (!initialized || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-card border border-border p-2 shadow-sm">
            <img src="/orion-logo.png" alt="Orion" className="w-full h-full object-contain" />
          </div>
          <Spinner size="sm" />
          <p className="text-xs text-muted-foreground">Starting Orion…</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    // AppShell already wraps this in the glassy shell — just render the overview content
    return <DashboardOverview />;
  }

  return <LandingPage />;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Orion Intelligence — Enterprise Decision OS" },
      {
        name: "description",
        content:
          "A governed knowledge layer for complex investigations, trusted AI, and mission-critical applications.",
      },
      { property: "og:title", content: "Orion Intelligence — Enterprise Decision OS" },
      {
        property: "og:description",
        content:
          "A governed knowledge layer for complex investigations, trusted AI, and mission-critical applications.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndexSwitch,
});
