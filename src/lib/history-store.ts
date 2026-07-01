// Local, no-auth history store — persists in the browser only.
export type HistoryRow = {
  id: string;
  filename: string;
  operation: "encode" | "decode";
  status: "success" | "failed";
  message_length: number | null;
  created_at: string;
};

const KEY = "stegocrypt.history.v1";

function read(): HistoryRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryRow[]) : [];
  } catch {
    return [];
  }
}

function write(rows: HistoryRow[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event("stegocrypt-history-change"));
}

export function listHistory(): HistoryRow[] {
  return read().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function addHistory(entry: Omit<HistoryRow, "id" | "created_at">) {
  const row: HistoryRow = {
    ...entry,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  write([row, ...read()]);
  return row;
}

export function deleteHistory(id: string) {
  write(read().filter((r) => r.id !== id));
}

export function clearHistory() {
  write([]);
}
