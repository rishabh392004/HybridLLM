import React from 'react';
import { MOCK_REGIONS } from '../api/mock';
import { MapPin, AlertCircle, ChevronDown } from 'lucide-react';

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
  variant = 'compact',
}) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <label htmlFor="region-select" className="sr-only">
        Select Meteorological Region
      </label>
      <div className="flex items-center gap-2 bg-surface/90 hover:bg-surface-hover border border-border rounded-xl px-3 py-1.5 transition-colors shadow-sm">
        <MapPin className="w-4 h-4 text-accent shrink-0" />
        <select
          id="region-select"
          value={selectedRegion}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-text-primary text-xs sm:text-sm font-medium focus:outline-none cursor-pointer pr-6 appearance-none font-body"
          aria-label="Select forecast subdivision"
        >
          {MOCK_REGIONS.map((r) => (
            <option key={r.id} value={r.name} className="bg-surface text-text-primary">
              {r.name} ({r.state}) {r.isExtreme ? ' ⚠️ [EXTREME ALERT]' : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-text-muted pointer-events-none absolute right-3" />
      </div>
    </div>
  );
};
