"use client";

import {
  useId,
  useState,
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  type MouseEvent,
} from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Box,
  Clock3,
  Download,
  Ellipsis,
  Eye,
  Filter,
  ListChecks,
  Search,
  ShieldCheck,
  TriangleAlert,
  Users,
  Zap,
  ArrowDownToLine,
  BarChart3,
  Bell,
  ChevronRight,
  Command,
  LayoutDashboard,
  Moon,
  Sun,
  TrendingUp,
  X,
  Network,
  DatabaseZap,
  Dna,
  Bot,
  Boxes,
  Workflow,
  Blocks,
  Settings,
} from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import "@fontsource-variable/manrope";

export interface OrionDashboardProps {
  backgroundImage?: string;
  backgroundCredit?: { label: string; href: string };
  workspaceName?: string;
  panelFrost?: number;
  initialTheme?: "light" | "dark";
  onNavigate?: (path: string) => void;
  userDisplayName?: string;
  userEmail?: string;
}

const orionBg =
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=85&auto=format&fit=crop";

// ─── CSS styles injected once ───────────────────────────────────────────────
const dashboardStyles = `
.gd-app {
  --gd-ink: #0f172a;
  --gd-muted: #475569;
  --gd-line: rgba(148, 163, 184, 0.28);
  --gd-grid: rgba(148, 163, 184, 0.18);
  --gd-rim: rgba(255, 255, 255, 0.85);
  --gd-edge-light: rgba(255, 255, 255, 0.95);
  --gd-edge-shade: rgba(15, 23, 42, 0.05);
  --gd-gloss: rgba(255, 255, 255, 0.70);
  --gd-frame: rgba(255, 255, 255, 0.50);
  --gd-rail: rgba(255, 255, 255, 0.65);
  --gd-card: rgba(255, 255, 255, 0.76);
  --gd-card-light: rgba(255, 255, 255, 0.60);
  --gd-raised: rgba(255, 255, 255, 0.92);
  --gd-inner: rgba(255, 255, 255, 0.45);
  --gd-surface: #ffffff;
  --gd-track: rgba(148, 163, 184, 0.18);
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
  inline-size: 100%;
  min-inline-size: 0;
  flex: 1 1 100%;
  position: relative;
  isolation: isolate;
  min-block-size: 100svh;
  background: #f1f5f9;
  color: var(--gd-ink);
  font-family: "Manrope Variable", system-ui, sans-serif;
}
.gd-app.gd-dark {
  --gd-ink: #f8fafc;
  --gd-muted: #94a3b8;
  --gd-line: rgba(255, 255, 255, 0.09);
  --gd-grid: rgba(255, 255, 255, 0.06);
  --gd-rim: rgba(255, 255, 255, 0.12);
  --gd-edge-light: rgba(255, 255, 255, 0.18);
  --gd-edge-shade: rgba(0, 0, 0, 0.50);
  --gd-gloss: rgba(255, 255, 255, 0.08);
  --gd-frame: rgba(255, 255, 255, 0.06);
  --gd-rail: rgba(255, 255, 255, 0.08);
  --gd-card: rgba(15, 23, 42, 0.68);
  --gd-card-light: rgba(30, 41, 59, 0.50);
  --gd-raised: rgba(30, 41, 59, 0.82);
  --gd-inner: rgba(15, 23, 42, 0.40);
  --gd-surface: #0f172a;
  --gd-track: rgba(255, 255, 255, 0.08);
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
  background: #070b12;
}
.gd-bg {
  position: fixed; inset: 0; z-index: 0;
  background-size: cover; background-position: center;
  pointer-events: none;
}
.gd-bg::after {
  content: ""; position: absolute; inset: 0;
  background: rgba(241, 245, 249, 0.80);
  backdrop-filter: blur(12px);
}
.gd-dark .gd-bg::after {
  background: rgba(7, 11, 18, 0.74);
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
.gd-logo-name { font-size: 14px; font-weight: 700; letter-spacing: -0.3px; white-space: nowrap; }
.gd-logo-sub { font-size: 10px; color: var(--gd-muted); letter-spacing: 0.3px; }
.gd-topbar-mid { flex: 1; display: flex; align-items: center; justify-content: center; }
.gd-search {
  display: flex; align-items: center; gap: 8px;
  background: var(--gd-card); border: 1px solid var(--gd-rim);
  border-radius: 10px; padding: 7px 14px; inline-size: min(340px, 100%);
  font-size: 13px; color: var(--gd-muted); cursor: pointer;
  backdrop-filter: blur(16px);
}
.gd-search:hover { background: var(--gd-raised); }
.gd-kbd {
  margin-inline-start: auto; display: flex; align-items: center; gap: 3px;
  font-size: 11px; color: var(--gd-muted);
}
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
  border: 1px solid transparent;
}
.gd-nav-item:hover { background: var(--gd-card); color: var(--gd-ink); }
.gd-nav-item.gd-active {
  background: var(--gd-raised); color: var(--gd-ink);
  border-color: var(--gd-rim); font-weight: 600;
}
.gd-nav-label { font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: var(--gd-muted); padding: 14px 12px 6px; }
.gd-nav-spacer { flex: 1; }
.gd-main { overflow-y: auto; padding: 24px 24px 40px; }
.gd-page-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-block-end: 4px; }
.gd-page-sub { font-size: 13px; color: var(--gd-muted); margin-block-end: 24px; }
.gd-metrics {
  display: grid; gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  margin-block-end: 24px;
}
.gd-metric {
  background: var(--gd-card); border: 1px solid var(--gd-rim);
  border-radius: 14px; padding: 18px 20px;
  display: flex; flex-direction: column; gap: 10px;
  backdrop-filter: blur(16px);
  box-shadow: inset 0 1px 0 var(--gd-edge-light), 0 2px 8px rgb(var(--gd-dark-shadow) / 8%);
}
.gd-metric-label { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: var(--gd-muted); }
.gd-metric-value { font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1; }
.gd-metric-delta { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; }
.gd-up { color: var(--gd-teal); }
.gd-down { color: var(--gd-coral); }
.gd-warn { color: var(--gd-ochre); }
.gd-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-block-end: 14px; }
.gd-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-block-end: 14px; }
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
.gd-panel-title { font-size: 13px; font-weight: 700; flex: 1; }
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
  font-size: 13px; transition: background 0.12s;
}
.gd-row:last-child { border-block-end: none; }
.gd-row:hover { background: var(--gd-inner); cursor: pointer; }
.gd-dot {
  inline-size: 8px; block-size: 8px; border-radius: 50%; flex-shrink: 0;
}
.gd-dot-green { background: var(--gd-teal); }
.gd-dot-orange { background: var(--gd-ochre); }
.gd-dot-red { background: var(--gd-coral); }
.gd-dot-blue { background: #3b82f6; }
.gd-row-label { flex: 1; font-weight: 500; }
.gd-row-sub { font-size: 11px; color: var(--gd-muted); }
.gd-badge {
  font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px;
  letter-spacing: 0.3px;
}
.gd-badge-green { background: rgb(9 100 79 / 15%); color: var(--gd-teal); }
.gd-badge-orange { background: rgb(153 99 0 / 15%); color: var(--gd-ochre); }
.gd-badge-red { background: rgb(164 60 39 / 15%); color: var(--gd-coral); }
.gd-badge-blue { background: rgb(59 130 246 / 15%); color: #3b82f6; }
.gd-badge-muted { background: var(--gd-track); color: var(--gd-muted); }
.gd-view-tabs {
  display: flex; gap: 2px; padding: 3px; border-radius: 10px;
  background: var(--gd-track); margin-block-end: 20px;
  inline-size: fit-content;
}
.gd-tab {
  padding: 6px 16px; border-radius: 8px; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: background 0.15s, color 0.15s;
  color: var(--gd-muted);
}
.gd-tab.gd-active { background: var(--gd-raised); color: var(--gd-ink); box-shadow: 0 1px 4px rgb(var(--gd-dark-shadow) / 12%); }
.gd-pill {
  padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
  cursor: pointer; border: 1px solid var(--gd-rim); background: var(--gd-inner);
  color: var(--gd-muted); transition: 0.15s;
}
.gd-pill:hover { background: var(--gd-raised); color: var(--gd-ink); }
.gd-pill.gd-active { background: var(--gd-primary); color: var(--gd-primary-ink); border-color: var(--gd-primary); }
.gd-timeline { padding: 0 18px; }
.gd-timeline-item {
  display: flex; gap: 12px; padding-block: 12px;
  border-block-end: 1px solid var(--gd-line);
}
.gd-timeline-item:last-child { border-block-end: none; }
.gd-timeline-icon {
  inline-size: 32px; block-size: 32px; border-radius: 9px; flex-shrink: 0;
  background: var(--gd-inner); border: 1px solid var(--gd-rim);
  display: flex; align-items: center; justify-content: center;
  color: var(--gd-muted);
}
.gd-timeline-body { flex: 1; min-inline-size: 0; }
.gd-timeline-title { font-size: 13px; font-weight: 600; }
.gd-timeline-meta { font-size: 11px; color: var(--gd-muted); display: flex; align-items: center; gap: 6px; margin-block-start: 2px; }
.gd-mini-bar { display: flex; align-items: flex-end; gap: 3px; block-size: 40px; }
.gd-mini-bar-col { background: var(--gd-primary); border-radius: 3px 3px 0 0; flex: 1; opacity: 0.7; transition: opacity 0.15s; }
.gd-mini-bar-col:hover { opacity: 1; }
.gd-credit { font-size: 10px; color: var(--gd-muted); padding-block: 12px; text-align: center; }
.gd-credit a { color: inherit; }
/* ── Graph sparkline ── */
.gd-sparkline { stroke: var(--gd-teal); fill: none; stroke-width: 2; vector-effect: non-scaling-stroke; }
.gd-sparkfill { fill: url(#gd-grad); }
/* scrollbar */
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

// ─── Tiny helpers ────────────────────────────────────────────────────────────
function cls(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ─── Sparkline chart ─────────────────────────────────────────────────────────
function Sparkline({
  data,
  w = 100,
  h = 100,
  color = "var(--gd-teal)",
  fill = true,
}: {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  fill?: boolean;
}) {
  const id = useId();
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h * 0.9 - h * 0.05;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M ${pts.join(" L ")}`;
  const fillPath = `${path} L ${w},${h} L 0,${h} Z`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="gd-chart-svg"
    >
      <defs>
        <linearGradient id={`gd-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {fill && (
        <path
          d={fillPath}
          fill={`url(#gd-grad-${id})`}
        />
      )}
      <path d={path} stroke={color} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function MiniBar({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="gd-mini-bar">
      {data.map((v, i) => (
        <div
          key={i}
          className="gd-mini-bar-col"
          style={{ blockSize: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

// ─── Standalone DashboardOverview (renders inside the shared AppShell) ────────
export function DashboardOverview() {
  const [view, setView] = useState<"overview" | "entities" | "pipelines" | "audit">("overview");
  const [filterPeriod, setFilterPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const appRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const ctx = gsap.context(() => {
        gsap.from(".gd-metric", { opacity: 0, y: 20, stagger: 0.08, duration: 0.5, ease: "power2.out" });
        gsap.from(".gd-panel",  { opacity: 0, y: 24, stagger: 0.1,  duration: 0.55, ease: "power2.out", delay: 0.2 });
      }, appRef);
      return () => ctx.revert();
    },
    { scope: appRef, dependencies: [view] },
  );

  const graphActivityData = [210, 345, 290, 480, 420, 610, 580, 740, 695, 820, 760, 900];
  const erScoreData       = [0.72, 0.74, 0.77, 0.75, 0.80, 0.82, 0.85, 0.83, 0.87, 0.89, 0.88, 0.92];
  const ingestData        = [18, 24, 20, 32, 28, 35, 30, 42, 38, 45, 41, 50];

  const metrics = [
    { label: "Knowledge Objects", value: fmt(48_320), delta: "+12.4%", dir: "up" as const, sub: "vs last period",   bars: [32,36,38,42,40,45,48] },
    { label: "Entities Resolved", value: fmt(12_750), delta: "+8.7%",  dir: "up" as const, sub: "entity resolution", bars: [60,72,68,80,78,88,90] },
    { label: "Graph Queries",     value: fmt(284_900),delta: "+31.2%", dir: "up" as const, sub: "this period",       bars: [40,55,50,70,65,80,85] },
    { label: "Alert Flags",       value: "17",        delta: "−5 resolved", dir: "warn" as const, sub: "needs review", bars: [8,10,12,9,14,11,10] },
  ];

  const pipelines = [
    { name: "OFAC Sanctions Normalizer",  status: "Active",   objects: "8,210",  latency: "1.2s", dot: "green"  },
    { name: "PEP List Enrichment",         status: "Active",   objects: "5,330",  latency: "0.9s", dot: "green"  },
    { name: "Corporate Registry Sync",     status: "Active",   objects: "12,440", latency: "2.1s", dot: "green"  },
    { name: "Adverse Media Crawler",       status: "Warning",  objects: "3,100",  latency: "4.7s", dot: "orange" },
    { name: "Historical Figures Dataset",  status: "Idle",     objects: "2,890",  latency: "—",    dot: "blue"   },
    { name: "FEBRL Synthetic Pairs",       status: "Training", objects: "1,500",  latency: "—",    dot: "orange" },
  ];

  const auditEvents = [
    { icon: <ShieldCheck size={14}/>, title: "RLS policy validated — knowledge_objects",   meta: "2 min ago · system",        badge: "Pass", badgeCls: "green"  },
    { icon: <Eye        size={14}/>, title: "Graph query by krishnasingh15kks@gmail.com",  meta: "5 min ago · query log",     badge: "Info", badgeCls: "blue"   },
    { icon: <TriangleAlert size={14}/>, title: "Adverse Media Crawler latency spike",      meta: "12 min ago · pipeline",     badge: "Warn", badgeCls: "orange" },
    { icon: <Download   size={14}/>, title: "Bulk export — 1,200 records",                meta: "34 min ago · data export",  badge: "Info", badgeCls: "blue"   },
    { icon: <Zap        size={14}/>, title: "Entity Resolution model retrained (F1: 0.924)", meta: "1 hr ago · ML service",  badge: "Pass", badgeCls: "green"  },
    { icon: <Users      size={14}/>, title: "New user invitation sent",                    meta: "2 hr ago · admin",          badge: "Info", badgeCls: "blue"   },
  ];

  const erMatches = [
    { a: "Ahmad Al-Rashidi",  b: "Ahmad Rashidi",         score: 0.94, status: "Match",  dot: "green"  },
    { a: "Orion Systems LLC", b: "Orion Systems Limited", score: 0.89, status: "Match",  dot: "green"  },
    { a: "David Chen",        b: "D. W. Chen",             score: 0.73, status: "Review", dot: "orange" },
    { a: "PetroGulf Corp",    b: "PetroGulf Corporation",  score: 0.97, status: "Match",  dot: "green"  },
    { a: "Maria Santos",      b: "Marie Santos",           score: 0.61, status: "Review", dot: "orange" },
  ];

  return (
    <div ref={appRef}>
      {/* View tabs */}
      <div className="gd-view-tabs">
        {(["overview","entities","pipelines","audit"] as const).map((v) => (
          <button key={v} className={cls("gd-tab", view === v && "gd-active")}
            onClick={() => setView(v)} style={{ background:"none", border:"none" }}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Period filter */}
      <div style={{ display:"flex", gap:6, marginBlockEnd:20 }}>
        {(["7d","30d","90d"] as const).map((p) => (
          <button key={p} className={cls("gd-pill", filterPeriod === p && "gd-active")}
            onClick={() => setFilterPeriod(p)} style={{ background:"none" }}>{p}</button>
        ))}
        <button className="gd-pill" style={{ background:"none", marginInlineStart:"auto" }}>
          <Filter size={11} style={{ display:"inline", marginInlineEnd:4 }} /> Filter
        </button>
      </div>

      {/* Page heading */}
      <div className="gd-page-title">
        {view === "overview"  && "Operational Overview"}
        {view === "entities"  && "Knowledge Explorer"}
        {view === "pipelines" && "Data Pipelines"}
        {view === "audit"     && "Entity Resolution & Audit"}
      </div>
      <div className="gd-page-sub">
        {view === "overview"  && `Real-time visibility into your governed knowledge graph · ${filterPeriod} window`}
        {view === "entities"  && "Browse, search, and inspect governed knowledge objects"}
        {view === "pipelines" && "Monitor active ingestion pipelines and data sources"}
        {view === "audit"     && "Entity resolution results, audit events, and provenance"}
      </div>

      {/* OVERVIEW */}
      {view === "overview" && (
        <>
          <div className="gd-metrics">
            {metrics.map((m) => (
              <div key={m.label} className="gd-metric">
                <div className="gd-metric-label">{m.label}</div>
                <div className="gd-metric-value">{m.value}</div>
                <div className={cls("gd-metric-delta", m.dir === "up" ? "gd-up" : m.dir === "down" ? "gd-down" : "gd-warn")}>
                  {m.dir === "up" ? <ArrowUpRight size={13}/> : m.dir === "down" ? <ArrowDownRight size={13}/> : <TriangleAlert size={12}/>}
                  {m.delta}
                  <span style={{ color:"var(--gd-muted)", fontWeight:400, marginInlineStart:4 }}>{m.sub}</span>
                </div>
                <MiniBar data={m.bars} />
              </div>
            ))}
          </div>

          <div className="gd-grid-2">
            <div className="gd-panel">
              <div className="gd-panel-head">
                <TrendingUp size={14} style={{ color:"var(--gd-teal)" }} />
                <span className="gd-panel-title">Graph Activity</span>
                <button className="gd-panel-action"><Download size={11}/> Export</button>
              </div>
              <div className="gd-chart-area"><Sparkline data={graphActivityData}/></div>
            </div>
            <div className="gd-panel">
              <div className="gd-panel-head">
                <Dna size={14} style={{ color:"var(--gd-ochre)" }} />
                <span className="gd-panel-title">ER Model F1 Score</span>
                <button className="gd-panel-action"><ArrowRight size={11}/> Details</button>
              </div>
              <div className="gd-chart-area"><Sparkline data={erScoreData.map((v)=>v*100)} color="var(--gd-ochre)"/></div>
            </div>
          </div>

          <div className="gd-grid-2">
            <div className="gd-panel">
              <div className="gd-panel-head">
                <DatabaseZap size={14} style={{ color:"var(--gd-teal)" }} />
                <span className="gd-panel-title">Active Pipelines</span>
                <button className="gd-panel-action">View all <ChevronRight size={11}/></button>
              </div>
              {pipelines.slice(0,4).map((p) => (
                <div key={p.name} className="gd-row">
                  <span className={cls("gd-dot",`gd-dot-${p.dot}`)}/>
                  <span className="gd-row-label">{p.name}<div className="gd-row-sub">{p.objects} objects · {p.latency}</div></span>
                  <span className={cls("gd-badge", p.status==="Active"?"gd-badge-green":p.status==="Warning"?"gd-badge-orange":"gd-badge-muted")}>{p.status}</span>
                </div>
              ))}
            </div>
            <div className="gd-panel">
              <div className="gd-panel-head">
                <ShieldCheck size={14} style={{ color:"var(--gd-teal)" }} />
                <span className="gd-panel-title">Audit Log</span>
                <button className="gd-panel-action">View all <ChevronRight size={11}/></button>
              </div>
              <div className="gd-timeline">
                {auditEvents.slice(0,4).map((e,i) => (
                  <div key={i} className="gd-timeline-item">
                    <div className="gd-timeline-icon">{e.icon}</div>
                    <div className="gd-timeline-body">
                      <div className="gd-timeline-title">{e.title}</div>
                      <div className="gd-timeline-meta"><Clock3 size={10}/> {e.meta} <span className={cls("gd-badge",`gd-badge-${e.badgeCls}`)}>{e.badge}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ENTITIES */}
      {view === "entities" && (
        <div className="gd-panel">
          <div className="gd-panel-head">
            <Box size={14}/><span className="gd-panel-title">Knowledge Objects (48,320 total)</span>
            <button className="gd-panel-action"><Filter size={11}/> Filter</button>
          </div>
          {[
            { name:"Ahmad Al-Rashidi",        type:"Person",       source:"OFAC Sanctions List",  confidence:"0.97", dot:"green"  },
            { name:"PetroGulf Corporation",    type:"Organisation", source:"Corporate Registry",   confidence:"0.95", dot:"green"  },
            { name:"ENT-00481 · Dubai Branch", type:"Location",    source:"Geographic DB",         confidence:"0.88", dot:"blue"   },
            { name:"Orion Systems Limited",    type:"Organisation", source:"Company House UK",      confidence:"0.91", dot:"green"  },
            { name:"Maria Santos",             type:"Person",       source:"PEP Database",          confidence:"0.72", dot:"orange" },
            { name:"Project Falcon Capital",   type:"Event",        source:"Adverse Media",         confidence:"0.65", dot:"orange" },
          ].map((e) => (
            <div key={e.name} className="gd-row">
              <span className={cls("gd-dot",`gd-dot-${e.dot}`)}/> 
              <span className="gd-row-label">{e.name}<div className="gd-row-sub">{e.type} · {e.source}</div></span>
              <span className="gd-badge gd-badge-muted">conf {e.confidence}</span>
              <ArrowRight size={12} style={{ color:"var(--gd-muted)" }}/>
            </div>
          ))}
        </div>
      )}

      {/* PIPELINES */}
      {view === "pipelines" && (
        <>
          <div className="gd-metrics" style={{ gridTemplateColumns:"repeat(3,1fr)" }}>
            {[
              { label:"Active Pipelines", value:"5",           delta:"+1 this week",   dir:"up"   as const, bars:[2,3,3,4,4,5,5]      },
              { label:"Objects Ingested",  value:fmt(50_120),   delta:"+18.3%",         dir:"up"   as const, bars:[30,35,32,40,38,45,48] },
              { label:"Avg Latency",       value:"1.8s",        delta:"+0.3s spike",    dir:"warn" as const, bars:[12,14,13,15,14,18,16] },
            ].map((m) => (
              <div key={m.label} className="gd-metric">
                <div className="gd-metric-label">{m.label}</div>
                <div className="gd-metric-value">{m.value}</div>
                <div className={cls("gd-metric-delta", m.dir==="up"?"gd-up":"gd-warn")}>
                  {m.dir==="up"?<ArrowUpRight size={13}/>:<TriangleAlert size={12}/>}{m.delta}
                </div>
                <MiniBar data={m.bars}/>
              </div>
            ))}
          </div>
          <div className="gd-panel">
            <div className="gd-panel-head">
              <DatabaseZap size={14}/><span className="gd-panel-title">All Pipelines</span>
              <button className="gd-panel-action"><ArrowDownToLine size={11}/> Export</button>
            </div>
            {pipelines.map((p) => (
              <div key={p.name} className="gd-row">
                <span className={cls("gd-dot",`gd-dot-${p.dot}`)}/> 
                <span className="gd-row-label">{p.name}<div className="gd-row-sub">{p.objects} objects ingested · avg {p.latency}</div></span>
                <span className={cls("gd-badge",p.status==="Active"?"gd-badge-green":p.status==="Warning"?"gd-badge-orange":"gd-badge-muted")}>{p.status}</span>
                <Ellipsis size={14} style={{ color:"var(--gd-muted)" }}/>
              </div>
            ))}
          </div>
          <div className="gd-panel" style={{ marginBlockStart:14 }}>
            <div className="gd-panel-head"><BarChart3 size={14}/><span className="gd-panel-title">Ingestion Volume (30d)</span></div>
            <div className="gd-chart-area"><Sparkline data={ingestData} color="var(--gd-ochre)"/></div>
          </div>
        </>
      )}

      {/* AUDIT */}
      {view === "audit" && (
        <>
          <div className="gd-grid-2">
            <div className="gd-panel">
              <div className="gd-panel-head">
                <Dna size={14} style={{ color:"var(--gd-ochre)" }}/><span className="gd-panel-title">Entity Resolution Results</span>
                <button className="gd-panel-action"><ListChecks size={11}/> Review queue</button>
              </div>
              {erMatches.map((m) => (
                <div key={`${m.a}-${m.b}`} className="gd-row">
                  <span className={cls("gd-dot",`gd-dot-${m.dot}`)}/> 
                  <span className="gd-row-label">{m.a} → {m.b}<div className="gd-row-sub">Score: {m.score}</div></span>
                  <span className={cls("gd-badge",m.status==="Match"?"gd-badge-green":"gd-badge-orange")}>{m.status}</span>
                </div>
              ))}
            </div>
            <div className="gd-panel">
              <div className="gd-panel-head">
                <ShieldCheck size={14} style={{ color:"var(--gd-teal)" }}/><span className="gd-panel-title">Full Audit Log</span>
                <button className="gd-panel-action"><Download size={11}/> Export</button>
              </div>
              <div className="gd-timeline">
                {auditEvents.map((e,i) => (
                  <div key={i} className="gd-timeline-item">
                    <div className="gd-timeline-icon">{e.icon}</div>
                    <div className="gd-timeline-body">
                      <div className="gd-timeline-title">{e.title}</div>
                      <div className="gd-timeline-meta"><Clock3 size={10}/> {e.meta} <span className={cls("gd-badge",`gd-badge-${e.badgeCls}`)}>{e.badge}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="gd-panel" style={{ marginBlockStart:14 }}>
            <div className="gd-panel-head"><TrendingUp size={14}/><span className="gd-panel-title">ER Model F1 Score Over Time</span></div>
            <div className="gd-chart-area"><Sparkline data={erScoreData.map((v)=>v*100)} color="var(--gd-ochre)"/></div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function OrionDashboard({
  backgroundImage = orionBg,
  backgroundCredit,
  workspaceName = "Orion Intelligence",
  panelFrost = 16,
  initialTheme = "dark",
  onNavigate,
  userDisplayName = "User",
  userEmail = "",
}: OrionDashboardProps) {
  const [theme, setTheme] = useState<"light" | "dark">(initialTheme);
  const [view, setView] = useState<"overview" | "entities" | "pipelines" | "audit">("overview");
  const [filterPeriod, setFilterPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const appRef = useRef<HTMLDivElement>(null);

  // GSAP entrance animation
  useGSAP(
    () => {
      const ctx = gsap.context(() => {
        gsap.from(".gd-metric", {
          opacity: 0, y: 20, stagger: 0.08, duration: 0.5, ease: "power2.out",
        });
        gsap.from(".gd-panel", {
          opacity: 0, y: 24, stagger: 0.1, duration: 0.55, ease: "power2.out", delay: 0.2,
        });
      }, appRef);
      return () => ctx.revert();
    },
    { scope: appRef, dependencies: [view] },
  );

  // ── Sample Orion data ────────────────────────────────────────────────────
  const graphActivityData = [210, 345, 290, 480, 420, 610, 580, 740, 695, 820, 760, 900];
  const erScoreData = [0.72, 0.74, 0.77, 0.75, 0.80, 0.82, 0.85, 0.83, 0.87, 0.89, 0.88, 0.92];
  const ingestData = [18, 24, 20, 32, 28, 35, 30, 42, 38, 45, 41, 50];
  const auditData = [4, 6, 3, 8, 5, 7, 6, 9, 7, 11, 8, 10];

  const metrics = [
    {
      label: "Knowledge Objects",
      value: fmt(48_320),
      delta: "+12.4%",
      dir: "up" as const,
      sub: "vs last period",
      bars: [32, 36, 38, 42, 40, 45, 48],
    },
    {
      label: "Entities Resolved",
      value: fmt(12_750),
      delta: "+8.7%",
      dir: "up" as const,
      sub: "entity resolution",
      bars: [60, 72, 68, 80, 78, 88, 90],
    },
    {
      label: "Graph Queries",
      value: fmt(284_900),
      delta: "+31.2%",
      dir: "up" as const,
      sub: "this period",
      bars: [40, 55, 50, 70, 65, 80, 85],
    },
    {
      label: "Alert Flags",
      value: "17",
      delta: "−5 resolved",
      dir: "warn" as const,
      sub: "needs review",
      bars: [8, 10, 12, 9, 14, 11, 10],
    },
  ];

  const pipelines = [
    { name: "OFAC Sanctions Normalizer", status: "Active", objects: "8,210", latency: "1.2s", dot: "green" },
    { name: "PEP List Enrichment", status: "Active", objects: "5,330", latency: "0.9s", dot: "green" },
    { name: "Corporate Registry Sync", status: "Active", objects: "12,440", latency: "2.1s", dot: "green" },
    { name: "Adverse Media Crawler", status: "Warning", objects: "3,100", latency: "4.7s", dot: "orange" },
    { name: "Historical Figures Dataset", status: "Idle", objects: "2,890", latency: "—", dot: "blue" },
    { name: "FEBRL Synthetic Pairs", status: "Training", objects: "1,500", latency: "—", dot: "orange" },
  ];

  const auditEvents = [
    { icon: <ShieldCheck size={14} />, title: "RLS policy validated — knowledge_objects", meta: "2 min ago · system", badge: "Pass", badgeCls: "green" },
    { icon: <Eye size={14} />, title: "Graph query by krishnasingh15kks@gmail.com", meta: "5 min ago · query log", badge: "Info", badgeCls: "blue" },
    { icon: <TriangleAlert size={14} />, title: "Adverse Media Crawler latency spike", meta: "12 min ago · pipeline monitor", badge: "Warn", badgeCls: "orange" },
    { icon: <Download size={14} />, title: "Bulk export — 1,200 records", meta: "34 min ago · data export", badge: "Info", badgeCls: "blue" },
    { icon: <Zap size={14} />, title: "Entity Resolution model retrained (F1: 0.924)", meta: "1 hr ago · ML service", badge: "Pass", badgeCls: "green" },
    { icon: <Users size={14} />, title: "New user invitation sent", meta: "2 hr ago · admin", badge: "Info", badgeCls: "blue" },
  ];

  const erMatches = [
    { a: "Ahmad Al-Rashidi", b: "Ahmad Rashidi", score: 0.94, status: "Match", dot: "green" },
    { a: "Orion Systems LLC", b: "Orion Systems Limited", score: 0.89, status: "Match", dot: "green" },
    { a: "David Chen", b: "D. W. Chen", score: 0.73, status: "Review", dot: "orange" },
    { a: "PetroGulf Corp", b: "PetroGulf Corporation", score: 0.97, status: "Match", dot: "green" },
    { a: "Maria Santos", b: "Marie Santos", score: 0.61, status: "Review", dot: "orange" },
  ];

  const initials = userDisplayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={15} />, view: "overview", path: "/" },
    { label: "Knowledge Explorer", icon: <Network size={15} />, view: "entities", path: "/knowledge" },
    { label: "Investigation Boards", icon: <Boxes size={15} />, view: null, path: "/boards" },
    { label: "Ontology Manager", icon: <Workflow size={15} />, view: null, path: "/ontology" },
    { label: "Data Ingestion", icon: <DatabaseZap size={15} />, view: "pipelines", path: "/ingestion" },
    { label: "Applications", icon: <Blocks size={15} />, view: null, path: "/applications" },
    { label: "AI Assistant", icon: <Bot size={15} />, view: null, path: "/assistant" },
    { label: "Entity Resolution", icon: <Dna size={15} />, view: "audit", path: "/entity-resolution" },
    { label: "Settings", icon: <Settings size={15} />, view: null, path: "/settings" },
  ];

  function handleNav(item: (typeof navItems)[0]) {
    if (item.view) {
      setView(item.view as typeof view);
    } else if (onNavigate) {
      onNavigate(item.path);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Inject styles once */}
      <style>{dashboardStyles}</style>

      <div ref={appRef} className={cls("gd-app", theme === "dark" && "gd-dark")}>
        {/* Background */}
        <div
          className="gd-bg"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backdropFilter: panelFrost ? `blur(${panelFrost}px)` : undefined,
          }}
        />

        <div className="gd-surround">
          {/* ── Top bar ── */}
          <header className="gd-topbar">
            <div className="gd-logo">
              <div className="gd-logo-mark p-1">
                <img src="/orion-logo.png" alt="Orion" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="gd-logo-name">{workspaceName}</div>
                <div className="gd-logo-sub">Decision OS</div>
              </div>
            </div>

            <div className="gd-topbar-mid">
              <div className="gd-search">
                <Search size={13} />
                <span>Search knowledge graph…</span>
                <span className="gd-kbd">
                  <Command size={11} /> K
                </span>
              </div>
            </div>

            <div className="gd-topbar-end">
              <button
                className="gd-icon-btn"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button className="gd-icon-btn" aria-label="Notifications">
                <Bell size={15} />
              </button>
              <div className="gd-avatar" title={userEmail}>{initials || "O"}</div>
            </div>
          </header>

          {/* ── Layout ── */}
          <div className="gd-layout">
            {/* Sidebar */}
            <nav className="gd-sidebar">
              <div className="gd-nav-label">Navigate</div>
              {navItems.map((item) => (
                <button
                  key={item.path}
                  className={cls(
                    "gd-nav-item",
                    view === item.view && "gd-active",
                  )}
                  onClick={() => handleNav(item)}
                  style={{ background: "none", border: "1px solid transparent", width: "100%", textAlign: "left" }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
              <div className="gd-nav-spacer" />
              <div
                className="gd-nav-item"
                style={{ opacity: 0.6, fontSize: 11 }}
                onClick={() => onNavigate?.("/settings")}
              >
                <Settings size={13} /> Settings
              </div>
            </nav>

            {/* Main */}
            <main className="gd-main">
              {/* View tabs */}
              <div className="gd-view-tabs">
                {(["overview", "entities", "pipelines", "audit"] as const).map((v) => (
                  <button
                    key={v}
                    className={cls("gd-tab", view === v && "gd-active")}
                    onClick={() => setView(v)}
                    style={{ background: "none", border: "none" }}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>

              {/* Period filter */}
              <div style={{ display: "flex", gap: 6, marginBlockEnd: 20 }}>
                {(["7d", "30d", "90d"] as const).map((p) => (
                  <button
                    key={p}
                    className={cls("gd-pill", filterPeriod === p && "gd-active")}
                    onClick={() => setFilterPeriod(p)}
                    style={{ background: "none" }}
                  >
                    {p}
                  </button>
                ))}
                <button className="gd-pill" style={{ background: "none", marginInlineStart: "auto" }}>
                  <Filter size={11} style={{ display: "inline", marginInlineEnd: 4 }} />
                  Filter
                </button>
              </div>

              {/* Page heading */}
              <div className="gd-page-title">
                {view === "overview" && "Operational Overview"}
                {view === "entities" && "Knowledge Explorer"}
                {view === "pipelines" && "Data Pipelines"}
                {view === "audit" && "Entity Resolution & Audit"}
              </div>
              <div className="gd-page-sub">
                {view === "overview" && `Real-time visibility into your governed knowledge graph · ${filterPeriod} window`}
                {view === "entities" && "Browse, search, and inspect governed knowledge objects"}
                {view === "pipelines" && "Monitor active ingestion pipelines and data sources"}
                {view === "audit" && "Entity resolution results, audit events, and provenance"}
              </div>

              {/* ── OVERVIEW ── */}
              {view === "overview" && (
                <>
                  {/* Metrics */}
                  <div className="gd-metrics">
                    {metrics.map((m) => (
                      <div key={m.label} className="gd-metric">
                        <div className="gd-metric-label">{m.label}</div>
                        <div className="gd-metric-value">{m.value}</div>
                        <div
                          className={cls(
                            "gd-metric-delta",
                            m.dir === "up" ? "gd-up" : m.dir === "down" ? "gd-down" : "gd-warn",
                          )}
                        >
                          {m.dir === "up" ? (
                            <ArrowUpRight size={13} />
                          ) : m.dir === "down" ? (
                            <ArrowDownRight size={13} />
                          ) : (
                            <TriangleAlert size={12} />
                          )}
                          {m.delta}
                          <span
                            style={{ color: "var(--gd-muted)", fontWeight: 400, marginInlineStart: 4 }}
                          >
                            {m.sub}
                          </span>
                        </div>
                        <MiniBar data={m.bars} />
                      </div>
                    ))}
                  </div>

                  {/* Charts row */}
                  <div className="gd-grid-2">
                    {/* Graph activity */}
                    <div className="gd-panel">
                      <div className="gd-panel-head">
                        <TrendingUp size={14} style={{ color: "var(--gd-teal)" }} />
                        <span className="gd-panel-title">Graph Activity</span>
                        <button className="gd-panel-action">
                          <Download size={11} /> Export
                        </button>
                      </div>
                      <div className="gd-chart-area">
                        <Sparkline data={graphActivityData} />
                      </div>
                    </div>

                    {/* ER score */}
                    <div className="gd-panel">
                      <div className="gd-panel-head">
                        <Dna size={14} style={{ color: "var(--gd-ochre)" }} />
                        <span className="gd-panel-title">ER Model F1 Score</span>
                        <button className="gd-panel-action">
                          <ArrowRight size={11} /> Details
                        </button>
                      </div>
                      <div className="gd-chart-area">
                        <Sparkline data={erScoreData.map((v) => v * 100)} color="var(--gd-ochre)" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="gd-grid-2">
                    {/* Active pipelines */}
                    <div className="gd-panel">
                      <div className="gd-panel-head">
                        <DatabaseZap size={14} style={{ color: "var(--gd-teal)" }} />
                        <span className="gd-panel-title">Active Pipelines</span>
                        <button className="gd-panel-action">View all <ChevronRight size={11} /></button>
                      </div>
                      {pipelines.slice(0, 4).map((p) => (
                        <div key={p.name} className="gd-row">
                          <span className={cls("gd-dot", `gd-dot-${p.dot}`)} />
                          <span className="gd-row-label">
                            {p.name}
                            <div className="gd-row-sub">{p.objects} objects · {p.latency}</div>
                          </span>
                          <span
                            className={cls(
                              "gd-badge",
                              p.status === "Active"
                                ? "gd-badge-green"
                                : p.status === "Warning"
                                  ? "gd-badge-orange"
                                  : "gd-badge-muted",
                            )}
                          >
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Audit log preview */}
                    <div className="gd-panel">
                      <div className="gd-panel-head">
                        <ShieldCheck size={14} style={{ color: "var(--gd-teal)" }} />
                        <span className="gd-panel-title">Audit Log</span>
                        <button className="gd-panel-action">View all <ChevronRight size={11} /></button>
                      </div>
                      <div className="gd-timeline">
                        {auditEvents.slice(0, 4).map((e, i) => (
                          <div key={i} className="gd-timeline-item">
                            <div className="gd-timeline-icon">{e.icon}</div>
                            <div className="gd-timeline-body">
                              <div className="gd-timeline-title">{e.title}</div>
                              <div className="gd-timeline-meta">
                                <Clock3 size={10} /> {e.meta}
                                <span
                                  className={cls(
                                    "gd-badge",
                                    `gd-badge-${e.badgeCls}`,
                                  )}
                                >
                                  {e.badge}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── ENTITIES view ── */}
              {view === "entities" && (
                <div className="gd-panel">
                  <div className="gd-panel-head">
                    <Box size={14} />
                    <span className="gd-panel-title">Knowledge Objects (48,320 total)</span>
                    <button className="gd-panel-action"><Filter size={11} /> Filter</button>
                  </div>
                  {[
                    { name: "Ahmad Al-Rashidi", type: "Person", source: "OFAC Sanctions List", confidence: "0.97", dot: "green" },
                    { name: "PetroGulf Corporation", type: "Organisation", source: "Corporate Registry", confidence: "0.95", dot: "green" },
                    { name: "ENT-00481 · Dubai Branch", type: "Location", source: "Geographic DB", confidence: "0.88", dot: "blue" },
                    { name: "Orion Systems Limited", type: "Organisation", source: "Company House UK", confidence: "0.91", dot: "green" },
                    { name: "Maria Santos", type: "Person", source: "PEP Database", confidence: "0.72", dot: "orange" },
                    { name: "Project Falcon Capital", type: "Event", source: "Adverse Media", confidence: "0.65", dot: "orange" },
                  ].map((e) => (
                    <div key={e.name} className="gd-row">
                      <span className={cls("gd-dot", `gd-dot-${e.dot}`)} />
                      <span className="gd-row-label">
                        {e.name}
                        <div className="gd-row-sub">{e.type} · {e.source}</div>
                      </span>
                      <span className="gd-badge gd-badge-muted">conf {e.confidence}</span>
                      <ArrowRight size={12} style={{ color: "var(--gd-muted)" }} />
                    </div>
                  ))}
                </div>
              )}

              {/* ── PIPELINES view ── */}
              {view === "pipelines" && (
                <>
                  <div className="gd-metrics" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
                    {[
                      { label: "Active Pipelines", value: "5", delta: "+1 this week", dir: "up" as const, bars: [2,3,3,4,4,5,5] },
                      { label: "Objects Ingested", value: fmt(50_120), delta: "+18.3%", dir: "up" as const, bars: [30,35,32,40,38,45,48] },
                      { label: "Avg Latency", value: "1.8s", delta: "+0.3s spike", dir: "warn" as const, bars: [12,14,13,15,14,18,16] },
                    ].map((m) => (
                      <div key={m.label} className="gd-metric">
                        <div className="gd-metric-label">{m.label}</div>
                        <div className="gd-metric-value">{m.value}</div>
                        <div className={cls("gd-metric-delta", m.dir === "up" ? "gd-up" : "gd-warn")}>
                          {m.dir === "up" ? <ArrowUpRight size={13} /> : <TriangleAlert size={12} />}
                          {m.delta}
                        </div>
                        <MiniBar data={m.bars} />
                      </div>
                    ))}
                  </div>
                  <div className="gd-panel">
                    <div className="gd-panel-head">
                      <DatabaseZap size={14} />
                      <span className="gd-panel-title">All Pipelines</span>
                      <button className="gd-panel-action"><ArrowDownToLine size={11} /> Export</button>
                    </div>
                    {pipelines.map((p) => (
                      <div key={p.name} className="gd-row">
                        <span className={cls("gd-dot", `gd-dot-${p.dot}`)} />
                        <span className="gd-row-label">
                          {p.name}
                          <div className="gd-row-sub">{p.objects} objects ingested · avg {p.latency}</div>
                        </span>
                        <span className={cls("gd-badge", p.status === "Active" ? "gd-badge-green" : p.status === "Warning" ? "gd-badge-orange" : "gd-badge-muted")}>{p.status}</span>
                        <Ellipsis size={14} style={{ color: "var(--gd-muted)" }} />
                      </div>
                    ))}
                  </div>
                  <div className="gd-panel" style={{ marginBlockStart: 14 }}>
                    <div className="gd-panel-head">
                      <BarChart3 size={14} />
                      <span className="gd-panel-title">Ingestion Volume (30d)</span>
                    </div>
                    <div className="gd-chart-area">
                      <Sparkline data={ingestData} color="var(--gd-ochre)" />
                    </div>
                  </div>
                </>
              )}

              {/* ── AUDIT / ER view ── */}
              {view === "audit" && (
                <>
                  <div className="gd-grid-2">
                    <div className="gd-panel">
                      <div className="gd-panel-head">
                        <Dna size={14} style={{ color: "var(--gd-ochre)" }} />
                        <span className="gd-panel-title">Entity Resolution Results</span>
                        <button className="gd-panel-action"><ListChecks size={11} /> Review queue</button>
                      </div>
                      {erMatches.map((m) => (
                        <div key={`${m.a}-${m.b}`} className="gd-row">
                          <span className={cls("gd-dot", `gd-dot-${m.dot}`)} />
                          <span className="gd-row-label">
                            {m.a} → {m.b}
                            <div className="gd-row-sub">Score: {m.score}</div>
                          </span>
                          <span className={cls("gd-badge", m.status === "Match" ? "gd-badge-green" : "gd-badge-orange")}>{m.status}</span>
                        </div>
                      ))}
                    </div>

                    <div className="gd-panel">
                      <div className="gd-panel-head">
                        <ShieldCheck size={14} style={{ color: "var(--gd-teal)" }} />
                        <span className="gd-panel-title">Full Audit Log</span>
                        <button className="gd-panel-action"><Download size={11} /> Export</button>
                      </div>
                      <div className="gd-timeline">
                        {auditEvents.map((e, i) => (
                          <div key={i} className="gd-timeline-item">
                            <div className="gd-timeline-icon">{e.icon}</div>
                            <div className="gd-timeline-body">
                              <div className="gd-timeline-title">{e.title}</div>
                              <div className="gd-timeline-meta">
                                <Clock3 size={10} /> {e.meta}
                                <span className={cls("gd-badge", `gd-badge-${e.badgeCls}`)}>{e.badge}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ER score chart */}
                  <div className="gd-panel" style={{ marginBlockStart: 14 }}>
                    <div className="gd-panel-head">
                      <TrendingUp size={14} />
                      <span className="gd-panel-title">ER Model F1 Score Over Time</span>
                    </div>
                    <div className="gd-chart-area">
                      <Sparkline data={erScoreData.map((v) => v * 100)} color="var(--gd-ochre)" />
                    </div>
                  </div>
                </>
              )}

              {/* Credit */}
              {backgroundCredit && (
                <div className="gd-credit">
                  Photo:{" "}
                  <a href={backgroundCredit.href} target="_blank" rel="noopener noreferrer">
                    {backgroundCredit.label}
                  </a>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
