"use client";

import { useEffect, useRef, useState } from "react";
import { messages } from "@/i18n";
import { LOCALE } from "@/lib/utils";

export interface ScorePoint {
  attemptedAt: string;
  scorePercent: number;
  title: string;
}

const t = messages.progress.chart;
const HEIGHT = 220;
const MARGIN = { top: 16, right: 16, bottom: 28, left: 48 };
const shortDate = new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "short" });
const time = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" });

/**
 * Quiz score over time (a single series: the card title names it, no legend).
 * Hand-made SVG: 2 px line, 8 px markers, faint grid, a reference line at the pass mark and a vertical
 * guide with a tooltip on hover (or keyboard focus).
 */
export function ScoreChart({ points, passMark }: { points: ScorePoint[]; passMark: number }) {
  const ref = useRef<HTMLDivElement>(null);
  // The width is measured in the browser: until then the height is reserved (no overflow on phones).
  const [measured, setMeasured] = useState<number | null>(null);
  const width = measured ?? 0;
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setMeasured(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const x = (i: number) => MARGIN.left + (points.length === 1 ? plotWidth / 2 : (i / (points.length - 1)) * plotWidth);
  const y = (p: number) => MARGIN.top + (1 - p / 100) * plotHeight;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.scorePercent).toFixed(1)}`).join(" ");

  // X labels: first, last and a few in between without overlapping (~90 px apart).
  const step = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(plotWidth / 90))));
  const xLabels = points.map((_, i) => i).filter((i) => i === 0 || i === points.length - 1 || (i % step === 0 && points.length - 1 - i >= step / 2));

  // When every attempt is from the same day the X axis shows the time (otherwise all labels would match).
  const sameDay = points.length > 1 && new Set(points.map((p) => shortDate.format(new Date(p.attemptedAt)))).size === 1;
  const xLabel = (iso: string) => (sameDay ? time : shortDate).format(new Date(iso));

  const nearest = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || points.length === 0) return null;
    const px = clientX - rect.left;
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    return best;
  };

  const a = active != null ? points[active] : null;

  if (measured == null) return <div ref={ref} className="w-full" style={{ height: HEIGHT }} aria-hidden />;

  return (
    <div ref={ref} className="relative w-full">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={t.ariaLabel(points.length, points[0]?.scorePercent ?? 0, points.at(-1)?.scorePercent ?? 0)}
        className="block touch-none select-none"
        onPointerMove={(e) => setActive(nearest(e.clientX))}
        onPointerLeave={() => setActive(null)}
      >
        {/* Faint grid and Y axis */}
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth={1} />
            <text x={MARGIN.left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
              {v} %
            </text>
          </g>
        ))}
        {/* Pass mark */}
        <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(passMark)} y2={y(passMark)} className="stroke-muted-foreground/60" strokeWidth={1} strokeDasharray="4 4" />
        <text x={width - MARGIN.right} y={y(passMark) - 6} textAnchor="end" className="fill-muted-foreground text-[11px]">
          {t.passMark(passMark)}
        </text>

        {/* Vertical guide of the active point */}
        {a && <line x1={x(active!)} x2={x(active!)} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} className="stroke-muted-foreground/50" strokeWidth={1} />}

        {/* Series */}
        {points.length > 1 && <path d={path} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.scorePercent)}
            r={active === i ? 5 : 4}
            className="fill-primary stroke-card"
            strokeWidth={2}
            tabIndex={0}
            aria-label={t.point(shortDate.format(new Date(p.attemptedAt)), p.scorePercent, p.title)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
          />
        ))}

        {/* X axis */}
        {xLabels.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={HEIGHT - 8}
            textAnchor={i === 0 && points.length > 1 ? "start" : i === points.length - 1 && points.length > 1 ? "end" : "middle"}
            className="fill-muted-foreground text-[11px]"
          >
            {xLabel(points[i].attemptedAt)}
          </text>
        ))}
      </svg>

      {a && (
        <div
          className="pointer-events-none absolute z-10 w-max max-w-[220px] -translate-x-1/2 -translate-y-full rounded-md border bg-card px-3 py-2 text-xs shadow-md"
          style={{ left: Math.min(Math.max(x(active!), 110), width - 110), top: y(a.scorePercent) - 10 }}
          role="status"
        >
          <p className="font-semibold tabular-nums text-foreground">{a.scorePercent} %</p>
          <p className="line-clamp-2 text-muted-foreground">{a.title}</p>
          <p className="text-muted-foreground">
            {shortDate.format(new Date(a.attemptedAt))} · {time.format(new Date(a.attemptedAt))}
          </p>
        </div>
      )}
    </div>
  );
}
