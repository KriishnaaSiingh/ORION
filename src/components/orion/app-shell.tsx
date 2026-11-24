import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Blocks,
  Bot,
  Boxes,
  ChevronDown,
  CircleUserRound,
  DatabaseZap,
  LayoutDashboard,
  LogOut,
  Moon,
  Network,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Workflow,
  Dna,
  Command,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useOrionStore } from "@/lib/orion-store";
import { useAuth, type UserRole } from "@/lib/auth-store";
import { toast } from "sonner";
import "@fontsource-variable/manrope";

// ─── Injected glassy-shell CSS (same tokens as glassy-dashboard.tsx) ─────────
const shellStyles = `
.gd-app {
  --gd-ink: #0f172a;
  --gd-muted: #475569;
  --gd-line: rgba(148,163,184,0.28);
  --gd-grid: rgba(148,163,184,0.18);
  --gd-rim: rgba(255,255,255,0.85);
  --gd-edge-light: rgba(255,255,255,0.95);
  --gd-edge-shade: rgba(15,23,42,0.05);
  --gd-gloss: rgba(255,255,255,0.70);
  --gd-frame: rgba(255,255,255,0.50);
  --gd-rail: rgba(255,255,255,0.65);
  --gd-card: rgba(255,255,255,0.76);
  --gd-card-light: rgba(255,255,255,0.60);
  --gd-raised: rgba(255,255,255,0.92);
  --gd-inner: rgba(255,255,255,0.45);
  --gd-surface: #ffffff;
  --gd-track: rgba(148,163,184,0.18);
  --gd-primary: #0f172a;
  --gd-primary-ink: #ffffff;
  --gd-pick: #ffffff;
  --gd-pick-ink: #0f172a;
  --gd-coral: #e11d48;
  --gd-teal: #0d9488;
  --gd-ochre: #d97706;
  --gd-graph-ink: #1e293b;
  --gd-focus: #0f766e;
  --gd-dark-shadow: 15 23 42;
  font-family: "Manrope Variable", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 550;
  font-variant-numeric: tabular-nums;
}
.gd-app.gd-dark {
  --gd-ink: #f8fafc;
  --gd-muted: #94a3b8;
  --gd-line: rgba(255,255,255,0.09);
  --gd-grid: rgba(255,255,255,0.06);
  --gd-rim: rgba(255,255,255,0.12);
  --gd-edge-light: rgba(255,255,255,0.18);
  --gd-edge-shade: rgba(0,0,0,0.50);
  --gd-gloss: rgba(255,255,255,0.08);
  --gd-frame: rgba(255,255,255,0.06);
  --gd-rail: rgba(255,255,255,0.08);
  --gd-card: rgba(15,23,42,0.68);
  --gd-card-light: rgba(30,41,59,0.50);
  --gd-raised: rgba(30,41,59,0.82);
  --gd-inner: rgba(15,23,42,0.40);
  --gd-surface: #0f172a;
  --gd-track: rgba(255,255,255,0.08);
  --gd-primary: #f8fafc;
  --gd-primary-ink: #0f172a;
  --gd-pick: #1e293b;
  --gd-pick-ink: #f8fafc;
  --gd-coral: #fb7185;
  --gd-teal: #2dd4bf;
  --gd-ochre: #fbbf24;
  --gd-graph-ink: #cbd5e1;
  --gd-focus: #2dd4bf;
  --gd-dark-shadow: 0 0 0;
}
.gd-bg {
  position: fixed; inset: 0; z-index: 0;
  background-size: cover; background-position: center;
  pointer-events: none;
}
.gd-bg::after {
  content: ""; position: absolute; inset: 0;
  background: rgba(241,245,249,0.80);
  backdrop-filter: blur(12px);
}
.gd-dark .gd-bg::after {
  background: rgba(7,11,18,0.74);
  backdrop-filter: blur(12px);
}
.gd-surround {
  position: relative; z-index: 1;
  inline-size: min(calc(100% - 60px), 1420px);
  margin-inline: auto;
  min-block-size: 100svh;
  display: flex; flex-direction: column; gap: 0;
}
.gd-topbar {
  display: flex; align-items: center; gap: 12px;
  padding-block: 18px; padding-inline: 2px;
  border-block-end: 1px solid var(--gd-line);
}
.gd-logo { display: flex; align-items: center; gap: 10px; }
.gd-logo-mark {
  inline-size: 36px; block-size: 36px; border-radius: 9px;
  overflow: hidden; border: 1px solid var(--gd-rim);
  background: rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.gd-logo-name { font-size: 14px; font-weight: 700; letter-spacing: -0.3px; white-space: nowrap; color: var(--gd-ink); }
.gd-logo-sub  { font-size: 10px; color: var(--gd-muted); letter-spacing: 0.3px; }
.gd-topbar-mid { flex: 1; display: flex; align-items: center; justify-content: center; }
.gd-search {
  display: flex; align-items: center; gap: 8px;
  background: var(--gd-card); border: 1px solid var(--gd-rim);
  border-radius: 10px; padding: 7px 14px; inline-size: min(340px,100%);
  font-size: 13px; color: var(--gd-muted); cursor: pointer;
  backdrop-filter: blur(16px);
}
.gd-search:hover { background: var(--gd-raised); }
.gd-kbd { margin-inline-start: auto; display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--gd-muted); }
.gd-topbar-end { display: flex; align-items: center; gap: 8px; }
.gd-icon-btn {
  inline-size: 34px; block-size: 34px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  background: var(--gd-card); border: 1px solid var(--gd-rim);
  cursor: pointer; color: var(--gd-ink); flex-shrink: 0;
  backdrop-filter: blur(14px); transition: background 0.15s;
}
.gd-icon-btn:hover { background: var(--gd-raised); }
.gd-avatar {
  inline-size: 32px; block-size: 32px; border-radius: 50%;
  background: var(--gd-primary); color: var(--gd-primary-ink);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; cursor: pointer; flex-shrink: 0;
}
.gd-layout {
  flex: 1; display: grid;
  grid-template-columns: 220px 1fr;
  gap: 0;
}
.gd-sidebar {
  border-inline-end: 1px solid var(--gd-line);
  padding-block: 20px; padding-inline: 12px;
  display: flex; flex-direction: column; gap: 4px;
  position: sticky; top: 0; block-size: calc(100svh - 73px);
  overflow-y: auto; overflow-x: hidden;
}
.gd-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; border-radius: 9px; cursor: pointer;
  font-size: 13px; font-weight: 500; color: var(--gd-muted);
  transition: background 0.15s, color 0.15s; white-space: nowrap;
  border: 1px solid transparent; text-decoration: none;
  background: none; width: 100%;
}
.gd-nav-item:hover { background: var(--gd-card); color: var(--gd-ink); }
.gd-nav-item.gd-active {
  background: var(--gd-raised); color: var(--gd-ink);
  border-color: var(--gd-rim); font-weight: 600;
}
.gd-nav-label { font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: var(--gd-muted); padding: 14px 12px 6px; }
.gd-nav-spacer { flex: 1; }
.gd-main { overflow-y: auto; padding: 24px 24px 40px; }
.gd-panel {
  background: var(--gd-card); border: 1px solid var(--gd-rim);
  border-radius: 16px; overflow: hidden;
  backdrop-filter: blur(16px);
  box-shadow: inset 0 1px 0 var(--gd-edge-light), 0 4px 16px rgb(var(--gd-dark-shadow) / 10%);
}
.gd-panel-head {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px; border-block-end: 1px solid var(--gd-line);
}
.gd-panel-title { font-size: 13px; font-weight: 700; flex: 1; color: var(--gd-ink); }
.gd-metric {
  background: var(--gd-card); border: 1px solid var(--gd-rim);
  border-radius: 14px; padding: 18px 20px;
  display: flex; flex-direction: column; gap: 10px;
  backdrop-filter: blur(16px);
  box-shadow: inset 0 1px 0 var(--gd-edge-light), 0 2px 8px rgb(var(--gd-dark-shadow) / 8%);
}
.gd-metric-label { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: var(--gd-muted); }
.gd-metric-value { font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1; color: var(--gd-ink); }
.gd-metric-delta { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; }
.gd-up { color: var(--gd-teal); }
.gd-down { color: var(--gd-coral); }
.gd-warn { color: var(--gd-ochre); }
.gd-metrics { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill,minmax(200px,1fr)); margin-block-end: 24px; }
.gd-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-block-end: 14px; }
.gd-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-block-end: 14px; }
.gd-panel-action {
  font-size: 11px; font-weight: 600; color: var(--gd-muted);
  cursor: pointer; display: flex; align-items: center; gap: 3px;
  padding: 4px 8px; border-radius: 6px; border: 1px solid var(--gd-rim);
  background: var(--gd-inner); transition: background 0.15s;
}
.gd-panel-action:hover { background: var(--gd-raised); color: var(--gd-ink); }
.gd-chart-area { padding: 16px 18px; block-size: 180px; position: relative; overflow: hidden; }
.gd-chart-svg { inline-size: 100%; block-size: 100%; }
.gd-row {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 18px; border-block-end: 1px solid var(--gd-line);
  font-size: 13px; transition: background 0.12s; color: var(--gd-ink);
}
.gd-row:last-child { border-block-end: none; }
.gd-row:hover { background: var(--gd-inner); cursor: pointer; }
.gd-dot { inline-size: 8px; block-size: 8px; border-radius: 50%; flex-shrink: 0; }
.gd-dot-green  { background: var(--gd-teal);  }
.gd-dot-orange { background: var(--gd-ochre); }
.gd-dot-red    { background: var(--gd-coral); }
.gd-dot-blue   { background: #3b82f6; }
.gd-row-label { flex: 1; font-weight: 500; }
.gd-row-sub { font-size: 11px; color: var(--gd-muted); }
.gd-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; letter-spacing: 0.3px; }
.gd-badge-green  { background: rgb(13 148 136 / 15%); color: var(--gd-teal);  }
.gd-badge-orange { background: rgb(217 119   6 / 15%); color: var(--gd-ochre); }
.gd-badge-red    { background: rgb(225  29  72 / 15%); color: var(--gd-coral); }
.gd-badge-blue   { background: rgb( 59 130 246 / 15%); color: #3b82f6; }
.gd-badge-muted  { background: var(--gd-track); color: var(--gd-muted); }
.gd-view-tabs { display: flex; gap: 2px; padding: 3px; border-radius: 10px; background: var(--gd-track); margin-block-end: 20px; inline-size: fit-content; }
.gd-tab { padding: 6px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.15s, color 0.15s; color: var(--gd-muted); background: none; border: none; }
.gd-tab.gd-active { background: var(--gd-raised); color: var(--gd-ink); box-shadow: 0 1px 4px rgb(var(--gd-dark-shadow)/12%); }
.gd-pill { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid var(--gd-rim); background: var(--gd-inner); color: var(--gd-muted); transition: 0.15s; }
.gd-pill:hover { background: var(--gd-raised); color: var(--gd-ink); }
.gd-pill.gd-active { background: var(--gd-primary); color: var(--gd-primary-ink); border-color: var(--gd-primary); }
.gd-timeline { padding: 0 18px; }
.gd-timeline-item { display: flex; gap: 12px; padding-block: 12px; border-block-end: 1px solid var(--gd-line); }
.gd-timeline-item:last-child { border-block-end: none; }
.gd-timeline-icon { inline-size: 32px; block-size: 32px; border-radius: 9px; flex-shrink: 0; background: var(--gd-inner); border: 1px solid var(--gd-rim); display: flex; align-items: center; justify-content: center; color: var(--gd-muted); }
.gd-timeline-body { flex: 1; min-inline-size: 0; }
.gd-timeline-title { font-size: 13px; font-weight: 600; color: var(--gd-ink); }
.gd-timeline-meta { font-size: 11px; color: var(--gd-muted); display: flex; align-items: center; gap: 6px; margin-block-start: 2px; }
.gd-mini-bar { display: flex; align-items: flex-end; gap: 3px; block-size: 40px; }
.gd-mini-bar-col { background: var(--gd-primary); border-radius: 3px 3px 0 0; flex: 1; opacity: 0.7; transition: opacity 0.15s; }
.gd-mini-bar-col:hover { opacity: 1; }
.gd-sparkline { stroke: var(--gd-teal); fill: none; stroke-width: 2; vector-effect: non-scaling-stroke; }
.gd-page-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-block-end: 4px; color: var(--gd-ink); }
.gd-page-sub { font-size: 13px; color: var(--gd-muted); margin-block-end: 24px; }
.gd-credit { font-size: 10px; color: var(--gd-muted); padding-block: 12px; text-align: center; }
.gd-credit a { color: inherit; }
.gd-sidebar::-webkit-scrollbar { inline-size: 4px; }
.gd-sidebar::-webkit-scrollbar-track { background: transparent; }
.gd-sidebar::-webkit-scrollbar-thumb { background: var(--gd-track); border-radius: 4px; }
.gd-main::-webkit-scrollbar { inline-size: 4px; }
.gd-main::-webkit-scrollbar-track { background: transparent; }
.gd-main::-webkit-scrollbar-thumb { background: var(--gd-track); border-radius: 4px; }
@media (max-width: 860px) {
  .gd-sidebar { display: none; }
  .gd-layout { grid-template-columns: 1fr; }
  .gd-surround { inline-size: calc(100% - 24px); }
  .gd-grid-2, .gd-grid-3 { grid-template-columns: 1fr; }
}
`;

// ─── Nav items ────────────────────────────────────────────────────────────────
const baseNav = [
  { label: "Dashboard",             to: "/",                  icon: LayoutDashboard },
  { label: "Knowledge Explorer",    to: "/knowledge",         icon: Network },
  { label: "Investigation Boards",  to: "/boards",            icon: Boxes },
  { label: "Ontology Manager",      to: "/ontology",          icon: Workflow },
  { label: "Data Ingestion",        to: "/ingestion",         icon: DatabaseZap },
  { label: "Applications",          to: "/applications",      icon: Blocks },
  { label: "AI Assistant",          to: "/assistant",         icon: Bot },
  { label: "Entity Resolution",     to: "/entity-resolution", icon: Dna },
  { label: "Settings",              to: "/settings",          icon: Settings },
];

function cls(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(" ");
}

// ─── Shared glassy shell ──────────────────────────────────────────────────────
function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname  = useRouterState({ select: (s) => s.location.pathname });
  const navigate  = useNavigate();
  const { theme, setTheme } = useOrionStore();
  const { profile, signOut } = useAuth();
  const [cmdOpen, setCmdOpen] = useState(false);

  // Sync html class so Tailwind dark: utilities still work too
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // ⌘K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const storeProfile  = useOrionStore((s) => s.profile);
  const displayRole   = storeProfile?.role ?? profile?.role ?? ("analyst" as UserRole);
  const displayName   = (storeProfile?.firstName && storeProfile?.lastName
    ? `${storeProfile.firstName} ${storeProfile.lastName}`
    : profile?.displayName) ?? "Krishna Singh";
  const userEmail     = storeProfile?.email ?? profile?.email ?? "krishnasingh15kks@gmail.com";
  const initials      = displayName.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "KS";
  const roleLabel     = displayRole === "admin" ? "Workspace admin" : displayRole === "analyst" ? "Analyst" : "Viewer";

  const navItems = displayRole === "admin"
    ? [...baseNav, { label: "Admin", to: "/admin", icon: ShieldCheck }]
    : baseNav;

  const handleSignOut = async () => {
    const res = await signOut();
    if (res.ok) {
      toast.success("Signed out");
      await navigate({ to: "/login", replace: true });
    } else if (res.error) {
      toast.error(res.error);
    }
  };

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <>
      {/* Inject glassy CSS once */}
      <style>{shellStyles}</style>

      <div className={cls("gd-app", theme === "dark" && "gd-dark")}
           style={{ minHeight: "100svh", display: "flex", flexDirection: "column" }}>

        {/* Background wallpaper */}
        <div className="gd-bg"
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=85&auto=format&fit=crop')" }} />

        <div className="gd-surround" style={{ flex: 1 }}>

          {/* ── Top bar ── */}
          <header className="gd-topbar">
            <div className="gd-logo">
              <div className="gd-logo-mark p-1">
                <img src="/orion-logo.png" alt="Orion" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              <div>
                <div className="gd-logo-name">Orion Intelligence</div>
                <div className="gd-logo-sub">Decision OS</div>
              </div>
            </div>

            <div className="gd-topbar-mid">
              <button className="gd-search" onClick={() => setCmdOpen(true)} style={{ border: "none" }}>
                <Search size={13} />
                <span>Search knowledge graph…</span>
                <span className="gd-kbd"><Command size={11} /> K</span>
              </button>
            </div>

            <div className="gd-topbar-end">
              {/* Theme toggle */}
              <button className="gd-icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              {/* Notifications */}
              <button className="gd-icon-btn" aria-label="Notifications" style={{ position: "relative" }}>
                <Bell size={15} />
                <span style={{ position:"absolute", top:7, right:7, width:6, height:6, borderRadius:"50%", background:"var(--gd-coral)" }} />
              </button>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="gd-icon-btn" style={{ gap: 6, paddingInline: 8, width: "auto" }}>
                    <div className="gd-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{initials}</div>
                    <ChevronDown size={12} style={{ color: "var(--gd-muted)" }} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {displayName}<br />
                    <span className="font-normal text-muted-foreground">{userEmail}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings"><CircleUserRound /> Profile settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void handleSignOut()} className="text-rose-600 focus:text-rose-600">
                    <LogOut /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* ── Layout grid ── */}
          <div className="gd-layout">
            {/* Sidebar */}
            <nav className="gd-sidebar">
              <div className="gd-nav-label">Navigate</div>
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cls("gd-nav-item", isActive(item.to) && "gd-active")}
                  style={{ textDecoration: "none" }}
                >
                  <item.icon size={15} />
                  {item.label}
                </Link>
              ))}
              <div className="gd-nav-spacer" />
              <div style={{ padding: "10px 12px", fontSize: 11, color: "var(--gd-muted)", opacity: 0.7 }}>
                {roleLabel}
              </div>
            </nav>

            {/* Main content */}
            <main className="gd-main">
              {children}
            </main>
          </div>
        </div>

        {/* Command palette */}
        <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
          <CommandInput placeholder="Search Orion or run a command…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigate">
              {navItems.map((i) => (
                <CommandItem key={i.to} onSelect={() => { void navigate({ to: i.to as "/" }); setCmdOpen(false); }}>
                  <i.icon />
                  {i.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => void navigate({ to: "/knowledge" })}>
                <Network /> Search knowledge graph
              </CommandItem>
              <CommandItem onSelect={() => void navigate({ to: "/boards" })}>
                <Boxes /> Create investigation board
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    </>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { status, initialized } = useAuth();

  // Public routes & unauthenticated landing page: render children cleanly without dashboard shell
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    (pathname === "/" && (!initialized || status !== "authenticated"))
  ) {
    return <>{children}</>;
  }

  return <ShellContent>{children}</ShellContent>;
}
