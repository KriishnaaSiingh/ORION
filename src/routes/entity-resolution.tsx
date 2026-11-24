import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/lib/require-auth";
import EntityResolutionPanel from "@/components/orion/entity-resolution-panel";

export const Route = createFileRoute("/entity-resolution")({
  head: () => ({
    meta: [
      { title: "Entity Resolution — Orion Intelligence" },
      {
        name: "description",
        content:
          "ML-powered entity resolution and record deduplication engine.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <EntityResolutionPanel />
    </RequireAuth>
  ),
});
