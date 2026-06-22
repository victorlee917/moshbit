"use client";

import { useEffect, useRef } from "react";

/* ---------------------------------------------------------------------------
   MoshBit — an ASCII mosh pit. A dense crowd of bodies churns in a circle pit:
   they swirl, shove, and slam into each other. Collisions flare acid; on the
   beat the whole pit bursts open then collapses back into the knot. Rendered as
   a live monospace density field — the more bodies pile into a cell, the heavier
   its glyph runs from '.' up to '█'.
--------------------------------------------------------------------------- */

const HOT = "#f4ffc4"; // white-hot — the peak of the friction charge / detonation
const ACID = "#d4fb0a";
const BONE = "#ededea";
const SMOKE = "#76736c";
const DIM = "#46443f";

// a continuous temperature ramp: dim crowd → bone → fluorescent → white-hot.
// Cells are coloured by interpolating along it, so heat shifts smoothly (no hard
// tier jumps) as the core charges and as the blast cools back down.
const GRAD = [DIM, SMOKE, BONE, ACID, HOT];
function lerpHex(a: string, b: string, t: number) {
  const ai = parseInt(a.slice(1), 16);
  const bi = parseInt(b.slice(1), 16);
  const r = Math.round((ai >> 16) + (((bi >> 16) - (ai >> 16)) * t));
  const g = Math.round(((ai >> 8) & 255) + ((((bi >> 8) & 255) - ((ai >> 8) & 255)) * t));
  const bl = Math.round((ai & 255) + (((bi & 255) - (ai & 255)) * t));
  return "#" + (0x1000000 + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}
const LUT_N = 32;
const LUT = Array.from({ length: LUT_N }, (_, i) => {
  const x = (i / (LUT_N - 1)) * (GRAD.length - 1);
  const s = Math.min(GRAD.length - 2, Math.floor(x));
  return lerpHex(GRAD[s], GRAD[s + 1], x - s);
});

// density ramp, light → heavy (a space is handled separately for empty cells).
// no solid '█' block at the top — a packed cell stays textured, never a hard square
const RAMP = [".", ":", "-", "+", "*", "o", "O", "8", "#", "@"];

const FONT_PX = 14;
const LINE_PX = 14;
const SLAM_PERIOD = 6400; // ms between centre-slams (independent of the swirl)

type Mosher = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  e: number; // energy — spikes on a slam, decays back down
};

export default function MoshBit() {
  const elRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // resolve the real monospace font so the measured char width is exact
    const family = getComputedStyle(el).fontFamily || "monospace";
    const meter = document.createElement("canvas").getContext("2d")!;
    meter.font = `${FONT_PX}px ${family}`;
    const charW = meter.measureText("M").width || FONT_PX * 0.6;

    let cols = 0;
    let rows = 0;
    let moshers: Mosher[] = [];
    let density = new Float32Array(0);
    let energy = new Float32Array(0);
    let raf = 0;
    let prev = performance.now();

    function build() {
      const rect = el!.getBoundingClientRect();
      cols = Math.max(8, Math.floor(rect.width / charW));
      rows = Math.max(8, Math.floor(rect.height / LINE_PX));
      density = new Float32Array(cols * rows);
      energy = new Float32Array(cols * rows);

      const n = Math.min(240, Math.max(40, Math.floor((cols * rows) / 16)));
      const cx = cols / 2;
      const cy = rows / 2;
      moshers = [];
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random());
        moshers.push({
          x: cx + Math.cos(a) * r * cols * 0.4,
          y: cy + Math.sin(a) * r * rows * 0.4,
          vx: 0,
          vy: 0,
          e: 0,
        });
      }
    }

    function step(t: number, dt: number) {
      const cx = cols / 2;
      const cy = rows / 2;
      const rx = cols * 0.44;
      const ry = rows * 0.44;
      const reach = Math.min(rx, ry); // scale for the friction-heat front

      // musical dynamics: a steady churn under the slam cycle below
      const swell = (Math.sin(t * 0.0009) + 1) / 2;
      const swirlDir = Math.sin(t * 0.00013) > 0 ? 1 : -1; // pit occasionally reverses

      // slam cycle: gather (accelerating) → crush & hold → one sharp pop → coast back
      const cyc = (t % SLAM_PERIOD) / SLAM_PERIOD;
      let radial: number; // <0 pulls in, >0 blasts out
      let compress = 0; // 0..1 — how far the pressure has built
      if (cyc < 0.45) {
        const k = cyc / 0.45; // 0 → 1 across the gather
        compress = k * k; // ease-in: starts gently, then accelerates inward
        radial = -0.55 * compress;
      } else if (cyc < 0.5) {
        compress = 1; // crush & hold — the knot packs tight, pressure peaks
        radial = -0.6;
      } else if (cyc < 0.53) {
        radial = 0.55; // 펑 — one short sharp impulse, then ballistic
      } else {
        radial = 0; // coast outward and ease back on the spring
      }

      const swirlI = 0.4 + 0.5 * swell + compress * 0.6; // swirl spins up as it packs
      const shoveI = 0.35 + 0.4 * swell; // calm shove → the burst stays clean & radial

      const n = moshers.length;
      for (let i = 0; i < n; i++) {
        const p = moshers[i];
        const ox = p.x - cx;
        const oy = p.y - cy;
        const d = Math.hypot(ox, oy) || 1e-3;

        // swirl — spins up as the crowd compresses, twisting it like a 꽈배기
        const swirl = 0.05 * swirlI * swirlDir * (1 + compress * 2.5);
        let ax = (-oy / d) * swirl;
        let ay = (ox / d) * swirl;

        // the slam: pull hard to the centre, then blast outward at the critical point
        ax += (ox / d) * radial;
        ay += (oy / d) * radial;

        // the pit's pull — only past the rim (rr > 1). A linear spring (∝ distance,
        // not distance³) so the bodies ease back in smoothly instead of snapping.
        const rr = (ox * ox) / (rx * rx) + (oy * oy) / (ry * ry);
        if (rr > 1) {
          const pull = 0.045 * (Math.sqrt(rr) - 1);
          ax -= (ox / d) * pull;
          ay -= (oy / d) * pull;
        }

        // random shoving
        ax += (Math.random() - 0.5) * 0.1 * shoveI;
        ay += (Math.random() - 0.5) * 0.1 * shoveI;

        p.vx = (p.vx + ax) * 0.86;
        p.vy = (p.vy + ay) * 0.86;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // no walls — on the explosion the bodies fly clear off the panel; the
        // pit's pull (the containment above) is what reels them back in
        // friction heat: as the crowd packs, heat ignites at the centre and the hot
        // front spreads outward, ramping the core all the way to white-hot at peak
        // compression. After the pop the heat is simply carried out and cools.
        const nd = d / reach;
        p.e = Math.max(p.e, Math.min(1, (compress * 1.1 - nd) * 1.1));
        p.e *= 0.86;
      }

      // collisions — the actual moshing. Bodies that meet shove apart.
      for (let i = 0; i < n; i++) {
        const a = moshers[i];
        for (let j = i + 1; j < n; j++) {
          const b = moshers[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 1.6 && d2 > 1e-4) {
            const d = Math.sqrt(d2);
            const push = (1.4 - d) * 0.35; // softer → the crowd can pack tighter
            const ux = dx / d;
            const uy = dy / d;
            a.vx -= ux * push; a.vy -= uy * push;
            b.vx += ux * push; b.vy += uy * push;
            // collisions shove the bodies (the mosh) but don't light them — glow
            // comes only from the compression charge and the detonation flash, so
            // no stray bits flare and fade out of sync after the burst
          }
        }
      }
    }

    function rasterize() {
      density.fill(0);
      energy.fill(0);
      const splat = (cxp: number, cyp: number, e: number, w: number) => {
        if (cxp < 0 || cyp < 0 || cxp >= cols || cyp >= rows) return;
        const k = cyp * cols + cxp;
        density[k] += w;
        if (e > energy[k]) energy[k] = e;
      };
      for (const p of moshers) {
        const cxp = Math.round(p.x);
        const cyp = Math.round(p.y);
        splat(cxp, cyp, p.e, 1);
        splat(cxp - 1, cyp, p.e, 0.4);
        splat(cxp + 1, cyp, p.e, 0.4);
        splat(cxp, cyp - 1, p.e, 0.4);
        splat(cxp, cyp + 1, p.e, 0.4);
      }
    }

    function draw() {
      rasterize();
      const parts: string[] = [];
      for (let r = 0; r < rows; r++) {
        let curColor = "";
        let buf = "";
        const flush = () => {
          if (buf) {
            parts.push(`<span style="color:${curColor}">${buf}</span>`);
            buf = "";
          }
        };
        for (let c = 0; c < cols; c++) {
          const k = r * cols + c;
          const d = density[k];
          if (d < 0.2) {
            flush();
            parts.push(" ");
            continue;
          }
          const e = energy[k];
          // glyph follows density only → the clump tightens smoothly, no sudden swap
          const glyph = RAMP[Math.min(RAMP.length - 1, Math.floor((d - 0.2) * 1.6))];
          // density sets the cool crowd tone (dim → bone); heat lifts it on up the
          // ramp. But only a DENSE cell can reach white-hot — a sparse cell (the
          // thinning blast edge) tops out at fluorescent, so the expanding shell
          // never flips to white, it just cools acid → bone.
          const dPart = Math.min(0.5, (d - 0.2) * 0.16);
          const m = Math.min(1, dPart + e * (0.75 - 0.5 * dPart));
          const color = LUT[Math.round(m * (LUT_N - 1))];
          if (color !== curColor) {
            flush();
            curColor = color;
          }
          buf += glyph;
        }
        flush();
        parts.push("\n");
      }
      el!.innerHTML = parts.join("");
    }

    function loop(now: number) {
      const dt = Math.min(2.2, (now - prev) / 16.67);
      prev = now;
      step(now, dt);
      draw();
      raf = requestAnimationFrame(loop);
    }

    function start() {
      cancelAnimationFrame(raf);
      build();
      if (reduced) {
        // settle into a calm packed pit, then hold one frame
        for (let i = 0; i < 240; i++) step(i * 16.67, 1);
        draw();
      } else {
        prev = performance.now();
        raf = requestAnimationFrame(loop);
      }
    }

    start();
    const ro = new ResizeObserver(start);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <pre
      ref={elRef}
      aria-hidden
      className="absolute inset-0 overflow-hidden select-none"
      style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: `${FONT_PX}px`,
        lineHeight: `${LINE_PX}px`,
        letterSpacing: 0,
        margin: 0,
        whiteSpace: "pre",
      }}
    />
  );
}
