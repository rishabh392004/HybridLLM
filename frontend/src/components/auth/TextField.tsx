import React from 'react';
import { LucideIcon, AlertCircle } from 'lucide-react';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon?: LucideIcon;
  error?: string | null;
  sublabel?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  id,
  label,
  icon: Icon,
  error,
  sublabel,
  className = '',
  required,
  ...props
}) => {
  const errorId = `${id}-error`;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="block text-xs font-semibold text-[#0F172A] tracking-tight">
          {label}
          {required && <span className="text-[#DC2626] ml-1" aria-hidden="true">*</span>}
        </label>
        {sublabel && <span className="text-[11px] text-[#64748B]">{sublabel}</span>}
      </div>

      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}

        <input
          id={id}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`
            w-full h-11 rounded-xl text-sm text-[#0F172A] placeholder:text-[#94A3B8]
            bg-white border transition-all duration-150 outline-none
            ${Icon ? 'pl-10 pr-4' : 'px-3.5'}
            ${
              error
                ? 'border-[#DC2626] bg-[#FEF2F2]/40 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                : 'border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#0F766E] focus:ring-2 focus:ring-[#14B8A6]/35'
            }
            ${className}
          `}
          {...props}
        />

        {error && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#DC2626]">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-[#DC2626] font-medium flex items-center gap-1.5 animate-fadeIn" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
