import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';

// Lazy-loaded routes for minimal bundle overhead and faster initial load
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const MapPage = lazy(() => import('./pages/Map').then((m) => ({ default: m.MapPage })));
const WeightsPage = lazy(() => import('./pages/Weights').then((m) => ({ default: m.WeightsPage })));
const ComparePage = lazy(() => import('./pages/Compare').then((m) => ({ default: m.ComparePage })));
const ScoreboardPage = lazy(() => import('./pages/Scoreboard').then((m) => ({ default: m.ScoreboardPage })));
const AlertsPage = lazy(() => import('./pages/Alerts').then((m) => ({ default: m.AlertsPage })));
const ExportOverridePage = lazy(() => import('./pages/ExportOverride').then((m) => ({ default: m.ExportOverridePage })));
const VisualizePage = lazy(() => import('./pages/Visualize').then((m) => ({ default: m.VisualizePage })));

const MissionControlFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-8">
    <div className="relative w-16 h-16 mb-4">
      <div className="absolute inset-0 rounded-full border-2 border-teal-500/20 animate-ping" />
      <div className="absolute inset-2 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
      <div className="absolute inset-4 rounded-full bg-teal-500/10 flex items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
      </div>
    </div>
    <div className="font-mono text-xs uppercase tracking-widest text-teal-400/90 font-semibold">
      Loading Atmospheric Matrix...
    </div>
    <div className="text-[11px] text-text-muted mt-1 font-mono">
      Synchronizing NWP & AI Blending Core
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Suspense fallback={<MissionControlFallback />}>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<Register />} />

            {/* Protected Meteorological Control Room Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<MapPage />} />
              <Route path="/map" element={<Navigate to="/" replace />} />
              <Route path="/weights" element={<WeightsPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/scoreboard" element={<ScoreboardPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/override" element={<ExportOverridePage />} />
              <Route path="/visualize" element={<VisualizePage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;

