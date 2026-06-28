import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({
  children,
  className = '',
  glow = 'none', // 'none' | 'primary' | 'secondary' | 'success' | 'danger'
  hover = true,
  onClick
}) => {
  const glowClasses = {
    none: 'border-glassBorder',
    primary: 'glass-glow-primary',
    secondary: 'glass-glow-secondary',
    success: 'glass-glow-success',
    danger: 'glass-glow-danger'
  };

  const cardVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    hover: hover ? {
      y: -4,
      borderColor: glow === 'none' ? 'rgba(0, 229, 255, 0.2)' : undefined,
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(123, 97, 255, 0.1)',
      transition: { duration: 0.2, ease: 'easeOut' }
    } : {}
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={hover ? "hover" : undefined}
      onClick={onClick}
      className={`glass rounded-2xl p-6 backdrop-blur-md overflow-hidden relative radial-bg-glow ${onClick ? 'cursor-pointer' : ''} ${glowClasses[glow]} ${className}`}
    >
      {/* Glow Overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none opacity-40" />
      {children}
    </motion.div>
  );
};

export default GlassCard;
