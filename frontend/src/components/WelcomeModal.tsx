import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../api/types';
import { Sparkles, CloudSun, ShieldAlert, Sprout, ArrowRight, X, HeartHandshake } from 'lucide-react';

export const WelcomeModal: React.FC = () => {
  const { role, switchRole } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('forecombine_intro_seen');
    if (!hasSeenIntro) {
      // Small delay so layout loads smoothly first
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('forecombine_intro_seen', 'true');
    setOpen(false);
  };

  const handleSelectRole = (newRole: UserRole) => {
    switchRole(newRole);
    handleClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden space-y-6">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          title="Close guide"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="ForeCombine Logo"
            className="w-12 h-12 rounded-2xl object-contain shadow-md border border-sky-200 bg-white p-1 shrink-0"
          />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent text-[11px] font-bold">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Welcome to ForeCombine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-text-primary tracking-tight mt-1">
              Weather Clarity Built for People
            </h2>
          </div>
        </div>

        {/* Body Description */}
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          Instead of relying on a single weather forecast model, ForeCombine blends 4 leading numerical & AI models (GFS, WRF, GEFS, FourCastNet) based on their real regional accuracy.
        </p>

        {/* Interactive Role Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-primary">
            How will you be using ForeCombine today?
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => handleSelectRole('analyst')}
              className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                role === 'analyst'
                  ? 'bg-accent/15 border-accent text-text-primary shadow-glow-teal/20'
                  : 'bg-surface-card hover:bg-surface-hover border-border text-text-secondary'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                <CloudSun className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-text-primary">Meteorologist / Forecast Analyst</div>
                <div className="text-[11px] text-text-muted">Inspect raw model weights, bias trends, and skill rankings</div>
              </div>
            </button>

            <button
              onClick={() => handleSelectRole('disaster_management')}
              className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                role === 'disaster_management'
                  ? 'bg-amber-500/15 border-amber-500 text-text-primary shadow-sm'
                  : 'bg-surface-card hover:bg-surface-hover border-border text-text-secondary'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-text-primary">Disaster Response Desk (SDRF/NDRF)</div>
                <div className="text-[11px] text-text-muted">Receive priority early hazard alerts and emergency evacuation steps</div>
              </div>
            </button>

            <button
              onClick={() => handleSelectRole('farmer')}
              className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                role === 'farmer'
                  ? 'bg-emerald-500/15 border-emerald-500 text-text-primary shadow-sm'
                  : 'bg-surface-card hover:bg-surface-hover border-border text-text-secondary'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-text-primary">Farmer / Agro Advisory (KVK)</div>
                <div className="text-[11px] text-text-muted">Get plain-language advice on crop drainage, sowing & spraying</div>
              </div>
            </button>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <button
            onClick={handleClose}
            className="text-xs text-text-muted hover:text-text-primary font-medium"
          >
            Skip intro
          </button>

          <button
            onClick={handleClose}
            className="py-2.5 px-5 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold text-xs shadow-glow-teal flex items-center gap-2 transition-all"
          >
            <span>Explore Forecast Map</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
