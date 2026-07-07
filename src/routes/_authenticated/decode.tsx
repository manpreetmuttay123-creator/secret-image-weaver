import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Unlock, Upload, Loader2, Copy, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { addHistory } from "@/lib/history-store";
import { decryptPayload, extractBytesFromImageData, fileToImageData } from "@/lib/stego";

export const Route = createFileRoute("/_authenticated/decode")({
  head: () => ({ meta: [{ title: "Decode — StegoCrypt" }] }),
  component: DecodePage,
});

function DecodePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!["image/png", "image/bmp"].includes(f.type)) return toast.error("Only PNG or BMP.");
    setFile(f); setRevealed(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  };

  const log = (status: "success" | "failed", messageLength: number | null) => {
    addHistory({
      filename: file?.name ?? "unknown",
      operation: "decode",
      status,
      message_length: messageLength,
    });
  };

  const onDecode = async () => {
    if (!file) return toast.error("Choose a stego-image.");
    setBusy(true); setRevealed(null);
    try {
      const img = await fileToImageData(file);
      const payload = extractBytesFromImageData(img);
      const msg = await decryptPayload(payload, "stegocrypt-default-key");
      setRevealed(msg);
      log("success", msg.length);
      toast.success("Message decoded");
    } catch (e) {
      log("failed", null);
      toast.error(e instanceof Error ? e.message : "Decoding failed");
    } finally {
      setBusy(false);
    }
  };

  const clearImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(null); setRevealed(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent"><Unlock className="h-5 w-5" /></span>
          Decode message
        </h1>
        <p className="text-muted-foreground mt-1">Extract and decrypt a hidden message from a stego-image.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="cyber-card rounded-2xl p-6 space-y-5">
          <div>
            <Label>Stego image (PNG / BMP)</Label>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              className="mt-2 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-accent/60 transition"
            >
              <Upload className="h-7 w-7 text-muted-foreground" />
              <div className="text-sm">Click or drop image</div>
              <input type="file" accept="image/png,image/bmp" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            </label>
            {file && (
              <div className="mt-2 flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span className="truncate">{file.name}</span>
                <button onClick={clearImage} className="hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <Button onClick={onDecode} disabled={busy || !file} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
            Extract & decrypt
          </Button>
        </div>

        <div className="cyber-card rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Output</h2>
          <div className="aspect-video rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
            {preview ? <img src={preview} alt="" className="max-h-full max-w-full object-contain" /> : <ImageIcon className="h-10 w-10 text-muted-foreground/50" />}
          </div>
          {revealed !== null ? (
            <div>
              <Label>Hidden message</Label>
              <div className="relative mt-2">
                <Textarea readOnly value={revealed} rows={6} className="font-mono pr-10" />
                <button
                  onClick={() => { navigator.clipboard.writeText(revealed); toast.success("Copied to clipboard"); }}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                  aria-label="Copy"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-6 font-mono">
              Awaiting decryption…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
