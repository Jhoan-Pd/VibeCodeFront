"use client";

import { useEffect, useRef } from "react";
import { PaperPlane } from "@/components/motion/paper-plane";
import { frameAt, wordMasks } from "@/lib/flight-path";

const FLIGHT_MS = 1800;

/**
 * A word of the title that changes when a paper plane crosses it: the plane enters at the top left,
 * dives to the word and goes through it; the old word is erased behind it and the new one appears,
 * slightly blurred.
 *
 * - The path and the masks are pure functions in lib/flight-path.ts.
 * - Every layer is as wide as the longest word, so the masks line up and the title does not jump.
 * - Screen readers only read the first word (the animated layers and the plane are aria-hidden).
 * - With "reduce motion" on there is no plane and the word does not change.
 */
export function RotatingWord({ words, intervalMs = 3200 }: { words: string[]; intervalMs?: number }) {
  const box = useRef<HTMLSpanElement | null>(null);
  const plane = useRef<HTMLSpanElement | null>(null);
  const layers = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (words.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let current = 0;
    let frame = 0;
    let timer: ReturnType<typeof setTimeout>;

    const setMask = (layer: HTMLSpanElement | null | undefined, value: string) => {
      if (!layer) return;
      layer.style.maskImage = value;
      layer.style.webkitMaskImage = value;
    };

    const fly = () => {
      const next = (current + 1) % words.length;
      const leaving = layers.current[current];
      const entering = layers.current[next];
      const el = box.current;
      const p = plane.current;
      if (!el || !p || !leaving || !entering) return;

      const { width, height } = el.getBoundingClientRect();
      const size = p.getBoundingClientRect();
      entering.style.opacity = "1";
      const start = performance.now();

      const step = (now: number) => {
        const f = Math.min((now - start) / FLIGHT_MS, 1);
        const c = frameAt(f);

        // Plane: pixel position from word units.
        const px = c.x * width - size.width / 2;
        const py = c.y * height - size.height / 2;
        p.style.opacity = c.opacity.toFixed(3);
        p.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) rotate(${c.angle.toFixed(1)}deg) scaleY(${c.bank.toFixed(3)})`;

        // Words: the old one is erased behind the plane, the new one appears blurred and sharpens.
        const m = wordMasks(c.x);
        setMask(leaving, m.leaving);
        setMask(entering, m.entering);
        const progress = Math.min(Math.max(c.x, 0), 1);
        entering.style.filter = `blur(${((1 - progress) * 4).toFixed(2)}px)`;
        leaving.style.filter = `blur(${(progress * 3).toFixed(2)}px)`;

        if (f < 1) {
          frame = requestAnimationFrame(step);
          return;
        }
        // Clean final state: only the new word, no masks nor blur.
        p.style.opacity = "0";
        leaving.style.opacity = "0";
        for (const layer of [leaving, entering]) {
          setMask(layer, "none");
          layer.style.filter = "none";
        }
        current = next;
        timer = setTimeout(fly, intervalMs);
      };
      frame = requestAnimationFrame(step);
    };

    timer = setTimeout(fly, intervalMs);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [words.length, intervalMs]);

  return (
    <span ref={box} className="relative inline-block">
      <span className="sr-only">{words[0]}</span>
      <span className="vd-morph" aria-hidden="true">
        {words.map((w, i) => (
          <span
            key={w}
            ref={(el) => {
              layers.current[i] = el;
            }}
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            {w}
          </span>
        ))}
      </span>
      <PaperPlane ref={plane} className="vd-plane" />
    </span>
  );
}
