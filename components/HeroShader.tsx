"use client";

import { WebGLShader } from "@/components/ui/web-gl-shader";

export default function HeroShader() {
  return (
    <WebGLShader
      className="absolute inset-0 w-full h-full block pointer-events-none opacity-25"
      xScale={1.2}
      yScale={0.45}
      distortion={0.04}
    />
  );
}
