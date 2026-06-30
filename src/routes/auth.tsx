import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — StegoCrypt" },
      { name: "description", content: "Sign in or create an account to start hiding encrypted messages inside images." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(8, "Min 8 characters").max(72);

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 border-r border-border/60">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          <span className="font-bold text-lg">Stego<span className="gradient-text">Crypt</span></span>
        </Link>

        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight">
            Encryption that <span className="gradient-text">disappears</span> into pixels.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md">
            Your password derives a 256-bit AES key. Your message becomes ciphertext.
            Ciphertext becomes invisible bits inside an image you can share anywhere.
          </p>
          <ul className="mt-6 space-y-2 text-sm font-mono text-muted-foreground">
            <li>→ Per-message random salt + IV</li>
            <li>→ PBKDF2 with 150,000 iterations</li>
            <li>→ Authenticated AES-GCM</li>
          </ul>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md cyber-card rounded-2xl p-8">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-6">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold">Stego<span className="gradient-text">Crypt</span></span>
          </Link>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to continue or create an account.</p>

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignInForm /></TabsContent>
            <TabsContent value="signup"><SignUpForm /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) return toast.error(err.issues[0].message);
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-6">
      <div>
        <Label htmlFor="si-email">Email</Label>
        <Input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="si-pw">Password</Label>
        <Input id="si-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      <Button type="submit" className="w-full glow-cyan" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      z.string().trim().min(2).max(40).parse(username);
    } catch (err) {
      if (err instanceof z.ZodError) return toast.error(err.issues[0].message);
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { username },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-6">
      <div>
        <Label htmlFor="su-user">Username</Label>
        <Input id="su-user" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="agent_smith" autoComplete="username" />
      </div>
      <div>
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="su-pw">Password</Label>
        <Input id="su-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <p className="text-xs text-muted-foreground mt-1 font-mono">Min 8 chars. Checked against breach database.</p>
      </div>
      <Button type="submit" className="w-full glow-cyan" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
      </Button>
    </form>
  );
}
