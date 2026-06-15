"use client";

import { useEffect, useRef } from "react";

// ── Aurora config ────────────────────────────────────────────────────────────
// Takefyy brand palette
const COLORS = [
  { r: 255, g: 107, b: 53 },  // #FF6B35 — accent orange
  { r: 201, g: 74,  b: 26 },  // #c94a1a — deep orange
  { r: 255, g: 140, b: 90 },  // #ff8c5a — light orange
  { r: 180, g: 40,  b: 10 },  // dark ember
  { r: 120, g: 20,  b: 5  },  // deep red glow
];

interface AuroraLayer {
  colorIdx: number;
  speed: number;
  amplitude: number;
  wavelength: number;
  yOffset: number;
  phase: number;
  thickness: number;
  opacity: number;
}

function createLayers(): AuroraLayer[] {
  return [
    { colorIdx: 0, speed: 0.00018, amplitude: 0.18, wavelength: 1.4, yOffset: 0.25, phase: 0,    thickness: 0.28, opacity: 0.45 },
    { colorIdx: 1, speed: 0.00013, amplitude: 0.22, wavelength: 1.8, yOffset: 0.50, phase: 1.2,  thickness: 0.32, opacity: 0.35 },
    { colorIdx: 2, speed: 0.00022, amplitude: 0.14, wavelength: 2.2, yOffset: 0.35, phase: 2.5,  thickness: 0.22, opacity: 0.30 },
    { colorIdx: 3, speed: 0.00010, amplitude: 0.26, wavelength: 1.6, yOffset: 0.65, phase: 4.1,  thickness: 0.38, opacity: 0.25 },
    { colorIdx: 4, speed: 0.00016, amplitude: 0.16, wavelength: 2.8, yOffset: 0.20, phase: 5.8,  thickness: 0.20, opacity: 0.20 },
  ];
}

// ── Noise helper (smooth pseudo-noise via sine harmonics) ────────────────────
function smoothNoise(x: number, t: number, phase: number): number {
  return (
    Math.sin(x * 1.1 + t + phase) * 0.50 +
    Math.sin(x * 2.3 - t * 1.3 + phase * 1.7) * 0.25 +
    Math.sin(x * 0.7 + t * 0.8 - phase * 0.4) * 0.15 +
    Math.sin(x * 3.1 + t * 0.5 + phase * 2.1) * 0.10
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function HeroShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const layers = createLayers();
    let startTime = performance.now();

    // ── Resize ───────────────────────────────────────────────────────────────
    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── Mouse tracking ───────────────────────────────────────────────────────
    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top)  / rect.height,
      };
    }
    canvas.addEventListener("mousemove", onMouseMove);

    // ── Draw ─────────────────────────────────────────────────────────────────
    function draw() {
      if (!canvas || !ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      const t = (performance.now() - startTime) * 0.001;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Dark base
      ctx.fillStyle = "#0E1116";
      ctx.fillRect(0, 0, W, H);

      // Mouse radial glow (subtle warm spot)
      const gx = mx * W;
      const gy = my * H;
      const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, W * 0.55);
      gr.addColorStop(0,   "rgba(255,107,53,0.08)");
      gr.addColorStop(0.5, "rgba(201, 74, 26,0.04)");
      gr.addColorStop(1,   "transparent");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);

      // ── Aurora layers ──────────────────────────────────────────────────────
      const SLICES = Math.ceil(W / 3); // horizontal resolution

      for (const layer of layers) {
        const col = COLORS[layer.colorIdx];
        const layerT = t * layer.speed * 1000; // scaled time per layer

        // Build vertical profile: for each x column, compute y center of band
        const points: { x: number; yCenter: number }[] = [];
        for (let i = 0; i <= SLICES; i++) {
          const xNorm = i / SLICES;
          const xPx = xNorm * W;

          // Mouse influence: pull band toward mouse
          const distX = xNorm - mx;
          const pull = Math.exp(-distX * distX * 8) * (my - layer.yOffset) * 0.18;

          const noise = smoothNoise(xNorm * Math.PI * layer.wavelength, layerT, layer.phase);
          const yCenter = (layer.yOffset + pull + noise * layer.amplitude) * H;

          points.push({ x: xPx, yCenter });
        }

        const halfThick = layer.thickness * H * 0.5;

        // Draw gradient band using a path + linear gradient
        for (let i = 0; i < points.length - 1; i++) {
          const p0 = points[i];
          const p1 = points[i + 1];
          const yMid = (p0.yCenter + p1.yCenter) / 2;

          const grad = ctx.createLinearGradient(p0.x, yMid - halfThick, p0.x, yMid + halfThick);
          grad.addColorStop(0,   `rgba(${col.r},${col.g},${col.b},0)`);
          grad.addColorStop(0.3, `rgba(${col.r},${col.g},${col.b},${(layer.opacity * 0.8).toFixed(3)})`);
          grad.addColorStop(0.5, `rgba(${col.r},${col.g},${col.b},${layer.opacity.toFixed(3)})`);
          grad.addColorStop(0.7, `rgba(${col.r},${col.g},${col.b},${(layer.opacity * 0.8).toFixed(3)})`);
          grad.addColorStop(1,   `rgba(${col.r},${col.g},${col.b},0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.rect(p0.x, yMid - halfThick, p1.x - p0.x + 1, halfThick * 2);
          ctx.fill();
        }
      }

      // ── Top & bottom dark vignette ─────────────────────────────────────────
      const topGrad = ctx.createLinearGradient(0, 0, 0, H * 0.35);
      topGrad.addColorStop(0, "rgba(14,17,22,0.92)");
      topGrad.addColorStop(1, "transparent");
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, W, H * 0.35);

      const botGrad = ctx.createLinearGradient(0, H * 0.65, 0, H);
      botGrad.addColorStop(0, "transparent");
      botGrad.addColorStop(1, "rgba(14,17,22,0.95)");
      ctx.fillStyle = botGrad;
      ctx.fillRect(0, H * 0.65, W, H * 0.35);

      // ── Side vignettes ─────────────────────────────────────────────────────
      const leftG = ctx.createLinearGradient(0, 0, W * 0.18, 0);
      leftG.addColorStop(0, "rgba(14,17,22,0.7)");
      leftG.addColorStop(1, "transparent");
      ctx.fillStyle = leftG;
      ctx.fillRect(0, 0, W * 0.18, H);

      const rightG = ctx.createLinearGradient(W * 0.82, 0, W, 0);
      rightG.addColorStop(0, "transparent");
      rightG.addColorStop(1, "rgba(14,17,22,0.7)");
      ctx.fillStyle = rightG;
      ctx.fillRect(W * 0.82, 0, W * 0.18, H);

      // ── Film grain overlay ─────────────────────────────────────────────────
      // (lightweight: every ~3 frames at reduced res for perf)
      if (Math.floor(t * 30) % 3 === 0) {
        const grainStrength = 0.025;
        const imgData = ctx.getImageData(0, 0, W, H);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const n = (Math.random() - 0.5) * grainStrength * 255;
          data[i]     = Math.min(255, Math.max(0, data[i]     + n));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
        }
        ctx.putImageData(imgData, 0, 0);
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
