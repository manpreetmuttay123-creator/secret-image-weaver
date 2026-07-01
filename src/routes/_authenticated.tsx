import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";

// Auth removed — this pathless layout is now a public shell wrapper so the
// existing /dashboard, /encode, /decode, /history URLs keep working without
// requiring sign-in.
export const Route = createFileRoute("/_authenticated")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
