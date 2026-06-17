"use client";

import { useEffect, useRef } from "react";

/* ---------------------------------------------------------------------------
   MoshBit — abstract bits that gather into a dense knot at the centre, then
   scatter out to fill the field, and back again. A slow, breathing mosh: the
   bits converging on the pit and bursting apart. Snapped to a grid so each
   particle reads as a crisp pixel, not a blurred dot.
--------------------------------------------------------------------------- */

// per-pixel palette (no background fill — the pixels carry all the colour).
// weighted: mostly bone/smoke, a few accents. Kept opaque so overlapping
// pixels never build up into a coloured haze.
const PALETTE = [
  "#ededea", // bone
  "#ededea",
  "#ededea",
  "#ededea",
  "#76736c", // smoke
  "#76736c",
  "#76736c",
  "#d4fb0a", // acid accent
  "#6f7bff", // cool violet accent
  "#ff8a3d", // warm amber accent
];

const CELL = 7; // grid size each pixel snaps to
const COUNT = 220; // number of pixels
const PERIOD = 7200; // ms for one full gather→scatter→gather cycle

type Px = {
  angle: number; // direction from centre
  fieldR: number; // radius when fully scattered (0..1 of field)
  coreR: number; // radius when gathered (tight knot)
  size: number; // 1 or 2 cells
  delay: number; // phase offset → ripple in/out instead of lockstep
  spin: number; // slow per-pixel rotation
  color: string; // fixed colour for this pixel
  jx: number; // current jitter
  jy: number;
};

function rand(seed: { v: number }) {
  seed.v = (seed.v * 1664525 + 1013904223) % 4294967296;
  return seed.v / 4294967296;
}

// ease-in-out so the pixels linger at the gathered and scattered extremes
function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function MoshBit() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (!ctx) return;
    const cv: HTMLCanvasElement = canvas;
    const g: CanvasRenderingContext2D = ctx;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let pixels: Px[] = [];
    let raf = 0;
    let start = performance.now();

    const snap = (n: number) => Math.round(n / CELL) * CELL;

    function build() {
      const rect = cv.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.floor(width * dpr);
      cv.height = Math.floor(height * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.imageSmoothingEnabled = false;

      const seed = { v: 73219 };
      pixels = [];
      for (let i = 0; i < COUNT; i++) {
        const r = Math.sqrt(rand(seed)); // even areal spread, not centre-heavy
        pixels.push({
          angle: rand(seed) * Math.PI * 2,
          fieldR: 0.18 + r * 0.82,
          coreR: rand(seed) * 0.06,
          size: rand(seed) < 0.22 ? 2 : 1,
          delay: r * 1.1, // outer pixels lag → ripple
          spin: (rand(seed) - 0.5) * 0.0006,
          color: PALETTE[Math.floor(rand(seed) * PALETTE.length)],
          jx: 0,
          jy: 0,
        });
      }
    }

    function render(t: number) {
      // no background fill — keep the canvas transparent so only pixels show
      g.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const reach = Math.min(width, height) * 0.42;

      // global breathing: 0 = gathered knot, 1 = scattered field
      const base = (Math.sin((t / PERIOD) * Math.PI * 2) + 1) / 2;

      for (const p of pixels) {
        // each pixel's own gather/scatter, phase-shifted for the ripple
        const local = ease(
          Math.max(0, Math.min(1, (base - p.delay * 0.18) / (1 - 0.18) + 0))
        );
        const r = (p.coreR + (p.fieldR - p.coreR) * local) * reach;
        const ang = p.angle + t * p.spin;

        // shimmer: agitated in the knot, calm when spread
        const shimmer = 1 - local;
        p.jx += (Math.random() - 0.5) * shimmer * 2.2;
        p.jy += (Math.random() - 0.5) * shimmer * 2.2;
        p.jx *= 0.8;
        p.jy *= 0.8;

        const x = snap(cx + Math.cos(ang) * r + p.jx);
        const y = snap(cy + Math.sin(ang) * r + p.jy);

        // opaque pixels — no alpha blending, so no coloured haze builds up
        g.fillStyle = p.color;
        const s = p.size * CELL;
        g.fillRect(x, y, s, s);
      }
      g.globalAlpha = 1;
    }

    function loop(now: number) {
      render(now - start);
      raf = requestAnimationFrame(loop);
    }

    build();
    if (reduced) {
      render(PERIOD * 0.5); // a settled mid-state frame
    } else {
      start = performance.now();
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      build();
      if (reduced) {
        render(PERIOD * 0.5);
      } else {
        start = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    ro.observe(cv);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
