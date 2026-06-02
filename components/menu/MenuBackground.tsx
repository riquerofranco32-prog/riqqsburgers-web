"use client";

import { useEffect, useRef, useState } from "react";

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "").padEnd(6, "0");
  return {
    r: parseInt(clean.slice(0, 2), 16) || 255,
    g: parseInt(clean.slice(2, 4), 16) || 107,
    b: parseInt(clean.slice(4, 6), 16) || 53,
  };
}

type Props = {
  accentColor?: string;
};

export default function MenuBackground({ accentColor = "#FF6B35" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useCss, setUseCss] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setUseCss(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const accent = hexToRgb(accentColor);
    const warm: RGB = { r: 251, g: 191, b: 36 };
    const peach: RGB = { r: 254, g: 215, b: 170 };

    let animId: number;
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    // Blobs defined as fractions of viewport — recomputed on each frame
    const blobs: Array<{
      ox: number;
      oy: number;
      r: number;
      sp: number;
      ph: number;
      a: number;
      c: RGB;
    }> = [
      { ox: 0.15, oy: 0.1, r: 180, sp: 0.00035, ph: 0.0, a: 0.07, c: accent },
      { ox: 0.85, oy: 0.25, r: 220, sp: 0.00025, ph: 2.1, a: 0.05, c: accent },
      { ox: 0.5, oy: 0.55, r: 260, sp: 0.0002, ph: 4.2, a: 0.04, c: warm },
      { ox: 0.1, oy: 0.75, r: 190, sp: 0.0004, ph: 1.0, a: 0.05, c: accent },
      { ox: 0.88, oy: 0.82, r: 200, sp: 0.0003, ph: 3.3, a: 0.04, c: peach },
    ];

    let t = 0;

    function tick() {
      ctx!.clearRect(0, 0, w, h);

      for (const b of blobs) {
        const ox = Math.sin(t * b.sp * 1000 + b.ph) * 40;
        const oy = Math.cos(t * b.sp * 800 + b.ph) * 30;
        const pulse = 1 + Math.sin(t * b.sp * 600 + b.ph) * 0.08;

        const x = b.ox * w + ox;
        const y = b.oy * h + oy;
        const r = b.r * pulse;

        const grad = ctx!.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${b.c.r},${b.c.g},${b.c.b},${b.a})`);
        grad.addColorStop(0.5, `rgba(${b.c.r},${b.c.g},${b.c.b},${b.a * 0.5})`);
        grad.addColorStop(1, `rgba(${b.c.r},${b.c.g},${b.c.b},0)`);

        ctx!.beginPath();
        ctx!.arc(x, y, r, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();
      }

      t++;
      animId = requestAnimationFrame(tick);
    }

    tick();

    function onResize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w;
      canvas!.height = h;
    }
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, [accentColor]);

  if (useCss) {
    return (
      <div aria-hidden="true">
        <div
          className="menu-blob menu-blob-1"
          style={{ "--blob-color": accentColor } as React.CSSProperties}
        />
        <div
          className="menu-blob menu-blob-2"
          style={{ "--blob-color": accentColor } as React.CSSProperties}
        />
        <div className="menu-blob menu-blob-3" />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}
