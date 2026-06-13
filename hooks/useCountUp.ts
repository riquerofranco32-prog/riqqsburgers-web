import { useState, useEffect, useRef } from "react";

export function useCountUp(
  target: number,
  duration = 800,
  enabled = true,
): number {
  const [current, setCurrent] = useState(enabled ? 0 : target);
  const currentRef = useRef(current);

  // Sync ref with the current state
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    if (!enabled) return;

    const startValue = currentRef.current;
    const endValue = target;

    if (startValue === endValue) return;

    let startTime: number | undefined;
    let frameId: number;

    const animate = (timestamp: number) => {
      if (startTime === undefined) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextVal = Math.round(startValue + (endValue - startValue) * eased);
      setCurrent(nextVal);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [target, duration, enabled]);

  // Sync target directly ONLY on initial mount if disabled
  const firstMount = useRef(true);
  useEffect(() => {
    if (!enabled && firstMount.current) {
      setCurrent(target);
      firstMount.current = false;
    }
  }, [target, enabled]);

  return current;
}
