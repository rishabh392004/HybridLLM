import React from 'react';
import { MOCK_REGIONS } from '../api/mock';
import { MapPin, ChevronDown } from 'lucide-react';

interface RegionSelectorProps {
  selectedRegion: string;
  onChange: (regionName: string) => void;
  className?: string;
  variant?: 'compact' | 'full';
}

export const RegionSelector: React.FC<RegionSelectorProps> = ({
  selectedRegion,
  onChange,
  className = '',
}) => {
  const selectedMeta = MOCK_REGIONS.find((r) => r.name === selectedRegion);
  const isExtreme = selectedMeta?.isExtreme ?? false;

  return (
    <div className={`relative inline-flex items-center min-w-0 ${className}`}>
      <label htmlFor="region-select" className="sr-only">
        Select Meteorological Region
      </label>

      {/* Pill wrapper — holds the icon + select + chevron */}
      <div
        className="flex items-center gap-2 border rounded-xl px-3 py-1.5 transition-colors shadow-sm min-w-0"
        style={{
          background: isExtreme
            ? 'rgba(245, 158, 11, 0.08)'
            : 'var(--color-surface)',
          borderColor: isExtreme
            ? 'rgba(245, 158, 11, 0.35)'
            : 'var(--color-border)',
        }}
      >
        <MapPin
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: isExtreme ? '#f59e0b' : 'var(--color-accent)' }}
        />

        <div className="relative flex items-center min-w-0">
          <select
            id="region-select"
            value={selectedRegion}
            onChange={(e) => onChange(e.target.value)}
            className="bg-transparent text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer appearance-none font-body pr-5 max-w-[160px] sm:max-w-[220px] truncate"
            aria-label="Select forecast subdivision"
          >
            {MOCK_REGIONS.map((r) => (
              <option
                key={r.id}
                value={r.name}
                className="bg-white text-slate-900 py-1 font-medium"
              >
                {r.name} ({r.state})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-text-muted pointer-events-none shrink-0 ml-0.5" />
        </div>

        {/* Extreme alert badge — shown inline, never in option text */}
        {isExtreme && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0"
            style={{
              background: 'rgba(245,158,11,0.15)',
              color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.3)',
            }}
          >
            ⚠ EXTREME
          </span>
        )}
      </div>
    </div>
  );
};
