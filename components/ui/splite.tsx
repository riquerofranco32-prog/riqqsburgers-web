"use client";

import { useEffect, useRef } from "react";

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let app: {
      dispose?: () => void;
      setSize?: (w: number, h: number) => void;
    } | null = null;

    const { width, height } = container.getBoundingClientRect();
    canvas.width = width || 600;
    canvas.height = height || 520;

    import("@splinetool/runtime").then(({ Application }) => {
      if (!canvasRef.current) return;
      app = new Application(canvas);
      (app as { load: (url: string) => void }).load(scene);
    });

    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      canvas.width = w;
      canvas.height = h;
      app?.setSize?.(w, h);
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      app?.dispose?.();
    };
  }, [scene]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative" }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
