"use client";

import dynamic from "next/dynamic";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "3px solid rgba(255,107,53,0.2)",
          borderTopColor: "#FF6B35",
          animation: "spin 0.8s linear infinite",
        }}
      />
    </div>
  ),
});

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <div className={`spline-wrapper ${className ?? ""}`}>
      <Spline scene={scene} />
    </div>
  );
}
