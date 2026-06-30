import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock, Unlock, History as HistoryIcon, TrendingUp, FileImage, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — StegoCrypt" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      const [encoded, decoded, recent] = await Promise.all([
        supabase.from("history").select("*", { count: "exact", head: true }).eq("operation", "encode").eq("status", "success"),
        supabase.from("history").select("*", { count: "exact", head: true }).eq("operation", "decode").eq("status", "success"),
        supabase.from("history").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      return {
        encoded: encoded.count ?? 0,
        decoded: decoded.count ?? 0,
        recent: recent.data ?? [],
      };
    },
  });

  const cards = [
    { label: "Encoded Images", value: stats?.encoded ?? 0, icon: Lock, color: "text-primary", bg: "bg-primary/10" },
    { label: "Decoded Messages", value: stats?.decoded ?? 0, icon: Unlock, color: "text-accent", bg: "bg-accent/10" },
    { label: "Total Activity", value: (stats?.encoded ?? 0) + (stats?.decoded ?? 0), icon: TrendingUp, color: "text-secondary", bg: "bg-secondary/20" },
    { label: "Success Rate", value: "100%", icon: CheckCircle2, color: "text-accent", bg: "bg-accent/10" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, <span className="gradient-text">{user?.user_metadata?.username || user?.email?.split("@")[0]}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Your secure steganography workspace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="cyber-card rounded-2xl p-5">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${bg} ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="mt-4 text-3xl font-bold font-mono">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/encode" className="cyber-card rounded-2xl p-6 hover:border-primary/60 transition group">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary mb-3">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">Encode a message</h2>
              <p className="text-sm text-muted-foreground mt-1">Upload an image, type a secret, get a stego-PNG.</p>
            </div>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition">Open →</Button>
          </div>
        </Link>
        <Link to="/decode" className="cyber-card rounded-2xl p-6 hover:border-accent/60 transition group">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent/15 text-accent mb-3">
                <Unlock className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">Decode an image</h2>
              <p className="text-sm text-muted-foreground mt-1">Upload a stego-PNG, enter the password, reveal the message.</p>
            </div>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition">Open →</Button>
          </div>
        </Link>
      </div>

      <div className="cyber-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HistoryIcon className="h-4 w-4 text-muted-foreground" /> Recent activity
          </h2>
          <Link to="/history" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        {stats?.recent.length ? (
          <ul className="divide-y divide-border/60">
            {stats.recent.map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  {r.operation === "encode" ? (
                    <Lock className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Unlock className="h-4 w-4 text-accent shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.filename}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-mono px-2 py-1 rounded-md ${
                  r.status === "success" ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"
                }`}>{r.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10 text-sm text-muted-foreground">
            <FileImage className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No activity yet. Try encoding your first message.
          </div>
        )}
      </div>
    </div>
  );
}
