import React, { useEffect, useState, useRef } from 'react';

interface TelemetryHighlightProps {
  value: string | number;
  durationMs?: number; // 300–600ms as per Section 8
  className?: string;
  children: React.ReactNode;
}

/**
 * TelemetryHighlight Component (Section 8 & 31)
 * Subtly highlights changed telemetry values with soft purple (#F1EDFF)
 * for 450ms then smoothly fades away without flashing or shaking the entire card.
 */
export const TelemetryHighlight: React.FC<TelemetryHighlightProps> = ({
  value,
  durationMs = 450,
  className = '',
  children,
}) => {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const prevValueRef = useRef(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setIsHighlighted(true);

      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, durationMs);

      return () => clearTimeout(timer);
    }
  }, [value, durationMs]);

  return (
    <span
      className={`inline-block transition-colors duration-300 rounded px-1 py-0.5 ${
        isHighlighted
          ? 'bg-[#E8F4FF] text-[#1687D9] font-extrabold ring-1 ring-[#1687D9]/30'
          : 'bg-transparent'
      } ${className}`}
    >
      {children}
    </span>
  );
};
