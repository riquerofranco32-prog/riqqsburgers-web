import { useState, useEffect, useRef } from "react";

export function useCountUp(
  target: number,
  duration = 800,
  enabled = true,
): number {
  const [current, setCurrent] = useState(enabled ? 0 : target);
  const frameRef = useRef<number>();
  const startRef = useRef<number>();

  useEffect(() => {
    if (!enabled || target === 0) {
      setCurrent(target);
      return;
    }
    startRef.current = undefined;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, enabled]);

  return current;
}
