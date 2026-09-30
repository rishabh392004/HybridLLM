import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RegionSelector } from './RegionSelector';
import { LeadTimeHours, WeatherParameter, UserRole } from '../api/types';
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
  Menu,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, role, switchRole, logout, theme, toggleTheme } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // URL state persistence
  const currentRegion = searchParams.get('region') || 'Konkan & Goa';
  const currentParam = (searchParams.get('param') as WeatherParameter) || 'rainfall';
  const currentLead = (Number(searchParams.get('lead')) as LeadTimeHours) || 24;

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const handleRegionChange = (newRegion: string) => {
    updateParam('region', newRegion);
  };

  // Demo Mode: Quickly loads extreme rainfall scenario in Konkan & Goa
  const triggerDemoMode = () => {
    const next = new URLSearchParams();
    next.set('region', 'Konkan & Goa');
    next.set('param', 'rainfall');
    next.set('lead', '24');
    setSearchParams(next);
    // If not on map or alerts, allow user to view map
    if (location.pathname === '/login' || location.pathname === '/register') {
      navigate('/?region=Konkan%20%26%20Goa&param=rainfall&lead=24');
    }
  };

  const navItems = [
    { to: '/', label: 'Blended Map', icon: Map, badge: null },
    { to: '/weights', label: 'Model Weights', icon: Scale, badge: null },
    { to: '/compare', label: 'Comparison', icon: BarChart3, badge: null },
    { to: '/scoreboard', label: 'Scoreboard', icon: Trophy, badge: '#1 Blend' },
    { to: '/alerts', label: 'Alerts & Actions', icon: AlertTriangle, badge: 'Live' },
    { to: '/override', label: 'Export & Override', icon: Sliders, badge: null },
  ];

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    analyst: { label: 'Meteorologist', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
    disaster_management: { label: 'Disaster Cell', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    farmer: { label: 'Agro Advisory', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-text-primary">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex flex-col border-r border-border bg-surface/80 backdrop-blur-xl transition-all duration-300 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border/80">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent-hover to-teal-300 flex items-center justify-center shadow-glow-teal text-slate-950 font-black text-sm">
                FC
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-base tracking-tight text-text-primary leading-tight">
                  ForeCombine
                </span>
                <span className="text-[10px] font-semibold text-accent tracking-widest uppercase">
                  AI-NWP Blending
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-xl bg-gradient-to-tr from-accent-hover to-teal-300 flex items-center justify-center shadow-glow-teal text-slate-950 font-black text-sm">
              FC
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Preserving query params across page navigation
            const targetUrl = `${item.to}${location.search}`;

            return (
              <NavLink
                key={item.to}
                to={targetUrl}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-accent/15 text-accent font-semibold shadow-sm border border-accent/25'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-primary'
                      }`}
                    />
                    {!collapsed && (
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-bold uppercase tracking-wider">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                    {collapsed && isActive && (
                      <span className="absolute right-1 w-1.5 h-6 bg-accent rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* SIH Hackathon & System Tag */}
        {!collapsed && (
          <div className="p-3 mx-3 mb-3 rounded-xl bg-surface-card border border-border/70 text-xs">
            <div className="flex items-center gap-1.5 text-accent font-medium mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SIH 2026 • MoES</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              IMD High-Resolution Adaptive Blending Core v2.4
            </p>
          </div>
        )}

        {/* Sidebar user footer */}
        <div className="p-3 border-t border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-surface-active flex items-center justify-center font-bold text-xs text-text-primary shrink-0">
              {user?.name ? user.name[0] : 'U'}
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-text-primary truncate">
                  {user?.name || 'Observer'}
                </span>
                <span className="text-[10px] text-text-muted truncate">{user?.agency || 'MoES'}</span>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-text-muted hover:text-red-400 hover:bg-surface-hover rounded-lg transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Control Bar / Header */}
        <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-xl px-4 flex items-center justify-between gap-3 z-20">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-slate-950 font-black text-xs">
                FC
              </div>
              <span className="font-heading font-bold text-sm">ForeCombine</span>
            </div>

            {/* Region Selector in Header */}
            <RegionSelector
              selectedRegion={currentRegion}
              onChange={handleRegionChange}
              className="max-w-[210px] sm:max-w-xs"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Demo Mode Button */}
            <button
              onClick={triggerDemoMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-500/20 to-amber-500/20 hover:from-red-500/30 hover:to-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold shadow-sm transition-all duration-200"
              title="Jump to Extreme Rainfall Demo in Konkan & Goa"
              aria-label="Demo mode extreme rainfall"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
              <span className="hidden sm:inline">Demo Extreme Event</span>
              <span className="sm:hidden">Demo</span>
            </button>

            {/* Role Switcher for 5-minute walkthrough showcase */}
            <div className="flex items-center gap-1.5 bg-surface border border-border rounded-xl px-2 py-1">
              <UserCheck className="w-3.5 h-3.5 text-text-muted hidden sm:inline" />
              <select
                value={role}
                onChange={(e) => switchRole(e.target.value as UserRole)}
                className="bg-transparent text-xs font-semibold text-text-primary focus:outline-none cursor-pointer"
                aria-label="Change active perspective role"
              >
                <option value="analyst" className="bg-surface">Role: Meteorologist</option>
                <option value="disaster_management" className="bg-surface">Role: Disaster Mgmt</option>
                <option value="farmer" className="bg-surface">Role: Farmer / Agro</option>
              </select>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover border border-border/70 transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
            </button>
          </div>
        </header>

        {/* View Content Body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
          <Outlet />
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav
          className="md:hidden flex items-center justify-around h-14 border-t border-border bg-surface/95 backdrop-blur-lg px-2 z-30"
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
                  `flex flex-col items-center justify-center py-1 px-2 text-[10px] font-medium transition-colors ${
                    isActive ? 'text-accent font-semibold' : 'text-text-muted hover:text-text-secondary'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="truncate max-w-[50px]">{item.label.split(' ')[0]}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
