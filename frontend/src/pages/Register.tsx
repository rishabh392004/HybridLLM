import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../api/types';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, User, CheckCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('analyst');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roleDescriptions: Record<UserRole, { title: string; desc: string }> = {
    analyst: {
      title: 'Meteorological Analyst',
      desc: 'Full access to model weights override, bias diagnostics, and verification skill scoreboards.',
    },
    disaster_management: {
      title: 'Disaster Management Authority (NDRF/SDMA)',
      desc: 'Priority alerts with civil defense protocols, evacuation guidelines, and pump staging locations.',
    },
    farmer: {
      title: 'Farmer / Agro-Climatic Advisory',
      desc: 'Actionable crop-level guidance on sowing, drainage bunds, livestock hydration, and pesticide timing.',
    },
  };

  const validate = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please provide a valid official email address.');
      return false;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await register(email, password, role);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col md:flex-row bg-background text-text-primary">
      {/* Left Brand Panel */}
      <div className="relative md:w-1/2 bg-surface flex flex-col justify-between p-8 md:p-14 overflow-hidden border-b md:border-b-0 md:border-r border-border">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-accent-hover to-teal-300 flex items-center justify-center shadow-glow-teal text-slate-950 font-black text-lg">
              FC
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-text-primary tracking-tight">
                ForeCombine
              </h1>
              <p className="text-xs text-accent font-medium tracking-wider uppercase">
                Adaptive NWP Blending Architecture
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 my-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Audience Adaptive Weather Intelligence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-text-primary tracking-tight leading-tight">
            Tailored Forecast Delivery for Every Tier of Governance
          </h2>
          <p className="text-sm text-text-secondary mt-4 leading-relaxed">
            ForeCombine translates raw numerical model outputs into actionable tactical advisories. Select your
            operational tier to customize default dashboards, alert wording, and intervention directives.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-text-muted border-t border-border/80 pt-4">
          <span>Ministry of Earth Sciences (MoES)</span>
          <span className="font-mono">SIH 2026</span>
        </div>
      </div>

      {/* Right Form Card */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-bold text-text-primary">Create Operational Account</h2>
            <p className="text-sm text-text-secondary mt-1">
              Select your role profile to configure specialized dashboards
            </p>
          </div>

          {error && (
            <div
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2"
              role="alert"
            >
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-email" className="block text-xs font-medium text-text-secondary mb-1.5">
                Official Agency / Department Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-3 pointer-events-none" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@domain.gov.in"
                  className="w-full bg-surface border border-border focus:border-accent rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-medium text-text-secondary mb-1.5">
                Password (min 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-3 pointer-events-none" />
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface border border-border focus:border-accent rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Role Select with descriptions */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Operational Role & Authority Level
              </label>
              <div className="space-y-2">
                {(['analyst', 'disaster_management', 'farmer'] as UserRole[]).map((r) => {
                  const isSelected = role === r;
                  const item = roleDescriptions[r];
                  return (
                    <div
                      key={r}
                      onClick={() => setRole(r)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-accent bg-accent/10 shadow-sm'
                          : 'border-border bg-surface hover:bg-surface-hover'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-primary">{item.title}</span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-accent" />}
                      </div>
                      <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-semibold text-sm transition-all duration-200 shadow-glow-teal flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-text-secondary">
            <span>Already have an account? </span>
            <Link to="/login" className="text-accent hover:underline font-medium">
              Sign in to console
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
