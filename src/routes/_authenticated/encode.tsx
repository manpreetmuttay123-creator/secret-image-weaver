import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Upload, Download, Loader2, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { addHistory } from "@/lib/history-store";
import {
  encryptMessage,
  embedBytesIntoImageData,
  fileToImageData,
  imageDataToPNGBlob,
  downloadBlob,
} from "@/lib/stego";

export const Route = createFileRoute("/_authenticated/encode")({
  head: () => ({ meta: [{ title: "Encode — StegoCrypt" }] }),
  component: EncodePage,
});

const ACCEPTED = ["image/png", "image/bmp"];
const MAX_SIZE = 15 * 1024 * 1024;

function EncodePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [stegoUrl, setStegoUrl] = useState<string | null>(null);
  const [stegoBlob, setStegoBlob] = useState<Blob | null>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      if (f.type === "image/jpeg") toast.error("JPEG is lossy and would destroy hidden bits. Use PNG or BMP.");
      else toast.error("Only PNG or BMP supported.");
      return;
    }
    if (f.size > MAX_SIZE) return toast.error("Image too large (max 15MB).");
    setFile(f);
    setStegoUrl(null); setStegoBlob(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  };

  const log = (status: "success" | "failed", messageLength: number | null) => {
    addHistory({
      filename: file?.name ?? "unknown",
      operation: "encode",
      status,
      message_length: messageLength,
    });
  };

  const onEncode = async () => {
    if (!file) return toast.error("Please choose an image.");
    if (!message.trim()) return toast.error("Message cannot be empty.");

    setBusy(true); setProgress(10); setStegoUrl(null);
    try {
      const img = await fileToImageData(file);
      setProgress(35);
      const payload = await encryptMessage(message, "stegocrypt-default-key");
      setProgress(60);
      const stego = embedBytesIntoImageData(img, payload);
      setProgress(85);
      const blob = await imageDataToPNGBlob(stego);
      setProgress(100);
      setStegoBlob(blob);
      setStegoUrl(URL.createObjectURL(blob));
      log("success", message.length);
      toast.success("Message embedded successfully");
    } catch (e) {
      log("failed", message.length);
      toast.error(e instanceof Error ? e.message : "Encoding failed");
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const clearImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (stegoUrl) URL.revokeObjectURL(stegoUrl);
    setFile(null); setPreview(null); setStegoUrl(null); setStegoBlob(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary"><Lock className="h-5 w-5" /></span>
          Encode message
        </h1>
        <p className="text-muted-foreground mt-1">Hide an AES-encrypted text inside a PNG or BMP image.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input side */}
        <div className="cyber-card rounded-2xl p-6 space-y-5">
          <div>
            <Label>Cover image (PNG / BMP)</Label>
            <label
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              className="mt-2 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/60 transition"
            >
              <Upload className="h-7 w-7 text-muted-foreground" />
              <div className="text-sm">Click or drop image</div>
              <div className="text-xs text-muted-foreground font-mono">PNG, BMP · max 15 MB</div>
              <input type="file" accept="image/png,image/bmp" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            </label>
            {file && (
              <div className="mt-2 flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span className="truncate">{file.name} · {(file.size / 1024).toFixed(1)} KB</span>
                <button onClick={clearImage} className="hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="msg">Secret message</Label>
            <Textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={20000} placeholder="Your confidential text…" />
            <div className="text-xs text-muted-foreground mt-1 font-mono">{message.length} / 20000 chars</div>
          </div>


          {progress > 0 && <Progress value={progress} />}

          <Button onClick={onEncode} disabled={busy || !file} className="w-full glow-cyan">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
            Encrypt & embed
          </Button>
        </div>

        {/* Preview side */}
        <div className="cyber-card rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Preview</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-mono text-muted-foreground mb-1">Original</div>
              <div className="aspect-square rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                {preview ? <img src={preview} alt="Original" className="w-full h-full object-contain" /> : <ImageIcon className="h-10 w-10 text-muted-foreground/50" />}
              </div>
            </div>
            <div>
              <div className="text-xs font-mono text-muted-foreground mb-1">Stego</div>
              <div className="aspect-square rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden relative">
                {stegoUrl ? (
                  <>
                    <img src={stegoUrl} alt="Stego" className="w-full h-full object-contain" />
                    <div className="absolute top-1 right-1 text-[10px] font-mono bg-accent/90 text-accent-foreground px-1.5 py-0.5 rounded">embedded</div>
                  </>
                ) : <ImageIcon className="h-10 w-10 text-muted-foreground/50" />}
              </div>
            </div>
          </div>
          {stegoBlob && (
            <Button
              variant="secondary"
              className="w-full glow-purple"
              onClick={() => downloadBlob(stegoBlob, `stego_${Date.now()}.png`)}
            >
              <Download className="h-4 w-4 mr-2" /> Download stego-PNG ({(stegoBlob.size / 1024).toFixed(1)} KB)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
