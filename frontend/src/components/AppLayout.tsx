import React, { useState, useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { RegionSelector } from './RegionSelector';
import { LanguageSelector } from './LanguageSelector';
import { WelcomeModal } from './WelcomeModal';
import { getMockBlend, getMockAlerts } from '../api/mock';
import { UserRole, LeadTimeHours, WeatherParameter } from '../api/types';
import {
  Map,
  Scale,
  BarChart3,
  Trophy,
  AlertTriangle,
  Sliders,
  Sun,
  Moon,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Activity,
  Download,
  Clock,
  Radio,
  ChevronRight as BreadcrumbSeparator,
  Globe2,
} from 'lucide-react';

// ── Source color registry ────────────────────────────────────
const SOURCE_COLOR_MAP: Record<string, string> = {
  'ECMWF IFS': 'var(--source-nwp)',
  'NWP (NCMRWF/GFS)': 'var(--source-nwp)',
  'FourCastNet AI': 'var(--source-ai)',
  'GraphCast AI': 'var(--source-ai)',
  'Ensemble (GEFS)': 'var(--source-ensemble)',
  'WRF Regional': 'var(--source-regional)',
  'AI Model (FourCastNet)': 'var(--source-ai)',
};

function getSourceColor(sourceName: string): string {
  for (const key of Object.keys(SOURCE_COLOR_MAP)) {
    if (sourceName.includes(key) || key.includes(sourceName.split(' ')[0])) {
      return SOURCE_COLOR_MAP[key];
    }
  }
  const palette = [
    'var(--source-nwp)',
    'var(--source-ai)',
    'var(--source-ensemble)',
    'var(--source-regional)',
  ];
  return palette[0];
}

// ── Trust Bar (Adaptive Weights Allocation Visualizer) ───────
const TrustBar: React.FC<{ region: string; lead: number; param: string }> = ({
  region,
  lead,
  param,
}) => {
  const data = useMemo(() => {
    try {
      return getMockBlend(region, lead as LeadTimeHours, param as WeatherParameter);
    } catch {
      return null;
    }
  }, [region, lead, param]);

  if (!data?.sources?.length) return <div className="h-[3px] w-full bg-white/5" />;

  const segments = data.sources.map((s) => ({
    name: s.source,
    weight: s.weight,
    color: getSourceColor(s.source),
  }));

  const total = segments.reduce((acc, s) => acc + s.weight, 0);

  return (
    <div
      className="trust-bar w-full h-[3px] flex overflow-hidden"
      role="presentation"
      aria-label="Live blend weight allocation"
      title={segments.map((s) => `${s.name}: ${Math.round((s.weight / total) * 100)}%`).join(' · ')}
    >
      {segments.map((seg, i) => (
        <div
          key={i}
          className="trust-bar-segment transition-all duration-300"
          style={{
            width: `${(seg.weight / total) * 100}%`,
            background: seg.color,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
};

// ── Main Layout ───────────────────────────────────────────────
export const AppLayout: React.FC = () => {
  const { user, role, switchRole, logout, theme, toggleTheme } = useAuth();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const currentRegion = searchParams.get('region') || 'Konkan & Goa';
  const currentLead = Number(searchParams.get('lead')) || 24;
  const currentParam = searchParams.get('param') || 'rainfall';

  // Count active alerts for status strip
  const activeAlertsCount = useMemo(() => {
    try {
      const list = getMockAlerts(currentRegion);
      return list.filter((a) => a.severity === 'severe' || a.severity === 'warning').length;
    } catch {
      return 2;
    }
  }, [currentRegion]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const handleRegionChange = (newRegion: string) => updateParam('region', newRegion);

  const triggerDemoMode = () => {
    const next = new URLSearchParams();
    next.set('region', 'Konkan & Goa');
    next.set('param', 'rainfall');
    next.set('lead', '24');
    setSearchParams(next);
    if (location.pathname === '/login' || location.pathname === '/register') {
      navigate('/?region=Konkan%20%26%20Goa&param=rainfall&lead=24');
    }
  };

  const navItems = [
    { to: '/', label: t('nav_blended_map', 'Blended Map'), icon: Map, badge: null },
    { to: '/weights', label: t('nav_model_weights', 'Model Weights'), icon: Scale, badge: null },
    { to: '/compare', label: t('nav_comparison', 'Comparison'), icon: BarChart3, badge: null },
    { to: '/scoreboard', label: t('nav_scoreboard', 'Scoreboard'), icon: Trophy, badge: '#1 Blend' },
    { to: '/alerts', label: t('nav_alerts', 'Alerts & Actions'), icon: AlertTriangle, badge: `${activeAlertsCount} Live` },
    { to: '/override', label: t('nav_export', 'Export & Override'), icon: Sliders, badge: null },
    { to: '/visualize', label: t('nav_visualize', '3D Visualizer'), icon: Globe2, badge: 'New' },
  ];

  // Map route path to human-readable breadcrumb label
  const pageBreadcrumbs: Record<string, string> = {
    '/': 'Blended Surface Forecast',
    '/map': 'Blended Surface Forecast',
    '/weights': 'Dynamic Weights & Calibration',
    '/compare': 'Multi-Model Skill Comparison',
    '/scoreboard': 'IMD Verified Scoreboard',
    '/alerts': 'Action Protocols & Directives',
    '/override': 'Interactive Override & Export',
    '/visualize': '3D Forecast Visualizer',
  };

  const currentBreadcrumb = pageBreadcrumbs[location.pathname] || 'Operational Room';

  const sourceLegend = [
    { label: 'NWP', color: 'var(--source-nwp)' },
    { label: 'AI', color: 'var(--source-ai)' },
    { label: 'ENS', color: 'var(--source-ensemble)' },
    { label: 'REG', color: 'var(--source-regional)' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-void text-text-primary">
      <WelcomeModal />

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col border-r border-border transition-all duration-300 z-30 shrink-0 bg-surface ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-3.5 h-14 border-b border-border">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/logo.png"
                alt="ForeCombine Logo"
                className="w-8 h-8 rounded-xl object-contain shrink-0 shadow-sm border border-teal-500/30 bg-white/10 p-0.5"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-heading font-bold text-[14px] tracking-tight text-text-primary leading-tight truncate">
                  ForeCombine
                </span>
                <span className="text-[9px] font-mono tracking-[0.14em] uppercase text-teal-400 font-semibold">
                  AI·NWP Blending
                </span>
              </div>
            </div>
          ) : (
            <img
              src="/logo.png"
              alt="ForeCombine Logo"
              className="w-8 h-8 mx-auto rounded-xl object-contain shrink-0 shadow-sm border border-teal-500/30 bg-white/10 p-0.5"
            />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors ${
              collapsed ? 'mx-auto mt-0' : ''
            }`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Live status badge */}
        {!collapsed && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/70 bg-surface/50">
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-teal-400">
                IMD Radar · Live
              </span>
            </div>
            <span className="text-[9px] font-mono text-text-muted">3m ago</span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-2 px-2.5 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const targetUrl = `${item.to}${location.search}`;

            return (
              <NavLink
                key={item.to}
                to={targetUrl}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-[0_0_15px_rgba(45,212,191,0.15)] font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent'
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`shrink-0 transition-colors ${
                        isActive ? 'text-teal-400' : 'text-text-muted group-hover:text-text-primary'
                      }`}
                      size={17}
                    />
                    {!collapsed && (
                      <div className="flex items-center justify-between w-full min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              item.badge.includes('Live')
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                                : 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                    {collapsed && isActive && (
                      <span className="absolute right-0 w-1 h-5 bg-teal-400 rounded-l-full" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Source color legend */}
        {!collapsed && (
          <div className="mx-2.5 mb-2.5 p-3 rounded-xl border border-border/80 bg-surface/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-text-muted tracking-wider uppercase">
                4-Model Ensembling
              </span>
              <ShieldCheck className="w-3 h-3 text-teal-400" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {sourceLegend.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-[10px] text-text-secondary font-mono font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User profile footer */}
        <div className="p-3 border-t border-border flex items-center gap-2.5 bg-surface/40">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[12px] text-white shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #0d9488 0%, #6366f1 100%)' }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'O'}
          </div>
          {!collapsed && (
            <>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[12px] font-semibold text-text-primary truncate leading-tight">
                  {user?.name || 'Observer'}
                </span>
                <span className="text-[10px] text-text-muted truncate">{user?.agency || 'MoES / IMD'}</span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 px-4 flex items-center justify-between gap-3 z-20 shrink-0 border-b border-border bg-surface/85 backdrop-blur-xl">
          {/* Left section: Breadcrumb & Region */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile logo */}
            <div className="md:hidden flex items-center gap-2 shrink-0">
              <img
                src="/logo.png"
                alt="ForeCombine Logo"
                className="w-7 h-7 rounded-lg object-contain shrink-0 border border-teal-500/40 bg-white/10 p-0.5"
              />
              <span className="font-heading font-bold text-[13px] text-text-primary">ForeCombine</span>
            </div>

            {/* Breadcrumb path for desktop */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-text-muted font-mono shrink-0">
              <span className="text-text-secondary font-medium">Control Room</span>
              <BreadcrumbSeparator className="w-3 h-3 text-border" />
              <span className="text-teal-400 font-semibold">{currentBreadcrumb}</span>
              <BreadcrumbSeparator className="w-3 h-3 text-border" />
            </div>

            <RegionSelector
              selectedRegion={currentRegion}
              onChange={handleRegionChange}
              className="max-w-[200px] sm:max-w-xs"
            />
          </div>

          {/* Right section: Actions & Status strip */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Data Freshness Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-surface/60 text-[11px] font-mono text-text-secondary">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>MoES Grid · Fresh</span>
            </div>

            <LanguageSelector />

            {/* Download Project ZIP option */}
            <a
              href="/ForeCombine-Operational-Platform.zip"
              download="ForeCombine-Operational-Platform.zip"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-teal-400 border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 transition-all shrink-0 shadow-sm"
              title="Download Full Project Source Code (ZIP)"
              aria-label="Download project zip"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Source ZIP</span>
            </a>

            {/* Demo button */}
            <button
              onClick={triggerDemoMode}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-amber-300 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all shrink-0 shadow-sm"
              title="Jump to Extreme Monsoon Event (Konkan)"
              aria-label="Demo mode"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span className="hidden lg:inline">{t('demo_event', 'Extreme Event Demo')}</span>
              <span className="lg:hidden">Demo</span>
            </button>

            {/* Role switcher */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border bg-surface text-[11px] shrink-0">
              <UserCheck className="w-3.5 h-3.5 text-teal-400 hidden md:inline shrink-0" />
              <select
                value={role}
                onChange={(e) => switchRole(e.target.value as UserRole)}
                className="bg-transparent text-[11px] font-semibold text-text-primary focus:outline-none cursor-pointer max-w-[110px] md:max-w-none"
                aria-label="Change active role"
              >
                <option value="analyst" className="bg-slate-900 text-slate-100 py-1.5">
                  {t('role_analyst', 'Meteorologist')}
                </option>
                <option value="disaster_management" className="bg-slate-900 text-slate-100 py-1.5">
                  {t('role_disaster', 'Disaster Mgmt')}
                </option>
                <option value="farmer" className="bg-slate-900 text-slate-100 py-1.5">
                  {t('role_farmer', 'Farmer / Agro')}
                </option>
              </select>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary bg-surface border border-border shadow-sm hover:border-teal-500/40 transition-all"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
              )}
            </button>
          </div>
        </header>

        {/* ── Trust Bar ──────────────────────────── */}
        <TrustBar region={currentRegion} lead={currentLead} param={currentParam} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-void relative">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav
          className="md:hidden flex items-center justify-around h-14 border-t border-border px-1 z-30 shrink-0 bg-surface/95 backdrop-blur-md"
          aria-label="Mobile Navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const targetUrl = `${item.to}${location.search}`;

            return (
              <NavLink
                key={item.to}
                to={targetUrl}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center py-1 px-2 text-[9px] font-semibold transition-colors gap-0.5 rounded-xl ${
                    isActive ? 'text-teal-400' : 'text-text-muted hover:text-text-secondary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className="absolute inset-x-0 -top-px h-[2px] rounded-b-full"
                        style={{ background: 'linear-gradient(90deg, transparent, #2dd4bf, transparent)' }}
                      />
                    )}
                    <Icon className="w-4.5 h-4.5" size={18} />
                    <span className="truncate max-w-[44px]">{item.label.split(' ')[0]}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
