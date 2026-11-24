import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Boxes,
  DatabaseZap,
  GitBranch,
  Layers,
  Lock,
  Network,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Workflow,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import AirplaneWindowGallery from "@/components/ui/airplane-window-gallery";
import GlassFolder from "@/components/ui/glass-folder-cards";
import SteppedMorphSlider, { SteppedSlide } from "@/components/ui/stepped-morph-slider";

const features = [
  {
    icon: Network,
    title: "Knowledge Graph",
    desc: "Unified object-and-link model across every dataset, document, and department.",
  },
  {
    icon: Sparkles,
    title: "AI Reasoning",
    desc: "Multi-agent orchestration that searches the graph, cites evidence, and answers complex questions.",
  },
  {
    icon: Layers,
    title: "Ontology Layer",
    desc: "Define your business vocabulary once — Person, Company, Transaction, Alert — and reuse everywhere.",
  },
  {
    icon: Boxes,
    title: "Investigation Boards",
    desc: "Collaborative, real-time canvases where analysts pin evidence and connect the dots.",
  },
  {
    icon: Workflow,
    title: "No-Code Apps",
    desc: "Ship operational tools on top of the live graph in minutes, not quarters.",
  },
  {
    icon: DatabaseZap,
    title: "Hybrid Search",
    desc: "Keyword + vector + graph traversal, fused into one query that always finds the signal.",
  },
];

const stats = [
  { value: "Unified", label: "Data across silos" },
  { value: "Sub-second", label: "Graph traversals" },
  { value: "SOC 2", label: "Enterprise-ready" },
  { value: "No backend", label: "For app builders" },
];

// ─── Mobile nav state ───────────────────────────────────────────────
function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition hover:bg-white/20"
        aria-label="Menu"
      >
        <span className="flex flex-col gap-[5px]">
          <span
            className={`block h-px w-4 bg-white transition-all duration-300 ${open ? "translate-y-[5px] rotate-45" : ""}`}
          />
          <span
            className={`block h-px w-4 bg-white transition-all duration-300 ${open ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-px w-4 bg-white transition-all duration-300 ${open ? "-translate-y-[5px] -rotate-45" : ""}`}
          />
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 min-w-48 rounded-2xl border border-white/15 bg-[#141220]/95 p-3 shadow-2xl backdrop-blur-2xl">
          {[
            { label: "Home", href: "#" },
            { label: "Intelligence Gap", href: "#features" },
            { label: "Platform", href: "#platform" },
            { label: "The Orion Loop", href: "#how" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-white/80 rounded-xl transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </a>
          ))}
          <div className="mx-2 my-2 h-px bg-white/10" />
          <Link
            to="/register"
            onClick={() => setOpen(false)}
            className="block text-center py-2 text-xs font-semibold text-white neo-nav-btn rounded-xl"
          >
            Get Started
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Solar ring hero ─────────────────────────────────────────────────
function SolarHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const prefersReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  // Entrance animation
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReduced) return;
    const root = heroRef.current;
    if (!root) return;

    const nav = root.querySelector<HTMLElement>("[data-anim='nav']");
    const badge = root.querySelector<HTMLElement>("[data-anim='badge']");
    const headline = root.querySelector<HTMLElement>("[data-anim='headline']");
    const subline = root.querySelector<HTMLElement>("[data-anim='subline']");
    const btn1 = root.querySelector<HTMLElement>("[data-anim='btn1']");
    const btn2 = root.querySelector<HTMLElement>("[data-anim='btn2']");

    const fade = (el: HTMLElement | null, delay: number, extra?: Keyframe[]) => {
      if (!el) return;
      el.animate(
        extra ?? [
          { opacity: 0, transform: "translateY(14px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { delay, duration: 500, fill: "both", easing: "cubic-bezier(.22,1,.36,1)" },
      );
    };

    fade(nav, 0, [{ opacity: 0, transform: "translateY(-10px)" }, { opacity: 1, transform: "translateY(0)" }]);
    headline?.animate(
      [
        { opacity: 0, clipPath: "inset(100% 0 0 0)", transform: "translateY(24px)" },
        { opacity: 1, clipPath: "inset(0% 0 0 0)", transform: "translateY(0)" },
      ],
      { delay: 350, duration: 750, fill: "both", easing: "cubic-bezier(.22,1,.36,1)" },
    );
    fade(subline, 750);
    fade(btn1, 950);
    fade(btn2, 1100);
  }, [prefersReduced]);

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-screen flex-col overflow-hidden bg-black text-white"
      style={{ fontFamily: "'Anta', sans-serif" }}
    >
      {/* Anta font import */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Anta&display=swap');`}</style>

      {/* ── Background glow plate ── */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0"
        style={{ height: "calc(515 / 541 * min(100svh, 100vw / 894 * 541))" }}
      >
        {/* Static plate */}
        <img
          src="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/7e2a7695-c32b-4179-9c90-cae865819272.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-bottom select-none"
          draggable={false}
        />

        {/* Looping video overlay */}
        {!prefersReduced && (
          <video
            ref={videoRef}
            src="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/6ad9485f-ab40-444b-bd3c-40dcb9bd0e2f.mp4"
            autoPlay
            muted
            loop
            playsInline
            onCanPlay={() => setVideoReady(true)}
            className="absolute inset-0 h-full w-full object-cover object-bottom transition-opacity duration-[800ms]"
            style={{ opacity: videoReady ? 1 : 0 }}
          />
        )}

        {/* Floor gradient — orange → black */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgb(255,150,40) 0%, rgb(160,60,10) 30%, transparent 100%)",
            opacity: 0.18,
          }}
        />

        {/* Fade top edge into black */}
        <div
          className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, #000 0%, transparent 100%)",
          }}
        />
      </div>

      {/* ── Smoked Frosted Glass Navigation Bar (Fixed Floating on Scroll) ── */}
      <div className="fixed top-4 inset-x-0 z-50 w-full px-4 sm:px-8 pointer-events-none">
        <nav
          data-anim="nav"
          className="folder-glass-nav pointer-events-auto mx-auto flex h-[66px] max-w-5xl items-center justify-between rounded-full px-6 sm:px-8 transition-all"
        >
          {/* Specular highlight overlay matching GlassFolder cards */}
          <div className="folder-glass-spec" />

          {/* Real Official Logo (Big & Bold while container stays compact) */}
          <Link to="/" className="relative z-10 flex items-center group -my-3">
            <img
              src="/orion-logo.png"
              alt="Orion Intelligence"
              className="h-14 sm:h-16 w-auto max-w-[260px] object-contain filter drop-shadow-[0_4px_22px_rgba(255,255,255,0.45)] transition-transform group-hover:scale-[1.03]"
            />
          </Link>

          {/* Clean, Simple Navigation Links */}
          <div className="relative z-10 hidden items-center gap-7 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Overview
            </a>
            <a
              href="#platform"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Platform
            </a>
            <a
              href="#how"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              The Orion Loop
            </a>
          </div>

          {/* Right Action Group */}
          <div className="relative z-10 flex items-center gap-3">
            <Link
              to="/register"
              className="folder-glass-cta rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
            >
              Get Started
              <ArrowRight className="size-3.5" />
            </Link>
            <MobileNav />
          </div>
        </nav>
      </div>

      {/* ── Hero content ── */}
      <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-6 pb-28 pt-36 text-center">
        {/* Large, High-Impact Headline */}
        <h1
          data-anim="headline"
          className="mx-auto max-w-4xl font-light tracking-tight text-white"
          style={{
            fontFamily: "'Anta', sans-serif",
            fontSize: "clamp(38px, 6.2vw, 76px)",
            lineHeight: "clamp(46px, 6.8vw, 84px)",
          }}
        >
          Empowering Enterprises with
          <br />
          <span className="bg-gradient-to-r from-white via-orange-100 to-orange-400 bg-clip-text text-transparent">
            Practical AI Systems
          </span>
        </h1>

        {/* Subline */}
        <p
          data-anim="subline"
          className="mx-auto mt-7 max-w-2xl text-white/75 font-normal"
          style={{
            fontSize: "clamp(14px, 1.8vw, 19px)",
            lineHeight: "1.65",
            letterSpacing: "-0.01em",
          }}
        >
          We build the unified knowledge layer that connects fragmented databases, runs
          autonomous agent reasoning, and powers operational decision intelligence.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            data-anim="btn1"
            to="/register"
            className="group relative inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-[14px] font-medium text-[#030103] transition-all duration-200 hover:shadow-[0_0_32px_rgba(255,130,40,0.65)] hover:scale-[1.02]"
            style={{ fontFamily: "'Anta', sans-serif" }}
          >
            Start Free
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-medium text-white/80 transition-all duration-200 hover:text-white hover:bg-white/[0.08]"
          >
            Sign in to Workspace →
          </Link>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <SolarHero />

      {/* ── Section 1: Marquee Ticker ── */}
      <div className="overflow-hidden bg-black py-3 border-y border-white/[0.06]">
        <style>{`
          @keyframes ticker {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-track {
            display: flex;
            width: max-content;
            animation: ticker 30s linear infinite;
          }
          .marquee-track:hover {
            animation-play-state: paused;
          }
        `}</style>
        <div className="marquee-track">
          {[
            "Knowledge Graph Engine",
            "Multi-Agent Reasoning",
            "Ontology Builder",
            "Hybrid Search",
            "Investigation Boards",
            "Real-Time Ingestion",
            "No-Code App Builder",
            "Entity Resolution",
            "Audit Trail",
            "SOC 2 Ready",
          ]
            .concat([
              "Knowledge Graph Engine",
              "Multi-Agent Reasoning",
              "Ontology Builder",
              "Hybrid Search",
              "Investigation Boards",
              "Real-Time Ingestion",
              "No-Code App Builder",
              "Entity Resolution",
              "Audit Trail",
              "SOC 2 Ready",
            ])
            .map((tag, i) => (
              <span key={i} className="flex items-center gap-4 px-6 text-[10px] uppercase tracking-[0.2em] text-white/50 whitespace-nowrap">
                {tag}
                <span className="size-1 rounded-full bg-white/20 flex-shrink-0" />
              </span>
            ))}
        </div>
      </div>

      <main>
        {/* ── Section 2: The Problem ── */}
        <section id="features" className="bg-[#0a0a0a] py-28 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-400">
                The Intelligence Gap
              </p>
              <h2 className="mt-5 text-3xl font-light text-white sm:text-4xl lg:text-5xl leading-[1.2]">
                Your data is everywhere. Your decisions shouldn't be.
              </h2>
              <p className="mt-6 text-sm leading-8 text-white/60">
                Intelligence teams spend 70% of their time finding and connecting data across siloed
                systems — not analyzing it. Orion collapses that gap with a unified Knowledge Graph
                that links every dataset, document, entity, and event into one governed, queryable
                layer.
              </p>
            </div>

            <div className="mt-16 flex flex-col items-center">
              <div className="grid w-full grid-cols-1 items-end justify-items-center gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                <GlassFolder
                  label="70% Lost Time"
                  meta="Siloed Data"
                  tone="dark"
                  art="ember"
                  seed={7}
                  action="more"
                  labelPlacement="top-left"
                  appearDelay={0}
                  width={340}
                  files={[
                    { name: "Unstructured Logs", meta: "Parquet · 2.4 GB", art: "ember" },
                    { name: "ERP Databases", meta: "PostgreSQL · 80M rows", art: "dusk" },
                    { name: "Manual Audits.pdf", meta: "PDF · 14 MB" },
                  ]}
                  menu={[
                    { label: "Connect to Knowledge Graph" },
                    { label: "Run Entity Resolution" },
                  ]}
                />
                <GlassFolder
                  label="12+ Siloed Tools"
                  meta="Context Splitting"
                  tone="dark"
                  art="dusk"
                  seed={19}
                  action="add"
                  labelPlacement="top-left"
                  appearDelay={140}
                  width={340}
                  files={[
                    { name: "Vector Index", meta: "Pinecone / Qdrant", art: "aurora" },
                    { name: "BI Dashboards", meta: "Tableau / Looker", art: "glacier" },
                    { name: "Incident Canvases", meta: "Miro / Notion", art: "verdant" },
                    { name: "Graph DB", meta: "Neo4j / Neptune", art: "ember" },
                  ]}
                />
                <GlassFolder
                  label="4x Decision Velocity"
                  meta="Unified Intelligence"
                  tone="dark"
                  art="aurora"
                  seed={42}
                  action="more"
                  labelPlacement="top-right"
                  appearDelay={280}
                  width={340}
                  files={[
                    { name: "Live Graph Canvas", meta: "Zero-latency sync", art: "verdant" },
                    { name: "Multi-Agent Briefs", meta: "Synthesized answers", art: "aurora" },
                    { name: "Actionable Alert", meta: "Autonomous trigger", art: "ember" },
                  ]}
                  menu={[
                    { label: "Export Evidence Brief" },
                    { label: "Deploy Live App" },
                  ]}
                />
              </div>
              <p className="mt-12 text-xs font-mono uppercase tracking-[0.2em] text-white/40">
                Hover to tilt glass · Click to open folder · Inspect data assets
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 3: Platform Capabilities ── */}
        <section id="platform" className="bg-[#0b0c10] py-28 px-6 border-t border-white/[0.05]">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center mb-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-400">
                Platform Architecture
              </p>
              <h2 className="mt-4 text-3xl font-light text-white sm:text-4xl lg:text-5xl leading-[1.2]">
                One OS for everything your intelligence team does.
              </h2>
              <p className="mt-4 text-sm text-white/50 max-w-xl mx-auto">
                Explore the modular subsystems powering Orion: from real-time ontology orchestration to autonomous multi-agent graph investigations.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#121318]/70 backdrop-blur-xl p-3 md:p-8 shadow-2xl">
              <SteppedMorphSlider
                columns={9}
                aspect={2.1}
                background="transparent"
                ink="#ffffff"
                muted="rgba(255,255,255,0.45)"
                accent="#f97316"
                outline="rgba(249,115,22,0.4)"
                autoplay={4800}
                slides={[
                  {
                    title: "Knowledge Graph Engine",
                    caption: "Unifies raw silos, transactions, and unstructured documents into a continuous, real-time queryable semantic graph.",
                    palette: "alpine",
                    seed: 14,
                    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80",
                  },
                  {
                    title: "Multi-Agent AI Reasoning",
                    caption: "Autonomous agent loop performs hybrid traversal, cites provenance, and verifies ground-truth evidence before answering.",
                    palette: "dusk",
                    seed: 28,
                    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
                  },
                  {
                    title: "Dynamic Ontology Builder",
                    caption: "Formalize concepts, entities, and event schemas once; propagate structural lineage across all live operational data.",
                    palette: "dawn",
                    seed: 42,
                    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80",
                  },
                  {
                    title: "Collaborative Investigation Canvases",
                    caption: "Infinite graph boards where analysts pin evidence, execute pathfinding, and author auditable intelligence dossiers.",
                    palette: "mist",
                    seed: 7,
                    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
                  },
                  {
                    title: "No-Code Operational App Engine",
                    caption: "Ship mission-critical workflows, automated alert triggers, and real-time operator portals in minutes with zero backend glue.",
                    palette: "alpine",
                    seed: 91,
                    image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1600&q=80",
                  },
                ]}
              />
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Network,
                  title: "Knowledge Graph",
                  desc: "Ingest any source. Objects and links form a living, queryable graph that reveals hidden connections across your entire data estate.",
                },
                {
                  icon: Sparkles,
                  title: "AI Reasoning",
                  desc: "Ask complex questions in natural language. Our multi-agent engine searches the graph, cites evidence, and returns answers you can trust — and audit.",
                },
                {
                  icon: Layers,
                  title: "Ontology Builder",
                  desc: "Define your business vocabulary — Person, Company, Transaction, Alert — once. Every pipeline, query, and app speaks the same language.",
                },
                {
                  icon: Boxes,
                  title: "Investigation Boards",
                  desc: "Collaborative, real-time canvas for analysts. Pin evidence, draw links, annotate objects, and share findings — directly on the live graph.",
                },
                {
                  icon: Workflow,
                  title: "No-Code App Builder",
                  desc: "Ship operational tools in hours, not quarters. Drag your ontology onto a canvas and publish apps that run on live graph data.",
                },
                {
                  icon: DatabaseZap,
                  title: "Hybrid Search",
                  desc: "Keyword + vector + graph traversal fused into a single query. Always finds the signal, even across millions of objects.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-all duration-300 hover:border-orange-500/30 hover:bg-white/[0.06] hover:shadow-[0_4px_24px_rgba(249,115,22,0.08)]"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 transition-colors group-hover:border-orange-500/40">
                    <f.icon className="size-5 text-orange-400" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 4: How It Works (The Orion Loop) ── */}
        <section id="how" className="bg-[#050505] py-28 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-400">
                The Orion Loop
              </p>
              <h2 className="mt-5 text-3xl font-light text-white sm:text-4xl leading-[1.2]">
                From raw data to operational intelligence in four steps.
              </h2>
              <p className="mt-4 text-sm text-white/50 max-w-xl mx-auto">
                Click any cabin window to expand its panoramic flight perspective, or let the loop cycle through each unified intelligence stage.
              </p>
            </div>

            {/* Airplane Window Gallery */}
            <div className="mt-14 rounded-3xl border border-white/10 bg-[#0d0e14]/80 backdrop-blur-xl p-3 md:p-6 shadow-2xl">
              <AirplaneWindowGallery
                windows={4}
                autoplay={true}
                interval={4500}
                drift={20}
                items={[
                  {
                    title: "Ingest Everything",
                    location: "Stage 01 · Data Fabric",
                    caption: "Drop files, connect databases, stream from Kafka or APIs. Orion normalizes, cleans, and resolves entities automatically — turning raw signals into structured objects.",
                    src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
                  },
                  {
                    title: "Build the Graph",
                    location: "Stage 02 · Knowledge Core",
                    caption: "Objects link to objects. Orion's entity resolution engine merges duplicates and writes every relationship into a governed knowledge graph with full lineage.",
                    src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80",
                  },
                  {
                    title: "Ask the Hard Questions",
                    location: "Stage 03 · AI Multi-Agent",
                    caption: "Natural-language queries become graph traversals. Multi-agent reasoning gathers evidence from across your data estate and synthesizes a traceable answer.",
                    src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
                  },
                  {
                    title: "Ship & Operate",
                    location: "Stage 04 · Live Applications",
                    caption: "Publish investigation boards, operational apps, and automated alerts — all running directly against the live graph. No backend code required.",
                    src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
                  },
                ]}
              />
            </div>

            {/* Step summary cards below */}
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "01",
                  icon: DatabaseZap,
                  title: "Ingest Everything",
                  body: "Drop files, connect databases, stream from Kafka or APIs. Orion normalizes, cleans, and resolves entities automatically — turning raw signals into structured objects.",
                },
                {
                  step: "02",
                  icon: GitBranch,
                  title: "Build the Graph",
                  body: "Objects link to objects. Orion's entity resolution engine merges duplicates and writes every relationship into a governed knowledge graph with full lineage.",
                },
                {
                  step: "03",
                  icon: Bot,
                  title: "Ask the Hard Questions",
                  body: "Natural-language queries become graph traversals. Multi-agent reasoning gathers evidence from across your data estate and synthesizes a traceable answer.",
                },
                {
                  step: "04",
                  icon: Layers,
                  title: "Ship & Operate",
                  body: "Publish investigation boards, operational apps, and automated alerts — all running directly against the live graph. No backend code required.",
                },
              ].map((s) => (
                <div key={s.step} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-orange-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-mono font-bold tracking-widest text-orange-400">STAGE {s.step}</p>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/10">
                      <s.icon className="size-4 text-orange-400" />
                    </div>
                    <h3 className="text-base font-semibold text-white">{s.title}</h3>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-white/50">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className="bg-black py-28 px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-light text-white leading-[1.2]">
              Your data. Your graph. Your intelligence OS.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/50">
              Stop stitching together disconnected tools. Build once on Orion — and every future
              question gets faster and cheaper.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition hover:bg-white/90"
              >
                Create Workspace
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-medium text-white transition hover:bg-orange-500/20"
                style={{
                  background: "rgba(249,115,22,0.12)",
                  border: "1px solid rgba(249,115,22,0.3)",
                }}
              >
                Talk to Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Nexeus Glass Footer Pane with Background Horizon ── */}
      <footer className="relative overflow-hidden bg-[#07070a] border-t border-white/[0.12] min-h-[460px]">
        {/* Background Alpine Horizon Artwork / Image - 100% sharp, zero blur */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/693205bf-8048-456a-879e-4e0a1b85a098.webp"
            alt="Alpine horizon"
            className="w-full h-full object-cover object-bottom filter saturate-110 brightness-95 opacity-90 select-none"
          />
          {/* Gentle vignette and gradient so text stands out cleanly while image details remain crystal sharp */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>

        {/* Subtle glass highlights without any backdrop blur over the image */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.06) 30px, rgba(255,255,255,0) 80px), linear-gradient(270deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.05) 30px, rgba(255,255,255,0) 80px), linear-gradient(180deg, rgba(14,10,22,0.15) 0%, rgba(10,8,18,0.5) 100%)",
            boxShadow:
              "inset 1.5px 0 0 rgba(255,255,255,0.2), inset -1.5px 0 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(255,255,255,0.22), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr] items-start">
            {/* Left brand column with Real Official Logo (Bigger & High Contrast) */}
            <div>
              <Link to="/" className="inline-block group">
                <img
                  src="/orion-logo.png"
                  alt="Orion Intelligence"
                  className="h-14 sm:h-16 w-auto max-w-[280px] object-contain filter drop-shadow-[0_4px_24px_rgba(255,255,255,0.5)] transition-transform group-hover:scale-[1.02]"
                />
              </Link>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/80 font-light">
                Change your future today using marketing and growth systems — everything you need starts here.
              </p>
            </div>

            {/* Right link columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Solutions</h3>
                <ul className="mt-4 space-y-3 text-sm text-white/80">
                  <li><a href="#" className="hover:text-white transition-colors">Revenue Acceleration</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Search Visibility</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Conversion Optimization</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Customer Automation</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Capabilities</h3>
                <ul className="mt-4 space-y-3 text-sm text-white/80">
                  <li><a href="#" className="hover:text-white transition-colors">Web Architecture</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Brand Systems</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Growth Marketing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">E-commerce Infrastructure</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Resources</h3>
                <ul className="mt-4 space-y-3 text-sm text-white/80">
                  <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Growth Insights</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Playbooks</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Industry Reports</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="my-12 h-px w-full bg-white/25 shadow-sm" />

          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/75 font-medium">
            <p>® 2025 Nexeus all rights reserved.</p>
            <div className="flex items-center gap-7">
              <a href="#" aria-label="LinkedIn" className="hover:opacity-75 transition-opacity text-white">
                <svg viewBox="0 0 30 30" className="size-6" fill="currentColor">
                  <path d="M24,4H6C4.895,4,4,4.895,4,6v18c0,1.105,0.895,2,2,2h18c1.105,0,2-0.895,2-2V6C26,4.895,25.105,4,24,4z M10.954,22h-3.66 v-10.74h3.66V22z M9.124,9.81c-1.173,0-2.124-0.954-2.124-2.124c0-1.173,0.951-2.124,2.124-2.124s2.124,0.951,2.124,2.124 C11.248,8.856,10.297,9.81,9.124,9.81z M22.716,22h-3.659v-5.727c0-1.366-0.026-3.123-1.902-3.123 c-1.905,0-2.197,1.488-2.197,3.024V22h-3.66v-10.74h3.513v1.468h0.049c0.489-0.927,1.685-1.905,3.468-1.905 c3.709,0,4.394,2.441,4.394,5.617V22z"/>
                </svg>
              </a>
              <a href="#" aria-label="GitHub" className="hover:opacity-75 transition-opacity text-white">
                <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
                  <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
                </svg>
              </a>
              <a href="#" aria-label="Medium" className="hover:opacity-75 transition-opacity text-white">
                <svg viewBox="0 0 1043.63 592.71" className="h-4 w-auto" fill="currentColor">
                  <path d="M588.67 296.36c0 163.67-131.78 296.35-294.33 296.35S0 460.03 0 296.36 131.78 0 294.34 0s294.33 132.69 294.33 296.36M911.56 296.36c0 154.06-65.89 279-147.17 279s-147.17-124.94-147.17-279 65.88-279 147.16-279 147.17 124.9 147.17 279M1043.63 296.36c0 138-23.17 249.94-51.76 249.94s-51.75-111.91-51.75-249.94 23.17-249.94 51.75-249.94 51.76 111.9 51.76 249.94"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
