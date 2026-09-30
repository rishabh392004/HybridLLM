import React from 'react';
import { ShieldCheck, Scale, AlertTriangle, Users } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtext: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtext }) => {
  return (
    <div
      className="auth-scope min-h-screen w-full flex flex-col lg:flex-row bg-[#F6F8FB] text-[#0F172A] font-sans antialiased selection:bg-[#0F766E]/20 selection:text-[#0F766E]"
    >
      {/* ══════════════════════════════════════════════════════════════
          LEFT PANEL (Desktop >=1024px: Brand & Value; Mobile: Compact Header)
          ══════════════════════════════════════════════════════════════ */}
      <div className="relative lg:w-[50%] xl:w-[52%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-gradient-to-b from-[#EEF6F5] to-[#F6F8FB] border-b lg:border-b-0 lg:border-r border-[#E2E8F0] overflow-hidden">
        {/* Decorative faint isobar / contour line SVG background (<= 6% opacity) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          aria-hidden="true"
        >
          <svg
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 800"
            preserveAspectRatio="none"
          >
            <path
              d="M-50 150 C180 80, 320 280, 550 180 S750 100, 850 160"
              fill="none"
              stroke="#0F766E"
              strokeWidth="1.5"
            />
            <path
              d="M-50 280 C200 220, 380 440, 620 310 S780 260, 850 320"
              fill="none"
              stroke="#0F766E"
              strokeWidth="1.5"
            />
            <path
              d="M-50 420 C160 360, 340 580, 580 460 S760 410, 850 470"
              fill="none"
              stroke="#0F766E"
              strokeWidth="1.5"
            />
            <path
              d="M-50 560 C220 500, 400 700, 660 590 S800 550, 850 610"
              fill="none"
              stroke="#0F766E"
              strokeWidth="1.5"
            />
            <circle cx="580" cy="380" r="140" fill="none" stroke="#0F766E" strokeWidth="1" />
            <circle cx="580" cy="380" r="240" fill="none" stroke="#0F766E" strokeWidth="1" />
          </svg>
        </div>

        {/* ── Brand Top Section ───────────────────────────────────── */}
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="ForeCombine Logo"
                className="w-10 h-10 rounded-xl object-contain bg-white border border-[#E2E8F0] p-1 shadow-[0_1px_2px_rgba(15,23,42,0.06)] shrink-0"
              />
              <div>
                <span className="font-heading font-extrabold text-xl text-[#0F172A] tracking-tight block leading-tight">
                  ForeCombine
                </span>
                <span className="text-xs text-[#475569] font-medium block">
                  Adaptive AI–NWP forecast blending
                </span>
              </div>
            </div>

            {/* Quiet single badge */}
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] text-[11px] font-semibold text-[#0F766E] shadow-sm">
              SIH 2026 · MoES
            </span>
          </div>

          <div className="mt-3 text-xs text-[#64748B]">
            Smart India Hackathon 2026 · Ministry of Earth Sciences
          </div>
        </div>

        {/* ── Desktop Value Proposition ──────────────────────────── */}
        <div className="relative z-10 my-8 lg:my-10 max-w-xl hidden lg:block">
          <h1 className="font-heading font-extrabold text-3xl lg:text-[32px] text-[#0F172A] tracking-tight leading-[1.2]">
            Trusted weather forecasts, blended by verified skill.
          </h1>
          <p className="text-sm text-[#475569] mt-3.5 leading-relaxed">
            ForeCombine aggregates NWP (NCMRWF/GFS), ensemble (GEFS), AI (FourCastNet), and regional (WRF) models,
            weighting each by measured skill against AWS ground truth to produce a single, calibrated forecast.
          </p>

          {/* Elevated Illustrative Forecast Convergence Card */}
          <div
            className="mt-6 p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_12px_32px_-12px_rgba(15,23,42,0.10),0_1px_2px_rgba(15,23,42,0.04)]"
            role="region"
            aria-label="Sample multi-model forecast convergence graph"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E8F0]">
              <span className="text-xs font-bold text-[#0F172A] font-heading">
                Multi-Source Forecast Convergence
              </span>
              <span className="text-[11px] font-mono text-[#64748B]">Sample data · +72h horizon</span>
            </div>

            {/* Inline SVG Chart with Accessible Alternative */}
            <div className="h-32 w-full pt-3">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 380 100"
                preserveAspectRatio="none"
                role="img"
                aria-label="Graph comparing 4 weather models against the ForeCombine Blend and verified AWS ground truth across lead times."
              >
                <title>Multi-Source Forecast Convergence Graph</title>
                <desc>
                  Shows lines for NWP, Ensemble, AI, and Regional models, with the ForeCombine Blend line converging closely to the observed ground truth.
                </desc>

                {/* Subtle horizontal grid lines */}
                <line x1="0" y1="20" x2="380" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="50" x2="380" y2="50" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="80" x2="380" y2="80" stroke="#F1F5F9" strokeWidth="1" />

                {/* NWP model line */}
                <path
                  d="M 10 70 Q 100 60, 190 75 T 370 65"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="1.5"
                  opacity="0.75"
                />

                {/* Ensemble model line */}
                <path
                  d="M 10 65 Q 100 45, 190 60 T 370 48"
                  fill="none"
                  stroke="#0D9488"
                  strokeWidth="1.5"
                  opacity="0.75"
                />

                {/* AI FourCastNet model line */}
                <path
                  d="M 10 52 Q 100 35, 190 42 T 370 38"
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth="1.5"
                  opacity="0.75"
                />

                {/* WRF Regional model line */}
                <path
                  d="M 10 80 Q 100 68, 190 70 T 370 58"
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth="1.5"
                  opacity="0.75"
                />

                {/* ForeCombine Blend Line (Bold Deep Teal) */}
                <path
                  d="M 10 58 Q 100 42, 190 48 T 370 43"
                  fill="none"
                  stroke="#0F766E"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Observed Ground Truth Line (Dashed Amber) */}
                <path
                  d="M 10 56 Q 100 40, 190 47 T 370 42"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Explanatory Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#F1F5F9] text-[10px] font-mono text-[#475569]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded-full bg-[#0284C7]" aria-hidden="true" />
                <span>NWP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded-full bg-[#0D9488]" aria-hidden="true" />
                <span>Ensemble</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded-full bg-[#7C3AED]" aria-hidden="true" />
                <span>AI Model</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded-full bg-[#EA580C]" aria-hidden="true" />
                <span>Regional</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-[#0F766E]">
                <span className="w-3 h-1.5 rounded-full bg-[#0F766E]" aria-hidden="true" />
                <span>Blend</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-[#D97706]">
                <span className="w-3 h-1 border-t-2 border-dashed border-[#F59E0B]" aria-hidden="true" />
                <span>Observed</span>
              </div>
            </div>
          </div>

          {/* 3 Compact Feature Rows */}
          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F172A]">Adaptive weights</div>
                <div className="text-[11px] text-[#475569]">
                  Rolling inverse-variance calibration updated continuously from AWS stations.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#D97706]/10 text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F172A]">Severity-based alerts</div>
                <div className="text-[11px] text-[#475569]">
                  Multi-tier threshold warnings triggered automatically when blended rainfall exceeds limits.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F172A]">Role-based advisories</div>
                <div className="text-[11px] text-[#475569]">
                  Targeted action protocols customized for farmers, disaster management cells, and meteorologists.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="relative z-10 flex items-center justify-between text-xs text-[#64748B] pt-4 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span>Encrypted session</span>
          </div>
          <span className="font-mono text-[11px]">v2.4-SIH</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          RIGHT PANEL: Centered Form Card
          ══════════════════════════════════════════════════════════════ */}
      <div className="lg:w-[50%] xl:w-[48%] flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-[440px] bg-white rounded-[20px] border border-[#E2E8F0] shadow-[0_12px_32px_-12px_rgba(15,23,42,0.14),0_1px_2px_rgba(15,23,42,0.06)] p-8 sm:p-10 space-y-6">
          {/* Header inside the form card */}
          <div>
            <h2 className="text-[28px] font-heading font-extrabold text-[#0F172A] tracking-tight leading-tight">
              {title}
            </h2>
            <p className="text-sm text-[#475569] mt-1.5 leading-relaxed">
              {subtext}
            </p>
          </div>

          {/* Children form controls */}
          {children}
        </div>
      </div>
    </div>
  );
};
