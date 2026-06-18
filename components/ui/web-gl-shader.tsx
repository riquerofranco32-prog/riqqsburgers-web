"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface WebGLShaderProps {
  className?: string;
  xScale?: number;
  yScale?: number;
  distortion?: number;
}

export function WebGLShader({
  className = "absolute inset-0 w-full h-full block",
  xScale = 1.0,
  yScale = 0.5,
  distortion = 0.05,
}: WebGLShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.OrthographicCamera | null;
    renderer: THREE.WebGLRenderer | null;
    mesh: THREE.Mesh | null;
    uniforms: Record<string, { value: unknown }> | null;
    animationId: number | null;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    mesh: null,
    uniforms: null,
    animationId: null,
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const refs = sceneRef.current;

    const vertexShader = `
      attribute vec3 position;
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float distortion;

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

        float d = length(p) * distortion;

        float rx = p.x * (1.0 + d);
        float gx = p.x;
        float bx = p.x * (1.0 - d);

        float r = 0.05 / abs(p.y + sin((rx + time) * xScale) * yScale);
        float g = 0.05 / abs(p.y + sin((gx + time) * xScale) * yScale);
        float b = 0.05 / abs(p.y + sin((bx + time) * xScale) * yScale);

        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `;

    refs.scene = new THREE.Scene();
    refs.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      powerPreference: "low-power", // hint GPU to use integrated graphics
    });
    // Cap at 1x — the shader is decorative, no need for retina resolution
    refs.renderer.setPixelRatio(1);
    refs.renderer.setClearColor(new THREE.Color(0x000000));
    refs.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1);

    refs.uniforms = {
      resolution: { value: [canvas.offsetWidth, canvas.offsetHeight] },
      time: { value: 0.0 },
      xScale: { value: xScale },
      yScale: { value: yScale },
      distortion: { value: distortion },
    };

    const positions = new THREE.BufferAttribute(
      new Float32Array([
        -1, -1, 0, 1, -1, 0, -1, 1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0,
      ]),
      3,
    );
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", positions);

    const material = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: refs.uniforms,
      side: THREE.DoubleSide,
    });

    refs.mesh = new THREE.Mesh(geometry, material);
    refs.scene.add(refs.mesh);

    const handleResize = () => {
      if (!refs.renderer || !refs.uniforms || !canvas) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      refs.renderer.setSize(w, h, false);
      (refs.uniforms.resolution.value as number[]) = [w, h];
    };

    handleResize();

    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);

    // Throttle to ~30fps — shader is decorative, 60fps is overkill
    let frame = 0;
    let isVisible = true;
    const animate = () => {
      if (!isVisible) {
        refs.animationId = null;
        return; // stop the loop when off-screen
      }
      refs.animationId = requestAnimationFrame(animate);
      frame++;
      if (frame % 2 !== 0) return; // skip every other frame → ~30fps
      if (refs.uniforms) (refs.uniforms.time.value as number) += 0.02;
      if (refs.renderer && refs.scene && refs.camera) {
        refs.renderer.render(refs.scene, refs.camera);
      }
    };
    animate();


    // Pause rAF completely when shader is off-screen — eliminates scroll lag
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        // Resume animation loop when coming back into view
        if (isVisible && !refs.animationId) {
          animate();
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    return () => {
      if (refs.animationId) cancelAnimationFrame(refs.animationId);
      refs.animationId = null;
      io.disconnect();
      ro.disconnect();
      if (refs.mesh) {
        refs.scene?.remove(refs.mesh);
        refs.mesh.geometry.dispose();
        if (refs.mesh.material instanceof THREE.Material) {
          refs.mesh.material.dispose();
        }
      }
      refs.renderer?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}
