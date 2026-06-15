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
    refs.renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

    const animate = () => {
      if (refs.uniforms) (refs.uniforms.time.value as number) += 0.01;
      if (refs.renderer && refs.scene && refs.camera) {
        refs.renderer.render(refs.scene, refs.camera);
      }
      refs.animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (refs.animationId) cancelAnimationFrame(refs.animationId);
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
