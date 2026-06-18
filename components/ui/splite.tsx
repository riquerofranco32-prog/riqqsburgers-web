"use client";

import { useEffect, useRef } from "react";

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let app: { dispose?: () => void } | null = null;

    import("@splinetool/runtime").then(({ Application }) => {
      if (!canvasRef.current) return;
      app = new Application(canvasRef.current);
      (app as { load: (url: string) => void }).load(scene);
    });

    return () => {
      app?.dispose?.();
    };
  }, [scene]);

  return <canvas ref={canvasRef} className={className} />;
}
