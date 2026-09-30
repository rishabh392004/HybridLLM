import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../api/types';
import { AuthLayout } from '../components/auth/AuthLayout';
import { TextField } from '../components/auth/TextField';
import { PasswordField } from '../components/auth/PasswordField';
import { RoleSelector } from '../components/auth/RoleSelector';
import { Button } from '../components/auth/Button';
import { Mail, AlertCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('analyst');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validateEmail = (val: string) => {
    if (!val) return 'Official email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid official email address.';
    return undefined;
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Password is required.';
    if (val.length < 8) return 'Password must be at least 8 characters long.';
    return undefined;
  };

  const validateConfirmPassword = (val: string, pwd: string) => {
    if (!val) return 'Please confirm your password.';
    if (val !== pwd) return 'Passwords do not match.';
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

  const handleBlurConfirmPassword = () => {
    const err = validateConfirmPassword(confirmPassword, password);
    setErrors((prev) => ({ ...prev, confirmPassword: err }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const pwdErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(confirmPassword, password);
    const termsErr = !agreedTerms ? 'You must agree to data governance guidelines.' : undefined;

    if (emailErr || pwdErr || confirmErr || termsErr) {
      setErrors({ email: emailErr, password: pwdErr, confirmPassword: confirmErr, terms: termsErr });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await register(email, password, role);
      navigate('/');
    } catch (err: any) {
      setErrors({
        general: err?.message || 'Registration failed. Please check your credentials or contact administrator.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtext="Set up role-based access for your meteorological division."
    >
      {/* Failed registration alert banner */}
      {errors.general && (
        <div
          className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-medium flex items-start gap-2.5 animate-fadeIn"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" aria-hidden="true" />
          <span>{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          id="reg-email"
          label="Official Department Email"
          type="email"
          autoComplete="email"
          required
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={handleBlurEmail}
          error={errors.email}
          placeholder="officer@agency.gov.in"
        />

        <PasswordField
          id="reg-password"
          label="Password (min 8 characters)"
          autoComplete="new-password"
          required
          showStrengthMeter
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={handleBlurPassword}
          error={errors.password}
          placeholder="••••••••"
        />

        <PasswordField
          id="reg-confirm-password"
          label="Confirm Password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={handleBlurConfirmPassword}
          error={errors.confirmPassword}
          placeholder="••••••••"
        />

        <RoleSelector selectedRole={role} onSelectRole={setRole} />

        {/* Terms agreement checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#475569]">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="w-4 h-4 rounded border-[#CBD5E1] text-[#0F766E] focus:ring-[#14B8A6]/35 mt-0.5 cursor-pointer shrink-0"
            />
            <span className="leading-snug">
              I agree to official meteorological data governance and verification reporting guidelines.
            </span>
          </label>
          {errors.terms && (
            <p className="mt-1 text-xs text-[#DC2626]">{errors.terms}</p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            Create account
          </Button>
        </div>
      </form>

      {/* Bottom link: Sign in */}
      <div className="pt-4 border-t border-[#E2E8F0] text-center text-xs text-[#475569]">
        <span>Already have an account? </span>
        <Link to="/login" className="text-[#0F766E] hover:text-[#115E59] hover:underline font-semibold transition-colors">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
};
