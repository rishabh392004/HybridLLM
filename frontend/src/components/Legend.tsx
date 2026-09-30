import React from 'react';
import { WeatherParameter } from '../api/types';

interface LegendProps {
  parameter: WeatherParameter;
  className?: string;
}

export const Legend: React.FC<LegendProps> = ({ parameter, className = '' }) => {
  const getSteps = () => {
    switch (parameter) {
      case 'rainfall':
        return [
          { color: '#2dd4bf', label: '< 15', sub: 'Light / Normal' },
          { color: '#eab308', label: '15 - 64', sub: 'Moderate' },
          { color: '#f97316', label: '65 - 115', sub: 'Heavy' },
          { color: '#ef4444', label: '> 115 mm', sub: 'Extremely Severe' },
        ];
      case 'temperature':
        return [
          { color: '#2dd4bf', label: '< 32°', sub: 'Comfortable' },
          { color: '#eab308', label: '32 - 38°', sub: 'Warm' },
          { color: '#f97316', label: '38 - 42°', sub: 'Heatwave' },
          { color: '#ef4444', label: '> 42°C', sub: 'Extreme Heat' },
        ];
      case 'wind':
        return [
          { color: '#2dd4bf', label: '< 30', sub: 'Breeze' },
          { color: '#eab308', label: '30 - 45', sub: 'Moderate' },
          { color: '#f97316', label: '45 - 65', sub: 'Squall' },
          { color: '#ef4444', label: '> 65 km/h', sub: 'Gale / Storm' },
        ];
    }
  };

  const steps = getSteps();

  return (
    <div
      className={`glass-panel p-3 rounded-xl border border-border/80 text-xs shadow-lg backdrop-blur-md ${className}`}
      aria-label="Meteorological intensity color scale legend"
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Intensity Scale
        </span>
        <span className="text-[10px] text-accent font-medium">Adaptive NWP Scale</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 min-w-[240px]">
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center text-center">
            <div
              className="w-full h-2.5 rounded-sm mb-1.5 shadow-sm"
              style={{ backgroundColor: step.color }}
            />
            <span className="font-semibold text-text-primary text-[11px]">{step.label}</span>
            <span className="text-[9px] text-text-muted">{step.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
