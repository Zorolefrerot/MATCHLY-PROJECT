import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';

/**
 * Top laser scroll progress bar (60fps GPU spring)
 */
export const ScrollProgressBar: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 right-0 left-0 z-50 h-[3px] origin-left bg-gradient-to-r from-[#0A4DFF] via-sky-400 to-emerald-400"
    />
  );
};

/**
 * Progressive scroll-triggered section / block reveal
 */
export const RevealOnScroll: React.FC<{
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'scale';
  className?: string;
}> = ({ children, delay = 0, direction = 'up', className = '' }) => {
  const initialOffset =
    direction === 'up'
      ? { opacity: 0, y: 38 }
      : direction === 'left'
        ? { opacity: 0, x: -42 }
        : direction === 'right'
          ? { opacity: 0, x: 42 }
          : { opacity: 0, scale: 0.93 };

  return (
    <motion.div
      initial={initialOffset}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.62,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Stagger container & items for cascading cards on scroll
 */
export const StaggerGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-50px' }}
    variants={{
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.09,
        },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 28, scale: 0.97 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * Scroll-linked 3D Parallax Phone Stage
 */
export const ParallaxPhoneStage: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [24, -28]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [6, 0, -4]);

  return (
    <div ref={ref} style={{ perspective: 1100 }} className={className}>
      <motion.div style={{ y, rotateX }}>{children}</motion.div>
    </div>
  );
};

/**
 * Smooth rolling counter triggered when scrolled into view
 */
export const AnimatedCounter: React.FC<{
  target: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
}> = ({ target, prefix = '', suffix = '', durationMs = 1300 }) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    let raf = 0;

    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min(1, (ts - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {val.toLocaleString('fr-FR')}
      {suffix}
    </span>
  );
};
