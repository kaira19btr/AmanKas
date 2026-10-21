/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  formatNumber?: boolean; // Indonesian thousand separator (.)
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 900,
  decimals = 0,
  prefix = '',
  suffix = '',
  formatNumber = true,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const prevValueRef = useRef<number>(value);
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = value;

    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    setIsAnimating(true);
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startVal + (endVal - startVal) * ease;

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endVal);
        prevValueRef.current = endVal;
        setIsAnimating(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [value, duration]);

  // Format the numerical value
  const formattedNumber = () => {
    let numStr = displayValue.toFixed(decimals);

    if (formatNumber) {
      const parts = numStr.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      if (parts[1]) {
        numStr = `${parts[0]},${parts[1]}`;
      } else {
        numStr = parts[0];
      }
    }

    return numStr;
  };

  return (
    <span
      className={`font-mono-tabular transition-colors duration-300 ${
        isAnimating ? 'text-[#009770]' : ''
      } ${className}`}
    >
      {prefix}
      {formattedNumber()}
      {suffix}
    </span>
  );
};
