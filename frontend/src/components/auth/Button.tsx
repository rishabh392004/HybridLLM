import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconRight?: React.ReactNode;
  iconLeft?: React.ReactNode;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#0F766E] hover:bg-[#115E59] active:bg-[#0D5F58] text-white border border-transparent shadow-[0_1px_2px_rgba(15,23,42,0.06)] focus-visible:ring-2 focus-visible:ring-[#14B8A6]/40 focus-visible:ring-offset-2',
  secondary:
    'bg-white hover:bg-[#F1F5F9] active:bg-[#E2E8F0] text-[#0F172A] border border-[#E2E8F0] hover:border-[#CBD5E1] shadow-[0_1px_2px_rgba(15,23,42,0.06)] focus-visible:ring-2 focus-visible:ring-[#14B8A6]/40 focus-visible:ring-offset-2',
  ghost:
    'bg-transparent hover:bg-[#F1F5F9] text-[#475569] hover:text-[#0F172A] border border-transparent focus-visible:ring-2 focus-visible:ring-[#14B8A6]/40',
  danger:
    'bg-[#DC2626] hover:bg-[#B91C1C] text-white border border-transparent shadow-[0_1px_2px_rgba(15,23,42,0.06)] focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-2',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-xs rounded-lg',
  md: 'h-11 px-4 text-sm rounded-xl',
  lg: 'h-12 px-5 text-base rounded-xl',
  xl: 'h-14 px-6 text-base rounded-2xl',
};

export const Button: React.FC<ButtonProps> = ({
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconRight,
  iconLeft,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={loading || disabled}
      aria-busy={loading}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 outline-none
        disabled:opacity-50 disabled:cursor-not-allowed select-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" aria-hidden="true" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {iconLeft && <span className="shrink-0">{iconLeft}</span>}
          <span>{children}</span>
          {iconRight !== undefined ? (
            <span className="shrink-0">{iconRight}</span>
          ) : (
            variant === 'primary' && (
              <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            )
          )}
        </>
      )}
    </button>
  );
};
