import React from 'react';

export default function ProgressBar({ percent, label, color = '#6B46C1', showLabel = true, size = 'md' }) {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3' };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-text-muted">{label}</span>}
          <span className="text-xs font-semibold text-text-primary ml-auto">{percent}%</span>
        </div>
      )}
      <div className={`w-full bg-white/10 rounded-full ${heights[size]} overflow-hidden`}>
        <div
          className={`${heights[size]} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
