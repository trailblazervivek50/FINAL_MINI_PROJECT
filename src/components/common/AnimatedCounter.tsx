import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number; // default: 350ms as per Section 7
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * useAnimatedNumber Hook
 * Uses requestAnimationFrame with cubic ease-out: 1 - (1 - progress)^3
 * Respects prefers-reduced-motion.
 */
export function useAnimatedNumber(
  endValue: number,
  duration = 350,
  decimals = 0
): number {
  const [displayValue, setDisplayValue] = useState<number>(endValue);
  const startValueRef = useRef<number>(endValue);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(endValue);
      startValueRef.current = endValue;
      return;
    }

    const startVal = startValueRef.current;
    if (startVal === endValue) return;

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const rawProgress = Math.min(elapsed / duration, 1);

      // Section 7 Formula: cubic ease-out: 1 - (1 - progress)^3
      const easeProgress = 1 - Math.pow(1 - rawProgress, 3);
      const current = startVal + (endValue - startVal) * easeProgress;

      const factor = Math.pow(10, decimals);
      setDisplayValue(Math.round(current * factor) / factor);

      if (rawProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        startValueRef.current = endValue;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [endValue, duration, decimals]);

  return displayValue;
}

/**
 * AnimatedCounter Component
 * Renders smooth animated counting numbers formatted for KPI cards.
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 350,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const animated = useAnimatedNumber(value, duration, decimals);

  const formattedNumber = decimals > 0
    ? animated.toFixed(decimals)
    : Math.round(animated).toLocaleString();

  return (
    <span className={className}>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
};
