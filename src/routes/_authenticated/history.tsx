import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { History as HistoryIcon, Lock, Unlock, Search, Trash2, FileImage } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteHistory, listHistory, type HistoryRow } from "@/lib/history-store";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — StegoCrypt" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "encode" | "decode">("all");

  useEffect(() => {
    const sync = () => setRows(listHistory());
    sync();
    window.addEventListener("stegocrypt-history-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("stegocrypt-history-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.operation !== filter) return false;
    if (search && !r.filename.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const deleteRow = (id: string) => {
    deleteHistory(id);
    toast.success("Removed");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/20 text-secondary"><HistoryIcon className="h-5 w-5" /></span>
          Activity history
        </h1>
        <p className="text-muted-foreground mt-1">Every encode and decode you've run on this device.</p>
      </div>

      <div className="cyber-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by filename…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All operations</SelectItem>
              <SelectItem value="encode">Encode only</SelectItem>
              <SelectItem value="decode">Decode only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="py-14 text-center text-muted-foreground">
            <FileImage className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <div className="text-sm">No matching activity.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left py-2 px-3">Operation</th>
                  <th className="text-left py-2 px-3">Filename</th>
                  <th className="text-left py-2 px-3">Length</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-mono ${r.operation === "encode" ? "text-primary" : "text-accent"}`}>
                        {r.operation === "encode" ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                        {r.operation}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-[240px] truncate">{r.filename}</td>
                    <td className="py-3 px-3 font-mono text-xs text-muted-foreground">
                      {r.message_length != null ? `${r.message_length} ch` : "—"}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-mono px-2 py-1 rounded-md ${
                        r.status === "success" ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"
                      }`}>{r.status}</span>
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground font-mono">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => deleteRow(r.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
