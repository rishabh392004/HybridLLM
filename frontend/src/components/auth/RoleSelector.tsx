import React from 'react';
import { UserRole } from '../../api/types';
import { CloudSun, ShieldAlert, Sprout, Check } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onSelectRole }) => {
  const roles: {
    role: UserRole;
    title: string;
    subtitle: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }[] = [
    {
      role: 'analyst',
      title: 'Meteorologist',
      subtitle: 'Analyst',
      desc: 'Operational forecasting, skill scoreboard & weight override access.',
      icon: CloudSun,
      accentColor: '#0F766E',
    },
    {
      role: 'disaster_management',
      title: 'Disaster Cell',
      subtitle: 'Emergency Management',
      desc: 'Civil protection protocols, SDMA/NDRF automated hazard directives.',
      icon: ShieldAlert,
      accentColor: '#D97706',
    },
    {
      role: 'farmer',
      title: 'Agro Farmer',
      subtitle: 'Crop Advisories',
      desc: 'KVK agricultural bulletins, crop drainage & sowing window guidance.',
      icon: Sprout,
      accentColor: '#059669',
    },
  ];

  return (
    <div className="w-full space-y-2">
      <label id="role-selector-label" className="block text-xs font-semibold text-[#0F172A] tracking-tight">
        Select Organizational Agency Role
      </label>

      <div
        role="radiogroup"
        aria-labelledby="role-selector-label"
        className="grid grid-cols-1 gap-2.5"
      >
        {roles.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedRole === item.role;
          const titleId = `role-title-${item.role}`;
          const descId = `role-desc-${item.role}`;

          return (
            <button
              key={item.role}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-labelledby={titleId}
              aria-describedby={descId}
              onClick={() => onSelectRole(item.role)}
              className={`
                flex items-start justify-between p-3.5 rounded-xl border text-left transition-all duration-150 outline-none
                ${
                  isSelected
                    ? 'bg-[#F0FDFA] border-[#0F766E] shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-[#0F766E]/25'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                }
                focus-visible:ring-2 focus-visible:ring-[#14B8A6]/40
              `}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`
                    w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors mt-0.5
                    ${isSelected ? 'bg-[#0F766E] text-white shadow-sm' : 'bg-[#F1F5F9] text-[#64748B]'}
                  `}
                  aria-hidden="true"
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div id={titleId} className="text-xs font-bold text-[#0F172A] leading-tight">
                    {item.title} <span className="text-[#64748B] font-normal">· {item.subtitle}</span>
                  </div>
                  <p id={descId} className="text-[11px] text-[#475569] leading-snug mt-1">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div
                className={`
                  w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 mt-1 transition-all
                  ${
                    isSelected
                      ? 'border-[#0F766E] bg-[#0F766E] text-white'
                      : 'border-[#CBD5E1] bg-white'
                  }
                `}
                aria-hidden="true"
              >
                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
