"use client";

import { useEffect, useRef } from "react";

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    let disposed = false;
    let app: { dispose?: () => void } | null = null;

    const init = async () => {
      const { Application } = await import("@splinetool/runtime");
      if (disposed) return;

      // Set pixel dimensions from the rendered wrapper size
      const { offsetWidth, offsetHeight } = wrapper;
      canvas.width = offsetWidth || 600;
      canvas.height = offsetHeight || 520;

      app = new Application(canvas);
      await (app as unknown as { load(url: string): Promise<void> }).load(
        scene,
      );
    };

    init();

    return () => {
      disposed = true;
      app?.dispose?.();
    };
  }, [scene]);

  return (
    <div ref={wrapperRef} className={className} style={{ overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
