"use client";

import {
  Shader,
  Swirl,
  ChromaFlow,
  FlutedGlass,
  FilmGrain,
} from "shaders/react";

interface Props {
  accent: string;
}

export default function MenuHeroShader({ accent }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <Shader style={{ width: "100%", height: "100%" }}>
        <Swirl colorA={accent} colorB={accent} detail={1.3} />
        <ChromaFlow
          baseColor={accent}
          upColor={accent}
          downColor={accent}
          leftColor="#000000"
          rightColor="#ffffff"
          momentum={9}
          radius={3}
        />
        <FlutedGlass
          aberration={0.35}
          angle={18}
          frequency={5}
          highlight={0.07}
          highlightSoftness={0}
          lightAngle={-90}
          refraction={2.5}
          shape="rounded"
          softness={1}
          speed={0.09}
        />
        <FilmGrain strength={0.032} />
      </Shader>
    </div>
  );
}
