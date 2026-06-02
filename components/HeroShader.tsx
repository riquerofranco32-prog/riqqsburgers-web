"use client";

import {
  Shader,
  Swirl,
  ChromaFlow,
  FlutedGlass,
  FilmGrain,
} from "shaders/react";

export default function HeroShader() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Shader style={{ width: "100%", height: "100%" }}>
        <Swirl colorA="#0E1116" colorB="#1a1f2e" detail={1.4} />
        <ChromaFlow
          baseColor="#0a0d14"
          upColor="#FF6B35"
          downColor="#c94a1a"
          leftColor="#1a0d08"
          rightColor="#ff8c5a"
          momentum={10}
          radius={3}
        />
        <FlutedGlass
          aberration={0.4}
          angle={20}
          frequency={6}
          highlight={0.06}
          highlightSoftness={0}
          lightAngle={-90}
          refraction={3}
          shape="rounded"
          softness={1}
          speed={0.1}
        />
        <FilmGrain strength={0.04} />
      </Shader>
    </div>
  );
}
