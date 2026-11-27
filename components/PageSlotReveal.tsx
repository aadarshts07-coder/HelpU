'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export interface PageSlotRevealProps {
  children: React.ReactNode;
  pageTitle?: string;
  className?: string;
}

export default function PageSlotReveal({
  children,
  pageTitle,
  className = '',
}: PageSlotRevealProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [originY, setOriginY] = useState<number>(140);
  const [animating, setAnimating] = useState<boolean>(true);
  const [announcedTitle, setAnnouncedTitle] = useState<string>('');

  useEffect(() => {
    // 1. Read origin Y from shared window object or event
    if (typeof window !== 'undefined') {
      const storedY = (window as any).__HELP_U_SLOT_Y__;
      const initialY = typeof storedY === 'number' && storedY > 0 ? storedY : 140;
      setOriginY(initialY);
      document.documentElement.style.setProperty('--slot-origin-y', `${initialY}px`);
    }

    setAnimating(true);
    const timer = setTimeout(() => {
      setAnimating(false);
    }, 450);

    // 2. Accessibility: Announce page load and move focus to h1
    if (pageTitle) {
      setAnnouncedTitle(`${pageTitle} loaded`);
    }

    const focusTimer = setTimeout(() => {
      if (containerRef.current) {
        const heading = containerRef.current.querySelector<HTMLElement>('h1, h2');
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus({ preventScroll: true });
        }
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      clearTimeout(focusTimer);
    };
  }, [pathname, pageTitle]);

  // Listen to live slot-open events from sidebar clicks
  useEffect(() => {
    const handleSlotOpen = (e: any) => {
      if (e.detail?.y) {
        setOriginY(e.detail.y);
        document.documentElement.style.setProperty('--slot-origin-y', `${e.detail.y}px`);
      }
    };

    window.addEventListener('help-u-slot-open', handleSlotOpen);
    return () => window.removeEventListener('help-u-slot-open', handleSlotOpen);
  }, []);

  return (
    <div
      ref={containerRef}
      key={pathname}
      className={`relative flex-1 w-full min-w-0 ${
        animating ? 'animate-slot-reveal' : ''
      } ${className}`}
      style={{
        ['--slot-origin-y' as any]: `${originY}px`,
      }}
    >
      {/* Subtle Indigo Edge Glow at Slot Origin Vertex */}
      {animating && (
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-2.5 pointer-events-none z-30 animate-slot-edge-glow"
          style={{
            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.45), rgba(168, 85, 247, 0.2), transparent)',
            filter: 'blur(2px)',
          }}
        />
      )}

      {/* Screen Reader Live Route Announcement */}
      <div className="sr-only" aria-live="polite">
        {announcedTitle}
      </div>

      {children}
    </div>
  );
}
