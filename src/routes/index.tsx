import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Lock, Unlock, KeyRound, Image as ImageIcon, Eye, Zap, Database, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StegoCrypt — Secure Image Steganography" },
      { name: "description", content: "Hide AES-256 encrypted text messages inside PNG images using LSB steganography. All crypto runs in your browser." },
      { property: "og:title", content: "StegoCrypt — Secure Image Steganography" },
      { property: "og:description", content: "Hide AES-256 encrypted text messages inside PNG images using LSB steganography." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <AppHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-72 w-[40rem] rounded-full bg-secondary/30 blur-[120px] pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-mono text-primary mb-6">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            AES-256 · LSB · Zero-knowledge
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Hide secrets <span className="gradient-text">inside images</span>.
            <br />Without anyone noticing.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            StegoCrypt encrypts your message with AES-256, then embeds it bit-by-bit
            into a PNG using Least Significant Bit steganography. The image looks identical —
            but only the right password unlocks the truth.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/encode">
              <Button size="lg" className="glow-cyan">
                Start encoding <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="outline">How it works</Button>
            </a>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-3 gap-6 text-left">
            {[
              { k: "256-bit", v: "AES key strength" },
              { k: "PBKDF2", v: "150k iterations" },
              { k: "0-byte", v: "Server message access" },
            ].map((s) => (
              <div key={s.k} className="cyber-card rounded-xl p-5">
                <div className="text-2xl md:text-3xl font-bold gradient-text font-mono">{s.k}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold">Built for cybersecurity</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Every layer of the stack is designed around the principle:
            the server never sees your message in plaintext.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Lock, title: "AES-256-GCM", desc: "Authenticated encryption with a 256-bit key derived from your password via PBKDF2-SHA256." },
            { icon: ImageIcon, title: "Lossless LSB", desc: "Embedded into the least significant bits of PNG pixels — visually imperceptible." },
            { icon: KeyRound, title: "Password-derived", desc: "Per-message random salt + IV. The wrong password produces a clean rejection, not garbage." },
            { icon: Eye, title: "Client-side only", desc: "Encryption and embedding happen entirely in your browser. Your message never leaves the device." },
            { icon: Database, title: "Audit trail", desc: "Every encode and decode is timestamped in your private history — filename, status, length." },
            { icon: Zap, title: "Instant download", desc: "Generated stego-images are downloadable as PNG, ready to share over any channel." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="cyber-card rounded-2xl p-6 transition hover:border-primary/50">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary mb-4">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold">How steganography works</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Encrypt", d: "Your message + password become an AES-256-GCM ciphertext with a random salt and IV." },
            { n: "02", t: "Embed", d: "The ciphertext bits replace the least significant bit of each color channel — invisible to the eye." },
            { n: "03", t: "Extract", d: "The recipient uploads the image with the password. Bits are read back, decrypted, message revealed." },
          ].map((s) => (
            <div key={s.n} className="relative cyber-card rounded-2xl p-7">
              <div className="font-mono text-5xl font-bold text-primary/30">{s.n}</div>
              <h3 className="text-xl font-semibold mt-2">{s.t}</h3>
              <p className="text-sm text-muted-foreground mt-2">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="cyber-card rounded-3xl p-10 md:p-14 text-center">
          <h2 className="text-3xl font-bold">Technology stack</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Industry-standard primitives, no rolling-your-own crypto.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2 font-mono text-xs">
            {["React 19", "TypeScript", "TanStack Start", "Tailwind v4", "Web Crypto API", "AES-256-GCM", "PBKDF2-SHA256", "LSB Steganography", "PostgreSQL", "Row-Level Security", "JWT Auth", "bcrypt-equivalent"].map((t) => (
              <span key={t} className="rounded-full border border-border bg-muted/40 px-3 py-1.5">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
        <h2 className="text-3xl md:text-4xl font-bold">Ready to hide your first message?</h2>
        <p className="text-muted-foreground mt-3">No sign-up, no account. Jump straight in.</p>
        <Link to="/encode" className="inline-block mt-8">
          <Button size="lg" className="glow-cyan">Launch StegoCrypt <ChevronRight className="ml-1 h-4 w-4" /></Button>
        </Link>
      </section>

      <footer className="border-t border-border/60 mt-10">
        <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-mono">StegoCrypt v1.0</span>
          </div>
          <div>Cybersecurity internship project — built with TanStack Start & Lovable Cloud</div>
        </div>
      </footer>
    </div>
  );
}
