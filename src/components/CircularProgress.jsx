import React from 'react';
import { motion } from 'framer-motion';

const CircularProgress = ({ value = 0, size = 160, strokeWidth = 12 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  // Determine dynamic colors based on score thresholds
  // 0-40: High Risk (Danger: #FF5C7A)
  // 41-70: Moderate (Warning: #FFC857)
  // 71-100: Excellent (Success: #00FF94)
  let color = '#00FF94'; // Success
  let glowColor = 'rgba(0, 255, 148, 0.4)';
  let riskLabel = 'EXCELLENT';
  let labelColor = 'text-success';

  if (value <= 40) {
    color = '#FF5C7A'; // Danger
    glowColor = 'rgba(255, 92, 122, 0.4)';
    riskLabel = 'HIGH RISK';
    labelColor = 'text-danger';
  } else if (value <= 70) {
    color = '#FFC857'; // Warning
    glowColor = 'rgba(255, 200, 87, 0.4)';
    riskLabel = 'MODERATE';
    labelColor = 'text-warning';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Track Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              strokeLinecap: 'round',
              filter: `drop-shadow(0 0 6px ${glowColor})`
            }}
          />
        </svg>

        {/* Floating Percentage inside the circle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-3xl font-extrabold tracking-tight text-white"
          >
            {value}
          </motion.span>
          <span className="text-[10px] font-semibold text-slate-400 mt-0.5 tracking-wider">
            GROWTH INDEX
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className={`mt-4 px-3 py-1 rounded-full border text-[11px] font-bold tracking-widest bg-slate-950/40 border-white/5 ${labelColor}`}
      >
        {riskLabel}
      </motion.div>
    </div>
  );
};

export default CircularProgress;
