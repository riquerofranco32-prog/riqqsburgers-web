"use client";

import dynamic from "next/dynamic";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => null,
});

interface SplineSceneProps {
  scene: string;
  className?: string;
  onLoad?: () => void;
}

export function SplineScene({ scene, className, onLoad }: SplineSceneProps) {
  return (
    <div
      className={`spline-wrapper ${className ?? ""}`}
      style={{ willChange: "transform" }}
    >
      <Spline scene={scene} onLoad={onLoad} />
    </div>
  );
}
