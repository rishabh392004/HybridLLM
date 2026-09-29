import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, CloudRain, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('analyst@imd.gov.in');
  const [password, setPassword] = useState('weather2026');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

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
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('weather2026');
    setError(null);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col md:flex-row bg-background text-text-primary">
      {/* Left Brand Panel with Isobars and Meteorological Graphic */}
      <div className="relative md:w-1/2 bg-surface flex flex-col justify-between p-8 md:p-14 overflow-hidden border-b md:border-b-0 md:border-r border-border">
        {/* Subtle SVG isobar line art background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none" aria-hidden="true">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(45, 212, 191, 0.2)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Isobar contours */}
            <path
              d="M -50 200 C 150 120, 250 350, 450 220 S 700 300, 900 150"
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="1.5"
              strokeDasharray="6,4"
            />
            <path
              d="M -50 320 C 180 260, 300 480, 520 360 S 750 420, 950 290"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            <path
              d="M -50 440 C 220 380, 360 620, 600 480 S 800 540, 1000 420"
              fill="none"
              stroke="#818cf8"
              strokeWidth="1.5"
            />
          </svg>
        </div>

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
                Ministry of Earth Sciences • SIH 2026
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 my-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Meteorological Blending Core</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-text-primary tracking-tight leading-tight">
            High-Resolution Forecast Blending with Dynamic Skill-Weighted AI
          </h2>
          <p className="text-sm text-text-secondary mt-4 leading-relaxed">
            ForeCombine ingests multi-model predictions across NWP, GEFS ensembles, WRF and neural surrogate
            models, weighting each by verified regional skill to deliver life-saving clarity for farmers,
            disaster coordinators and analysts.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-text-muted border-t border-border/80 pt-4">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>IMD Certified NWP Integration Benchmark</span>
          </div>
          <span className="font-mono">v2.4-SIH-STABLE</span>
        </div>
      </div>

      {/* Right Form Card */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-14">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-text-primary">Sign in to Console</h2>
            <p className="text-sm text-text-secondary mt-1">
              Access real-time meteorological blending, weights, and early alerts
            </p>
          </div>

          {/* Quick Demo Pre-fill Buttons */}
          <div className="mb-6 p-3 rounded-xl bg-surface border border-border">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
              Fast Demo Accounts (SIH Evaluator Quick Access):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoRole('analyst@imd.gov.in')}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium text-center border transition-all ${
                  email.includes('analyst')
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                    : 'bg-surface-hover/70 text-text-secondary border-border/60 hover:text-text-primary'
                }`}
              >
                Meteorologist
              </button>
              <button
                type="button"
                onClick={() => setDemoRole('disaster.command@sdrf.gov.in')}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium text-center border transition-all ${
                  email.includes('disaster')
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-surface-hover/70 text-text-secondary border-border/60 hover:text-text-primary'
                }`}
              >
                Disaster Cell
              </button>
              <button
                type="button"
                onClick={() => setDemoRole('farmer.liaison@kvk.in')}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium text-center border transition-all ${
                  email.includes('farmer')
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-surface-hover/70 text-text-secondary border-border/60 hover:text-text-primary'
                }`}
              >
                Agro Farmer
              </button>
            </div>
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
              <label htmlFor="email" className="block text-xs font-medium text-text-secondary mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-3 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@imd.gov.in"
                  className="w-full bg-surface border border-border focus:border-accent rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-text-secondary mb-1.5">
                Access Key / Password (min 8 chars)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-3 pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface border border-border focus:border-accent rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors"
                />
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
                  <span>Sign In & Open Operations</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-text-secondary">
            <span>Need an organizational account? </span>
            <Link to="/register" className="text-accent hover:underline font-medium">
              Register new agency role
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
