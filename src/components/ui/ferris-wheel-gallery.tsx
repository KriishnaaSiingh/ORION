"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, ChevronDown, ImageIcon, Pause, Play } from "lucide-react";

export interface FerrisWheelItem {
  id?: string;
  src: string;
  alt: string;
  title: string;
  year?: string | number;
  discipline?: string;
}

type DivProps = React.ComponentProps<"div">;

export interface FerrisWheelGalleryProps extends DivProps {
  items: FerrisWheelItem[];
  /** Zero-based item index. Omit to let the gallery own its selection. */
  active?: number;
  defaultActive?: number;
  onActiveChange?: (index: number) => void;
  /** Physical direction when moving to the next item. */
  direction?: "cw" | "ccw";
  /** Opt in only where wanted. Input or focus pauses automatic rotation. */
  autoplay?: boolean;
  interval?: number;
  ref?: DivProps["ref"];
}

const TURN_MS = 650;
const SWAY_MS = 340;

function wrap(index: number, total: number) {
  return total > 0 ? ((Math.trunc(Number.isFinite(index) ? index : 0) % total) + total) % total : 0;
}

function Photo({ item, thumbnail = false }: { item: FerrisWheelItem; thumbnail?: boolean }) {
  const [failed, setFailed] = React.useState("");
  const [loading, setLoading] = React.useState("");
  const [shown, setShown] = React.useState("");
  const image = React.useRef(null as HTMLImageElement | null);
  React.useLayoutEffect(() => {
    const node = image.current;
    if (node && !(node.complete && node.naturalWidth > 0)) setLoading(item.src);
  }, [item.src]);
  const pending = loading === item.src && shown !== item.src && failed !== item.src;
  return (
    <>
      {pending && <span aria-hidden="true" data-photo-skeleton className="absolute inset-0 bg-muted/30 motion-safe:animate-pulse" />}
      {failed !== item.src && (
        <img
          ref={image}
          src={item.src}
          alt={thumbnail ? "" : item.alt}
          draggable={false}
          onLoad={() => setShown(item.src)}
          onError={() => setFailed(item.src)}
          data-photo-state={pending ? "loading" : "ready"}
          className={`absolute inset-0 size-full object-cover ${pending ? "opacity-0" : loading === item.src ? "opacity-100 transition-opacity duration-500 motion-reduce:transition-none" : ""}`}
        />
      )}
      {failed === item.src && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/5 text-white/50" role={thumbnail ? undefined : "img"} aria-label={thumbnail ? undefined : `${item.alt} — image unavailable`}>
          <ImageIcon className={thumbnail ? "size-4" : "size-6"} aria-hidden="true" />
          {!thumbnail && <span className="text-xs">Image unavailable</span>}
        </span>
      )}
    </>
  );
}

/** A vertical wheel with upright gondolas. Remote image URLs are supplied by the host. */
export function FerrisWheelGallery({
  items,
  active,
  defaultActive = 0,
  onActiveChange,
  direction = "cw",
  autoplay = true,
  interval = 3200,
  className,
  ref,
  onKeyDown,
  onFocusCapture,
  ...rest
}: FerrisWheelGalleryProps) {
  const total = items.length;
  const [localActive, setLocalActive] = React.useState(() => wrap(defaultActive, total));
  const selected = wrap(active ?? localActive, total);
  const sign = direction === "cw" ? 1 : -1;
  const slot = total > 0 ? 360 / total : 0;
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [phase, setPhase] = React.useState("idle");
  const [view, setView] = React.useState(() => ({ index: selected, previous: selected }));
  const [announcement, setAnnouncement] = React.useState("");
  const initialAngle = React.useRef(selected * slot * sign);
  const angle = React.useRef(initialAngle.current);
  const wheelRef = React.useRef(null as HTMLDivElement | null);
  const stageRef = React.useRef(null as HTMLDivElement | null);
  const counters = React.useRef([] as (HTMLDivElement | null)[]);
  const gondolas = React.useRef([] as (HTMLDivElement | null)[]);
  const photoRef = React.useRef(null as HTMLDivElement | null);
  const previousRef = React.useRef(null as HTMLDivElement | null);
  const captionRef = React.useRef(null as HTMLDivElement | null);
  const command = React.useRef(null as ((index: number) => void) | null);
  const requestRef = React.useRef(null as ((index: number, user?: boolean) => void) | null);
  const drag = React.useRef(null as { id: number; x: number; y: number; captured: boolean } | null);
  const suppressClickUntil = React.useRef(0);
  const latest = React.useRef({ selected, active, onActiveChange, items });
  latest.current = { selected, active, onActiveChange, items };
  const labelId = React.useId();
  const helpId = React.useId();

  React.useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  React.useLayoutEffect(() => {
    let shown = latest.current.selected;
    let target = shown;
    let frame = 0;
    let sways: Animation[] = [];
    let settleTimer = 0;
    let disposed = false;

    const paint = (value: number) => {
      angle.current = value;
      if (wheelRef.current) wheelRef.current.style.transform = `rotate(${value}deg)`;
      counters.current.forEach((node) => {
        if (node) node.style.transform = `rotate(${-value}deg)`;
      });
    };
    const stopSway = () => {
      window.clearTimeout(settleTimer);
      sways.forEach((animation) => animation.cancel());
      sways = [];
    };
    const sway = (turn: number) => {
      const swing = [0, -2.6, 0, 1.7, 0, -0.9, 0, 0.35, 0];
      sways = gondolas.current.flatMap((node) => node ? [node.animate(
        swing.map((value) => ({ transform: `rotate(${value * turn}deg)` })),
        { duration: SWAY_MS, easing: "ease-in-out" },
      )] : []);
      setPhase("settling");
      settleTimer = window.setTimeout(() => { if (!disposed) setPhase("idle"); }, SWAY_MS);
    };
    const announce = () => {
      const item = latest.current.items[shown];
      if (item) setAnnouncement(`${shown + 1} of ${total}: ${item.title}`);
    };
    const begin = () => {
      if (shown === target || total < 2) return;
      stopSway();
      let distance = wrap(target - shown, total);
      if (distance > total / 2) distance -= total;
      const step = Math.sign(distance);
      const next = wrap(shown + step, total);
      const from = angle.current;
      const to = from + step * slot * sign;
      const started = performance.now();
      setView({ index: next, previous: shown });
      setPhase("turning");
      const tick = (now: number) => {
        const progress = Math.min(1, (now - started) / TURN_MS);
        const tail = progress - 1;
        const spring = 1 + 2.2 * tail ** 3 + 1.2 * tail ** 2;
        paint(from + (to - from) * spring);
        if (progress < 1) {
          frame = requestAnimationFrame(tick);
          return;
        }
        frame = 0;
        paint(to);
        shown = next;
        if (shown !== target) begin();
        else { announce(); sway(step * sign); }
      };
      frame = requestAnimationFrame(tick);
    };
    paint(shown * slot * sign);
    setView({ index: shown, previous: shown });
    setPhase("idle");
    command.current = (index) => {
      target = wrap(index, total);
      if (reducedMotion) {
        cancelAnimationFrame(frame);
        frame = 0;
        stopSway();
        shown = target;
        paint(shown * slot * sign);
        setView({ index: shown, previous: shown });
        setPhase("idle");
        announce();
      } else if (!frame) begin();
    };
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      stopSway();
      command.current = null;
    };
  }, [total, slot, sign, reducedMotion]);

  React.useLayoutEffect(() => { command.current?.(selected); }, [selected, total, direction, reducedMotion]);

  React.useLayoutEffect(() => {
    if (reducedMotion || view.index === view.previous) return;
    const options = { duration: 360, easing: "ease-out" };
    const fades = [
      photoRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], options),
      previousRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], options),
      captionRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], options),
    ];
    return () => fades.forEach((animation) => animation?.cancel());
  }, [view, reducedMotion]);

  const request = (index: number, user = true) => {
    if (user) setPaused(true);
    const next = wrap(index, total);
    if (next === latest.current.selected || total < 2) return;
    if (latest.current.active === undefined) setLocalActive(next);
    latest.current.onActiveChange?.(next);
  };
  requestRef.current = request;

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage || total < 2) return;
    let lastWheel = -Infinity;
    let amount = 0;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastWheel < TURN_MS + 80) return;
      amount += (Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1);
      if (Math.abs(amount) < 14) return;
      requestRef.current?.(latest.current.selected + Math.sign(amount));
      amount = 0;
      lastWheel = now;
    };
    stage.addEventListener("wheel", wheel, { passive: false });
    return () => stage.removeEventListener("wheel", wheel);
  }, [total]);

  React.useEffect(() => {
    if (!autoplay || paused || reducedMotion || total < 2) return;
    const delay = Number.isFinite(interval) ? Math.max(TURN_MS + SWAY_MS, interval) : 3200;
    const timer = window.setInterval(() => requestRef.current?.(latest.current.selected + 1, false), delay);
    return () => window.clearInterval(timer);
  }, [autoplay, paused, reducedMotion, total, interval]);

  const current = items[wrap(view.index, total)];
  const previous = items[wrap(view.previous, total)];
  const focusRing = "outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

  return (
    <div
      {...rest}
      ref={ref}
      data-ferris-gallery
      data-active={selected}
      data-visible={view.index}
      data-phase={phase}
      data-reduced-motion={reducedMotion}
      className={`@container/ferris w-full text-white ${className ?? ""}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={rest["aria-label"] ?? "Ferris wheel image gallery"}
      onFocusCapture={(event) => { onFocusCapture?.(event); if (!event.defaultPrevented && !(event.target instanceof Element && event.target.closest("[data-autoplay-control]"))) setPaused(true); }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          request(selected + (event.key === "ArrowRight" ? 1 : -1));
        }
      }}
    >
      {!current ? <div className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-white/20 text-sm text-white/50" role="status">Add capabilities to start collection.</div> : (
        <div className="grid items-center gap-6 @min-[600px]/ferris:grid-cols-[1.5fr_1.1fr] @min-[900px]/ferris:gap-12">
          <div>
            <div
              ref={stageRef}
              data-wheel-stage
              tabIndex={0}
              aria-label="Browse the collection"
              aria-describedby={helpId}
              className={`relative mx-auto w-full max-w-[380px] select-none overflow-hidden rounded-3xl pb-4 @min-[600px]/ferris:max-w-none ${focusRing}`}
              style={{ touchAction: "none" }}
              onPointerDown={(event) => {
                if (!event.isPrimary || event.button !== 0) return;
                setPaused(true);
                drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, captured: false };
              }}
              onPointerMove={(event) => {
                const start = drag.current;
                if (!start || start.id !== event.pointerId) return;
                if (!start.captured && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  start.captured = true;
                }
              }}
              onPointerUp={(event) => {
                const start = drag.current;
                drag.current = null;
                if (!start || start.id !== event.pointerId) return;
                if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                const x = event.clientX - start.x;
                const y = event.clientY - start.y;
                const delta = Math.abs(x) >= Math.abs(y) ? x : y;
                if (start.captured) suppressClickUntil.current = performance.now() + 300;
                if (Math.abs(delta) >= 30) request(selected - Math.sign(delta));
              }}
              onPointerCancel={() => { drag.current = null; }}
              onLostPointerCapture={() => { drag.current = null; }}
            >
              <div className="relative aspect-square">
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-1 text-white/50">
                  <span className="text-[10px] font-medium tracking-[0.22em] text-orange-400">ACTIVE CORE</span>
                  <ChevronDown className="size-3 text-orange-400" />
                </div>
                <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full text-white/10" viewBox="0 0 400 400" fill="none">
                  <path d="M200 184 146 362M200 184 254 362M124 362H276" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <div ref={wheelRef} data-wheel className="absolute left-[17%] top-[13%] size-[66%] rounded-full border-2 border-white/20" style={{ transform: `rotate(${initialAngle.current}deg)` }}>
                  <div aria-hidden="true" className="absolute inset-[6%] rounded-full border border-white/10" />
                  {Array.from({ length: 24 }, (_, light) => (
                    <span key={`light-${light}`} aria-hidden="true" data-rim-light className="absolute size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400/80" style={{ left: `${50 + Math.sin(light * Math.PI / 12) * 50}%`, top: `${50 - Math.cos(light * Math.PI / 12) * 50}%` }} />
                  ))}
                  {items.map((item, index) => {
                    const radians = -sign * index * slot * Math.PI / 180;
                    const isActive = index === view.index;
                    return (
                      <React.Fragment key={`${item.id ?? item.src}-${index}`}>
                        <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-px w-1/2 origin-left bg-white/15" style={{ transform: `rotate(${-90 - sign * index * slot}deg)` }} />
                        <div data-gondola-anchor={index} className="absolute z-10 w-[35%]" style={{ left: `${50 + Math.sin(radians) * 50}%`, top: `${50 - Math.cos(radians) * 50}%`, zIndex: isActive ? 20 : 10 }}>
                          <div ref={(node) => { counters.current[index] = node; }} data-counter={index} className="relative origin-top-left" style={{ transform: `rotate(${-initialAngle.current}deg)` }}>
                            <div className="absolute left-0 top-0 w-full -translate-x-1/2">
                              <div ref={(node) => { gondolas.current[index] = node; }} data-pendulum={index} className="relative origin-top">
                                <span aria-hidden="true" className="mx-auto block h-2.5 w-0.5 rounded-full bg-white/30" />
                                <button
                                  type="button"
                                  data-gondola={index}
                                  aria-label={`View ${item.title}, ${index + 1} of ${total}`}
                                  aria-current={isActive ? "true" : undefined}
                                  aria-controls={labelId}
                                  onClick={() => { if (performance.now() >= suppressClickUntil.current) request(index); }}
                                  className={`relative block w-full rounded-xl border bg-[#14151e]/90 p-1.5 shadow-md ${isActive ? "border-orange-500 ring-2 ring-orange-500/30" : "border-white/15 hover:border-white/40"} ${focusRing}`}
                                  style={{ transform: `scale(${isActive ? 1.12 : 1})`, transition: reducedMotion ? "none" : "transform 320ms ease" }}
                                >
                                  <span className="relative block aspect-[1.4] overflow-hidden rounded-lg bg-black/40"><Photo item={item} thumbnail /></span>
                                  <span aria-hidden="true" className={`mt-1.5 block text-center font-mono text-[10px] leading-none ${isActive ? "text-orange-400 font-bold" : "text-white/60"}`}>{String(index + 1).padStart(2, "0")}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
                <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[46%] flex size-[19%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-white/20 bg-[#161722] shadow-xl">
                  <span className="font-mono text-lg font-light leading-none tracking-tight text-white">{String(total).padStart(2, "0")}</span>
                  <span className="mt-1 text-[9px] font-medium leading-none tracking-[0.14em] text-orange-400">NODES</span>
                </div>
              </div>
            </div>
            <p id={helpId} className="mt-1 text-center text-[11px] tracking-wide text-white/50">Drag wheel to orbit <span aria-hidden="true" className="px-1.5 text-white/20">/</span> Scroll or arrow keys</p>
          </div>
          <div data-detail-panel id={labelId} className="grid grid-cols-[1.35fr_1fr] items-center gap-5 @min-[600px]/ferris:grid-cols-1 @min-[600px]/ferris:gap-6">
            <div className="relative aspect-[1.6] min-w-0 overflow-hidden rounded-2xl bg-black/50 border border-white/15 @min-[600px]/ferris:aspect-[1.3] shadow-2xl">
              {previous && view.previous !== view.index && <div ref={previousRef} data-previous-photo aria-hidden="true" className="absolute inset-0" style={{ opacity: 0 }}><Photo item={previous} /></div>}
              <div ref={photoRef} data-current-photo className="absolute inset-0"><Photo item={current} /></div>
              <span aria-hidden="true" className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
            </div>
            <div className="min-w-0">
              <div ref={captionRef} data-caption>
                <p className="mb-2 border-l-2 border-orange-500 pl-2.5 font-mono text-[11px] font-semibold tracking-wider text-orange-400">SUBSYSTEM {String(view.index + 1).padStart(2, "0")}</p>
                <h3 className="text-xl font-medium leading-tight tracking-tight text-white @min-[600px]/ferris:text-2xl @min-[900px]/ferris:text-3xl">{current.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-white/70">{[current.discipline, current.year].filter((value) => value !== undefined && value !== "").join(" · ")}</p>
              </div>
              <div className="mt-5 flex items-center gap-2.5 @min-[600px]/ferris:mt-6">
                <button type="button" data-previous aria-label="Previous capability" disabled={total < 2} onClick={() => request(selected - 1)} className={`flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 hover:bg-white/15 disabled:opacity-40 text-white ${focusRing}`}><ArrowLeft className="size-4" aria-hidden="true" /></button>
                <button type="button" data-next aria-label="Next capability" disabled={total < 2} onClick={() => request(selected + 1)} className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 ${focusRing}`}><ArrowRight className="size-4" aria-hidden="true" /></button>
                <span aria-hidden="true" className="ml-auto font-mono text-xs tabular-nums text-white/60">{String(view.index + 1).padStart(2, "0")}<span className="px-1 text-white/25">/</span>{String(total).padStart(2, "0")}</span>
                {autoplay && !reducedMotion && total > 1 && <button data-autoplay-control type="button" aria-label={paused ? "Resume rotation" : "Pause rotation"} onClick={() => setPaused(!paused)} className={`flex size-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white ${focusRing}`}>{paused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}</button>}
              </div>
            </div>
          </div>
        </div>
      )}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</span>
    </div>
  );
}

export default FerrisWheelGallery;

