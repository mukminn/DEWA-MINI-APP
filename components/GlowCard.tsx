'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'yellow' | 'orange' | 'red';
}

export function GlowCard({ children, className = '', glowColor = 'blue' }: GlowCardProps) {
  const glowClass = {
    blue: 'glow-blue',
    yellow: 'glow-yellow',
    orange: 'glow-orange',
    red: 'glow-red',
  }[glowColor];

  return (
    <motion.div
      className={`glass-card rounded-3xl p-6 ${glowClass} ${className}`}
      whileHover={{ scale: 1.02, rotateX: 5, rotateY: 5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
    >
      {children}
    </motion.div>
  );
}


