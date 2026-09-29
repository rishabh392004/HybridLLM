import React from 'react';
import { WeatherParameter } from '../api/types';
import { CloudRain, Thermometer, Wind } from 'lucide-react';

interface ParameterToggleProps {
  parameter: WeatherParameter;
  onChange: (param: WeatherParameter) => void;
  className?: string;
}

export const ParameterToggle: React.FC<ParameterToggleProps> = ({
  parameter,
  onChange,
  className = '',
}) => {
  const options: { id: WeatherParameter; label: string; unit: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'rainfall', label: 'Rainfall', unit: 'mm/day', icon: CloudRain },
    { id: 'temperature', label: 'Temperature', unit: '°C', icon: Thermometer },
    { id: 'wind', label: 'Wind', unit: 'km/h', icon: Wind },
  ];

  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl bg-surface/90 border border-border backdrop-blur-md shadow-sm ${className}`}
      role="group"
      aria-label="Select weather parameter"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = parameter === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-accent text-slate-950 font-semibold shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
            aria-pressed={isActive}
            aria-label={`${opt.label} (${opt.unit})`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-text-muted'}`} />
            <span>{opt.label}</span>
            <span
              className={`hidden md:inline text-[10px] ${
                isActive ? 'text-slate-800' : 'text-text-muted'
              }`}
            >
              {opt.unit}
            </span>
          </button>
        );
      })}
    </div>
  );
};
