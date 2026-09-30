import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string | null;
  showStrengthMeter?: boolean;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  label,
  value = '',
  error,
  showStrengthMeter = false,
  required,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const errorId = `${id}-error`;

  // Compute password strength score (0–4)
  const calculateStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '', bars: 'bg-[#E2E8F0]' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    const map: Record<number, { label: string; color: string; bars: string }> = {
      1: { label: 'Weak', color: 'text-[#DC2626]', bars: 'bg-[#DC2626]' },
      2: { label: 'Fair', color: 'text-[#D97706]', bars: 'bg-[#D97706]' },
      3: { label: 'Good', color: 'text-[#0F766E]', bars: 'bg-[#0F766E]' },
      4: { label: 'Strong', color: 'text-[#059669]', bars: 'bg-[#059669]' },
    };
    return { score, ...map[score] };
  };

  const strength = showStrengthMeter ? calculateStrength(String(value)) : null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="block text-xs font-semibold text-[#0F172A] tracking-tight">
          {label}
          {required && <span className="text-[#DC2626] ml-1" aria-hidden="true">*</span>}
        </label>
        {strength?.label && (
          <span className={`text-[11px] font-semibold transition-colors ${strength.color}`}>
            {strength.label}
          </span>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
          <Lock className="w-4 h-4" aria-hidden="true" />
        </div>

        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`
            w-full h-11 rounded-xl pl-10 pr-11 text-sm text-[#0F172A] placeholder:text-[#94A3B8]
            bg-white border transition-all duration-150 outline-none
            ${
              error
                ? 'border-[#DC2626] bg-[#FEF2F2]/40 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                : 'border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#0F766E] focus:ring-2 focus:ring-[#14B8A6]/35'
            }
            ${className}
          `}
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#64748B] hover:text-[#0F172A] transition-colors rounded-lg hover:bg-[#F1F5F9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/40"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
        </button>
      </div>

      {/* Strength Bars */}
      {showStrengthMeter && String(value).length > 0 && strength && (
        <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                step <= strength.score ? strength.bars : 'bg-[#E2E8F0]'
              }`}
            />
          ))}
        </div>
      )}

      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-[#DC2626] font-medium flex items-center gap-1.5 animate-fadeIn" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
