'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  onComplete?: () => void;
}

export default function AnimatedNumber({
  value,
  duration = 1200,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  onComplete,
}: AnimatedNumberProps) {
  const targetNum = typeof value === 'number' && !isNaN(value) ? value : 0;
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef<number>(0);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // If reduced motion is requested, render target instantly
    if (prefersReducedMotion) {
      setDisplayValue(targetNum);
      prevValueRef.current = targetNum;
      if (onComplete) onComplete();
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    let animFrameId: number;

    const runAnimation = (startVal: number, endVal: number) => {
      let startTimestamp: number | null = null;

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic: 1 - (1 - progress)^3
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const current = startVal + (endVal - startVal) * easedProgress;

        setDisplayValue(current);

        if (progress < 1) {
          animFrameId = requestAnimationFrame(step);
        } else {
          setDisplayValue(endVal);
          prevValueRef.current = endVal;
          if (onComplete) onComplete();
        }
      };

      animFrameId = requestAnimationFrame(step);
    };

    // If already animated once, smoothly transition from previous value to new target
    if (hasAnimated) {
      if (prevValueRef.current !== targetNum) {
        runAnimation(prevValueRef.current, targetNum);
      }
      return () => cancelAnimationFrame(animFrameId);
    }

    // First time entrance: wait until element intersects viewport
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          runAnimation(0, targetNum);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animFrameId);
    };
  }, [targetNum, duration, hasAnimated, prefersReducedMotion]);

  // Format numbers with thousands separators
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const finalFormatted = `${prefix}${formatNumber(targetNum)}${suffix}`;
  const currentFormatted = `${prefix}${formatNumber(displayValue)}${suffix}`;

  return (
    <span ref={containerRef} className={`inline-block select-none ${className}`}>
      {/* Screen reader announces final value once */}
      <span className="sr-only">{finalFormatted}</span>
      {/* Visual animating digits */}
      <span aria-hidden="true" className="tabular-nums font-inherit">
        {currentFormatted}
      </span>
    </span>
  );
}
