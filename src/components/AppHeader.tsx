import { Link, useRouterState } from "@tanstack/react-router";
import { Shield, LayoutDashboard, Lock, Unlock, History, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/encode", label: "Encode", icon: Lock },
  { to: "/decode", label: "Decode", icon: Unlock },
  { to: "/history", label: "History", icon: History },
] as const;

export function AppHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative">
            <Shield className="h-7 w-7 text-primary" />
            <div className="absolute inset-0 blur-md bg-primary/40 -z-10" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Stego<span className="gradient-text">Crypt</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-border/60 bg-background/95 px-4 py-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted/60"
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
