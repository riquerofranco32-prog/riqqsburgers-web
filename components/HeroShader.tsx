"use client";

import { WebGLShader } from "@/components/ui/web-gl-shader";

export default function HeroShader() {
  return (
    <WebGLShader
      className="absolute inset-0 w-full h-full block pointer-events-none opacity-30"
      xScale={1.0}
      yScale={0.5}
      distortion={0.05}
    />
  );
}
