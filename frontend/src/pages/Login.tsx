import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { TextField } from '../components/auth/TextField';
import { PasswordField } from '../components/auth/PasswordField';
import { Button } from '../components/auth/Button';
import { Mail, AlertCircle, CloudSun, ShieldAlert, Sprout, Check } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('analyst@imd.gov.in');
  const [password, setPassword] = useState('weather2026');
  const [rememberMe, setRememberMe] = useState(true);
  const [activeDemoRole, setActiveDemoRole] = useState<string>('Meteorologist · Analyst');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const validateEmail = (val: string) => {
    if (!val) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid official email address.';
    return undefined;
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Password is required.';
    if (val.length < 6) return 'Password must be at least 6 characters long.';
    return undefined;
  };

  const handleBlurEmail = () => {
    const err = validateEmail(email);
    setErrors((prev) => ({ ...prev, email: err }));
  };

  const handleBlurPassword = () => {
    const err = validatePassword(password);
    setErrors((prev) => ({ ...prev, password: err }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const pwdErr = validatePassword(password);

    if (emailErr || pwdErr) {
      setErrors({ email: emailErr, password: pwdErr });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrors({
        general: err?.message || 'Authentication failed. Please verify your official email and password.',
      });
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string, roleLabel: string) => {
    setEmail(demoEmail);
    setPassword('weather2026');
    setActiveDemoRole(roleLabel);
    setErrors({});
  };

  return (
    <AuthLayout
      title="Sign in"
      subtext="Access the ForeCombine operations console."
    >
      {/* Failed login alert banner */}
      {errors.general && (
        <div
          className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-medium flex items-start gap-2.5 animate-fadeIn"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" aria-hidden="true" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Main Sign In Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          id="email"
          label="Email address"
          type="email"
          autoComplete="username"
          required
          icon={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setActiveDemoRole('');
          }}
          onBlur={handleBlurEmail}
          error={errors.email}
          placeholder="name@agency.gov.in"
        />

        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setActiveDemoRole('');
          }}
          onBlur={handleBlurPassword}
          error={errors.password}
          placeholder="••••••••"
        />

        {/* Row: Remember me + Forgot password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[#475569]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-[#CBD5E1] text-[#0F766E] focus:ring-[#14B8A6]/35 cursor-pointer"
            />
            <span>Remember me</span>
          </label>

          <a
            href="#forgot-password"
            onClick={(e) => {
              e.preventDefault();
              alert('Please contact your district MoES / IMD system administrator to reset operational credentials.');
            }}
            className="text-[#0F766E] hover:text-[#115E59] hover:underline font-semibold transition-colors"
          >
            Forgot password?
          </a>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            Sign in
          </Button>
        </div>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-[#E2E8F0]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-[#64748B] font-semibold uppercase tracking-wider text-[11px]">
            or try a demo account
          </span>
        </div>
      </div>

      {/* Demo Account Cards */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Meteorologist */}
          <button
            type="button"
            onClick={() => setDemoAccount('analyst@imd.gov.in', 'Meteorologist · Analyst')}
            className={`
              p-2.5 rounded-xl border text-left transition-all outline-none flex flex-col justify-between
              ${
                email.includes('analyst')
                  ? 'border-[#0F766E] bg-[#F0FDFA] ring-1 ring-[#0F766E]/20 shadow-sm'
                  : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1]'
              }
              focus-visible:ring-2 focus-visible:ring-[#14B8A6]/40
            `}
          >
            <div className="flex items-center justify-between mb-1.5">
              <CloudSun className={`w-4 h-4 ${email.includes('analyst') ? 'text-[#0F766E]' : 'text-[#64748B]'}`} />
              {email.includes('analyst') && <Check className="w-3.5 h-3.5 text-[#0F766E]" />}
            </div>
            <div className="text-xs font-bold text-[#0F172A] leading-tight">Meteorologist</div>
            <div className="text-[10px] text-[#475569] leading-tight mt-0.5">Analyst · MoES</div>
          </button>

          {/* Disaster Cell */}
          <button
            type="button"
            onClick={() => setDemoAccount('disaster.command@sdrf.gov.in', 'Disaster Cell · Emergency Management')}
            className={`
              p-2.5 rounded-xl border text-left transition-all outline-none flex flex-col justify-between
              ${
                email.includes('disaster')
                  ? 'border-[#0F766E] bg-[#F0FDFA] ring-1 ring-[#0F766E]/20 shadow-sm'
                  : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1]'
              }
              focus-visible:ring-2 focus-visible:ring-[#14B8A6]/40
            `}
          >
            <div className="flex items-center justify-between mb-1.5">
              <ShieldAlert className={`w-4 h-4 ${email.includes('disaster') ? 'text-[#0F766E]' : 'text-[#64748B]'}`} />
              {email.includes('disaster') && <Check className="w-3.5 h-3.5 text-[#0F766E]" />}
            </div>
            <div className="text-xs font-bold text-[#0F172A] leading-tight">Disaster Cell</div>
            <div className="text-[10px] text-[#475569] leading-tight mt-0.5">Emergency · NDRF</div>
          </button>

          {/* Agro Farmer */}
          <button
            type="button"
            onClick={() => setDemoAccount('farmer.liaison@kvk.in', 'Agro Farmer · Crop Advisories')}
            className={`
              p-2.5 rounded-xl border text-left transition-all outline-none flex flex-col justify-between
              ${
                email.includes('farmer')
                  ? 'border-[#0F766E] bg-[#F0FDFA] ring-1 ring-[#0F766E]/20 shadow-sm'
                  : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1]'
              }
              focus-visible:ring-2 focus-visible:ring-[#14B8A6]/40
            `}
          >
            <div className="flex items-center justify-between mb-1.5">
              <Sprout className={`w-4 h-4 ${email.includes('farmer') ? 'text-[#0F766E]' : 'text-[#64748B]'}`} />
              {email.includes('farmer') && <Check className="w-3.5 h-3.5 text-[#0F766E]" />}
            </div>
            <div className="text-xs font-bold text-[#0F172A] leading-tight">Agro Farmer</div>
            <div className="text-[10px] text-[#475569] leading-tight mt-0.5">Advisories · KVK</div>
          </button>
        </div>

        {activeDemoRole && (
          <p className="text-[11px] text-[#0F766E] font-medium text-center">
            Demo account loaded: <strong>{activeDemoRole}</strong>
          </p>
        )}
      </div>

      {/* Bottom link: Create account */}
      <div className="pt-4 border-t border-[#E2E8F0] text-center text-xs text-[#475569]">
        <span>New to ForeCombine? </span>
        <Link to="/register" className="text-[#0F766E] hover:text-[#115E59] hover:underline font-semibold transition-colors">
          Create an account
        </Link>
      </div>
    </AuthLayout>
  );
};
